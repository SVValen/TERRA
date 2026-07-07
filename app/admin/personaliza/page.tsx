'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomStudio, EstudioItem } from '@/lib/types'
import { CUSTOM_STUDIO_DEFAULT } from '@/lib/contenido'
import { personalizaHabilitado } from '@/lib/features'

export default function PersonalizaAdminPage() {
  const router = useRouter()
  useEffect(() => { if (!personalizaHabilitado()) router.replace('/admin/stock') }, [router])
  if (!personalizaHabilitado()) return null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Personalizá tu diseño</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Todo el contenido de /tienda/personaliza: textos, imagen y los ítems de la grilla &quot;Diseño + Producto&quot;.
        </p>
      </div>

      <ContenidoForm />
      <ItemsManager />
    </div>
  )
}

function ContenidoForm() {
  const [customStudio, setCustomStudio] = useState<CustomStudio>(CUSTOM_STUDIO_DEFAULT)
  const [disenoImagenUrl, setDisenoImagenUrl] = useState<string | null>(null)
  const [disenoPreview, setDisenoPreview] = useState<string | null>(null)
  const [disenoArchivo, setDisenoArchivo] = useState<File | null>(null)
  const disenoInputRef = useRef<HTMLInputElement>(null)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/negocio').then(r => r.json()).then(d => {
      setCustomStudio(d.custom_studio ?? CUSTOM_STUDIO_DEFAULT)
      setDisenoImagenUrl(d.custom_diseno_imagen_url ?? null)
    })
  }, [])

  const onDisenoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDisenoArchivo(file)
    setDisenoPreview(URL.createObjectURL(file))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)
    const fd = new FormData()
    fd.append('custom_studio', JSON.stringify(customStudio))
    if (disenoArchivo) fd.append('custom_diseno_imagen', disenoArchivo)

    const res = await fetch('/api/negocio', { method: 'PATCH', body: fd })
    const data = await res.json()
    if (res.ok) {
      setDisenoImagenUrl(data.custom_diseno_imagen_url ?? disenoImagenUrl)
      setDisenoPreview(null)
      setDisenoArchivo(null)
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  return (
    <form onSubmit={guardar} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Contenido de la página</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título principal</label>
          <input type="text" value={customStudio.heroTitulo} onChange={e => setCustomStudio(p => ({ ...p, heroTitulo: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Subtítulo</label>
          <input type="text" value={customStudio.heroSubtitulo} onChange={e => setCustomStudio(p => ({ ...p, heroSubtitulo: e.target.value }))} className="input" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sección &quot;Solo diseño&quot;</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título</label>
            <input type="text" value={customStudio.disenoTitulo} onChange={e => setCustomStudio(p => ({ ...p, disenoTitulo: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título del recuadro</label>
            <input type="text" value={customStudio.identidadTitulo} onChange={e => setCustomStudio(p => ({ ...p, identidadTitulo: e.target.value }))} className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto</label>
          <textarea value={customStudio.disenoTexto} onChange={e => setCustomStudio(p => ({ ...p, disenoTexto: e.target.value }))} rows={3} className="input resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto del recuadro</label>
          <textarea value={customStudio.identidadTexto} onChange={e => setCustomStudio(p => ({ ...p, identidadTexto: e.target.value }))} rows={2} className="input resize-none" />
        </div>
        <ImagenField label="Imagen" preview={disenoPreview ?? disenoImagenUrl} onClick={() => disenoInputRef.current?.click()} />
        <input ref={disenoInputRef} type="file" accept="image/*" className="hidden" onChange={onDisenoFileChange} />
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sección &quot;Diseño + producto&quot;</p>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título</label>
          <input type="text" value={customStudio.productoTitulo} onChange={e => setCustomStudio(p => ({ ...p, productoTitulo: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto</label>
          <textarea value={customStudio.productoTexto} onChange={e => setCustomStudio(p => ({ ...p, productoTexto: e.target.value }))} rows={2} className="input resize-none" />
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Los ítems de esta grilla (nombre, subtítulo, descripción, precio e imagen) se administran más abajo, sin límite de cantidad.
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sección &quot;Tu prenda, nuestro diseño&quot;</p>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título</label>
          <input type="text" value={customStudio.prendaTitulo} onChange={e => setCustomStudio(p => ({ ...p, prendaTitulo: e.target.value }))} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto</label>
          <textarea value={customStudio.prendaTexto} onChange={e => setCustomStudio(p => ({ ...p, prendaTexto: e.target.value }))} rows={3} className="input resize-none" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto del proceso</label>
            <input type="text" value={customStudio.prendaProceso} onChange={e => setCustomStudio(p => ({ ...p, prendaProceso: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Texto del botón</label>
            <input type="text" value={customStudio.prendaBoton} onChange={e => setCustomStudio(p => ({ ...p, prendaBoton: e.target.value }))} className="input" />
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500">
          El botón abre WhatsApp con el mensaje configurado en la pestaña &quot;WhatsApp&quot;.
        </p>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Título final (CTA)</label>
        <input type="text" value={customStudio.ctaTitulo} onChange={e => setCustomStudio(p => ({ ...p, ctaTitulo: e.target.value }))} className="input" />
      </div>

      {msg && (
        <p className={`text-xs px-3 py-2 rounded-lg ${
          msg.tipo === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
        }`}>
          {msg.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}

function ImagenField({
  label,
  preview,
  onClick,
}: {
  label: string
  preview: string | null
  onClick: () => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-700 shrink-0 cursor-pointer hover:border-amber-400 transition-colors"
          onClick={onClick}
        >
          {preview
            ? <img src={preview} alt={label} className="w-full h-full object-cover" />
            : <span className="text-2xl text-gray-300 dark:text-slate-500">🖼️</span>
          }
        </div>
        <button
          type="button"
          onClick={onClick}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors"
        >
          {preview ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
      </div>
    </div>
  )
}

function ItemsManager() {
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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Ítems de &quot;Diseño + Producto&quot;</h2>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Cada uno abre su propia página de detalle. Podés cargar los que quieras.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Nuevo ítem</h3>

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
