'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

const nav = [
  { href: '/admin/stock',      label: 'Stock',      icon: '📦' },
  { href: '/admin/caja',       label: 'Caja',       icon: '💰' },
  { href: '/admin/retiros',    label: 'Retiros',    icon: '💸' },
  { href: '/admin/metricas',   label: 'Métricas',   icon: '📊' },
  { href: '/admin/categorias', label: 'Categorías', icon: '🏷️' },
  { href: '/admin/negocio',    label: 'Mi negocio', icon: '🏪' },
]

interface Props {
  children: ReactNode
  nombre: string
  logoUrl: string | null
}

export default function Sidebar({ children, nombre, logoUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-slate-900">
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 flex flex-col
          transform transition-transform duration-200 ease-in-out border-r border-slate-800
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo / nombre negocio */}
        <Link
          href="/admin/negocio"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-5 py-5 border-b border-slate-800 hover:bg-slate-800 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-slate-900"
            style={!logoUrl ? { background: 'var(--accent)' } : {}}
          >
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              : nombre.slice(0, 2).toUpperCase()
            }
          </div>
          <span className="text-white font-semibold text-sm tracking-wide truncate">{nombre}</span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }
                `}
                style={active ? { background: 'var(--accent)', color: '#1e293b' } : {}}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-0.5">
          <Link
            href="/tienda"
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <span className="text-base w-5 text-center">🛍️</span>
            Ver tienda
          </Link>
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <span className="text-base w-5 text-center">{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Modo claro' : 'Modo noche'}
          </button>
          <Link
            href="/admin/perfil"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === '/admin/perfil'
                ? 'shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            style={pathname === '/admin/perfil' ? { background: 'var(--accent)', color: '#1e293b' } : {}}
          >
            <span className="text-base w-5 text-center">👤</span>
            Mi perfil
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <span className="text-base w-5 text-center">🚪</span>
            Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
            : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-900" style={{ background: 'var(--accent)' }}>{nombre.slice(0, 2).toUpperCase()}</div>
          }
          <span className="font-semibold text-gray-800 dark:text-white text-sm truncate flex-1">{nombre}</span>
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
