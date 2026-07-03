'use client'

import { useState } from 'react'

export default function ListaSimple({
  titulo,
  placeholder,
  items,
  onAgregar,
  onEliminar,
}: {
  titulo: string
  placeholder: string
  items: { id: string; nombre: string }[]
  onAgregar: (nombre: string) => Promise<void>
  onEliminar: (id: string, nombre: string) => Promise<void>
}) {
  const [nuevo, setNuevo] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevo.trim()) return
    setCreando(true)
    setError('')
    try {
      await onAgregar(nuevo.trim())
      setNuevo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    }
    setCreando(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">{titulo}</h2>

      <form onSubmit={agregar} className="flex gap-2 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={nuevo}
            onChange={e => { setNuevo(e.target.value); setError('') }}
            placeholder={placeholder}
            className="input"
          />
        </div>
        <button
          type="submit"
          disabled={creando || !nuevo.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-40 shrink-0 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {creando ? '...' : 'Agregar'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mb-3 -mt-2">{error}</p>}

      {items.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Sin elementos todavía.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm px-3 py-1 rounded-full"
            >
              {item.nombre}
              <button
                onClick={() => onEliminar(item.id, item.nombre)}
                className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
