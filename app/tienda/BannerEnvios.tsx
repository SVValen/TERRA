'use client'

import { useTienda } from './TiendaShell'

const REPETICIONES = 6

export default function BannerEnvios() {
  const { negocio } = useTienda()

  if (!negocio.bannerEnvios) return null

  return (
    <div className="overflow-hidden w-full py-1.5" style={{ background: 'var(--tienda-banner-bg)' }}>
      <div className="marquee-track flex whitespace-nowrap w-max">
        {[0, 1].map(bloque => (
          <span key={bloque} className="flex items-center shrink-0">
            {Array.from({ length: REPETICIONES }).map((_, i) => (
              <span key={i} className="px-6 text-xs font-semibold" style={{ color: 'var(--tienda-banner-text)' }}>
                {negocio.bannerEnvios}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
