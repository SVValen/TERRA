'use client'

import { useMemo, useState } from 'react'
import { useTienda } from '../TiendaShell'
import { buildProductoWaUrl } from '@/lib/whatsapp'
import WhatsAppIcon from '../WhatsAppIcon'

type Variante = { talle: string; color: string; stock: number }

export default function SelectorVariante({
  productoId,
  variantes,
  nombre,
  foto,
  precioVenta,
  whatsapp,
  nombreTienda,
  productoUrl,
}: {
  productoId: string
  variantes: Variante[]
  nombre: string
  foto: string | null
  precioVenta: number
  whatsapp: string | null
  nombreTienda: string
  productoUrl: string
}) {
  const { interes, negocio } = useTienda()
  const [agregado, setAgregado] = useState(false)

  const talles = useMemo(() => [...new Set(variantes.map(v => v.talle))], [variantes])
  const [talleSel, setTalleSel] = useState<string | null>(talles.length === 1 ? talles[0] : null)

  const coloresDelTalle = useMemo(() => {
    if (!talleSel) return []
    return variantes.filter(v => v.talle === talleSel && v.color !== '')
  }, [variantes, talleSel])

  const [colorSel, setColorSel] = useState<string | null>(
    coloresDelTalle.length === 1 ? coloresDelTalle[0].color : null
  )

  const seleccionarTalle = (talle: string) => {
    setTalleSel(talle)
    setAgregado(false)
    const colores = variantes.filter(v => v.talle === talle && v.color !== '')
    setColorSel(colores.length === 1 ? colores[0].color : null)
  }

  const varianteElegida = variantes.find(v =>
    v.talle === talleSel && (coloresDelTalle.length === 0 ? true : v.color === colorSel)
  )

  const stockPorTalle = (talle: string) =>
    variantes.filter(v => v.talle === talle).reduce((a, v) => a + v.stock, 0)

  const waUrl = buildProductoWaUrl({
    whatsapp,
    nombreTienda,
    nombre,
    precioVenta,
    productoUrl,
    talle: talleSel,
    color: colorSel,
    saludo: negocio.whatsappSaludo,
    intro: negocio.whatsappMsgProductoIntro,
  })

  const agregarAInteres = () => {
    interes.agregar({ productoId, nombre, talle: talleSel, color: colorSel, foto })
    setAgregado(true)
  }

  return (
    <div>
      {talles.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-xs uppercase text-[var(--tienda-text)]/50 mb-2">Talle</p>
          <div className="grid grid-cols-4 gap-2">
            {talles.map(t => {
              const sinStock = stockPorTalle(t) === 0
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => seleccionarTalle(t)}
                  className={`py-3 font-mono text-sm border transition-colors ${
                    sinStock
                      ? 'border-[var(--tienda-text)]/10 text-[var(--tienda-text)]/20 line-through cursor-not-allowed'
                      : talleSel === t
                        ? 'bg-[var(--tienda-text)] text-[var(--tienda-fondo)] border-[var(--tienda-text)]'
                        : 'border-[var(--tienda-text)]/30 text-[var(--tienda-text)] hover:bg-[var(--tienda-text)] hover:text-[var(--tienda-fondo)]'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {talleSel && coloresDelTalle.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-xs uppercase text-[var(--tienda-text)]/50 mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {coloresDelTalle.map(v => (
              <button
                key={v.color}
                type="button"
                onClick={() => { setColorSel(v.color); setAgregado(false) }}
                className={`px-4 py-2 font-mono text-xs uppercase border transition-colors ${
                  v.stock === 0
                    ? 'border-[var(--tienda-text)]/10 text-[var(--tienda-text)]/20 line-through'
                    : colorSel === v.color
                      ? 'bg-[var(--tienda-text)] text-[var(--tienda-fondo)] border-[var(--tienda-text)]'
                      : 'border-[var(--tienda-text)]/30 text-[var(--tienda-text)] hover:bg-[var(--tienda-text)] hover:text-[var(--tienda-fondo)]'
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {varianteElegida && (
        <p className="font-mono text-[10px] uppercase text-[var(--tienda-text)]/40 mb-2">
          {varianteElegida.stock > 0
            ? `Stock de esta variante: ${varianteElegida.stock}`
            : 'Esta variante está sin stock'}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-4">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-5 text-white font-mono text-sm font-bold uppercase tracking-tighter transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        ) : (
          <div className="w-full py-5 text-center font-mono text-xs uppercase text-[var(--tienda-text)]/40 bg-[var(--tienda-text)]/5">
            Contactate con {nombreTienda} para consultar disponibilidad
          </div>
        )}

        <button
          type="button"
          onClick={agregarAInteres}
          disabled={agregado}
          className="w-full py-4 border border-[var(--tienda-text)]/30 font-mono text-xs font-bold uppercase tracking-tighter text-[var(--tienda-text)] hover:bg-[var(--tienda-text)] hover:text-[var(--tienda-fondo)] transition-colors disabled:opacity-40"
        >
          {agregado ? '✓ Agregado a mi interés' : 'Agregar a mi interés'}
        </button>
      </div>
    </div>
  )
}
