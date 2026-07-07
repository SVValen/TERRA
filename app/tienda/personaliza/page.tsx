'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTienda } from '../TiendaShell'
import { buildConsultaWaUrl } from '@/lib/whatsapp'
import WhatsAppIcon from '../WhatsAppIcon'
import type { EstudioItem } from '@/lib/types'

export default function PersonalizaPage() {
  const { negocio } = useTienda()
  const cs = negocio.customStudio
  const [items, setItems] = useState<EstudioItem[]>([])

  useEffect(() => {
    fetch('/api/tienda/estudio-items').then(r => r.json()).then(setItems)
  }, [])

  const waProceso = buildConsultaWaUrl({
    whatsapp: negocio.whatsapp,
    nombreTienda: negocio.nombre,
    mensaje: negocio.whatsappMsgEstudioProceso,
    saludo: negocio.whatsappSaludo,
  })
  const waCta = buildConsultaWaUrl({
    whatsapp: negocio.whatsapp,
    nombreTienda: negocio.nombre,
    mensaje: negocio.whatsappMsgEstudioGeneral,
    saludo: negocio.whatsappSaludo,
  })

  return (
    <div className="bg-black">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-24">
        <h1
          className="text-6xl sm:text-8xl uppercase tracking-tighter leading-[0.9] mb-4"
          style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
        >
          {cs.heroTitulo}
        </h1>
        <p className="font-mono text-xs sm:text-sm uppercase tracking-widest text-white/50 mb-12">
          {cs.heroSubtitulo}
        </p>
        <div className="w-1 h-24 bg-red-600" />
      </section>

      {/* Solo diseño */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 sm:px-6 py-24 md:py-32 border-t border-white/20 max-w-6xl mx-auto">
        <div className="md:col-span-7 flex flex-col justify-center order-2 md:order-1">
          <h2
            className="text-4xl sm:text-6xl uppercase mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            {cs.disenoTitulo}
          </h2>
          <div className="max-w-md">
            <p className="text-white/60 mb-8 leading-relaxed">{cs.disenoTexto}</p>
            <div className="p-6 border border-white/30 flex items-start gap-4">
              <span className="text-red-600 text-xl">✦</span>
              <div>
                <p className="font-mono uppercase text-sm mb-2 text-white">{cs.identidadTitulo}</p>
                <p className="text-white/50 text-sm">{cs.identidadTexto}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-5 relative h-[350px] sm:h-[500px] bg-white/5 border border-white/20 order-1 md:order-2 overflow-hidden group">
          {negocio.customDisenoImagenUrl ? (
            <Image src={negocio.customDisenoImagenUrl} alt={cs.disenoTitulo} fill className="object-cover grayscale" sizes="(max-width: 768px) 100vw, 40vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-6xl uppercase text-white/10 group-hover:text-white/20 transition-colors"
                style={{ fontFamily: 'var(--font-anton)' }}
              >
                TERRA
              </span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-black border border-white/30">
            <p className="font-mono text-[10px] uppercase tracking-tighter text-white/60">Project_01: Identity Systems</p>
          </div>
        </div>
      </section>

      {/* Diseño + producto */}
      <section className="px-4 sm:px-6 py-24 md:py-32 border-t border-white/20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <h2
            className="text-4xl sm:text-6xl uppercase leading-none"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            {cs.productoTitulo}
          </h2>
          <p className="font-mono text-xs uppercase max-w-sm md:text-right text-white/50">{cs.productoTexto}</p>
        </div>

        {items.length === 0 ? (
          <p className="font-mono text-xs uppercase text-white/30 text-center py-12">Próximamente</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {items.map(item => (
              <Link key={item.id} href={`/tienda/personaliza/${item.id}`} className="flex flex-col group">
                <div className="relative aspect-square overflow-hidden bg-white/5 border border-white/20">
                  {item.imagen_url ? (
                    <Image
                      src={item.imagen_url}
                      alt={item.nombre}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white/10">📷</div>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-body-md uppercase font-bold text-sm text-white group-hover:text-red-600 transition-colors">{item.nombre}</h3>
                    {item.subtitulo && <p className="font-mono text-[10px] uppercase text-white/40">{item.subtitulo}</p>}
                  </div>
                  {item.precio && <p className="font-mono text-xs text-white/60">{item.precio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tu prenda, nuestro diseño */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-y border-white/20">
        <div className="p-8 md:p-24 border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col justify-center bg-white/[0.03]">
          <span className="font-mono text-xs text-red-600 mb-4 uppercase">Service_03</span>
          <h2
            className="text-4xl sm:text-5xl uppercase mb-10 leading-tight"
            style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
          >
            {cs.prendaTitulo}
          </h2>
          <p className="text-white/70 max-w-sm leading-relaxed">{cs.prendaTexto}</p>
        </div>
        <div className="relative min-h-[400px] flex items-center justify-center p-8">
          <div className="w-full max-w-md aspect-square border border-white/20 relative flex items-center justify-center overflow-hidden">
            <div className="text-center p-8">
              <p
                className="uppercase mb-4 tracking-tighter text-2xl"
                style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
              >
                Bring your own
              </p>
              <p className="font-mono text-[10px] uppercase text-white/40 mb-8 tracking-widest">{cs.prendaProceso}</p>
              {waProceso ? (
                <a
                  href={waProceso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors w-full"
                >
                  {cs.prendaBoton}
                </a>
              ) : (
                <div className="px-8 py-4 bg-white/10 text-white/40 font-mono text-xs uppercase tracking-widest w-full">
                  {cs.prendaBoton}
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/40" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/40" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 md:py-48 px-4 sm:px-6 text-center">
        <h2
          className="text-5xl sm:text-8xl uppercase tracking-tighter mb-12 leading-[0.95]"
          style={{ fontFamily: 'var(--font-anton)', color: 'var(--tienda-text)' }}
        >
          {cs.ctaTitulo}
        </h2>
        {waCta ? (
          <a
            href={waCta}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 text-white font-mono px-10 py-5 text-base sm:text-lg uppercase tracking-widest transition-colors hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Consultá por WhatsApp
          </a>
        ) : null}
      </section>
    </div>
  )
}
