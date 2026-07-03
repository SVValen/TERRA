'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { InteresItem } from '@/lib/whatsapp'
import Header from './Header'
import Footer from './Footer'
import PanelInteres from './PanelInteres'

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
}

interface InteresCtx {
  items: InteresItem[]
  agregar: (item: InteresItem) => void
  quitar: (productoId: string, talle: string | null, color: string | null) => void
  limpiar: () => void
  abierto: boolean
  setAbierto: (v: boolean) => void
}

interface TiendaCtx {
  negocio: NegocioCtx
  interes: InteresCtx
}

const negocioVacio: NegocioCtx = {
  nombre: '', logoUrl: null, whatsapp: null, instagram: null,
  colorFondo: null, colorTexto: null, razonSocial: null, cuit: null, direccion: null,
}

const TiendaContext = createContext<TiendaCtx>({
  negocio: negocioVacio,
  interes: { items: [], agregar: () => {}, quitar: () => {}, limpiar: () => {}, abierto: false, setAbierto: () => {} },
})
export const useTienda = () => useContext(TiendaContext)

interface Props extends NegocioCtx {
  children: ReactNode
}

export default function TiendaShell({ children, ...negocio }: Props) {
  const [items, setItems] = useState<InteresItem[]>([])
  const [abierto, setAbierto] = useState(false)
  const cargado = useRef(false)

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

  return (
    <TiendaContext.Provider value={{ negocio, interes: { items, agregar, quitar, limpiar, abierto, setAbierto } }}>
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
      </div>
    </TiendaContext.Provider>
  )
}
