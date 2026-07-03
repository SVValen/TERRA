'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTienda } from './TiendaShell'
import WhatsAppIcon from './WhatsAppIcon'

interface Categoria {
  id: string
  nombre: string
  subcategorias: string[]
}

export default function Header() {
  const { negocio, interes } = useTienda()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaHover, setCategoriaHover] = useState<string | null>(null)
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false)
  const [categoriaMobileAbierta, setCategoriaMobileAbierta] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tienda/categorias').then(r => r.json()).then(setCategorias)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Hamburguesa mobile */}
          {categorias.length > 0 && (
            <button
              type="button"
              onClick={() => setMenuMobileAbierto(true)}
              aria-label="Abrir menú"
              className="md:hidden w-9 h-9 flex items-center justify-center text-stone-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <Link href="/tienda" className="flex items-center gap-3">
            {negocio.logoUrl ? (
              <Image src={negocio.logoUrl} alt={negocio.nombre} width={36} height={36} className="rounded-xl object-cover shadow-sm" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-slate-900 shadow-sm"
                style={{ background: 'var(--accent)' }}
              >
                {negocio.nombre.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-lg tracking-tight" style={{ color: 'var(--tienda-text)' }}>{negocio.nombre}</span>
          </Link>
        </div>

        {/* Menú de categorías desktop */}
        {categorias.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {categorias.map(c => (
              <div
                key={c.id}
                className="relative"
                onMouseEnter={() => setCategoriaHover(c.id)}
                onMouseLeave={() => setCategoriaHover(null)}
              >
                <Link
                  href={`/tienda?categoria=${encodeURIComponent(c.nombre)}`}
                  className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {c.nombre}
                </Link>
                {categoriaHover === c.id && c.subcategorias.length > 0 && (
                  <div className="absolute top-full left-0 bg-white border border-stone-200 rounded-xl shadow-lg py-2 min-w-[180px] z-40">
                    {c.subcategorias.map(s => (
                      <Link
                        key={s}
                        href={`/tienda?categoria=${encodeURIComponent(c.nombre)}&subcategoria=${encodeURIComponent(s)}`}
                        className="block px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {negocio.whatsapp && (
            <a
              href={`https://wa.me/${negocio.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon />
              Consultá por WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => interes.setAbierto(true)}
            aria-label="Ver mi interés"
            className="relative w-9 h-9 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z" />
            </svg>
            {interes.items.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                {interes.items.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel mobile de categorías */}
      {menuMobileAbierto && (
        <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200 shrink-0">
            <span className="font-semibold text-stone-900">Categorías</span>
            <button
              type="button"
              onClick={() => setMenuMobileAbierto(false)}
              aria-label="Cerrar menú"
              className="w-9 h-9 flex items-center justify-center text-stone-600"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {categorias.map(c => (
              <div key={c.id} className="border-b border-stone-100">
                <button
                  type="button"
                  onClick={() => setCategoriaMobileAbierta(categoriaMobileAbierta === c.id ? null : c.id)}
                  className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-stone-800"
                >
                  <Link
                    href={`/tienda?categoria=${encodeURIComponent(c.nombre)}`}
                    onClick={() => setMenuMobileAbierto(false)}
                  >
                    {c.nombre}
                  </Link>
                  {c.subcategorias.length > 0 && (
                    <span className="text-stone-400">{categoriaMobileAbierta === c.id ? '−' : '+'}</span>
                  )}
                </button>
                {categoriaMobileAbierta === c.id && c.subcategorias.length > 0 && (
                  <div className="pb-2 pl-3 space-y-1">
                    {c.subcategorias.map(s => (
                      <Link
                        key={s}
                        href={`/tienda?categoria=${encodeURIComponent(c.nombre)}&subcategoria=${encodeURIComponent(s)}`}
                        onClick={() => setMenuMobileAbierto(false)}
                        className="block py-1.5 text-sm text-stone-500"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
