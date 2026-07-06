'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTienda } from '../../TiendaShell'
import { buildConsultaWaUrl } from '@/lib/whatsapp'
import WhatsAppIcon from '../../WhatsAppIcon'
import type { EstudioItem } from '@/lib/types'

export default function EstudioItemPage() {
  const { id } = useParams<{ id: string }>()
  const { negocio } = useTienda()
  const [item, setItem] = useState<EstudioItem | null | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/tienda/estudio-items/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(setItem)
  }, [id])

  if (item === undefined) return null

  if (item === null) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="font-mono text-xs uppercase text-white/60 mb-4">Ítem no disponible</p>
        <Link href="/tienda/personaliza" className="font-mono text-xs uppercase text-red-600 underline underline-offset-4">
          Volver a Personalizá tu diseño
        </Link>
      </div>
    )
  }

  const wa = buildConsultaWaUrl({
    whatsapp: negocio.whatsapp,
    nombreTienda: negocio.nombre,
    mensaje: `Quiero consultar por "${item.nombre}" de la sección Personalizá tu diseño.`,
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <Link href="/tienda/personaliza" className="font-mono text-xs uppercase text-white/40 hover:text-red-600 transition-colors">
        ← Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start mt-8">
        <div className="aspect-square bg-white/5 border border-white/20 relative overflow-hidden">
          {item.imagen_url ? (
            <Image src={item.imagen_url} alt={item.nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-white/10">📷</div>
          )}
        </div>

        <div className="flex flex-col">
          {item.subtitulo && (
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest mb-3">{item.subtitulo}</p>
          )}
          <h1
            className="text-4xl sm:text-5xl uppercase leading-[0.95] tracking-tighter mb-6"
            style={{ color: 'var(--tienda-text)', fontFamily: 'var(--font-anton)' }}
          >
            {item.nombre}
          </h1>

          {item.precio && (
            <p className="font-mono text-2xl font-bold border-t border-white/20 pt-6 mb-6" style={{ color: 'var(--tienda-text)' }}>
              {item.precio}
            </p>
          )}

          {item.descripcion && (
            <p className="text-sm text-white/60 mb-8 whitespace-pre-line leading-relaxed">{item.descripcion}</p>
          )}

          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-5 text-white font-mono text-sm font-bold uppercase tracking-tighter transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon className="w-5 h-5" />
              Consultar por WhatsApp
            </a>
          ) : (
            <div className="w-full py-5 text-center font-mono text-xs uppercase text-white/40 bg-white/5">
              Contactate con {negocio.nombre} para consultar disponibilidad
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
