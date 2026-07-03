'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { InteresItem } from '@/lib/whatsapp'
import Header from './Header'
import Footer from './Footer'
import PanelInteres from './PanelInteres'
import CatalogoSidebar from './CatalogoSidebar'

const INTERES_STORAGE_KEY = 'sp-interes'

interface NegocioCtx {
  nombre: string
  logoUrl: string | null
  whatsapp: string | null
  instagram: string | null
  colorFondo: string | null
  colorTexto: string | null
  razonSocial: string | null
  cuit: string | null
  direccion: string | null
  diasNuevo: number
}

interface InteresCtx {
  items: InteresItem[]
  agregar: (item: InteresItem) => void
  quitar: (productoId: string, talle: string | null, color: string | null) => void
  limpiar: () => void
  abierto: boolean
  setAbierto: (v: boolean) => void
}

interface CatalogoCtx {
  abierto: boolean
  setAbierto: (v: boolean) => void
  categoriaActiva: string
  setCategoriaActiva: (v: string) => void
  subcategoriaActiva: string
  setSubcategoriaActiva: (v: string) => void
}

interface TiendaCtx {
  negocio: NegocioCtx
  interes: InteresCtx
  catalogo: CatalogoCtx
}

const negocioVacio: NegocioCtx = {
  nombre: '', logoUrl: null, whatsapp: null, instagram: null,
  colorFondo: null, colorTexto: null, razonSocial: null, cuit: null, direccion: null,
  diasNuevo: 14,
}

const TiendaContext = createContext<TiendaCtx>({
  negocio: negocioVacio,
  interes: { items: [], agregar: () => {}, quitar: () => {}, limpiar: () => {}, abierto: false, setAbierto: () => {} },
  catalogo: {
    abierto: false, setAbierto: () => {},
    categoriaActiva: '', setCategoriaActiva: () => {},
    subcategoriaActiva: '', setSubcategoriaActiva: () => {},
  },
})
export const useTienda = () => useContext(TiendaContext)

interface Props extends NegocioCtx {
  children: ReactNode
}

export default function TiendaShell({ children, ...negocio }: Props) {
  const [items, setItems] = useState<InteresItem[]>([])
  const [abierto, setAbierto] = useState(false)
  const cargado = useRef(false)

  const [catalogoAbierto, setCatalogoAbierto] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('')

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const guardado = localStorage.getItem(INTERES_STORAGE_KEY)
        if (guardado) setItems(JSON.parse(guardado))
      } catch {
        // localStorage no disponible o dato corrupto — arrancamos con lista vacía
      }
      cargado.current = true
    })
  }, [])

  useEffect(() => {
    if (!cargado.current) return
    localStorage.setItem(INTERES_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const agregar = (item: InteresItem) => {
    setItems(prev => [...prev, item])
  }

  const quitar = (productoId: string, talle: string | null, color: string | null) => {
    setItems(prev => prev.filter(i => !(i.productoId === productoId && i.talle === talle && i.color === color)))
  }

  const limpiar = () => setItems([])

  const catalogo: CatalogoCtx = {
    abierto: catalogoAbierto, setAbierto: setCatalogoAbierto,
    categoriaActiva, setCategoriaActiva,
    subcategoriaActiva, setSubcategoriaActiva,
  }

  return (
    <TiendaContext.Provider value={{ negocio, interes: { items, agregar, quitar, limpiar, abierto, setAbierto }, catalogo }}>
      <div
        className="min-h-screen bg-stone-50 flex flex-col"
        style={{
          background: negocio.colorFondo || undefined,
          ['--tienda-text' as string]: negocio.colorTexto || '#1c1917',
        }}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <PanelInteres />
        <CatalogoSidebar />
      </div>
    </TiendaContext.Provider>
  )
}
