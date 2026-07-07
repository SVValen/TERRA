'use client'

import { useEffect, useState } from 'react'
import {
  WHATSAPP_SALUDO_DEFAULT,
  WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
  WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
} from '@/lib/contenido'
import { personalizaHabilitado } from '@/lib/features'

export default function WhatsappAdminPage() {
  const [saludo, setSaludo] = useState(WHATSAPP_SALUDO_DEFAULT)
  const [msgProductoIntro, setMsgProductoIntro] = useState(WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT)
  const [msgInteresIntro, setMsgInteresIntro] = useState(WHATSAPP_MSG_INTERES_INTRO_DEFAULT)
  const [msgEstudioProceso, setMsgEstudioProceso] = useState(WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT)
  const [msgEstudioGeneral, setMsgEstudioGeneral] = useState(WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT)
  const [msgEstudioItem, setMsgEstudioItem] = useState(WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/negocio').then(r => r.json()).then(d => {
      setSaludo(d.whatsapp_saludo ?? WHATSAPP_SALUDO_DEFAULT)
      setMsgProductoIntro(d.whatsapp_msg_producto_intro ?? WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT)
      setMsgInteresIntro(d.whatsapp_msg_interes_intro ?? WHATSAPP_MSG_INTERES_INTRO_DEFAULT)
      setMsgEstudioProceso(d.whatsapp_msg_estudio_proceso ?? WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT)
      setMsgEstudioGeneral(d.whatsapp_msg_estudio_general ?? WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT)
      setMsgEstudioItem(d.whatsapp_msg_estudio_item ?? WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT)
    })
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setGuardando(true)
    const fd = new FormData()
    fd.append('whatsapp_saludo', saludo)
    fd.append('whatsapp_msg_producto_intro', msgProductoIntro)
    fd.append('whatsapp_msg_interes_intro', msgInteresIntro)
    fd.append('whatsapp_msg_estudio_proceso', msgEstudioProceso)
    fd.append('whatsapp_msg_estudio_general', msgEstudioGeneral)
    fd.append('whatsapp_msg_estudio_item', msgEstudioItem)

    const res = await fetch('/api/negocio', { method: 'PATCH', body: fd })
    const data = await res.json()
    if (res.ok) {
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Personalizá los mensajes que se arman automáticamente al consultar por WhatsApp desde la tienda
        </p>
      </div>

      <form onSubmit={guardar} className="space-y-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Saludo inicial</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Primera línea de todos los mensajes. Usá <code className="px-1 rounded bg-gray-100 dark:bg-slate-700">{'{tienda}'}</code> para insertar el nombre del negocio.
            </p>
          </div>
          <input type="text" value={saludo} onChange={e => setSaludo(e.target.value)} className="input" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Consulta de un producto</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Se usa en el botón &quot;Consultar&quot; de cada card y en la ficha del producto. Debajo del saludo y esta línea, el mensaje siempre agrega automáticamente el nombre del producto, talle, precio y link — eso no es editable.
            </p>
          </div>
          <input type="text" value={msgProductoIntro} onChange={e => setMsgProductoIntro(e.target.value)} className="input" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Consulta de &quot;Mi interés&quot;</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Se usa al confirmar el panel de &quot;Mi interés&quot; con varios productos. La lista de productos se agrega automáticamente debajo.
            </p>
          </div>
          <input type="text" value={msgInteresIntro} onChange={e => setMsgInteresIntro(e.target.value)} className="input" />
        </div>

        {personalizaHabilitado() && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Personalizá tu diseño (Custom Studio)</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Mensajes de /tienda/personaliza</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                Botón &quot;Traé tu prenda&quot; (sección &quot;Tu prenda, nuestro diseño&quot;)
              </label>
              <textarea value={msgEstudioProceso} onChange={e => setMsgEstudioProceso(e.target.value)} rows={2} className="input resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                Botón de WhatsApp del CTA final de la página
              </label>
              <textarea value={msgEstudioGeneral} onChange={e => setMsgEstudioGeneral(e.target.value)} rows={2} className="input resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                Consulta por un ítem puntual de &quot;Diseño + Producto&quot;
              </label>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1.5">
                Usá <code className="px-1 rounded bg-gray-100 dark:bg-slate-700">{'{item}'}</code> para insertar el nombre del ítem.
              </p>
              <textarea value={msgEstudioItem} onChange={e => setMsgEstudioItem(e.target.value)} rows={2} className="input resize-none" />
            </div>
          </div>
        )}

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
