'use client'

import { useEffect, useRef, useState } from 'react'
import type { EstudioItem } from '@/lib/types'

export default function PersonalizaAdminPage() {
  const [items, setItems] = useState<EstudioItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const [nombre, setNombre] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)

  const cargar = () => {
    fetch('/api/estudio-items').then(r => r.json()).then(data => { setItems(data); setCargando(false) })
  }

  useEffect(() => { cargar() }, [])

  const crear = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }

    setSubiendo(true)
    setError('')
    const fd = new FormData()
    fd.append('nombre', nombre)
    fd.append('subtitulo', subtitulo)
    fd.append('descripcion', descripcion)
    fd.append('precio', precio)
    fd.append('orden', String(items.length))
    if (archivo) fd.append('imagen', archivo)

    const res = await fetch('/api/estudio-items', { method: 'POST', body: fd })
    if (res.ok) {
      setNombre('')
      setSubtitulo('')
      setDescripcion('')
      setPrecio('')
      setArchivo(null)
      if (fileRef.current) fileRef.current.value = ''
      cargar()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al crear el ítem')
    }
    setSubiendo(false)
  }

  const toggleActivo = async (item: EstudioItem) => {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, activo: !x.activo } : x))
    await fetch(`/api/estudio-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !item.activo }),
    })
  }

  const cambiarOrden = async (item: EstudioItem, orden: number) => {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, orden } : x))
    await fetch(`/api/estudio-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden }),
    })
  }

  const eliminar = async (item: EstudioItem) => {
    if (!confirm('¿Eliminar este ítem?')) return
    setItems(prev => prev.filter(x => x.id !== item.id))
    await fetch(`/api/estudio-items/${item.id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Personalizá tu diseño</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Ítems de la sección &quot;Diseño + Producto&quot; en /tienda/personaliza. Cada uno abre su propia página de detalle. Podés cargar los que quieras.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Nuevo ítem</h2>

        <div>
          {archivo ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
              <span className="truncate">{archivo.name}</span>
              <button
                type="button"
                onClick={() => { setArchivo(null); if (fileRef.current) fileRef.current.value = '' }}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                aria-label="Quitar archivo"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-slate-500 hover:border-amber-400 hover:text-amber-500 transition-colors"
            >
              + Elegir imagen
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setArchivo(f) }}
          />
        </div>

        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="input" />
        <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo (opcional)" className="input" />
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción para la página de detalle (opcional)" rows={3} className="input resize-none" />
        <input type="text" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio a mostrar (opcional, ej: $ Desde 45.000)" className="input" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={crear}
          disabled={subiendo}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {subiendo ? 'Guardando...' : 'Agregar ítem'}
        </button>
      </div>

      <div className="space-y-3">
        {cargando ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Sin ítems todavía.</p>
        ) : (
          items.map(item => (
            editandoId === item.id
              ? <ItemEditor key={item.id} item={item} onCancelar={() => setEditandoId(null)} onGuardado={actualizado => {
                  setItems(prev => prev.map(x => x.id === actualizado.id ? actualizado : x))
                  setEditandoId(null)
                }} />
              : (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-3 flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                    {item.imagen_url && <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">{item.nombre}</p>
                    {item.subtitulo && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{item.subtitulo}</p>}
                  </div>

                  <input
                    type="number"
                    value={item.orden}
                    onChange={e => cambiarOrden(item, Number(e.target.value))}
                    className="w-16 text-sm text-center rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent py-1"
                    aria-label="Orden"
                  />

                  <button
                    onClick={() => toggleActivo(item)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </button>

                  <button
                    onClick={() => setEditandoId(item.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => eliminar(item)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                    aria-label="Eliminar ítem"
                  >
                    ×
                  </button>
                </div>
              )
          ))
        )}
      </div>
    </div>
  )
}

function ItemEditor({
  item,
  onCancelar,
  onGuardado,
}: {
  item: EstudioItem
  onCancelar: () => void
  onGuardado: (item: EstudioItem) => void
}) {
  const [nombre, setNombre] = useState(item.nombre)
  const [subtitulo, setSubtitulo] = useState(item.subtitulo ?? '')
  const [descripcion, setDescripcion] = useState(item.descripcion ?? '')
  const [precio, setPrecio] = useState(item.precio ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const guardar = async () => {
    setGuardando(true)
    setError('')
    const fd = new FormData()
    fd.append('nombre', nombre)
    fd.append('subtitulo', subtitulo)
    fd.append('descripcion', descripcion)
    fd.append('precio', precio)
    if (archivo) fd.append('imagen', archivo)

    const res = await fetch(`/api/estudio-items/${item.id}`, { method: 'PATCH', body: fd })
    if (res.ok) {
      onGuardado(await res.json())
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al guardar')
    }
    setGuardando(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-300 shadow-sm p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
          {item.imagen_url && <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-slate-500 hover:border-amber-400 hover:text-amber-500 transition-colors"
        >
          {archivo ? archivo.name : 'Reemplazar imagen (opcional)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) setArchivo(f) }}
        />
      </div>

      <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="input" />
      <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo (opcional)" className="input" />
      <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={3} className="input resize-none" />
      <input type="text" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio a mostrar (opcional)" className="input" />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={guardando}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={onCancelar}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
