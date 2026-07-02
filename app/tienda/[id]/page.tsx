'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTienda } from '../TiendaShell'

interface Producto {
  id: string
  nombre: string
  foto_url: string | null
  fotos_urls: string[]
  talle: string | null
  precio_venta: number
  categoria: string | null
  subcategoria: string | null
  stock: number
}

export default function ProductoTiendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { whatsapp, nombre: nombreTienda } = useTienda()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoActiva, setFotoActiva] = useState(0)

  useEffect(() => {
    fetch(`/api/tienda/productos/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProducto(data); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-stone-400">
        <div className="w-5 h-5 border-2 border-stone-200 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }

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

  const fotos = producto.fotos_urls?.length ? producto.fotos_urls : producto.foto_url ? [producto.foto_url] : []
  const fotoMostrada = fotos[fotoActiva] ?? null

  const waMsg = encodeURIComponent(
    `Hola! Me interesa este producto:\n*${producto.nombre}*${producto.talle ? ` · Talle ${producto.talle}` : ''}\nPrecio: $${producto.precio_venta.toLocaleString('es-AR')}`
  )
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${waMsg}` : null

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
        {/* Fotos */}
        <div className="space-y-3">
          <div className="aspect-square bg-stone-100 rounded-3xl overflow-hidden shadow-sm">
            {fotoMostrada ? (
              <img src={fotoMostrada} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl text-stone-200">📷</div>
            )}
          </div>

          {fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {fotos.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setFotoActiva(i)}
                  className={`shrink-0 w-18 h-18 rounded-xl overflow-hidden border-2 transition-all ${
                    i === fotoActiva ? 'border-amber-400 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                  style={{ width: '72px', height: '72px' }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

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

          {producto.talle && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Talle</p>
              <span className="inline-block px-4 py-1.5 bg-stone-100 text-stone-800 font-semibold text-sm rounded-full">
                {producto.talle}
              </span>
            </div>
          )}

          <div className="mb-6">
            <p className="text-3xl font-bold text-stone-900">
              ${producto.precio_venta.toLocaleString('es-AR')}
            </p>
          </div>

          {/* Stock indicator */}
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

          {/* CTA */}
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

          <Link
            href="/tienda"
            className="text-center mt-4 text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            ← Ver más productos
          </Link>
        </div>
      </div>
    </div>
  )
}
