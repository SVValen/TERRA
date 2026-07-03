import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import FotoCarousel from './FotoCarousel'

async function getProducto(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('productos')
    .select('id, nombre, foto_url, fotos_urls, precio_venta, categoria, subcategoria, stock, producto_talles(talle, stock)')
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

  const tallesDisponibles = producto.producto_talles?.filter(t => t.stock > 0).map(t => t.talle) ?? []

  const desc = [
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

  const tallesConStock = producto.producto_talles?.filter(t => t.stock > 0) ?? []

  const productoUrl = `${getBaseUrl()}/tienda/${id}`
  const waMsg = [
    `Hola *${nombreTienda}*! 👋`,
    ``,
    `Me interesa este producto:`,
    `*${producto.nombre}*`,
    tallesConStock.length > 0 ? `Talle: ${tallesConStock.map(t => t.talle).join('/')}` : '',
    `Precio: $${producto.precio_venta.toLocaleString('es-AR')}`,
    ``,
    productoUrl,
  ].filter(l => l !== undefined).join('\n')

  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMsg)}` : null

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

          {producto.producto_talles && producto.producto_talles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Talle</p>
              <div className="flex flex-wrap gap-2">
                {producto.producto_talles.map(t => (
                  <span
                    key={t.talle}
                    className={`inline-block px-4 py-1.5 font-semibold text-sm rounded-full ${
                      t.stock > 0 ? 'bg-stone-100 text-stone-800' : 'bg-stone-50 text-stone-300 line-through'
                    }`}
                  >
                    {t.talle}
                  </span>
                ))}
              </div>
            </div>
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

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90 mt-auto"
              style={{ background: '#25D366' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Consultar por WhatsApp
            </a>
          ) : (
            <div className="w-full py-4 rounded-2xl text-center text-sm text-stone-400 bg-stone-100">
              Contactate con {nombreTienda} para consultar disponibilidad
            </div>
          )}

          <Link href="/tienda" className="text-center mt-4 text-sm text-stone-400 hover:text-stone-700 transition-colors">
            ← Ver más productos
          </Link>
        </div>
      </div>
    </div>
  )
}
