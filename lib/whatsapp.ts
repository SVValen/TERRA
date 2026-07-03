interface ProductoWaOpts {
  whatsapp: string | null
  nombreTienda: string
  nombre: string
  precioVenta: number
  productoUrl: string
  talle?: string | null
  color?: string | null
  tallesDisponibles?: string[]
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
}: ProductoWaOpts): string | null {
  if (!whatsapp) return null

  const lineaTalle = talle
    ? `Talle: ${talle}${color ? ` - ${color}` : ''}`
    : tallesDisponibles && tallesDisponibles.length > 0
      ? `Talle: ${tallesDisponibles.join('/')}`
      : ''

  const lineas = [
    `Hola *${nombreTienda}*! 👋`,
    ``,
    `Me interesa este producto:`,
    `*${nombre}*`,
    lineaTalle,
    `Precio: $${precioVenta.toLocaleString('es-AR')}`,
    ``,
    productoUrl,
  ].filter(l => l !== '')

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`
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
}: {
  whatsapp: string | null
  nombreTienda: string
  items: InteresItem[]
}): string | null {
  if (!whatsapp || items.length === 0) return null

  const detalle = items.map(item => {
    const variante = [item.talle, item.color].filter(Boolean).join(' - ')
    return `• ${item.nombre}${variante ? ` (${variante})` : ''}`
  })

  const lineas = [
    `Hola *${nombreTienda}*! 👋`,
    ``,
    `Me interesan estos productos:`,
    ...detalle,
  ]

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`
}
