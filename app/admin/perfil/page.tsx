'use client'

import { useEffect, useState } from 'react'

export default function PerfilPage() {
  const [nombre, setNombre] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setNombre(d.nombre ?? '')
      setTelegramId(d.telegramId ?? '')
    })
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (passwordNueva && passwordNueva !== passwordConfirm) {
      setMsg({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' })
      return
    }
    setGuardando(true)
    const body: Record<string, string> = { nombre, telegram_id: telegramId }
    if (passwordActual && passwordNueva) {
      body.password_actual = passwordActual
      body.password_nueva = passwordNueva
    }
    const res = await fetch('/api/usuarios/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ tipo: 'ok', texto: 'Cambios guardados correctamente' })
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirm('')
    } else {
      setMsg({ tipo: 'error', texto: data.error ?? 'Error al guardar' })
    }
    setGuardando(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Cambiá tu nombre de usuario o contraseña</p>
      </div>

      <form onSubmit={guardar} className="space-y-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Datos de acceso</h2>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">ID de Telegram (usuario)</label>
            <input type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)} className="input" required />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Se usa para ingresar al panel y acceder al bot</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Cambiar contraseña</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Dejá los campos vacíos si no querés cambiarla</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Contraseña actual</label>
            <input type="password" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} placeholder="••••••••" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Nueva contraseña</label>
            <input type="password" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} placeholder="••••••••" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Confirmar nueva contraseña</label>
            <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="••••••••" className="input" />
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
