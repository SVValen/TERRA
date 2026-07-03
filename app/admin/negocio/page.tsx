'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NegocioPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [margen, setMargen] = useState('30')
  const [colorPrimario, setColorPrimario] = useState('#C9A574')
  const [colorFondo, setColorFondo] = useState('#FAFAF9')
  const [colorTexto, setColorTexto] = useState('#1C1917')
  const [instagram, setInstagram] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/negocio').then(r => r.json()).then(d => {
      setNombre(d.nombre ?? '')
      setWhatsapp(d.whatsapp ?? '')
      setMargen(String(d.margen_objetivo ?? 30))
      setColorPrimario(d.color_primario ?? '#C9A574')
      setColorFondo(d.color_fondo ?? '#FAFAF9')
      setColorTexto(d.color_texto ?? '#1C1917')
      setInstagram(d.instagram ?? '')
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
    fd.append('whatsapp', whatsapp)
    fd.append('margen_objetivo', margen)
    fd.append('color_primario', colorPrimario)
    fd.append('color_fondo', colorFondo)
    fd.append('color_texto', colorTexto)
    fd.append('instagram', instagram)
    if (archivo) fd.append('logo', archivo)
    const res = await fetch('/api/negocio', { method: 'PATCH', body: fd })
    const data = await res.json()
    if (res.ok) {
      setLogoUrl(data.logo_url ?? logoUrl)
      setPreview(null)
      setArchivo(null)
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
      router.refresh()
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  const logoMostrado = preview ?? logoUrl

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi negocio</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Nombre, logo y contacto de la tienda</p>
      </div>

      <form onSubmit={guardar} className="space-y-5">
        {/* Logo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Logo del negocio</label>
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-700 shrink-0 cursor-pointer hover:border-amber-400 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              {logoMostrado
                ? <img src={logoMostrado} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-3xl text-gray-300 dark:text-slate-500">🏪</span>
              }
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors"
              >
                {logoMostrado ? 'Cambiar logo' : 'Subir logo'}
              </button>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">JPG, PNG o WebP. Recomendado: 256×256 px</p>
              {preview && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Vista previa — guardá para aplicar</p>}
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>

        {/* Nombre */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Nombre del negocio</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="input"
            required
            placeholder="Ej: Showroom SP"
          />
        </div>

        {/* Contacto */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 -mb-1">Contacto</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">WhatsApp</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Se usa en la tienda online para el botón &quot;Consultar&quot;</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">+</span>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="input pl-7"
                placeholder="5491112345678"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">Incluí el código de país sin el +. Ej: 5491112345678</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Instagram</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Aparece como link en el pie de página de la tienda</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">@</span>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value.replace(/^@/, ''))}
                className="input pl-7"
                placeholder="miusuario"
              />
            </div>
          </div>
        </div>

        {/* Margen objetivo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Margen objetivo</label>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Se usa para sugerir el precio de venta al editar un producto</p>
          <div className="flex items-center gap-3">
            <div className="relative w-28">
              <input
                type="number"
                value={margen}
                onChange={e => setMargen(e.target.value)}
                min="1"
                max="99"
                className="input pr-8 text-right"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">%</span>
            </div>
            {margen && Number(margen) > 0 && Number(margen) < 100 && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Costo $1.000 → venta sugerida{' '}
                <span className="font-semibold text-gray-700 dark:text-slate-200">
                  ${Math.round(1000 / (1 - Number(margen) / 100)).toLocaleString('es-AR')}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Paleta de color */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 -mb-1">Colores</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Color de acento</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Botones y detalles del panel y la tienda pública</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimario}
                onChange={e => setColorPrimario(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer bg-transparent"
              />
              <div className="w-32">
                <input
                  type="text"
                  value={colorPrimario}
                  onChange={e => setColorPrimario(e.target.value)}
                  className="input uppercase"
                  placeholder="#C9A574"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Fondo de la tienda pública</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Color de fondo detrás de los productos en /tienda</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorFondo}
                onChange={e => setColorFondo(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer bg-transparent"
              />
              <div className="w-32">
                <input
                  type="text"
                  value={colorFondo}
                  onChange={e => setColorFondo(e.target.value)}
                  className="input uppercase"
                  placeholder="#FAFAF9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Texto de la tienda pública</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Color de nombres, títulos y precios en /tienda</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorTexto}
                onChange={e => setColorTexto(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer bg-transparent"
              />
              <div className="w-32">
                <input
                  type="text"
                  value={colorTexto}
                  onChange={e => setColorTexto(e.target.value)}
                  className="input uppercase"
                  placeholder="#1C1917"
                />
              </div>
            </div>
          </div>
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
    </div>
  )
}
