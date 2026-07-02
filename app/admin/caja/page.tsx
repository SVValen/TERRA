'use client'

import { useEffect, useState } from 'react'

interface Venta {
  id: string
  precio_vendido: number
  ganancia: number
  fecha: string
  productos: { nombre: string; foto_url: string | null } | null
}

export default function CajaPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      const params = new URLSearchParams({ desde, hasta: `${hasta}T23:59:59` })
      const res = await fetch(`/api/ventas?${params}`)
      setVentas(await res.json())
      setLoading(false)
    }
    cargar()
  }, [desde, hasta])

  const totalVendido = ventas.reduce((acc, v) => acc + v.precio_vendido, 0)
  const totalGanancia = ventas.reduce((acc, v) => acc + (v.ganancia ?? 0), 0)

  const porDia = ventas.reduce<Record<string, Venta[]>>((acc, v) => {
    const dia = v.fecha.split('T')[0]
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(v)
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Caja</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Ventas del período</p>
      </div>

      {/* Selector de rango */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-slate-300 shrink-0">Período:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="input w-auto"
          />
          <span className="text-gray-400 dark:text-slate-500 text-sm">→</span>
          <input
            type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatCard label="Ventas" value={ventas.length.toString()} />
        <StatCard label="Total vendido" value={`$${totalVendido.toLocaleString('es-AR')}`} />
        <StatCard label="Ganancia" value={`$${totalGanancia.toLocaleString('es-AR')}`} green />
      </div>

      {/* Ventas por día */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400 dark:text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
          Cargando...
        </div>
      )}

      {!loading && Object.keys(porDia).length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm">Sin ventas en este período</p>
        </div>
      )}

      {!loading && Object.entries(porDia).map(([dia, ventasDia]) => (
        <div key={dia} className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{formatearFecha(dia)}</h2>
            <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {ventasDia.length} venta{ventasDia.length !== 1 ? 's' : ''} · $
              {ventasDia.reduce((a, v) => a + v.precio_vendido, 0).toLocaleString('es-AR')}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/40">
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Producto</th>
                    <th className="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Precio</th>
                    <th className="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Ganancia</th>
                    <th className="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400 hidden sm:table-cell">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {ventasDia.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30">
                      <td className="py-2.5 px-4 text-gray-900 dark:text-white font-medium">{v.productos?.nombre ?? '—'}</td>
                      <td className="py-2.5 px-4 text-right text-gray-700 dark:text-slate-300">${v.precio_vendido.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">${(v.ganancia ?? 0).toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-4 text-right text-gray-400 dark:text-slate-500 hidden sm:table-cell">
                        {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold ${green ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  )
}

function formatearFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
