'use client'

import { useRef } from 'react'
import Link from 'next/link'
import ProductoCard, { type ProductoCardData } from './ProductoCard'

export default function ProductCarousel({
  titulo,
  productos,
  verTodoHref,
  whatsapp,
  nombreTienda,
}: {
  titulo: string
  productos: ProductoCardData[]
  verTodoHref?: string
  whatsapp: string | null
  nombreTienda: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (productos.length === 0) return null

  const desplazar = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tienda-text)' }}>{titulo}</h2>
        {verTodoHref && (
          <Link href={verTodoHref} className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            Ver todo
          </Link>
        )}
      </div>

      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {productos.map(p => (
            <div
              key={p.id}
              className="shrink-0 w-[45%] sm:w-[30%] lg:w-[22%]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductoCard producto={p} whatsapp={whatsapp} nombreTienda={nombreTienda} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => desplazar(-1)}
          aria-label="Anterior"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => desplazar(1)}
          aria-label="Siguiente"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          →
        </button>
      </div>
    </section>
  )
}
