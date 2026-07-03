'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginForm({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  const router = useRouter()
  const [telegramId, setTelegramId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: telegramId.trim(), password }),
    })

    if (res.ok) {
      router.push('/admin/stock')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  const iniciales = nombre
    ? nombre.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SP'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg relative">
              <Image src={logoUrl} alt={nombre} fill className="object-cover" sizes="56px" />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-slate-900 mx-auto mb-4 shadow-lg"
              style={{ background: 'var(--accent)' }}
            >
              {iniciales}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenida</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Ingresá para acceder al panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
              ID de Telegram
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={e => setTelegramId(e.target.value)}
              placeholder="123456789"
              required
              autoFocus
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !telegramId || !password}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50 mt-2"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
