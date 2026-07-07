'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { InteresItem } from '@/lib/whatsapp'
import type { BannerDireccion, CustomStudio, GuiaTallas } from '@/lib/types'
import { anton, jetbrainsMono } from '@/lib/fonts'
import {
  GUIA_TALLES_DEFAULT,
  CAMBIOS_DEVOLUCIONES_DEFAULT,
  ENVIOS_DEFAULT,
  ETIQUETA_ENVIO_GRATIS_DEFAULT,
  ETIQUETA_ENVIO_DIA_DEFAULT,
  TEXTO_DESTACADO_DEFAULT,
  BANNER_VELOCIDAD_DEFAULT,
  BANNER_DIRECCION_DEFAULT,
  MISION_DEFAULT,
  VISION_DEFAULT,
  CUSTOM_STUDIO_DEFAULT,
  WHATSAPP_SALUDO_DEFAULT,
  WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
  WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
} from '@/lib/contenido'
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
  colorHeaderFondo: string
  colorHeaderTexto: string
  colorBannerFondo: string
  colorBannerTexto: string
  colorBotonFondo: string
  colorBotonTexto: string
  razonSocial: string | null
  cuit: string | null
  direccion: string | null
  diasNuevo: number
  guiaTallas: GuiaTallas
  cambiosDevoluciones: string
  envios: string
  bannerEnvios: string | null
  bannerEnviosVelocidad: number
  bannerEnviosDireccion: BannerDireccion
  etiquetaEnvioGratis: string
  etiquetaEnvioDia: string
  textoDestacado: string
  bannerDestacadoVelocidad: number
  bannerDestacadoDireccion: BannerDireccion
  misionVisionHabilitado: boolean
  misionTexto: string
  misionImagenUrl: string | null
  visionTexto: string
  visionImagenUrl: string | null
  personalizaHabilitado: boolean
  customStudio: CustomStudio
  customDisenoImagenUrl: string | null
  whatsappSaludo: string
  whatsappMsgProductoIntro: string
  whatsappMsgInteresIntro: string
  whatsappMsgEstudioProceso: string
  whatsappMsgEstudioGeneral: string
  whatsappMsgEstudioItem: string
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
  colorFondo: '#131313', colorTexto: '#e2e2e2', razonSocial: null, cuit: null, direccion: null,
  colorHeaderFondo: '#131313', colorHeaderTexto: '#e2e2e2',
  colorBannerFondo: '#e2e2e2', colorBannerTexto: '#131313',
  colorBotonFondo: '#e2e2e2', colorBotonTexto: '#131313',
  diasNuevo: 14,
  guiaTallas: GUIA_TALLES_DEFAULT,
  cambiosDevoluciones: CAMBIOS_DEVOLUCIONES_DEFAULT,
  envios: ENVIOS_DEFAULT,
  bannerEnvios: null,
  bannerEnviosVelocidad: BANNER_VELOCIDAD_DEFAULT,
  bannerEnviosDireccion: BANNER_DIRECCION_DEFAULT,
  etiquetaEnvioGratis: ETIQUETA_ENVIO_GRATIS_DEFAULT,
  etiquetaEnvioDia: ETIQUETA_ENVIO_DIA_DEFAULT,
  textoDestacado: TEXTO_DESTACADO_DEFAULT,
  bannerDestacadoVelocidad: BANNER_VELOCIDAD_DEFAULT,
  bannerDestacadoDireccion: BANNER_DIRECCION_DEFAULT,
  misionVisionHabilitado: true,
  misionTexto: MISION_DEFAULT,
  misionImagenUrl: null,
  visionTexto: VISION_DEFAULT,
  visionImagenUrl: null,
  personalizaHabilitado: true,
  customStudio: CUSTOM_STUDIO_DEFAULT,
  customDisenoImagenUrl: null,
  whatsappSaludo: WHATSAPP_SALUDO_DEFAULT,
  whatsappMsgProductoIntro: WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
  whatsappMsgInteresIntro: WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
  whatsappMsgEstudioProceso: WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
  whatsappMsgEstudioGeneral: WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
  whatsappMsgEstudioItem: WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
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
        className={`${anton.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col selection:bg-red-600 selection:text-white`}
        style={{
          background: negocio.colorFondo || '#131313',
          ['--tienda-fondo' as string]: negocio.colorFondo || '#131313',
          ['--tienda-text' as string]: negocio.colorTexto || '#e2e2e2',
          ['--tienda-header-bg' as string]: negocio.colorHeaderFondo,
          ['--tienda-header-text' as string]: negocio.colorHeaderTexto,
          ['--tienda-banner-bg' as string]: negocio.colorBannerFondo,
          ['--tienda-banner-text' as string]: negocio.colorBannerTexto,
          ['--tienda-boton-bg' as string]: negocio.colorBotonFondo,
          ['--tienda-boton-text' as string]: negocio.colorBotonTexto,
          ['--tienda-accent' as string]: '#FF0000',
          ['--font-mono' as string]: 'var(--font-jetbrains)',
          color: negocio.colorTexto || '#e2e2e2',
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
