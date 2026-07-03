'use client'

import { useEffect, useState, useRef } from 'react'
import type { Categoria, Talle, Color } from '@/lib/types'
import ListaSimple from './ListaSimple'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [talles, setTalles] = useState<Talle[]>([])
  const [colores, setColores] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const [cats, tallesRes, coloresRes] = await Promise.all([
      fetch('/api/categorias').then(r => r.json()),
      fetch('/api/talles').then(r => r.json()),
      fetch('/api/colores').then(r => r.json()),
    ])
    setCategorias(cats)
    setTalles(tallesRes)
    setColores(coloresRes)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const crearTalle = async (nombre: string) => {
    const res = await fetch('/api/talles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al crear')
    }
    await cargar()
  }

  const eliminarTalle = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el talle "${nombre}"?`)) return
    await fetch(`/api/talles/${id}`, { method: 'DELETE' })
    cargar()
  }

  const crearColor = async (nombre: string) => {
    const res = await fetch('/api/colores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al crear')
    }
    await cargar()
  }

  const eliminarColor = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el color "${nombre}"?`)) return
    await fetch(`/api/colores/${id}`, { method: 'DELETE' })
    cargar()
  }

  const crearCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCategoria.trim()) return
    setCreando(true)
    setError('')
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaCategoria.trim() }),
    })
    if (res.ok) {
      setNuevaCategoria('')
      cargar()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear')
    }
    setCreando(false)
  }

  const eliminarCategoria = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return
    await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
    cargar()
  }

  const agregarSubcategoria = async (cat: Categoria, nueva: string) => {
    if (!nueva.trim() || cat.subcategorias.includes(nueva.trim())) return
    const actualizadas = [...cat.subcategorias, nueva.trim()]
    await fetch(`/api/categorias/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcategorias: actualizadas }),
    })
    cargar()
  }

  const eliminarSubcategoria = async (cat: Categoria, sub: string) => {
    const actualizadas = cat.subcategorias.filter(s => s !== sub)
    await fetch(`/api/categorias/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subcategorias: actualizadas }),
    })
    cargar()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorías, talles y colores</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Organizá los productos por categoría/subcategoría, y gestioná las listas de talles y colores disponibles para cargar stock
        </p>
      </div>

      {/* Crear categoría */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Nueva categoría</h2>
        <form onSubmit={crearCategoria} className="flex gap-2">
          <input
            type="text"
            value={nuevaCategoria}
            onChange={e => { setNuevaCategoria(e.target.value); setError('') }}
            placeholder="Ej: Ropa, Calzado, Accesorios..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={creando || !nuevaCategoria.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-40 shrink-0 transition-opacity"
            style={{ background: 'var(--accent)' }}
          >
            {creando ? '...' : 'Agregar'}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-10 text-gray-400 dark:text-slate-500 text-sm justify-center">
          <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
          Cargando...
        </div>
      )}

      {!loading && categorias.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500">
          <p className="text-3xl mb-2">🏷️</p>
          <p className="text-sm font-medium">Sin categorías todavía</p>
          <p className="text-xs mt-1">Creá la primera con el formulario de arriba</p>
        </div>
      )}

      <div className="space-y-3">
        {categorias.map(cat => (
          <CategoriaCard
            key={cat.id}
            categoria={cat}
            onEliminar={() => eliminarCategoria(cat.id, cat.nombre)}
            onAgregarSub={(sub) => agregarSubcategoria(cat, sub)}
            onEliminarSub={(sub) => eliminarSubcategoria(cat, sub)}
          />
        ))}
      </div>

      {!loading && (
        <div className="mt-8 space-y-4">
          <ListaSimple
            titulo="Talles"
            placeholder="Ej: M, XL, 42..."
            items={talles}
            onAgregar={crearTalle}
            onEliminar={eliminarTalle}
          />
          <ListaSimple
            titulo="Colores"
            placeholder="Ej: Negro, Blanco, Beige..."
            items={colores}
            onAgregar={crearColor}
            onEliminar={eliminarColor}
          />
        </div>
      )}
    </div>
  )
}

function CategoriaCard({ categoria, onEliminar, onAgregarSub, onEliminarSub }: {
  categoria: Categoria
  onEliminar: () => void
  onAgregarSub: (sub: string) => void
  onEliminarSub: (sub: string) => void
}) {
  const [nuevaSub, setNuevaSub] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const agregarSub = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaSub.trim()) return
    onAgregarSub(nuevaSub.trim())
    setNuevaSub('')
    inputRef.current?.focus()
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900 dark:text-white">{categoria.nombre}</span>
          <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {categoria.subcategorias.length} sub{categoria.subcategorias.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onEliminar}
          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-lg transition-colors"
        >
          Eliminar
        </button>
      </div>

      <div className="px-5 py-4">
        {categoria.subcategorias.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {categoria.subcategorias.map(sub => (
              <span
                key={sub}
                className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm px-3 py-1 rounded-full"
              >
                {sub}
                <button
                  onClick={() => onEliminarSub(sub)}
                  className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Sin subcategorías. Agregá la primera abajo.</p>
        )}

        <form onSubmit={agregarSub} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nuevaSub}
            onChange={e => setNuevaSub(e.target.value)}
            placeholder="Nueva subcategoría..."
            className="input flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!nuevaSub.trim()}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0"
          >
            + Agregar
          </button>
        </form>
      </div>
    </div>
  )
}
