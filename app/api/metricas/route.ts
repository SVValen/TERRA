import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  const hoy = new Date().toISOString().slice(0, 10)
  const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [productosResult, ventasResult, retirosResult, tiendaResult] = await Promise.all([
    supabase.from('productos').select('costo, precio_venta, estado'),
    supabase.from('ventas').select('ganancia, precio_vendido, fecha'),
    supabase.from('retiros').select('monto'),
    supabase.from('metricas_tienda').select('fecha, visitas, clicks_wa').gte('fecha', hace30),
  ])

  if (productosResult.error || ventasResult.error || retirosResult.error) {
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 })
  }

  const tiendaRows = tiendaResult.data ?? []
  const sumBy = (field: 'visitas' | 'clicks_wa', desde: string) =>
    tiendaRows.filter(r => r.fecha >= desde).reduce((acc, r) => acc + (r[field] ?? 0), 0)

  const productos = productosResult.data
  const ventas = ventasResult.data
  const retiros = retirosResult.data

  const disponibles = productos.filter((p) => p.estado === 'disponible')
  const valorStockCosto = disponibles.reduce((acc, p) => acc + p.costo, 0)
  const valorStockVenta = disponibles.reduce((acc, p) => acc + p.precio_venta, 0)

  const gananciaTotal = ventas.reduce((acc, v) => acc + (v.ganancia ?? 0), 0)
  const totalRetiros = retiros.reduce((acc, r) => acc + r.monto, 0)
  const saldoDisponible = gananciaTotal - totalRetiros

  const margenPromedio =
    ventas.length > 0
      ? ventas.reduce((acc, v) => acc + (v.ganancia ?? 0) / v.precio_vendido, 0) / ventas.length
      : 0

  return NextResponse.json({
    valor_stock_costo: valorStockCosto,
    valor_stock_venta: valorStockVenta,
    ganancia_total: gananciaTotal,
    total_retiros: totalRetiros,
    saldo_disponible: saldoDisponible,
    margen_promedio: margenPromedio,
    total_ventas: ventas.length,
    total_productos: productos.length,
    productos_disponibles: disponibles.length,
    tienda: {
      visitas_hoy: sumBy('visitas', hoy),
      visitas_semana: sumBy('visitas', hace7),
      visitas_mes: sumBy('visitas', hace30),
      clicks_wa_hoy: sumBy('clicks_wa', hoy),
      clicks_wa_semana: sumBy('clicks_wa', hace7),
      clicks_wa_mes: sumBy('clicks_wa', hace30),
    },
  })
}
