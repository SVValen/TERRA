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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {disponibles} disponibles · {vendidos} vendidos · {productos.length} total
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Estado */}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="reservado">Reservado</option>
        </select>

        {/* Categoría */}
        <select
          value={filtroCategoria}
          onChange={(e) => { setFiltroCategoria(e.target.value); setFiltroSubcategoria('') }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>

        {/* Subcategoría (solo si hay categoría seleccionada con subs) */}
        {filtroCategoria && subcategorias.length > 0 && (
          <select
            value={filtroSubcategoria}
            onChange={(e) => setFiltroSubcategoria(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="">Todas las subcategorías</option>
            {subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {/* Limpiar filtros */}
        {(filtroEstado || filtroCategoria || filtroSubcategoria || busqueda) && (
          <button
            onClick={() => { setFiltroEstado(''); setFiltroCategoria(''); setFiltroSubcategoria(''); setBusqueda('') }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros ×
          </button>
        )}
      </div>

      {/* Grid de tarjetas */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {!loading && productos.length === 0 && (
        <div className="text-center py-20 text-gray-400">
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
    <Link href={`/stock/${p.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200">
        {/* Foto */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {p.foto_url ? (
            <img
              src={p.foto_url}
              alt={p.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">
              📷
            </div>
          )}

          {/* Badge estado */}
          <div className="absolute top-2 right-2">
            <EstadoBadge estado={p.estado} />
          </div>

          {/* Badge múltiples fotos */}
          {p.fotos_urls?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md">
              {p.fotos_urls.length} fotos
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
            {p.nombre}
          </p>

          {(p.categoria || p.subcategoria) && (
            <p className="text-xs text-gray-400 mb-2 line-clamp-1">
              {[p.categoria, p.subcategoria].filter(Boolean).join(' › ')}
            </p>
          )}

          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-base font-bold text-gray-900">
                ${p.precio_venta.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-400">
                costo ${p.costo.toLocaleString('es-AR')}
              </p>
            </div>
            {margen !== null && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                margen >= 40 ? 'bg-emerald-50 text-emerald-700' :
                margen >= 20 ? 'bg-amber-50 text-amber-700' :
                'bg-gray-100 text-gray-500'
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
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shadow-sm ${cls}`}>
      {label}
    </span>
  )
}
