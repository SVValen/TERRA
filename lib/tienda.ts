// Campos de `productos` seguros para exponer en /api/tienda/*. Nunca incluir `costo`.
export const PRODUCTO_TIENDA_FIELDS =
  'id, nombre, descripcion, foto_url, fotos_urls, video_url, precio_venta, precio_anterior, destacado, envio_gratis, envio_dia, categoria, subcategoria, stock, creado_en'

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}
