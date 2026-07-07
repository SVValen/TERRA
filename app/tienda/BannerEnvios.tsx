'use client'

import { useTienda } from './TiendaShell'

const REPETICIONES = 6

export default function BannerEnvios() {
  const { negocio } = useTienda()

  if (!negocio.bannerEnvios) return null

  return (
    <div className="overflow-hidden w-full py-2 border-y" style={{ background: 'var(--tienda-banner-bg)', borderColor: 'var(--tienda-banner-text)' }}>
      <div
        className="marquee-track flex whitespace-nowrap w-max"
        style={{
          animationDuration: `${negocio.bannerEnviosVelocidad}s`,
          animationDirection: negocio.bannerEnviosDireccion === 'derecha' ? 'reverse' : 'normal',
        }}
      >
        {[0, 1].map(bloque => (
          <span key={bloque} className="flex items-center shrink-0">
            {Array.from({ length: REPETICIONES }).map((_, i) => (
              <span
                key={i}
                className="px-6 font-mono text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--tienda-banner-text)' }}
              >
                {negocio.bannerEnvios} •
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
