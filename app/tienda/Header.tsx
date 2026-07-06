'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTienda } from './TiendaShell'
import WhatsAppIcon from './WhatsAppIcon'
import BannerEnvios from './BannerEnvios'

export default function Header() {
  const { negocio, interes, catalogo } = useTienda()
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false)

  const abrirCatalogo = () => {
    catalogo.setCategoriaActiva('')
    catalogo.setSubcategoriaActiva('')
    catalogo.setAbierto(true)
    setMenuMobileAbierto(false)
  }

  return (
    <>
    <header
      className="sticky top-0 z-30 border-b"
      style={{ background: 'var(--tienda-header-bg)', borderColor: 'var(--tienda-header-text)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Hamburguesa mobile */}
          <button
            type="button"
            onClick={() => setMenuMobileAbierto(true)}
            aria-label="Abrir menú"
            className="md:hidden w-9 h-9 flex items-center justify-center hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-3">
            {negocio.logoUrl ? (
              <Image src={negocio.logoUrl} alt={negocio.nombre} width={36} height={36} className="object-contain" />
            ) : (
              <div
                className="w-9 h-9 flex items-center justify-center text-sm font-bold border"
                style={{ color: 'var(--tienda-header-text)', borderColor: 'var(--tienda-header-text)' }}
              >
                {negocio.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className="text-xl uppercase tracking-tighter"
              style={{ color: 'var(--tienda-header-text)', fontFamily: 'var(--font-anton)' }}
            >
              {negocio.nombre}
            </span>
          </Link>
        </div>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-tighter hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            Tienda
          </Link>
          <button
            type="button"
            onClick={abrirCatalogo}
            className="font-mono text-xs uppercase tracking-tighter hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            Catálogo
          </button>
          <Link
            href="/tienda/personaliza"
            className="font-mono text-xs uppercase tracking-tighter hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            Personalizá tu diseño
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {negocio.whatsapp && (
            <a
              href={`https://wa.me/${negocio.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-tighter text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon />
              Consultá por WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={abrirCatalogo}
            aria-label="Ver catálogo completo"
            className="w-9 h-9 flex items-center justify-center hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => interes.setAbierto(true)}
            aria-label="Ver mi interés"
            className="relative w-9 h-9 flex items-center justify-center hover:text-red-600 transition-colors"
            style={{ color: 'var(--tienda-header-text)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z" />
            </svg>
            {interes.items.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--tienda-accent, #FF0000)' }}
              >
                {interes.items.length}
              </span>
            )}
          </button>
        </div>
      </div>
      <BannerEnvios />
    </header>

    {/* Panel mobile — fuera del <header> (sticky) para que el fixed no quede atrapado en su containing block en Safari/iOS */}
    {menuMobileAbierto && (
        <div className="md:hidden fixed inset-0 z-40 bg-black flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 shrink-0">
            <span className="font-mono text-xs uppercase tracking-tighter text-white">Menú</span>
            <button
              type="button"
              onClick={() => setMenuMobileAbierto(false)}
              aria-label="Cerrar menú"
              className="w-9 h-9 flex items-center justify-center text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <Link
              href="/"
              onClick={() => setMenuMobileAbierto(false)}
              className="block py-3 font-mono text-xs uppercase tracking-tighter text-white border-b border-white/10"
            >
              Tienda
            </Link>
            <button
              type="button"
              onClick={abrirCatalogo}
              className="block w-full text-left py-3 font-mono text-xs uppercase tracking-tighter text-white border-b border-white/10"
            >
              Catálogo
            </button>
            <Link
              href="/tienda/personaliza"
              onClick={() => setMenuMobileAbierto(false)}
              className="block w-full text-left py-3 font-mono text-xs uppercase tracking-tighter text-white"
            >
              Personalizá tu diseño
            </Link>
          </div>
        </div>
    )}
    </>
  )
}
