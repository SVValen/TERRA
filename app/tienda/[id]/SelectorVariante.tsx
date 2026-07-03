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
  const { interes } = useTienda()
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
  })

  const agregarAInteres = () => {
    interes.agregar({ productoId, nombre, talle: talleSel, color: colorSel, foto })
    setAgregado(true)
  }

  return (
    <div>
      {talles.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Talle</p>
          <div className="flex flex-wrap gap-2">
            {talles.map(t => {
              const sinStock = stockPorTalle(t) === 0
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => seleccionarTalle(t)}
                  className={`inline-block px-4 py-1.5 font-semibold text-sm rounded-full transition-colors ${
                    sinStock
                      ? 'bg-stone-50 text-stone-300 line-through'
                      : talleSel === t
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
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
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {coloresDelTalle.map(v => (
              <button
                key={v.color}
                type="button"
                onClick={() => { setColorSel(v.color); setAgregado(false) }}
                className={`inline-block px-4 py-1.5 font-semibold text-sm rounded-full transition-colors ${
                  v.stock === 0
                    ? 'bg-stone-50 text-stone-300 line-through'
                    : colorSel === v.color
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {varianteElegida && (
        <p className="text-xs text-stone-400 mb-2">
          {varianteElegida.stock > 0
            ? `Stock de esta variante: ${varianteElegida.stock}`
            : 'Esta variante está sin stock'}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Consultar por WhatsApp
          </a>
        ) : (
          <div className="w-full py-4 rounded-2xl text-center text-sm text-stone-400 bg-stone-100">
            Contactate con {nombreTienda} para consultar disponibilidad
          </div>
        )}

        <button
          type="button"
          onClick={agregarAInteres}
          disabled={agregado}
          className="w-full py-3 rounded-2xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-60"
        >
          {agregado ? '✓ Agregado a mi interés' : 'Agregar a mi interés'}
        </button>
      </div>
    </div>
  )
}
