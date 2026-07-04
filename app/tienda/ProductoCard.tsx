'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Producto as ProductoBase } from '@/lib/types'
import { buildProductoWaUrl } from '@/lib/whatsapp'
import { getBaseUrl } from '@/lib/tienda'
import { useTienda } from './TiendaShell'
import WhatsAppIcon from './WhatsAppIcon'

const AHORA_MS = Date.now()

export type ProductoCardData = Pick<
  ProductoBase,
  'id' | 'nombre' | 'foto_url' | 'fotos_urls' | 'video_url' | 'precio_venta' | 'precio_anterior' | 'categoria' | 'subcategoria' | 'stock' | 'creado_en' | 'envio_gratis' | 'envio_dia'
> & { producto_talles: { talle: string; color: string; stock: number }[] }

export default function ProductoCard({
  producto: p,
  whatsapp,
  nombreTienda,
}: {
  producto: ProductoCardData
  whatsapp: string | null
  nombreTienda: string
}) {
  const [hover, setHover] = useState(false)
  const { negocio } = useTienda()

  const sinStock = p.stock === 0
  const esNuevo = AHORA_MS - new Date(p.creado_en).getTime() < negocio.diasNuevo * 24 * 60 * 60 * 1000
  const tieneDescuento = !!p.precio_anterior && p.precio_anterior > p.precio_venta
  const porcentajeOff = tieneDescuento ? Math.round((1 - p.precio_venta / p.precio_anterior!) * 100) : 0

  const tallesConStock = p.producto_talles?.filter(t => t.stock > 0).map(t => t.talle) ?? []
  const productoUrl = `${typeof window !== 'undefined' ? window.location.origin : getBaseUrl()}/tienda/${p.id}`
  const waUrl = buildProductoWaUrl({
    whatsapp,
    nombreTienda,
    nombre: p.nombre,
    precioVenta: p.precio_venta,
    productoUrl,
    tallesDisponibles: [...new Set(tallesConStock)],
  })

  const segundaFoto = p.fotos_urls?.[1]

  return (
    <div
      className={`group h-full flex flex-col bg-transparent ${sinStock ? 'opacity-50' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/tienda/${p.id}`} className="block">
        <div className="aspect-square bg-white/5 relative overflow-hidden">
          {p.foto_url ? (
            <Image
              src={hover && segundaFoto ? segundaFoto : p.foto_url}
              alt={p.nombre}
              fill
              className={`object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ${sinStock ? 'grayscale' : ''}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-white/10">📷</div>
          )}
          {p.fotos_urls?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[10px] px-1.5 py-0.5">
              +{p.fotos_urls.length - 1}
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {sinStock && (
              <span className="bg-white/90 text-black font-mono text-[10px] px-2 py-0.5 uppercase font-bold">
                Sin stock
              </span>
            )}
            {!sinStock && esNuevo && (
              <span className="bg-white text-black font-mono text-[10px] px-2 py-0.5 uppercase font-bold">
                Nuevo
              </span>
            )}
            {!sinStock && tieneDescuento && (
              <span className="bg-red-600 text-white font-mono text-[10px] px-2 py-0.5 uppercase font-bold">
                {porcentajeOff}% OFF
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="pt-4 flex flex-col flex-1">
        <Link href={`/tienda/${p.id}`}>
          <p className="font-body-md text-sm uppercase leading-snug line-clamp-2 min-h-[2.6em] mb-1.5 hover:text-red-600 transition-colors" style={{ color: 'var(--tienda-text)' }}>
            {p.nombre}
          </p>
        </Link>

        {(p.categoria || p.subcategoria) && (
          <p className="font-mono text-[10px] uppercase text-white/40 mb-1.5 line-clamp-1">
            {[p.categoria, p.subcategoria].filter(Boolean).join(' · ')}
          </p>
        )}

        {p.producto_talles && p.producto_talles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {[...new Map(p.producto_talles.map(t => [t.talle, t])).values()].map(t => {
              const stockTalle = p.producto_talles.filter(x => x.talle === t.talle).reduce((a, x) => a + x.stock, 0)
              return (
                <span
                  key={t.talle}
                  className={`inline-block font-mono text-[10px] px-1.5 py-0.5 border ${
                    stockTalle > 0 ? 'text-white/70 border-white/20' : 'text-white/20 border-white/10 line-through'
                  }`}
                >
                  {t.talle}
                </span>
              )
            })}
          </div>
        )}

        {(p.envio_gratis || p.envio_dia) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {p.envio_gratis && (
              <span className="inline-block font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border border-red-600 text-red-600">
                {negocio.etiquetaEnvioGratis}
              </span>
            )}
            {p.envio_dia && (
              <span className="inline-block font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border border-red-600 text-red-600">
                {negocio.etiquetaEnvioDia}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <p className="font-mono text-sm font-bold whitespace-nowrap" style={{ color: 'var(--tienda-text)' }}>
              ${p.precio_venta.toLocaleString('es-AR')}
            </p>
            {tieneDescuento && (
              <p className="font-mono text-xs text-white/40 line-through whitespace-nowrap">
                ${p.precio_anterior!.toLocaleString('es-AR')}
              </p>
            )}
          </div>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => fetch('/api/tienda/click-wa', { method: 'POST' })}
              className="shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Consultar
            </a>
          ) : (
            <Link
              href={`/tienda/${p.id}`}
              className="shrink-0 font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 transition-colors hover:bg-red-600 hover:text-white"
              style={{ background: 'var(--tienda-boton-bg)', color: 'var(--tienda-boton-text)' }}
            >
              Ver más
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
