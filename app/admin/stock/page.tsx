'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Producto, Categoria } from '@/lib/types'

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(setCategorias)
  }, [])

  const cargar = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    if (filtroSubcategoria) params.set('subcategoria', filtroSubcategoria)
    if (busqueda) params.set('q', busqueda)
    const res = await fetch(`/api/productos?${params}`)
    setProductos(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [filtroEstado, filtroCategoria, filtroSubcategoria, busqueda])

  const catActual = categorias.find(c => c.nombre === filtroCategoria)
  const subcategorias = catActual?.subcategorias ?? []
  const disponibles = productos.filter(p => p.estado === 'disponible').length
  const vendidos = productos.filter(p => p.estado === 'vendido').length
  const hayFiltros = filtroEstado || filtroCategoria || filtroSubcategoria || busqueda

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {disponibles} disponibles · {vendidos} vendidos · {productos.length} total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input pl-9"
          />
        </div>

        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input w-auto">
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="reservado">Reservado</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => { setFiltroCategoria(e.target.value); setFiltroSubcategoria('') }}
          className="input w-auto"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>

        {filtroCategoria && subcategorias.length > 0 && (
          <select value={filtroSubcategoria} onChange={(e) => setFiltroSubcategoria(e.target.value)} className="input w-auto">
            <option value="">Todas las subs</option>
            {subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {hayFiltros && (
          <button
            onClick={() => { setFiltroEstado(''); setFiltroCategoria(''); setFiltroSubcategoria(''); setBusqueda('') }}
            className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            Limpiar ×
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400 dark:text-slate-500">
          <div className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {!loading && productos.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm font-medium">
            Sin productos{busqueda ? ` con "${busqueda}"` : filtroCategoria ? ` en "${filtroCategoria}"` : ''}
          </p>
          <p className="text-xs mt-1">Usá el bot con /cargar para agregar productos</p>
        </div>
      )}

      {!loading && productos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {productos.map((p) => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}
    </div>
  )
}

function ProductCard({ producto: p }: { producto: Producto }) {
  const margen = p.costo > 0
    ? Math.round((p.precio_venta - p.costo) / p.precio_venta * 100)
    : null

  return (
    <Link href={`/admin/stock/${p.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200">
        <div className="aspect-square bg-gray-50 dark:bg-slate-700 relative overflow-hidden">
          {p.foto_url ? (
            <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200 dark:text-slate-600">📷</div>
          )}
          <div className="absolute top-2 right-2">
            <EstadoBadge estado={p.estado} />
          </div>
          {p.fotos_urls?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md">
              {p.fotos_urls.length} fotos
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">{p.nombre}</p>
          {(p.categoria || p.subcategoria) && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 line-clamp-1">
              {[p.categoria, p.subcategoria].filter(Boolean).join(' › ')}
            </p>
          )}
          {p.talle && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Talle: {p.talle}</p>
          )}
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">${p.precio_venta.toLocaleString('es-AR')}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">costo ${p.costo.toLocaleString('es-AR')}</p>
            </div>
            {margen !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                margen >= 40 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' :
                margen >= 20 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' :
                'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
              }`}>
                {margen}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    disponible: { label: 'Disponible', cls: 'bg-emerald-500 text-white' },
    vendido:    { label: 'Vendido',    cls: 'bg-gray-400 text-white' },
    reservado:  { label: 'Reservado',  cls: 'bg-amber-400 text-white' },
  }
  const { label, cls } = map[estado] ?? { label: estado, cls: 'bg-gray-400 text-white' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium shadow-sm ${cls}`}>{label}</span>
}
