'use client'

import { useEffect, useState } from 'react'
import { useTienda } from './TiendaShell'
import { type ProductoCardData } from './ProductoCard'
import type { Anuncio } from '@/lib/types'
import ProductCarousel from './ProductCarousel'
import Hero from './Hero'
import MisionVision from './MisionVision'

export default function TiendaPage() {
  const { negocio, catalogo } = useTienda()
  const [destacados, setDestacados] = useState<ProductoCardData[]>([])
  const [nuevos, setNuevos] = useState<ProductoCardData[]>([])
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])

  useEffect(() => {
    fetch('/api/tienda/visita', { method: 'POST' })
    fetch('/api/tienda/productos?destacado=true').then(r => r.json()).then(setDestacados)
    fetch('/api/tienda/productos').then(r => r.json()).then((data: ProductoCardData[]) => setNuevos(data.slice(0, 10)))
    fetch('/api/tienda/anuncios').then(r => r.json()).then(setAnuncios)
  }, [])

  return (
    <div>
      <Hero anuncios={anuncios} productos={destacados} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />

      {negocio.textoDestacado && (
        <div className="overflow-hidden w-full py-4 border-y border-[var(--tienda-text)]/20 bg-[var(--tienda-text)] text-[var(--tienda-fondo)]">
          <div
            className="marquee-track flex whitespace-nowrap w-max"
            style={{
              animationDuration: `${negocio.bannerDestacadoVelocidad}s`,
              animationDirection: negocio.bannerDestacadoDireccion === 'derecha' ? 'reverse' : 'normal',
            }}
          >
            {[0, 1].map(bloque => (
              <span key={bloque} className="flex items-center shrink-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="px-6 text-2xl sm:text-3xl uppercase tracking-tighter"
                    style={{ fontFamily: 'var(--font-anton)' }}
                  >
                    {negocio.nombre} • {negocio.textoDestacado} •
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <ProductCarousel titulo="Nuevos" productos={nuevos} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => catalogo.setAbierto(true)}
            className="px-10 py-4 font-mono text-xs font-bold uppercase tracking-tighter transition-colors hover:bg-red-600 hover:text-white"
            style={{ background: 'var(--tienda-boton-bg)', color: 'var(--tienda-boton-text)' }}
          >
            Ver catálogo completo
          </button>
        </div>
      </div>

      {negocio.misionVisionHabilitado && <MisionVision />}
    </div>
  )
}
