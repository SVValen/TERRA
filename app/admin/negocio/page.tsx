'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GuiaTallas } from '@/lib/types'
import {
  GUIA_TALLES_DEFAULT,
  CAMBIOS_DEVOLUCIONES_DEFAULT,
  ENVIOS_DEFAULT,
  BANNER_ENVIOS_DEFAULT,
  ETIQUETA_ENVIO_GRATIS_DEFAULT,
  ETIQUETA_ENVIO_DIA_DEFAULT,
  TEXTO_DESTACADO_DEFAULT,
  MISION_DEFAULT,
  VISION_DEFAULT,
} from '@/lib/contenido'
import GuiaTallasEditor from './GuiaTallasEditor'

export default function NegocioPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [margen, setMargen] = useState('30')
  const [diasNuevo, setDiasNuevo] = useState('14')
  const [colorPrimario, setColorPrimario] = useState('#C9A574')
  const [colorFondo, setColorFondo] = useState('#FAFAF9')
  const [colorTexto, setColorTexto] = useState('#1C1917')
  const [colorHeaderFondo, setColorHeaderFondo] = useState('#FFFFFF')
  const [colorHeaderTexto, setColorHeaderTexto] = useState('#1C1917')
  const [colorBannerFondo, setColorBannerFondo] = useState('#FAFAF9')
  const [colorBannerTexto, setColorBannerTexto] = useState('#1C1917')
  const [colorBotonFondo, setColorBotonFondo] = useState('#C9A574')
  const [colorBotonTexto, setColorBotonTexto] = useState('#0F172A')
  const [instagram, setInstagram] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [cuit, setCuit] = useState('')
  const [direccion, setDireccion] = useState('')
  const [cambiosDevoluciones, setCambiosDevoluciones] = useState(CAMBIOS_DEVOLUCIONES_DEFAULT)
  const [envios, setEnvios] = useState(ENVIOS_DEFAULT)
  const [bannerEnvios, setBannerEnvios] = useState(BANNER_ENVIOS_DEFAULT)
  const [etiquetaEnvioGratis, setEtiquetaEnvioGratis] = useState(ETIQUETA_ENVIO_GRATIS_DEFAULT)
  const [etiquetaEnvioDia, setEtiquetaEnvioDia] = useState(ETIQUETA_ENVIO_DIA_DEFAULT)
  const [textoDestacado, setTextoDestacado] = useState(TEXTO_DESTACADO_DEFAULT)
  const [misionTexto, setMisionTexto] = useState(MISION_DEFAULT)
  const [visionTexto, setVisionTexto] = useState(VISION_DEFAULT)
  const [misionImagenUrl, setMisionImagenUrl] = useState<string | null>(null)
  const [visionImagenUrl, setVisionImagenUrl] = useState<string | null>(null)
  const [misionPreview, setMisionPreview] = useState<string | null>(null)
  const [visionPreview, setVisionPreview] = useState<string | null>(null)
  const [misionArchivo, setMisionArchivo] = useState<File | null>(null)
  const [visionArchivo, setVisionArchivo] = useState<File | null>(null)
  const misionInputRef = useRef<HTMLInputElement>(null)
  const visionInputRef = useRef<HTMLInputElement>(null)
  const [guiaTallas, setGuiaTallas] = useState<GuiaTallas>(GUIA_TALLES_DEFAULT)
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
      setDiasNuevo(String(d.dias_nuevo ?? 14))
      setColorPrimario(d.color_primario ?? '#C9A574')
      setColorFondo(d.color_fondo ?? '#FAFAF9')
      setColorTexto(d.color_texto ?? '#1C1917')
      setColorHeaderFondo(d.color_header_fondo ?? '#FFFFFF')
      setColorHeaderTexto(d.color_header_texto ?? '#1C1917')
      setColorBannerFondo(d.color_banner_fondo ?? '#FAFAF9')
      setColorBannerTexto(d.color_banner_texto ?? '#1C1917')
      setColorBotonFondo(d.color_boton_fondo ?? '#C9A574')
      setColorBotonTexto(d.color_boton_texto ?? '#0F172A')
      setInstagram(d.instagram ?? '')
      setRazonSocial(d.razon_social ?? '')
      setCuit(d.cuit ?? '')
      setDireccion(d.direccion ?? '')
      setCambiosDevoluciones(d.cambios_devoluciones ?? CAMBIOS_DEVOLUCIONES_DEFAULT)
      setEnvios(d.envios ?? ENVIOS_DEFAULT)
      setBannerEnvios(d.banner_envios ?? BANNER_ENVIOS_DEFAULT)
      setEtiquetaEnvioGratis(d.etiqueta_envio_gratis ?? ETIQUETA_ENVIO_GRATIS_DEFAULT)
      setEtiquetaEnvioDia(d.etiqueta_envio_dia ?? ETIQUETA_ENVIO_DIA_DEFAULT)
      setTextoDestacado(d.texto_destacado ?? TEXTO_DESTACADO_DEFAULT)
      setMisionTexto(d.mision_texto ?? MISION_DEFAULT)
      setVisionTexto(d.vision_texto ?? VISION_DEFAULT)
      setMisionImagenUrl(d.mision_imagen_url ?? null)
      setVisionImagenUrl(d.vision_imagen_url ?? null)
      setGuiaTallas(d.guia_talles ?? GUIA_TALLES_DEFAULT)
      setLogoUrl(d.logo_url ?? null)
    })
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }

  const onMisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMisionArchivo(file)
    setMisionPreview(URL.createObjectURL(file))
  }

  const onVisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVisionArchivo(file)
    setVisionPreview(URL.createObjectURL(file))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)
    const fd = new FormData()
    fd.append('nombre', nombre)
    fd.append('whatsapp', whatsapp)
    fd.append('margen_objetivo', margen)
    fd.append('dias_nuevo', diasNuevo)
    fd.append('color_primario', colorPrimario)
    fd.append('color_fondo', colorFondo)
    fd.append('color_texto', colorTexto)
    fd.append('color_header_fondo', colorHeaderFondo)
    fd.append('color_header_texto', colorHeaderTexto)
    fd.append('color_banner_fondo', colorBannerFondo)
    fd.append('color_banner_texto', colorBannerTexto)
    fd.append('color_boton_fondo', colorBotonFondo)
    fd.append('color_boton_texto', colorBotonTexto)
    fd.append('instagram', instagram)
    fd.append('razon_social', razonSocial)
    fd.append('cuit', cuit)
    fd.append('direccion', direccion)
    fd.append('cambios_devoluciones', cambiosDevoluciones)
    fd.append('envios', envios)
    fd.append('banner_envios', bannerEnvios)
    fd.append('etiqueta_envio_gratis', etiquetaEnvioGratis)
    fd.append('etiqueta_envio_dia', etiquetaEnvioDia)
    fd.append('texto_destacado', textoDestacado)
    fd.append('mision_texto', misionTexto)
    fd.append('vision_texto', visionTexto)
    if (misionArchivo) fd.append('mision_imagen', misionArchivo)
    if (visionArchivo) fd.append('vision_imagen', visionArchivo)
    fd.append('guia_talles', JSON.stringify(guiaTallas))
    if (archivo) fd.append('logo', archivo)
    const res = await fetch('/api/negocio', { method: 'PATCH', body: fd })
    const data = await res.json()
    if (res.ok) {
      setLogoUrl(data.logo_url ?? logoUrl)
      setPreview(null)
      setArchivo(null)
      setMisionImagenUrl(data.mision_imagen_url ?? misionImagenUrl)
      setVisionImagenUrl(data.vision_imagen_url ?? visionImagenUrl)
      setMisionPreview(null)
      setVisionPreview(null)
      setMisionArchivo(null)
      setVisionArchivo(null)
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
      router.refresh()
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  const logoMostrado = preview ?? logoUrl

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Contacto</h2>

          <div className="grid sm:grid-cols-2 gap-5">
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
        </div>

        {/* Datos legales */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Datos legales</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Se muestran en el pie de página de la tienda (los que completes)</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Razón social</label>
              <input
                type="text"
                value={razonSocial}
                onChange={e => setRazonSocial(e.target.value)}
                className="input"
                placeholder="Ej: Juana Pérez"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">CUIT</label>
              <input
                type="text"
                value={cuit}
                onChange={e => setCuit(e.target.value)}
                className="input"
                placeholder="20-12345678-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
              className="input"
              placeholder="Ej: Av. Siempreviva 742, CABA"
            />
          </div>
        </div>

        {/* Envíos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Envíos</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Texto de la sección &quot;Envíos&quot; en el pie de página de la tienda</p>
          </div>
          <textarea
            value={envios}
            onChange={e => setEnvios(e.target.value)}
            rows={4}
            className="input resize-none"
          />

          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Banner de envíos</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Frase que corre en un cartel animado en el header y el footer de la tienda. Dejar vacío para ocultarlo.</p>
            <input
              type="text"
              value={bannerEnvios}
              onChange={e => setBannerEnvios(e.target.value)}
              className="input"
              placeholder="Envíos a todo el país · Envío en el día en CABA"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Etiqueta &quot;envío gratis&quot;</label>
              <input
                type="text"
                value={etiquetaEnvioGratis}
                onChange={e => setEtiquetaEnvioGratis(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Etiqueta &quot;envío en el día&quot;</label>
              <input
                type="text"
                value={etiquetaEnvioDia}
                onChange={e => setEtiquetaEnvioDia(e.target.value)}
                className="input"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 col-span-2 -mt-1">
              Se muestran como cartelito en la ficha de cada producto que actives con el toggle correspondiente en su edición (Stock)
            </p>
          </div>
        </div>

        {/* Página de inicio */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Página de inicio</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Texto que corre en la cinta animada debajo del banner principal de /tienda</p>
          </div>
          <input
            type="text"
            value={textoDestacado}
            onChange={e => setTextoDestacado(e.target.value)}
            className="input"
            placeholder="NUEVA COLECCIÓN"
          />
        </div>

        {/* Misión y Visión */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Misión y Visión</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Sección con texto e imagen que se muestra en el home de la tienda</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">Misión — texto</label>
              <textarea
                value={misionTexto}
                onChange={e => setMisionTexto(e.target.value)}
                rows={4}
                className="input resize-none"
              />
              <ImagenField
                label="Misión — imagen"
                preview={misionPreview ?? misionImagenUrl}
                onClick={() => misionInputRef.current?.click()}
              />
              <input ref={misionInputRef} type="file" accept="image/*" className="hidden" onChange={onMisionFileChange} />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">Visión — texto</label>
              <textarea
                value={visionTexto}
                onChange={e => setVisionTexto(e.target.value)}
                rows={4}
                className="input resize-none"
              />
              <ImagenField
                label="Visión — imagen"
                preview={visionPreview ?? visionImagenUrl}
                onClick={() => visionInputRef.current?.click()}
              />
              <input ref={visionInputRef} type="file" accept="image/*" className="hidden" onChange={onVisionFileChange} />
            </div>
          </div>
        </div>

        {/* Guía de talles */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Guía de talles</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Tabla que se muestra al clickear &quot;Guía de talles&quot; en el pie de página de la tienda</p>
          </div>
          <GuiaTallasEditor guiaTallas={guiaTallas} onChange={setGuiaTallas} />
        </div>

        {/* Cambios y devoluciones */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Cambios y devoluciones</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Texto que se muestra al clickear &quot;Cambios y devoluciones&quot; en el pie de página de la tienda</p>
          </div>
          <textarea
            value={cambiosDevoluciones}
            onChange={e => setCambiosDevoluciones(e.target.value)}
            rows={4}
            className="input resize-none"
          />
        </div>

        {/* Margen objetivo + Badge "Nuevo" */}
        <div className="grid sm:grid-cols-2 gap-5">
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

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Badge &quot;Nuevo&quot;</label>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Días durante los cuales se muestra el cartel &quot;Nuevo&quot; en la tienda pública</p>
            <div className="relative w-28">
              <input
                type="number"
                value={diasNuevo}
                onChange={e => setDiasNuevo(e.target.value)}
                min="0"
                max="365"
                className="input pr-10 text-right"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">días</span>
            </div>
          </div>
        </div>

        {/* Paleta de color */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Colores</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Fondo y texto configurables por separado para cada elemento de la tienda pública</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">General</p>
            <div className="grid sm:grid-cols-3 gap-5">
              <ColorField label="Color de acento" hint="Panel admin, login y detalles varios" value={colorPrimario} onChange={setColorPrimario} placeholder="#C9A574" />
              <ColorField label="Fondo general" hint="Fondo detrás de los productos en /tienda" value={colorFondo} onChange={setColorFondo} placeholder="#FAFAF9" />
              <ColorField label="Texto general" hint="Nombres, títulos y precios en /tienda" value={colorTexto} onChange={setColorTexto} placeholder="#1C1917" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Header</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ColorField label="Fondo" value={colorHeaderFondo} onChange={setColorHeaderFondo} placeholder="#FFFFFF" />
              <ColorField label="Texto" value={colorHeaderTexto} onChange={setColorHeaderTexto} placeholder="#1C1917" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Banner de envíos</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ColorField label="Fondo" value={colorBannerFondo} onChange={setColorBannerFondo} placeholder="#FAFAF9" />
              <ColorField label="Texto" value={colorBannerTexto} onChange={setColorBannerTexto} placeholder="#1C1917" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Botones</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <ColorField label="Fondo" value={colorBotonFondo} onChange={setColorBotonFondo} placeholder="#C9A574" />
              <ColorField label="Texto" value={colorBotonTexto} onChange={setColorBotonTexto} placeholder="#0F172A" />
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

function ColorField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">{hint}</p>}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer bg-transparent"
        />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="input uppercase"
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  )
}
