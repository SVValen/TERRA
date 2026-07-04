'use client'

import { useEffect, useRef, useState } from 'react'
import type { Anuncio } from '@/lib/types'

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const cargar = () => {
    fetch('/api/anuncios').then(r => r.json()).then(data => { setAnuncios(data); setCargando(false) })
  }

  useEffect(() => { cargar() }, [])

  const subir = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Elegí una imagen o video'); return }

    setSubiendo(true)
    setError('')
    const fd = new FormData()
    fd.append('media', file)
    fd.append('titulo', titulo)
    fd.append('subtitulo', subtitulo)
    fd.append('link_url', linkUrl)
    fd.append('orden', String(anuncios.length))

    const res = await fetch('/api/anuncios', { method: 'POST', body: fd })
    if (res.ok) {
      setTitulo('')
      setSubtitulo('')
      setLinkUrl('')
      if (fileRef.current) fileRef.current.value = ''
      cargar()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al subir el anuncio')
    }
    setSubiendo(false)
  }

  const toggleActivo = async (a: Anuncio) => {
    setAnuncios(prev => prev.map(x => x.id === a.id ? { ...x, activo: !x.activo } : x))
    await fetch(`/api/anuncios/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !a.activo }),
    })
  }

  const cambiarOrden = async (a: Anuncio, orden: number) => {
    setAnuncios(prev => prev.map(x => x.id === a.id ? { ...x, orden } : x))
    await fetch(`/api/anuncios/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden }),
    })
  }

  const eliminar = async (a: Anuncio) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    setAnuncios(prev => prev.filter(x => x.id !== a.id))
    await fetch(`/api/anuncios/${a.id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Anuncios</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Imágenes o videos de lanzamientos que reemplazan el hero de la tienda mientras estén activos.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Nuevo anuncio</h2>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="block w-full text-sm text-gray-500 dark:text-slate-400"
        />
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (opcional)" className="input" />
        <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo (opcional)" className="input" />
        <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Link al hacer click (opcional, ej: /tienda/nuevo-producto)" className="input" />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={subir}
          disabled={subiendo}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {subiendo ? 'Subiendo...' : 'Agregar anuncio'}
        </button>
      </div>

      <div className="space-y-3">
        {cargando ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>
        ) : anuncios.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Sin anuncios todavía.</p>
        ) : (
          anuncios.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-3 flex gap-3 items-center">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                {a.media_tipo === 'video' ? (
                  <video src={a.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={a.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">{a.titulo || '(sin título)'}</p>
                {a.subtitulo && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{a.subtitulo}</p>}
                {a.link_url && <p className="text-xs text-amber-600 truncate">{a.link_url}</p>}
              </div>

              <input
                type="number"
                value={a.orden}
                onChange={e => cambiarOrden(a, Number(e.target.value))}
                className="w-16 text-sm text-center rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent py-1"
                aria-label="Orden"
              />

              <button
                onClick={() => toggleActivo(a)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  a.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                }`}
              >
                {a.activo ? 'Activo' : 'Inactivo'}
              </button>

              <button
                onClick={() => eliminar(a)}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                aria-label="Eliminar anuncio"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
