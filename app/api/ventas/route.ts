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
  const { producto_id, precio_vendido, cantidad = 1 } = await request.json()

  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('costo, stock, estado')
    .eq('id', producto_id)
    .single()

  if (errorProducto || !producto) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  if (cantidad > producto.stock) {
    return NextResponse.json({ error: 'Stock insuficiente' }, { status: 422 })
  }

  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert({
      producto_id,
      precio_vendido,
      costo_al_momento: producto.costo,
      cantidad,
    })
    .select()
    .single()

  if (errorVenta) {
    console.error('[api/ventas POST]', errorVenta)
    return NextResponse.json({ error: 'Error al registrar la venta' }, { status: 500 })
  }

  const nuevoStock = producto.stock - cantidad
  await supabase
    .from('productos')
    .update({
      stock: nuevoStock,
      estado: nuevoStock === 0 ? 'vendido' : producto.estado,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', producto_id)

  return NextResponse.json(venta, { status: 201 })
}
