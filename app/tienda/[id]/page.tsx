import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import FotoCarousel from './FotoCarousel'
import SelectorVariante from './SelectorVariante'

async function getProducto(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, foto_url, fotos_urls, precio_venta, categoria, subcategoria, stock, producto_talles(talle, color, stock)')
    .eq('id', id)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .single()
  return data
}

async function getNegocio() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('nombre, whatsapp').eq('id', 1).single()
  return data
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
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

  if (!producto) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-stone-600 font-medium mb-4">Producto no disponible</p>
        <Link href="/tienda" className="text-sm text-amber-700 underline underline-offset-2">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const { whatsapp, nombre: nombreTienda } = negocio ?? { whatsapp: null, nombre: '' }
  const fotos = producto.fotos_urls?.length ? producto.fotos_urls : producto.foto_url ? [producto.foto_url] : []

  const productoUrl = `${getBaseUrl()}/tienda/${id}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/tienda" className="text-stone-400 hover:text-stone-700 transition-colors">
          ← Volver
        </Link>
        {producto.categoria && (
          <>
            <span className="text-stone-300">/</span>
            <span className="text-stone-400">{producto.categoria}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Carrusel de fotos */}
        <FotoCarousel fotos={fotos} nombre={producto.nombre} />

        {/* Info */}
        <div className="flex flex-col">
          {(producto.categoria || producto.subcategoria) && (
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">
              {[producto.categoria, producto.subcategoria].filter(Boolean).join(' · ')}
            </p>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight mb-4">
            {producto.nombre}
          </h1>

          {producto.descripcion && (
            <p className="text-sm text-stone-600 mb-4 whitespace-pre-line">{producto.descripcion}</p>
          )}

          <div className="mb-6">
            <p className="text-3xl font-bold text-stone-900">
              ${producto.precio_venta.toLocaleString('es-AR')}
            </p>
          </div>

          {producto.stock > 1 && (
            <p className="text-xs text-emerald-600 font-medium mb-4">
              ✓ {producto.stock} unidades disponibles
            </p>
          )}
          {producto.stock === 1 && (
            <p className="text-xs text-amber-600 font-medium mb-4">
              ⚡ ¡Última unidad!
            </p>
          )}
          {producto.stock === 0 && (
            <p className="text-xs text-stone-400 font-medium mb-4">
              Sin stock disponible
            </p>
          )}

          <SelectorVariante
            variantes={producto.producto_talles ?? []}
            nombre={producto.nombre}
            precioVenta={producto.precio_venta}
            whatsapp={whatsapp}
            nombreTienda={nombreTienda}
            productoUrl={productoUrl}
          />

          <Link href="/tienda" className="text-center mt-4 text-sm text-stone-400 hover:text-stone-700 transition-colors">
            ← Ver más productos
          </Link>
        </div>
      </div>
    </div>
  )
}
