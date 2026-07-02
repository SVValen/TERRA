'use client'

import { useEffect, useState } from 'react'

interface Metricas {
  valor_stock_costo: number
  valor_stock_venta: number
  ganancia_total: number
  total_retiros: number
  saldo_disponible: number
  margen_promedio: number
  total_ventas: number
  total_productos: number
  productos_disponibles: number
}

export default function MetricasPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metricas')
      .then((r) => r.json())
      .then((d) => { setMetricas(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-gray-400 dark:text-slate-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
        Cargando...
      </div>
    )
  }

  if (!metricas) return <div className="p-8 text-red-500 text-sm">Error al cargar métricas.</div>

  const potencialGanancia = metricas.valor_stock_venta - metricas.valor_stock_costo

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Resumen general del negocio</p>
      </div>

      <Section title="Inventario actual">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Disponibles" value={metricas.productos_disponibles.toString()} sub={`de ${metricas.total_productos} totales`} />
          <MetricCard label="Valor a costo" value={`$${metricas.valor_stock_costo.toLocaleString('es-AR')}`} sub="lo que invertiste" />
          <MetricCard label="Valor a venta" value={`$${metricas.valor_stock_venta.toLocaleString('es-AR')}`} sub="si vendés todo" />
          <MetricCard label="Ganancia potencial" value={`$${potencialGanancia.toLocaleString('es-AR')}`} sub="si vendés todo" green />
        </div>
      </Section>

      <Section title="Ventas realizadas">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard label="Total de ventas" value={metricas.total_ventas.toString()} />
          <MetricCard label="Ganancia acumulada" value={`$${metricas.ganancia_total.toLocaleString('es-AR')}`} green />
          <MetricCard
            label="Margen promedio"
            value={`${(metricas.margen_promedio * 100).toFixed(1)}%`}
            sub="sobre precio de venta"
            green={metricas.margen_promedio >= 0.3}
          />
        </div>
      </Section>

      <Section title="Caja">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard label="Ganancia total" value={`$${metricas.ganancia_total.toLocaleString('es-AR')}`} />
          <MetricCard label="Total retirado" value={`$${metricas.total_retiros.toLocaleString('es-AR')}`} />
          <MetricCard
            label="Saldo disponible"
            value={`$${metricas.saldo_disponible.toLocaleString('es-AR')}`}
            green={metricas.saldo_disponible >= 0}
            red={metricas.saldo_disponible < 0}
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub, green, red }: {
  label: string; value: string; sub?: string; green?: boolean; red?: boolean
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 leading-tight">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold leading-none ${
        red ? 'text-red-500' : green ? 'text-emerald-500' : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{sub}</p>}
    </div>
  )
}
