'use client'

import { useEffect, useState } from 'react'
import type { Retiro } from '@/lib/types'

export default function RetirosPage() {
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [loading, setLoading] = useState(true)
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [gananciaTotal, setGananciaTotal] = useState(0)

  const cargar = async () => {
    setLoading(true)
    const [retirosRes, metricasRes] = await Promise.all([
      fetch('/api/retiros').then((r) => r.json()),
      fetch('/api/metricas').then((r) => r.json()),
    ])
    setRetiros(retirosRes)
    setGananciaTotal(metricasRes.ganancia_total ?? 0)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const totalRetiros = retiros.reduce((acc, r) => acc + r.monto, 0)
  const saldoDisponible = gananciaTotal - totalRetiros

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) return
    setEnviando(true)
    await fetch('/api/retiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: montoNum, motivo: motivo || undefined }),
    })
    setMonto('')
    setMotivo('')
    setEnviando(false)
    cargar()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Retiros</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Gestión de retiros de caja</p>
      </div>

      {/* Cards saldo */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 font-medium uppercase tracking-wide">Ganancia total</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">${gananciaTotal.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 font-medium uppercase tracking-wide">Retirado</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">${totalRetiros.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 font-medium uppercase tracking-wide">Disponible</p>
          <p className={`text-lg sm:text-2xl font-bold ${saldoDisponible >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            ${saldoDisponible.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Nuevo retiro</h2>
            <form onSubmit={registrar} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Monto *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0"
                    required
                    min="1"
                    className="input pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                  Motivo <span className="text-gray-300 dark:text-slate-600">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: gastos del local"
                  className="input"
                />
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {enviando ? 'Registrando...' : 'Registrar retiro'}
              </button>
            </form>
          </div>
        </div>

        {/* Historial */}
        <div className="lg:col-span-3">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">Historial</h2>
          {loading && (
            <div className="flex items-center gap-2 py-6 text-gray-400 dark:text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
              Cargando...
            </div>
          )}
          {!loading && retiros.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-slate-500">
              <p className="text-2xl mb-2">💸</p>
              <p className="text-sm">Sin retiros registrados</p>
            </div>
          )}
          {retiros.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/40">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Fecha</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Motivo</th>
                      <th className="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-slate-400">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {retiros.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30">
                        <td className="py-2.5 px-4 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs sm:text-sm">
                          {new Date(r.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700 dark:text-slate-300">{r.motivo ?? <span className="text-gray-300 dark:text-slate-600">—</span>}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          ${r.monto.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
