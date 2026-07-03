import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('ventas')
    .select('*, productos(nombre, foto_url)')
    .order('fecha', { ascending: false })

  const desde = searchParams.get('desde')
  if (desde) query = query.gte('fecha', desde)

  const hasta = searchParams.get('hasta')
  if (hasta) query = query.lte('fecha', hasta)

  const { data, error } = await query
  if (error) {
    console.error('[api/ventas GET]', error)
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const { producto_id, precio_vendido, cantidad = 1, talle, color = '' } = await request.json()

  if (!talle) {
    return NextResponse.json({ error: 'Falta indicar el talle vendido' }, { status: 422 })
  }

  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('costo, estado')
    .eq('id', producto_id)
    .single()

  if (errorProducto || !producto) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const { data: variante, error: errorVariante } = await supabase
    .from('producto_talles')
    .select('id, stock')
    .eq('producto_id', producto_id)
    .eq('talle', talle)
    .eq('color', color)
    .single()

  if (errorVariante || !variante) {
    return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })
  }

  if (cantidad > variante.stock) {
    return NextResponse.json({ error: 'Stock insuficiente' }, { status: 422 })
  }

  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert({
      producto_id,
      precio_vendido,
      costo_al_momento: producto.costo,
      cantidad,
      talle,
      color,
    })
    .select()
    .single()

  if (errorVenta) {
    console.error('[api/ventas POST]', errorVenta)
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }

  await supabase
    .from('producto_talles')
    .update({ stock: variante.stock - cantidad })
    .eq('id', variante.id)

  const { data: talles } = await supabase
    .from('producto_talles')
    .select('stock')
    .eq('producto_id', producto_id)

  const nuevoStockTotal = (talles ?? []).reduce((acc, t) => acc + t.stock, 0)
  await supabase
    .from('productos')
    .update({
      stock: nuevoStockTotal,
      estado: nuevoStockTotal === 0 ? 'vendido' : producto.estado,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', producto_id)

  return NextResponse.json(venta, { status: 201 })
}
