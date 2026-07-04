'use client'

import { useEffect, useRef, useState } from 'react'
import type { Anuncio } from '@/lib/types'
import { esFormatoHero, getImageDimensions, getVideoDimensions } from '@/lib/media'

async function validarFormatoHero(file: File): Promise<string | null> {
  try {
    const dims = file.type.startsWith('video/')
      ? await getVideoDimensions(file)
      : await getImageDimensions(file)
    if (!esFormatoHero(dims.width, dims.height)) {
      return `El archivo es ${dims.width}x${dims.height} — usá formato Full HD 16:9 (recomendado 1920x1080)`
    }
    return null
  } catch {
    return 'No se pudo leer el archivo, probá con otro'
  }
}

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)

  const cargar = () => {
    fetch('/api/anuncios').then(r => r.json()).then(data => { setAnuncios(data); setCargando(false) })
  }

  useEffect(() => { cargar() }, [])

  const elegirArchivo = async (file: File) => {
    setError('')
    const errorFormato = await validarFormatoHero(file)
    if (errorFormato) { setError(errorFormato); setArchivo(null); if (fileRef.current) fileRef.current.value = ''; return }
    setArchivo(file)
  }

  const subir = async () => {
    if (!archivo) { setError('Elegí una imagen o video'); return }

    setSubiendo(true)
    setError('')
    const fd = new FormData()
    fd.append('media', archivo)
    fd.append('titulo', titulo)
    fd.append('subtitulo', subtitulo)
    fd.append('link_url', linkUrl)
    fd.append('orden', String(anuncios.length))

    const res = await fetch('/api/anuncios', { method: 'POST', body: fd })
    if (res.ok) {
      setTitulo('')
      setSubtitulo('')
      setLinkUrl('')
      setArchivo(null)
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
          Imágenes o videos de lanzamientos que se suman al hero de la tienda junto a los productos destacados. Formato recomendado: Full HD 1920x1080 (16:9).
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Nuevo anuncio</h2>

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
              + Elegir imagen o video
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) elegirArchivo(f) }}
          />
        </div>

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
            editandoId === a.id
              ? <AnuncioEditor key={a.id} anuncio={a} onCancelar={() => setEditandoId(null)} onGuardado={actualizado => {
                  setAnuncios(prev => prev.map(x => x.id === actualizado.id ? actualizado : x))
                  setEditandoId(null)
                }} />
              : (
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
                    onClick={() => setEditandoId(a.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => eliminar(a)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                    aria-label="Eliminar anuncio"
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

function AnuncioEditor({
  anuncio,
  onCancelar,
  onGuardado,
}: {
  anuncio: Anuncio
  onCancelar: () => void
  onGuardado: (a: Anuncio) => void
}) {
  const [titulo, setTitulo] = useState(anuncio.titulo ?? '')
  const [subtitulo, setSubtitulo] = useState(anuncio.subtitulo ?? '')
  const [linkUrl, setLinkUrl] = useState(anuncio.link_url ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const elegirArchivo = async (file: File) => {
    setError('')
    const errorFormato = await validarFormatoHero(file)
    if (errorFormato) { setError(errorFormato); if (fileRef.current) fileRef.current.value = ''; return }
    setArchivo(file)
  }

  const guardar = async () => {
    setGuardando(true)
    setError('')
    const fd = new FormData()
    fd.append('titulo', titulo)
    fd.append('subtitulo', subtitulo)
    fd.append('link_url', linkUrl)
    if (archivo) fd.append('media', archivo)

    const res = await fetch(`/api/anuncios/${anuncio.id}`, { method: 'PATCH', body: fd })
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
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
          {anuncio.media_tipo === 'video' ? (
            <video src={anuncio.media_url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={anuncio.media_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-slate-500 hover:border-amber-400 hover:text-amber-500 transition-colors"
        >
          {archivo ? archivo.name : 'Reemplazar archivo (opcional)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) elegirArchivo(f) }}
        />
      </div>

      <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (opcional)" className="input" />
      <input type="text" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo (opcional)" className="input" />
      <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Link al hacer click (opcional)" className="input" />

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
