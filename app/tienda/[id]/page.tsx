import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import FotoCarousel from './FotoCarousel'
import SelectorVariante from './SelectorVariante'
import ProductCarousel from '../ProductCarousel'
import type { ProductoCardData } from '../ProductoCard'
import { PRODUCTO_TIENDA_FIELDS, getBaseUrl } from '@/lib/tienda'

async function getProducto(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('productos')
    .select(`${PRODUCTO_TIENDA_FIELDS}, producto_talles(talle, color, stock)`)
    .eq('id', id)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .single()
  return data
}

async function getRelacionados(id: string, categoria: string | null): Promise<ProductoCardData[]> {
  const supabase = createServiceClient()
  const base = supabase
    .from('productos')
    .select(`${PRODUCTO_TIENDA_FIELDS}, producto_talles(talle, color, stock)`)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .neq('id', id)
    .order('creado_en', { ascending: false })
    .limit(8)

  const { data: misma } = categoria ? await base.eq('categoria', categoria) : { data: null }

  if (misma && misma.length >= 4) return misma

  const { data: otros } = await supabase
    .from('productos')
    .select(`${PRODUCTO_TIENDA_FIELDS}, producto_talles(talle, color, stock)`)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .neq('id', id)
    .order('creado_en', { ascending: false })
    .limit(8)

  const combinados = [...(misma ?? [])]
  const ids = new Set(combinados.map(p => p.id))
  for (const p of otros ?? []) {
    if (combinados.length >= 8) break
    if (!ids.has(p.id)) { combinados.push(p); ids.add(p.id) }
  }
  return combinados
}

async function getNegocio() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('nombre, whatsapp').eq('id', 1).single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const producto = await getProducto(id)
  if (!producto) return { title: 'Producto no encontrado' }

  const negocio = await getNegocio()
  const storeName = negocio?.nombre ?? ''

  const tallesDisponibles = [...new Set(producto.producto_talles?.filter(t => t.stock > 0).map(t => t.talle) ?? [])]

  const desc = producto.descripcion?.trim() || [
    tallesDisponibles.length > 0 ? `Talles ${tallesDisponibles.join(', ')}` : null,
    `$${producto.precio_venta.toLocaleString('es-AR')}`,
    producto.categoria,
  ].filter(Boolean).join(' · ')

  const images = producto.foto_url
    ? [{ url: producto.foto_url, width: 800, height: 800, alt: producto.nombre }]
    : []

  return {
    title: `${producto.nombre} · ${storeName}`,
    description: desc,
    openGraph: {
      title: producto.nombre,
      description: desc,
      siteName: storeName,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: producto.nombre,
      description: desc,
      images: producto.foto_url ? [producto.foto_url] : [],
    },
  }
}

export default async function ProductoTiendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [producto, negocio] = await Promise.all([getProducto(id), getNegocio()])
  const relacionados = producto ? await getRelacionados(id, producto.categoria) : []

  if (!producto) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="font-mono text-xs uppercase text-[var(--tienda-text)]/60 mb-4">Producto no disponible</p>
        <Link href="/" className="font-mono text-xs uppercase text-red-600 underline underline-offset-4">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const { whatsapp, nombre: nombreTienda } = negocio ?? { whatsapp: null, nombre: '' }
  const fotos = producto.fotos_urls?.length ? producto.fotos_urls : producto.foto_url ? [producto.foto_url] : []

  const productoUrl = `${getBaseUrl()}/tienda/${id}`

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-10 font-mono text-xs uppercase">
        <Link href="/" className="text-[var(--tienda-text)]/40 hover:text-red-600 transition-colors">
          ← Volver
        </Link>
        {producto.categoria && (
          <>
            <span className="text-[var(--tienda-text)]/20">/</span>
            <span className="text-[var(--tienda-text)]/40">{producto.categoria}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Carrusel de fotos */}
        <div className="lg:col-span-7">
          <FotoCarousel fotos={fotos} nombre={producto.nombre} videoUrl={producto.video_url} />
        </div>

        {/* Info */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col">
          {(producto.categoria || producto.subcategoria) && (
            <p className="font-mono text-xs text-[var(--tienda-text)]/40 uppercase tracking-widest mb-3">
              {[producto.categoria, producto.subcategoria].filter(Boolean).join(' · ')}
            </p>
          )}

          <h1
            className="text-4xl sm:text-5xl uppercase leading-[0.95] tracking-tighter mb-6"
            style={{ color: 'var(--tienda-text)', fontFamily: 'var(--font-anton)' }}
          >
            {producto.nombre}
          </h1>

          <div className="border-t border-[var(--tienda-text)]/20 pt-6 mb-6 flex items-baseline gap-3">
            <p className="font-mono text-2xl font-bold" style={{ color: 'var(--tienda-text)' }}>
              ${producto.precio_venta.toLocaleString('es-AR')}
            </p>
            {producto.precio_anterior && producto.precio_anterior > producto.precio_venta && (
              <p className="font-mono text-base text-[var(--tienda-text)]/40 line-through">
                ${producto.precio_anterior.toLocaleString('es-AR')}
              </p>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-sm text-[var(--tienda-text)]/60 mb-6 whitespace-pre-line leading-relaxed">{producto.descripcion}</p>
          )}

          {producto.stock > 1 && (
            <p className="font-mono text-[10px] uppercase text-[var(--tienda-text)]/50 mb-4">
              ✓ {producto.stock} unidades disponibles
            </p>
          )}
          {producto.stock === 1 && (
            <p className="font-mono text-[10px] uppercase text-red-600 mb-4">
              ⚡ ¡Última unidad!
            </p>
          )}
          {producto.stock === 0 && (
            <p className="font-mono text-[10px] uppercase text-[var(--tienda-text)]/30 mb-4">
              Sin stock disponible
            </p>
          )}

          <SelectorVariante
            productoId={id}
            variantes={producto.producto_talles ?? []}
            nombre={producto.nombre}
            foto={producto.foto_url}
            precioVenta={producto.precio_venta}
            whatsapp={whatsapp}
            nombreTienda={nombreTienda}
            productoUrl={productoUrl}
          />

          <Link href="/" className="text-center mt-6 font-mono text-xs uppercase text-[var(--tienda-text)]/40 hover:text-red-600 transition-colors">
            ← Ver más productos
          </Link>
        </aside>
      </div>

      <div className="mt-24">
        <ProductCarousel
          titulo="También te puede interesar"
          productos={relacionados}
          whatsapp={whatsapp}
          nombreTienda={nombreTienda}
        />
      </div>
    </div>
  )
}
