export type ProductoEstado = 'disponible' | 'vendido' | 'reservado'
export type ProductoOrigen = 'bot' | 'web'

export interface ProductoTalle {
  id: string
  producto_id: string
  talle: string
  stock: number
  creado_en: string
}

export interface Producto {
  id: string
  nombre: string
  categoria: string | null
  subcategoria: string | null
  talle: string | null
  costo: number
  precio_venta: number
  stock: number
  estado: ProductoEstado
  foto_url: string | null
  fotos_urls: string[]
  origen: ProductoOrigen
  creado_en: string
  actualizado_en: string
  producto_talles?: ProductoTalle[]
}

export interface Venta {
  id: string
  producto_id: string
  precio_vendido: number
  costo_al_momento: number
  ganancia: number
  cantidad: number
  talle: string | null
  fecha: string
}

export interface Categoria {
  id: string
  nombre: string
  subcategorias: string[]
  creado_en: string
}

export interface Retiro {
  id: string
  monto: number
  motivo: string | null
  fecha: string
}

export interface BotSesion {
  chat_id: string
  paso: BotPaso
  datos_parciales: Partial<DatosParciales>
  actualizado_en: string
}

export type BotPaso =
  | 'esperando_nombre'
  | 'esperando_categoria'
  | 'esperando_subcategoria'
  | 'esperando_costo'
  | 'esperando_venta'
  | 'esperando_talles'
  | 'esperando_cantidad_talle'
  | 'esperando_fotos'
  | 'esperando_confirmacion'

export interface DatosParciales {
  nombre: string
  categoria: string
  subcategoria: string
  costo: number
  precio_venta: number
  foto_url: string
  fotos_urls: string[]
  talles_seleccionados: string[]
  talles_cantidades: Record<string, number>
  talle_actual_idx: number
}
