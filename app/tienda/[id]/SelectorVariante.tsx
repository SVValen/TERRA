'use client'

import { useMemo, useState } from 'react'

type Variante = { talle: string; color: string; stock: number }

export default function SelectorVariante({
  variantes,
  nombre,
  precioVenta,
  whatsapp,
  nombreTienda,
  productoUrl,
}: {
  variantes: Variante[]
  nombre: string
  precioVenta: number
  whatsapp: string | null
  nombreTienda: string
  productoUrl: string
}) {
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
    const colores = variantes.filter(v => v.talle === talle && v.color !== '')
    setColorSel(colores.length === 1 ? colores[0].color : null)
  }

  const varianteElegida = variantes.find(v =>
    v.talle === talleSel && (coloresDelTalle.length === 0 ? true : v.color === colorSel)
  )

  const stockPorTalle = (talle: string) =>
    variantes.filter(v => v.talle === talle).reduce((a, v) => a + v.stock, 0)

  const lineas = [
    `Hola *${nombreTienda}*! 👋`,
    ``,
    `Me interesa este producto:`,
    `*${nombre}*`,
    talleSel ? `Talle: ${talleSel}${colorSel ? ` - ${colorSel}` : ''}` : '',
    `Precio: $${precioVenta.toLocaleString('es-AR')}`,
    ``,
    productoUrl,
  ].filter(l => l !== '')
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}` : null

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
                onClick={() => setColorSel(v.color)}
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

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90 mt-auto"
          style={{ background: '#25D366' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Consultar por WhatsApp
        </a>
      ) : (
        <div className="w-full py-4 rounded-2xl text-center text-sm text-stone-400 bg-stone-100">
          Contactate con {nombreTienda} para consultar disponibilidad
        </div>
      )}
    </div>
  )
}
