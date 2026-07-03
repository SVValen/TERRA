'use client'

import { useState } from 'react'
import { useTienda } from './TiendaShell'
import WhatsAppIcon from './WhatsAppIcon'
import InfoModal from './InfoModal'
import BannerEnvios from './BannerEnvios'

type ModalAyuda = 'talles' | 'cambios' | 'envios' | null

export default function Footer() {
  const { negocio } = useTienda()
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [modalAyuda, setModalAyuda] = useState<ModalAyuda>(null)

  const suscribirse = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('enviando')
    const res = await fetch('/api/tienda/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setEstado(res.ok ? 'ok' : 'error')
    if (res.ok) setEmail('')
  }

  const datosLegales = [negocio.razonSocial, negocio.cuit, negocio.direccion].filter(Boolean)

  return (
    <footer className="bg-white border-t border-stone-200 mt-16">
      <BannerEnvios />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Newsletter — primero en mobile */}
        <div className="order-first lg:order-last">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Newsletter</p>
          <p className="text-sm text-stone-500 mb-3">Enterate de las novedades y lanzamientos.</p>
          <form onSubmit={suscribirse} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input"
            />
            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--accent)' }}
            >
              Sumarme
            </button>
          </form>
          {estado === 'ok' && <p className="text-xs text-emerald-600 mt-2">¡Listo! Ya estás suscripta.</p>}
          {estado === 'error' && <p className="text-xs text-red-500 mt-2">No pudimos suscribirte, probá de nuevo.</p>}
        </div>

        {/* Ayuda */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Ayuda</p>
          <ul className="space-y-2 text-sm text-stone-500">
            <li>
              <button type="button" onClick={() => setModalAyuda('talles')} className="hover:text-stone-800 transition-colors">
                Guía de talles
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setModalAyuda('cambios')} className="hover:text-stone-800 transition-colors">
                Cambios y devoluciones
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setModalAyuda('envios')} className="hover:text-stone-800 transition-colors">
                Envíos
              </button>
            </li>
          </ul>
        </div>

        {/* Institucional */}
        {datosLegales.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Institucional</p>
            <ul className="space-y-1 text-sm text-stone-500">
              {negocio.razonSocial && <li>{negocio.razonSocial}</li>}
              {negocio.cuit && <li>CUIT: {negocio.cuit}</li>}
              {negocio.direccion && <li>{negocio.direccion}</li>}
            </ul>
          </div>
        )}

        {/* Seguinos */}
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Seguinos</p>
          <div className="flex flex-col gap-2">
            {negocio.whatsapp && (
              <a
                href={`https://wa.me/${negocio.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            )}
            {negocio.instagram && (
              <a
                href={`https://instagram.com/${negocio.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-stone-100 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2.5">
          <span className="text-xs text-stone-400">{negocio.nombre}</span>
        </div>
      </div>

      {modalAyuda === 'talles' && (
        <InfoModal titulo="Guía de talles" onClose={() => setModalAyuda(null)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {negocio.guiaTallas.columnas.map((c, i) => (
                    <th key={i} className="text-left font-semibold text-stone-700 pb-2 pr-4 border-b border-stone-200">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {negocio.guiaTallas.filas.map((fila, fi) => (
                  <tr key={fi}>
                    {fila.map((celda, ci) => (
                      <td key={ci} className="py-2 pr-4 text-stone-600 border-b border-stone-100">{celda}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoModal>
      )}

      {modalAyuda === 'cambios' && (
        <InfoModal titulo="Cambios y devoluciones" onClose={() => setModalAyuda(null)}>
          <p className="text-sm text-stone-600 whitespace-pre-line">{negocio.cambiosDevoluciones}</p>
        </InfoModal>
      )}

      {modalAyuda === 'envios' && (
        <InfoModal titulo="Envíos" onClose={() => setModalAyuda(null)}>
          <p className="text-sm text-stone-600 whitespace-pre-line">{negocio.envios}</p>
        </InfoModal>
      )}
    </footer>
  )
}
