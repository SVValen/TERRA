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
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl uppercase tracking-tighter" style={{ color: 'var(--tienda-text)', fontFamily: 'var(--font-anton)' }}>{titulo}</h2>
        {verTodoHref && (
          <Link href={verTodoHref} className="font-mono text-xs uppercase underline underline-offset-4 text-white/50 hover:text-red-600 transition-colors">
            Ver todo
          </Link>
        )}
      </div>

      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          className="flex gap-6 sm:gap-8 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollSnapType: 'x mandatory', justifyContent: 'safe center' }}
        >
          {productos.map(p => (
            <div
              key={p.id}
              className="shrink-0 w-[55%] sm:w-[30%] lg:w-[22%]"
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
          className="hidden sm:flex absolute left-0 top-[35%] -translate-y-1/2 -translate-x-3 w-10 h-10 items-center justify-center bg-black text-white border border-white/30 opacity-0 group-hover/carousel:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => desplazar(1)}
          aria-label="Siguiente"
          className="hidden sm:flex absolute right-0 top-[35%] -translate-y-1/2 translate-x-3 w-10 h-10 items-center justify-center bg-black text-white border border-white/30 opacity-0 group-hover/carousel:opacity-100 hover:bg-red-600 hover:border-red-600 transition-all"
        >
          →
        </button>
      </div>
    </section>
  )
}
