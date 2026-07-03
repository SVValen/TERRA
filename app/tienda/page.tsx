'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTienda } from './TiendaShell'
import type { Producto as ProductoBase } from '@/lib/types'

type Producto = Pick<
  ProductoBase,
  'id' | 'nombre' | 'foto_url' | 'fotos_urls' | 'precio_venta' | 'categoria' | 'subcategoria' | 'stock'
> & { producto_talles: { talle: string; color: string; stock: number }[] }

interface Categoria {
  id: string
  nombre: string
  subcategorias: string[]
}

export default function TiendaPage() {
  const { whatsapp, nombre } = useTienda()
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('')

  useEffect(() => {
    fetch('/api/tienda/categorias').then(r => r.json()).then(setCategorias)
    fetch('/api/tienda/visita', { method: 'POST' })
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
            <ProductCard key={p.id} producto={p} whatsapp={whatsapp} nombreTienda={nombre} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildWaUrl(whatsapp: string, nombreTienda: string, p: Producto) {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${base}/tienda/${p.id}`
  const tallesConStock = p.producto_talles?.filter(t => t.stock > 0).map(t => t.talle) ?? []
  const lines = [
    `Hola *${nombreTienda}*! 👋`,
    ``,
    `Me interesa este producto:`,
    `*${p.nombre}*`,
    tallesConStock.length > 0 ? `Talle: ${tallesConStock.join('/')}` : '',
    `Precio: $${p.precio_venta.toLocaleString('es-AR')}`,
    ``,
    link,
  ].filter(l => l !== undefined)
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`
}

function ProductCard({ producto: p, whatsapp, nombreTienda }: { producto: Producto; whatsapp: string | null; nombreTienda: string }) {
  const waUrl = whatsapp ? buildWaUrl(whatsapp, nombreTienda, p) : null

  const sinStock = p.stock === 0

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 ${sinStock ? 'opacity-60' : ''}`}>
      <Link href={`/tienda/${p.id}`} className="block">
        <div className="aspect-square bg-stone-50 relative overflow-hidden">
          {p.foto_url ? (
            <Image
              src={p.foto_url}
              alt={p.nombre}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${sinStock ? 'grayscale' : ''}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-stone-200">📷</div>
          )}
          {p.fotos_urls?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              +{p.fotos_urls.length - 1}
            </div>
          )}
          {sinStock && (
            <div className="absolute top-2 left-2 bg-stone-800/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              Sin stock
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <Link href={`/tienda/${p.id}`}>
          <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 hover:text-amber-800 transition-colors" style={{ color: 'var(--tienda-text)' }}>
            {p.nombre}
          </p>
        </Link>

        {(p.categoria || p.subcategoria) && (
          <p className="text-xs text-stone-400 mb-1.5">
            {[p.categoria, p.subcategoria].filter(Boolean).join(' · ')}
          </p>
        )}

        {p.producto_talles && p.producto_talles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {p.producto_talles.map(t => (
              <span
                key={t.talle}
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                  t.stock > 0 ? 'text-stone-600 bg-stone-100' : 'text-stone-300 bg-stone-50 line-through'
                }`}
              >
                {t.talle}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-base font-bold" style={{ color: 'var(--tienda-text)' }}>
            ${p.precio_venta.toLocaleString('es-AR')}
          </p>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => fetch('/api/tienda/click-wa', { method: 'POST' })}
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              Consultar
            </a>
          ) : (
            <Link
              href={`/tienda/${p.id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-slate-900 transition-opacity"
              style={{ background: 'var(--accent)' }}
            >
              Ver más
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
