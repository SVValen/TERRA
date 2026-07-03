'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTienda } from './TiendaShell'
import ProductoCard, { type ProductoCardData } from './ProductoCard'
import ProductCarousel from './ProductCarousel'

interface Categoria {
  id: string
  nombre: string
  subcategorias: string[]
}

export default function TiendaPage() {
  const { negocio } = useTienda()
  const [productos, setProductos] = useState<ProductoCardData[]>([])
  const [destacados, setDestacados] = useState<ProductoCardData[]>([])
  const [nuevos, setNuevos] = useState<ProductoCardData[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('')

  useEffect(() => {
    fetch('/api/tienda/categorias').then(r => r.json()).then(setCategorias)
    fetch('/api/tienda/visita', { method: 'POST' })
    fetch('/api/tienda/productos?destacado=true').then(r => r.json()).then(setDestacados)
    fetch('/api/tienda/productos').then(r => r.json()).then((data: ProductoCardData[]) => setNuevos(data.slice(0, 10)))

    // Llega desde el dropdown de categorías del header (link con query params)
    Promise.resolve().then(() => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('categoria')) setCategoriaActiva(params.get('categoria')!)
      if (params.get('subcategoria')) setSubcategoriaActiva(params.get('subcategoria')!)
    })
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busqueda) params.set('q', busqueda)
    if (categoriaActiva) params.set('categoria', categoriaActiva)
    if (subcategoriaActiva) params.set('subcategoria', subcategoriaActiva)
    const res = await fetch(`/api/tienda/productos?${params}`)
    setProductos(await res.json())
    setLoading(false)
  }, [busqueda, categoriaActiva, subcategoriaActiva])

  useEffect(() => { cargar() }, [cargar])

  const catData = categorias.find(c => c.nombre === categoriaActiva)
  const subcategorias = catData?.subcategorias ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <ProductCarousel titulo="Destacados" productos={destacados} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />
      <ProductCarousel titulo="Nuevos" productos={nuevos} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />

      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--tienda-text)' }}>Catálogo completo</h2>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setSubcategoriaActiva('') }}
            placeholder="Buscar productos..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-sm"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filtro categorías */}
      {categorias.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => { setCategoriaActiva(''); setSubcategoriaActiva('') }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !categoriaActiva
                  ? 'text-slate-900 shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
              }`}
              style={!categoriaActiva ? { background: 'var(--accent)' } : {}}
            >
              Todo
            </button>
            {categorias.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategoriaActiva(c.nombre === categoriaActiva ? '' : c.nombre); setSubcategoriaActiva('') }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoriaActiva === c.nombre
                    ? 'text-slate-900 shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                }`}
                style={categoriaActiva === c.nombre ? { background: 'var(--accent)' } : {}}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          {categoriaActiva && subcategorias.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-none">
              {subcategorias.map(s => (
                <button
                  key={s}
                  onClick={() => setSubcategoriaActiva(s === subcategoriaActiva ? '' : s)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    subcategoriaActiva === s
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contador */}
      {!loading && (
        <p className="text-xs text-stone-400 mb-5">
          {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          {categoriaActiva ? ` en ${categoriaActiva}` : ''}
          {busqueda ? ` · "${busqueda}"` : ''}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-24 text-stone-400">
          <div className="w-5 h-5 border-2 border-stone-200 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {!loading && productos.length === 0 && (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🛍️</p>
          <p className="text-stone-600 font-medium">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin productos disponibles'}
          </p>
          {(busqueda || categoriaActiva) && (
            <button
              onClick={() => { setBusqueda(''); setCategoriaActiva(''); setSubcategoriaActiva('') }}
              className="mt-3 text-sm text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              Ver todos
            </button>
          )}
        </div>
      )}

      {!loading && productos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {productos.map(p => (
            <ProductoCard key={p.id} producto={p} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />
          ))}
        </div>
      )}
    </div>
  )
}
