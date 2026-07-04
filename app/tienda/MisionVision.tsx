'use client'

import Image from 'next/image'
import { useTienda } from './TiendaShell'

export default function MisionVision() {
  const { negocio } = useTienda()

  return (
    <section className="border-y border-white/15 py-20 md:py-32 overflow-hidden bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        {/* Misión */}
        <div className="order-2 md:order-1">
          <h2
            className="text-4xl sm:text-5xl uppercase tracking-tighter mb-6 leading-none"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            Nuestra Misión
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed whitespace-pre-line">
            {negocio.misionTexto}
          </p>
        </div>
        <div className="order-1 md:order-2 relative">
          <div className="aspect-[4/5] bg-white/5 border border-white/10 relative flex items-center justify-center overflow-hidden">
            {negocio.misionImagenUrl ? (
              <Image src={negocio.misionImagenUrl} alt="Nuestra misión" fill className="object-cover grayscale" sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <span className="font-mono text-xs uppercase tracking-widest text-white/20">Terra Urban Systems</span>
            )}
            <div className="absolute -bottom-6 -left-6 bg-black border border-white/30 p-6 hidden md:block">
              <span className="text-3xl uppercase" style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}>01</span>
            </div>
          </div>
        </div>

        {/* Visión */}
        <div className="order-3 relative">
          <div className="aspect-[4/5] bg-white/5 border border-white/10 relative flex items-center justify-center overflow-hidden">
            {negocio.visionImagenUrl ? (
              <Image src={negocio.visionImagenUrl} alt="Nuestra visión" fill className="object-cover grayscale" sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <span className="font-mono text-xs uppercase tracking-widest text-white/20">Terra Urban Systems</span>
            )}
            <div className="absolute -top-6 -right-6 bg-black border border-white/30 p-6 hidden md:block">
              <span className="text-3xl uppercase" style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}>02</span>
            </div>
          </div>
        </div>
        <div className="order-4">
          <h2
            className="text-4xl sm:text-5xl uppercase tracking-tighter mb-6 leading-none"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            Nuestra Visión
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed whitespace-pre-line">
            {negocio.visionTexto}
          </p>
        </div>
      </div>
    </section>
  )
}
