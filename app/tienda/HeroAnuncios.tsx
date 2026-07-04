'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Anuncio } from '@/lib/types'

export default function HeroAnuncios({ anuncios }: { anuncios: Anuncio[] }) {
  const [activo, setActivo] = useState(0)

  if (anuncios.length === 0) return null

  const irSiguiente = () => setActivo(i => (i + 1) % anuncios.length)
  const irAnterior = () => setActivo(i => (i - 1 + anuncios.length) % anuncios.length)

  const a = anuncios[activo]
  const esLinkExterno = !!a.link_url && /^https?:\/\//.test(a.link_url)

  const contenido = (
    <section className="relative w-full h-[60vh] sm:h-[70vh] bg-stone-100 overflow-hidden">
      {a.media_tipo === 'video' ? (
        <video
          key={a.id}
          src={a.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <Image
          key={a.id}
          src={a.media_url}
          alt={a.titulo ?? ''}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {(a.titulo || a.subtitulo) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 sm:px-8 pb-8 sm:pb-12 max-w-6xl mx-auto left-0 right-0">
            {a.subtitulo && (
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">{a.subtitulo}</p>
            )}
            {a.titulo && (
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight max-w-2xl">{a.titulo}</h1>
            )}
          </div>
        </>
      )}

      {anuncios.length > 1 && (
        <>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); irAnterior() }}
            aria-label="Anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
          >
            ←
          </button>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); irSiguiente() }}
            aria-label="Siguiente"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
          >
            →
          </button>
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
            {anuncios.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setActivo(i) }}
                aria-label={`Ir al anuncio ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${i === activo ? 'bg-white w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )

  if (!a.link_url) return contenido

  return esLinkExterno ? (
    <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="block">{contenido}</a>
  ) : (
    <Link href={a.link_url} className="block">{contenido}</Link>
  )
}
