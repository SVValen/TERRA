'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

const nav = [
  { href: '/stock',      label: 'Stock',      icon: '📦' },
  { href: '/caja',       label: 'Caja',       icon: '💰' },
  { href: '/retiros',    label: 'Retiros',    icon: '💸' },
  { href: '/metricas',   label: 'Métricas',   icon: '📊' },
  { href: '/categorias', label: 'Categorías', icon: '🏷️' },
  { href: '/negocio',    label: 'Mi negocio', icon: '🏪' },
]

interface Props {
  children: ReactNode
  nombre: string
  logoUrl: string | null
}

export default function Sidebar({ children, nombre, logoUrl }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo / nombre negocio */}
        <Link
          href="/negocio"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-5 py-5 border-b border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <div
            className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-slate-900"
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
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }
                `}
                style={active ? { background: 'var(--accent)', color: '#1e293b' } : {}}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-700 space-y-0.5">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/perfil'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            style={pathname === '/perfil' ? { background: 'var(--accent)', color: '#1e293b' } : {}}
          >
            <span className="text-base">👤</span>
            Mi perfil
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <span className="text-base">🚪</span>
            Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {logoUrl && <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded object-cover" />}
          <span className="font-semibold text-gray-800 text-sm truncate">{nombre}</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
