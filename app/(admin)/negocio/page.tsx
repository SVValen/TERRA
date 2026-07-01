'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NegocioPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/negocio').then(r => r.json()).then(d => {
      setNombre(d.nombre ?? '')
      setLogoUrl(d.logo_url ?? null)
    })
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)

    const fd = new FormData()
    fd.append('nombre', nombre)
    if (archivo) fd.append('logo', archivo)

    const res = await fetch('/api/negocio', { method: 'PATCH', body: fd })
    const data = await res.json()

    if (res.ok) {
      setLogoUrl(data.logo_url ?? logoUrl)
      setPreview(null)
      setArchivo(null)
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
      router.refresh() // re-fetch del layout server para actualizar sidebar
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  const logoMostrado = preview ?? logoUrl

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi negocio</h1>
        <p className="text-sm text-gray-500 mt-0.5">Nombre y logo que aparecen en el panel</p>
      </div>

      <form onSubmit={guardar} className="space-y-5">
        {/* Logo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-4">Logo del negocio</label>

          <div className="flex items-center gap-5">
            {/* Preview */}
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0 cursor-pointer hover:border-amber-400 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              {logoMostrado ? (
                <img src={logoMostrado} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-300">🏪</span>
              )}
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {logoMostrado ? 'Cambiar logo' : 'Subir logo'}
              </button>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG o WebP. Recomendado: 256×256 px</p>
              {preview && (
                <p className="text-xs text-amber-600 mt-1">Vista previa — guardá para aplicar</p>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Nombre */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Nombre del negocio</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="input"
            required
            placeholder="Ej: Showroom SP"
          />
        </div>

        {msg && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
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
    </div>
  )
}
