'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function FotoCarousel({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [activa, setActiva] = useState(0)
  const [lightboxAbierto, setLightboxAbierto] = useState(false)
  const foto = fotos[activa] ?? null

  const siguiente = () => setActiva(i => (i + 1) % fotos.length)
  const anterior = () => setActiva(i => (i - 1 + fotos.length) % fotos.length)
  const seleccionar = (i: number) => setActiva(i)

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-stone-100 rounded-3xl overflow-hidden shadow-sm relative group">
        {foto ? (
          <button
            type="button"
            onClick={() => setLightboxAbierto(true)}
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            aria-label="Ampliar foto"
          >
            <Image src={foto} alt={nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-stone-200">📷</div>
        )}

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-stone-700 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-stone-700 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {activa + 1}/{fotos.length}
            </div>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActiva(i)}
              style={{ width: 72, height: 72 }}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${
                i === activa ? 'border-amber-400 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="72px" />
            </button>
          ))}
        </div>
      )}

      {lightboxAbierto && (
        <Lightbox
          fotos={fotos}
          nombre={nombre}
          activa={activa}
          onCerrar={() => setLightboxAbierto(false)}
          onSiguiente={siguiente}
          onAnterior={anterior}
          onSeleccionar={seleccionar}
        />
      )}
    </div>
  )
}

function Lightbox({
  fotos,
  nombre,
  activa,
  onCerrar,
  onSiguiente,
  onAnterior,
  onSeleccionar,
}: {
  fotos: string[]
  nombre: string
  activa: number
  onCerrar: () => void
  onSiguiente: () => void
  onAnterior: () => void
  onSeleccionar: (i: number) => void
}) {
  const [zoom, setZoom] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const arrastre = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const irSiguiente = useCallback(() => { setZoom(false); setOffset({ x: 0, y: 0 }); onSiguiente() }, [onSiguiente])
  const irAnterior = useCallback(() => { setZoom(false); setOffset({ x: 0, y: 0 }); onAnterior() }, [onAnterior])
  const irA = (i: number) => { setZoom(false); setOffset({ x: 0, y: 0 }); onSeleccionar(i) }

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'ArrowRight') irSiguiente()
      if (e.key === 'ArrowLeft') irAnterior()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCerrar, irSiguiente, irAnterior])

  const toggleZoom = () => {
    setZoom(z => !z)
    setOffset({ x: 0, y: 0 })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!zoom) return
    arrastre.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!zoom || !arrastre.current) return
    const dx = e.clientX - arrastre.current.x
    const dy = e.clientY - arrastre.current.y
    setOffset({ x: arrastre.current.offsetX + dx, y: arrastre.current.offsetY + dy })
  }
  const onMouseUp = () => { arrastre.current = null }

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    if (zoom) arrastre.current = { x: t.clientX, y: t.clientY, offsetX: offset.x, offsetY: offset.y }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!zoom || !arrastre.current) return
    const t = e.touches[0]
    const dx = t.clientX - arrastre.current.x
    const dy = t.clientY - arrastre.current.y
    setOffset({ x: arrastre.current.offsetX + dx, y: arrastre.current.offsetY + dy })
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    arrastre.current = null
    if (zoom || !touchStart.current) { touchStart.current = null; return }
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) irSiguiente(); else irAnterior()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`Foto de ${nombre}`}>
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm">
        <span>{activa + 1} / {fotos.length}</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={toggleZoom} className="hover:text-white transition-colors">
            {zoom ? 'Alejar' : 'Ampliar'}
          </button>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-xl leading-none hover:text-white transition-colors">
            ×
          </button>
        </div>
      </div>

      <div
        className={`relative flex-1 overflow-hidden select-none ${zoom ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        onClick={e => { if (!zoom) toggleZoom(); e.stopPropagation() }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 transition-transform duration-150"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom ? 2.2 : 1})` }}
        >
          <Image src={fotos[activa]} alt={nombre} fill className="object-contain" sizes="100vw" />
        </div>
      </div>

      {fotos.length > 1 && !zoom && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); irAnterior() }}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); irSiguiente() }}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
          >
            ›
          </button>
        </>
      )}

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 justify-center">
          {fotos.map((url, i) => (
            <button
              key={url}
              onClick={e => { e.stopPropagation(); irA(i) }}
              style={{ width: 48, height: 48 }}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all relative ${
                i === activa ? 'border-amber-400' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
