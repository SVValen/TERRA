'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ProductoCardData } from './ProductoCard'
import { buildProductoWaUrl } from '@/lib/whatsapp'
import { getBaseUrl } from '@/lib/tienda'
import WhatsAppIcon from './WhatsAppIcon'

export default function HeroDestacados({
  productos,
  whatsapp,
  nombreTienda,
}: {
  productos: ProductoCardData[]
  whatsapp: string | null
  nombreTienda: string
}) {
  const [activo, setActivo] = useState(0)

  if (productos.length === 0) return null

  const irSiguiente = () => setActivo(i => (i + 1) % productos.length)
  const irAnterior = () => setActivo(i => (i - 1 + productos.length) % productos.length)

  const p = productos[activo]
  const tieneDescuento = !!p.precio_anterior && p.precio_anterior > p.precio_venta
  const productoUrl = `${typeof window !== 'undefined' ? window.location.origin : getBaseUrl()}/tienda/${p.id}`
  const waUrl = buildProductoWaUrl({
    whatsapp,
    nombreTienda,
    nombre: p.nombre,
    precioVenta: p.precio_venta,
    productoUrl,
  })

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] bg-stone-100 overflow-hidden">
      {p.foto_url ? (
        <Image
          key={p.id}
          src={p.foto_url}
          alt={p.nombre}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-7xl text-stone-300">📷</div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-8 pb-8 sm:pb-12 max-w-6xl mx-auto left-0 right-0">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Destacado</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-3 max-w-2xl">
          {p.nombre}
        </h1>
        <div className="flex items-baseline gap-3 mb-5">
          <p className="text-2xl sm:text-3xl font-bold text-white">
            ${p.precio_venta.toLocaleString('es-AR')}
          </p>
          {tieneDescuento && (
            <p className="text-base text-white/60 line-through">
              ${p.precio_anterior!.toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/tienda/${p.id}`}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--tienda-boton-bg)', color: 'var(--tienda-boton-text)' }}
          >
            Ver producto
          </Link>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon />
              Consultar por WhatsApp
            </a>
          )}
        </div>
      </div>

      {productos.length > 1 && (
        <>
          <button
            type="button"
            onClick={irAnterior}
            aria-label="Anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
          >
            ←
          </button>
          <button
            type="button"
            onClick={irSiguiente}
            aria-label="Siguiente"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
          >
            →
          </button>
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
            {productos.map((prod, i) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => setActivo(i)}
                aria-label={`Ir al destacado ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${i === activo ? 'bg-white w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
