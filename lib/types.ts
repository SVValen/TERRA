export type ProductoEstado = 'disponible' | 'vendido' | 'reservado'
export type ProductoOrigen = 'bot' | 'web'

export interface ProductoTalle {
  id: string
  producto_id: string
  talle: string
  color: string
  stock: number
  creado_en: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  subcategoria: string | null
  talle: string | null
  costo: number
  precio_venta: number
  precio_anterior: number | null
  destacado: boolean
  orden_destacado: number | null
  envio_gratis: boolean
  envio_dia: boolean
  stock: number
  estado: ProductoEstado
  activo: boolean
  foto_url: string | null
  fotos_urls: string[]
  video_url: string | null
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
  color: string | null
  fecha: string
}

export interface Categoria {
  id: string
  nombre: string
  subcategorias: string[]
  activa?: boolean
  creado_en: string
}

export interface Talle {
  id: string
  nombre: string
  creado_en: string
}

export interface Color {
  id: string
  nombre: string
  creado_en: string
}

export interface GuiaTallas {
  columnas: string[]
  filas: string[][]
}

export type BannerDireccion = 'izquierda' | 'derecha'

export interface CustomStudio {
  heroTitulo: string
  heroSubtitulo: string
  disenoTitulo: string
  disenoTexto: string
  identidadTitulo: string
  identidadTexto: string
  productoTitulo: string
  productoTexto: string
  prendaTitulo: string
  prendaTexto: string
  prendaProceso: string
  prendaBoton: string
  ctaTitulo: string
}

export interface EstudioItem {
  id: string
  nombre: string
  subtitulo: string | null
  descripcion: string | null
  imagen_url: string | null
  precio: string | null
  orden: number
  activo: boolean
  creado_en: string
}

export interface Negocio {
  id: number
  nombre: string
  logo_url: string | null
  whatsapp: string | null
  instagram: string | null
  color_primario: string | null
  color_fondo: string | null
  color_texto: string | null
  color_header_fondo: string | null
  color_header_texto: string | null
  color_banner_fondo: string | null
  color_banner_texto: string | null
  color_boton_fondo: string | null
  color_boton_texto: string | null
  margen_objetivo: number | null
  dias_nuevo: number | null
  razon_social: string | null
  cuit: string | null
  direccion: string | null
  guia_talles: GuiaTallas | null
  cambios_devoluciones: string | null
  envios: string | null
  banner_envios: string | null
  banner_envios_velocidad: number | null
  banner_envios_direccion: BannerDireccion | null
  etiqueta_envio_gratis: string | null
  etiqueta_envio_dia: string | null
  texto_destacado: string | null
  banner_destacado_velocidad: number | null
  banner_destacado_direccion: BannerDireccion | null
  mision_vision_habilitado: boolean
  mision_texto: string | null
  mision_imagen_url: string | null
  vision_texto: string | null
  vision_imagen_url: string | null
  personaliza_habilitado: boolean
  custom_studio: CustomStudio | null
  custom_diseno_imagen_url: string | null
  whatsapp_saludo: string | null
  whatsapp_msg_producto_intro: string | null
  whatsapp_msg_interes_intro: string | null
  whatsapp_msg_estudio_proceso: string | null
  whatsapp_msg_estudio_general: string | null
  whatsapp_msg_estudio_item: string | null
  actualizado_en: string
}

export type AnuncioMediaTipo = 'imagen' | 'video'

export interface Anuncio {
  id: string
  media_url: string
  media_tipo: AnuncioMediaTipo
  titulo: string | null
  subtitulo: string | null
  link_url: string | null
  orden: number
  activo: boolean
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
  | 'esperando_descripcion'
  | 'esperando_categoria'
  | 'esperando_subcategoria'
  | 'esperando_costo'
  | 'esperando_venta'
  | 'esperando_talles'
  | 'esperando_colores'
  | 'esperando_cantidad_combinacion'
  | 'esperando_fotos'
  | 'esperando_confirmacion'

export interface DatosParciales {
  nombre: string
  descripcion: string
  categoria: string
  subcategoria: string
  costo: number
  precio_venta: number
  foto_url: string
  fotos_urls: string[]
  talles_seleccionados: string[]
  talle_actual_idx: number
  colores_seleccionados: string[]
  colores_pendientes: string[]
  colores_pendientes_idx: number
  combinaciones: { talle: string; color: string; stock: number }[]
}
