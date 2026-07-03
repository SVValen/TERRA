'use client'

import { useEffect, useState } from 'react'
import { useTienda } from './TiendaShell'
import { type ProductoCardData } from './ProductoCard'
import ProductCarousel from './ProductCarousel'
import HeroDestacados from './HeroDestacados'

export default function TiendaPage() {
  const { negocio, catalogo } = useTienda()
  const [destacados, setDestacados] = useState<ProductoCardData[]>([])
  const [nuevos, setNuevos] = useState<ProductoCardData[]>([])

  useEffect(() => {
    fetch('/api/tienda/visita', { method: 'POST' })
    fetch('/api/tienda/productos?destacado=true').then(r => r.json()).then(setDestacados)
    fetch('/api/tienda/productos').then(r => r.json()).then((data: ProductoCardData[]) => setNuevos(data.slice(0, 10)))
  }, [])

  return (
    <div>
      <HeroDestacados productos={destacados} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <ProductCarousel titulo="Nuevos" productos={nuevos} whatsapp={negocio.whatsapp} nombreTienda={negocio.nombre} />

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => catalogo.setAbierto(true)}
            className="px-6 py-3 rounded-full text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            Ver catálogo completo
          </button>
        </div>
      </div>
    </div>
  )
}
