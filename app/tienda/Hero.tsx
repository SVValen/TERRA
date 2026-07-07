'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Anuncio } from '@/lib/types'
import type { ProductoCardData } from './ProductoCard'
import { buildProductoWaUrl } from '@/lib/whatsapp'
import { getBaseUrl } from '@/lib/tienda'
import { useTienda } from './TiendaShell'
import WhatsAppIcon from './WhatsAppIcon'

type Slide =
  | { tipo: 'anuncio'; data: Anuncio }
  | { tipo: 'producto'; data: ProductoCardData }

export default function Hero({
  anuncios,
  productos,
  whatsapp,
  nombreTienda,
}: {
  anuncios: Anuncio[]
  productos: ProductoCardData[]
  whatsapp: string | null
  nombreTienda: string
}) {
  const slides: Slide[] = [
    ...anuncios.map(a => ({ tipo: 'anuncio' as const, data: a })),
    ...productos.map(p => ({ tipo: 'producto' as const, data: p })),
  ]

  const [activo, setActivo] = useState(0)
  const { negocio } = useTienda()

  if (slides.length === 0) return null

  const irSiguiente = () => setActivo(i => (i + 1) % slides.length)
  const irAnterior = () => setActivo(i => (i - 1 + slides.length) % slides.length)

  const slide = slides[activo]

  const mediaUrl = slide.tipo === 'anuncio' ? slide.data.media_url : slide.data.foto_url
  const mediaTipo = slide.tipo === 'anuncio' ? slide.data.media_tipo : (slide.data.video_url ? 'video' : 'imagen')
  const videoUrl = slide.tipo === 'anuncio' ? (slide.data.media_tipo === 'video' ? slide.data.media_url : null) : slide.data.video_url

  const linkUrl = slide.tipo === 'anuncio' ? slide.data.link_url : null
  const esLinkExterno = !!linkUrl && /^https?:\/\//.test(linkUrl)

  const producto = slide.tipo === 'producto' ? slide.data : null
  const tieneDescuento = !!producto?.precio_anterior && producto.precio_anterior > producto.precio_venta
  const productoUrl = producto ? `${typeof window !== 'undefined' ? window.location.origin : getBaseUrl()}/tienda/${producto.id}` : ''
  const waUrl = producto
    ? buildProductoWaUrl({
        whatsapp, nombreTienda, nombre: producto.nombre, precioVenta: producto.precio_venta, productoUrl,
        saludo: negocio.whatsappSaludo, intro: negocio.whatsappMsgProductoIntro,
      })
    : null

  const contenido = (
    <section className="relative w-full h-[70vh] sm:h-[90vh] bg-black overflow-hidden">
      {mediaTipo === 'video' && videoUrl ? (
        <video
          key={slide.data.id}
          src={videoUrl}
          poster={slide.tipo === 'producto' ? slide.data.foto_url ?? undefined : undefined}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : mediaUrl ? (
        <Image
          key={slide.data.id}
          src={mediaUrl}
          alt={slide.tipo === 'anuncio' ? slide.data.titulo ?? '' : slide.data.nombre}
          fill
          priority
          className="object-cover opacity-70"
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-7xl text-white/20">📷</div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-8 pb-10 sm:pb-16 max-w-6xl mx-auto left-0 right-0">
        {slide.tipo === 'anuncio' ? (
          <>
            {slide.data.subtitulo && (
              <p className="font-mono text-xs font-bold text-white/70 uppercase tracking-widest mb-3">{slide.data.subtitulo}</p>
            )}
            {slide.data.titulo && (
              <h1
                className="text-4xl sm:text-7xl uppercase tracking-tighter text-white leading-[0.95] max-w-3xl"
                style={{ fontFamily: 'var(--font-anton)' }}
              >
                {slide.data.titulo}
              </h1>
            )}
          </>
        ) : producto && (
          <>
            <p className="font-mono text-xs font-bold text-white/70 uppercase tracking-widest mb-3">Destacado</p>
            <h1
              className="text-4xl sm:text-7xl uppercase tracking-tighter text-white leading-[0.95] mb-4 max-w-3xl"
              style={{ fontFamily: 'var(--font-anton)' }}
            >
              {producto.nombre}
            </h1>
            <div className="flex items-baseline gap-3 mb-6">
              <p className="font-mono text-2xl sm:text-3xl font-bold text-white">
                ${producto.precio_venta.toLocaleString('es-AR')}
              </p>
              {tieneDescuento && (
                <p className="font-mono text-base text-white/50 line-through">
                  ${producto.precio_anterior!.toLocaleString('es-AR')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/tienda/${producto.id}`}
                className="px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-tighter transition-all hover:bg-red-600 hover:text-white"
                style={{ background: 'var(--tienda-boton-bg)', color: 'var(--tienda-boton-text)' }}
              >
                Ver producto
              </Link>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-tighter text-white transition-opacity hover:opacity-80"
                  style={{ background: '#25D366' }}
                >
                  <WhatsAppIcon />
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); irAnterior() }}
            aria-label="Anterior"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-sm transition-colors"
          >
            ←
          </button>
          <button
            type="button"
            onClick={e => { e.preventDefault(); e.stopPropagation(); irSiguiente() }}
            aria-label="Siguiente"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-sm transition-colors"
          >
            →
          </button>
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.data.id}
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setActivo(i) }}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-1 transition-all ${i === activo ? 'bg-white w-8' : 'bg-white/40 w-3'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )

  if (slide.tipo !== 'anuncio' || !linkUrl) return contenido

  return esLinkExterno ? (
    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block">{contenido}</a>
  ) : (
    <Link href={linkUrl} className="block">{contenido}</Link>
  )
}
