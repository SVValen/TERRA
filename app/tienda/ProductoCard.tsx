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
  'id' | 'nombre' | 'foto_url' | 'fotos_urls' | 'precio_venta' | 'precio_anterior' | 'categoria' | 'subcategoria' | 'stock' | 'creado_en' | 'envio_gratis' | 'envio_dia'
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
      className={`group h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 ${sinStock ? 'opacity-60' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/tienda/${p.id}`} className="block">
        <div className="aspect-square bg-stone-50 relative overflow-hidden">
          {p.foto_url ? (
            <Image
              src={hover && segundaFoto ? segundaFoto : p.foto_url}
              alt={p.nombre}
              fill
              className={`object-cover transition-transform duration-500 ${!hover ? 'group-hover:scale-105' : ''} ${sinStock ? 'grayscale' : ''}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-stone-200">📷</div>
          )}
          {p.fotos_urls?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              +{p.fotos_urls.length - 1}
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {sinStock && (
              <span className="bg-stone-800/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                Sin stock
              </span>
            )}
            {!sinStock && esNuevo && (
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                Nuevo
              </span>
            )}
            {!sinStock && tieneDescuento && (
              <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                {porcentajeOff}% OFF
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link href={`/tienda/${p.id}`}>
          <p className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.6em] mb-1.5 hover:text-amber-800 transition-colors" style={{ color: 'var(--tienda-text)' }}>
            {p.nombre}
          </p>
        </Link>

        {(p.categoria || p.subcategoria) && (
          <p className="text-xs text-stone-400 mb-1.5 line-clamp-1">
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
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                    stockTalle > 0 ? 'text-stone-600 bg-stone-100' : 'text-stone-300 bg-stone-50 line-through'
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
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                {negocio.etiquetaEnvioGratis}
              </span>
            )}
            {p.envio_dia && (
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                {negocio.etiquetaEnvioDia}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <p className="text-base font-bold whitespace-nowrap" style={{ color: 'var(--tienda-text)' }}>
              ${p.precio_venta.toLocaleString('es-AR')}
            </p>
            {tieneDescuento && (
              <p className="text-xs text-stone-400 line-through whitespace-nowrap">
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
              className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Consultar
            </a>
          ) : (
            <Link
              href={`/tienda/${p.id}`}
              className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full text-slate-900 transition-opacity"
              style={{ background: 'var(--accent)' }}
            >
              Ver más
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
