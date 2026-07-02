import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('productos')
    .select('id, nombre, foto_url, fotos_urls, talle, precio_venta, categoria, subcategoria, stock, creado_en')
    .eq('estado', 'disponible')
    .gt('stock', 0)
    .order('creado_en', { ascending: false })

  const q = searchParams.get('q')
  if (q) query = query.ilike('nombre', `%${q}%`)

  const categoria = searchParams.get('categoria')
  if (categoria) query = query.eq('categoria', categoria)

  const subcategoria = searchParams.get('subcategoria')
  if (subcategoria) query = query.eq('subcategoria', subcategoria)

  const talle = searchParams.get('talle')
  if (talle) query = query.eq('talle', talle)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
