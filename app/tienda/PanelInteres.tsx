'use client'

import Image from 'next/image'
import { useTienda } from './TiendaShell'
import { buildInteresWaUrl } from '@/lib/whatsapp'
import WhatsAppIcon from './WhatsAppIcon'

export default function PanelInteres() {
  const { negocio, interes } = useTienda()

  if (!interes.abierto) return null

  const waUrl = buildInteresWaUrl({ whatsapp: negocio.whatsapp, nombreTienda: negocio.nombre, items: interes.items })

  const confirmar = () => {
    if (!waUrl) return
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    interes.limpiar()
    interes.setAbierto(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={() => interes.setAbierto(false)} />
      <div className="relative w-full sm:w-96 h-full bg-black border-l border-white/20 flex flex-col">
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 shrink-0">
          <span className="font-mono text-xs uppercase tracking-widest text-white">Mi interés ({interes.items.length})</span>
          <button
            type="button"
            onClick={() => interes.setAbierto(false)}
            aria-label="Cerrar"
            className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {interes.items.length === 0 ? (
            <p className="font-mono text-xs uppercase text-white/40 text-center mt-12">Todavía no agregaste productos.</p>
          ) : (
            interes.items.map((item, i) => (
              <div key={`${item.productoId}-${item.talle}-${item.color}-${i}`} className="flex items-center gap-3 border border-white/15 p-2.5">
                <div className="w-14 h-14 bg-white/5 overflow-hidden relative shrink-0">
                  {item.foto ? (
                    <Image src={item.foto} alt={item.nombre} fill className="object-cover grayscale" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-white/20">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm uppercase text-white line-clamp-1">{item.nombre}</p>
                  {(item.talle || item.color) && (
                    <p className="font-mono text-[10px] uppercase text-white/40">{[item.talle, item.color].filter(Boolean).join(' - ')}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => interes.quitar(item.productoId, item.talle, item.color)}
                  aria-label="Quitar"
                  className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-red-600 transition-colors shrink-0"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {interes.items.length > 0 && (
          <div className="p-4 border-t border-white/20 shrink-0">
            {waUrl ? (
              <button
                type="button"
                onClick={confirmar}
                className="flex items-center justify-center gap-3 w-full py-4 text-white font-mono text-xs font-bold uppercase tracking-tighter transition-opacity hover:opacity-90"
                style={{ background: '#25D366' }}
              >
                <WhatsAppIcon className="w-5 h-5" />
                Consultar por WhatsApp
              </button>
            ) : (
              <div className="w-full py-4 text-center font-mono text-xs uppercase text-white/40 bg-white/5">
                Contactate con {negocio.nombre} para consultar disponibilidad
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
