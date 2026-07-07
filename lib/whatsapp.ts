export const SALUDO_DEFAULT = 'Hola *{tienda}*! 👋'
export const MSG_PRODUCTO_INTRO_DEFAULT = 'Me interesa este producto:'
export const MSG_INTERES_INTRO_DEFAULT = 'Me interesan estos productos:'
export const MSG_ESTUDIO_PROCESO_DEFAULT = 'Quiero traer mi propia prenda para personalizarla con el diseño de ustedes. ¿Cómo es el proceso?'
export const MSG_ESTUDIO_GENERAL_DEFAULT = 'Quiero consultar por el servicio de diseño personalizado / Custom Studio.'
export const MSG_ESTUDIO_ITEM_DEFAULT = 'Quiero consultar por "{item}" de la sección Personalizá tu diseño.'

export function sustituirTokens(texto: string, tokens: Record<string, string>): string {
  return Object.entries(tokens).reduce((acc, [clave, valor]) => acc.replaceAll(`{${clave}}`, valor), texto)
}

interface ProductoWaOpts {
  whatsapp: string | null
  nombreTienda: string
  nombre: string
  precioVenta: number
  productoUrl: string
  talle?: string | null
  color?: string | null
  tallesDisponibles?: string[]
  saludo?: string
  intro?: string
}

export function buildProductoWaUrl({
  whatsapp,
  nombreTienda,
  nombre,
  precioVenta,
  productoUrl,
  talle,
  color,
  tallesDisponibles,
  saludo = SALUDO_DEFAULT,
  intro = MSG_PRODUCTO_INTRO_DEFAULT,
}: ProductoWaOpts): string | null {
  if (!whatsapp) return null

  const lineaTalle = talle
    ? `Talle: ${talle}${color ? ` - ${color}` : ''}`
    : tallesDisponibles && tallesDisponibles.length > 0
      ? `Talle: ${tallesDisponibles.join('/')}`
      : ''

  const lineas = [
    sustituirTokens(saludo, { tienda: nombreTienda }),
    ``,
    intro,
    `*${nombre}*`,
    lineaTalle,
    `Precio: $${precioVenta.toLocaleString('es-AR')}`,
    ``,
    productoUrl,
  ].filter(l => l !== '')

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`
}

export function buildConsultaWaUrl({
  whatsapp,
  nombreTienda,
  mensaje,
  saludo = SALUDO_DEFAULT,
}: {
  whatsapp: string | null
  nombreTienda: string
  mensaje: string
  saludo?: string
}): string | null {
  if (!whatsapp) return null
  const texto = `${sustituirTokens(saludo, { tienda: nombreTienda })}\n\n${mensaje}`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`
}

export interface InteresItem {
  productoId: string
  nombre: string
  talle: string | null
  color: string | null
  foto: string | null
}

export function buildInteresWaUrl({
  whatsapp,
  nombreTienda,
  items,
  saludo = SALUDO_DEFAULT,
  intro = MSG_INTERES_INTRO_DEFAULT,
}: {
  whatsapp: string | null
  nombreTienda: string
  items: InteresItem[]
  saludo?: string
  intro?: string
}): string | null {
  if (!whatsapp || items.length === 0) return null

  const detalle = items.map(item => {
    const variante = [item.talle, item.color].filter(Boolean).join(' - ')
    return `• ${item.nombre}${variante ? ` (${variante})` : ''}`
  })

  const lineas = [
    sustituirTokens(saludo, { tienda: nombreTienda }),
    ``,
    intro,
    ...detalle,
  ]

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`
}
