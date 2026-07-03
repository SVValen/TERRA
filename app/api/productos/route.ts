import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  let query = supabase.from('productos').select('*, producto_talles(*)').order('creado_en', { ascending: false })

  const estado = searchParams.get('estado')
  if (estado) query = query.eq('estado', estado)

  const categoria = searchParams.get('categoria')
  if (categoria) query = query.eq('categoria', categoria)

  const subcategoria = searchParams.get('subcategoria')
  if (subcategoria) query = query.eq('subcategoria', subcategoria)

  const busqueda = searchParams.get('q')
  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const { talles, nombre, descripcion, categoria, subcategoria, costo, precio_venta } = await request.json()

  const tallesValidos = (Array.isArray(talles) ? talles : []).filter(
    (t: { talle: string; color?: string; stock: number }) => t.talle?.trim()
  )
  const stockTotal = tallesValidos.reduce((acc: number, t: { stock: number }) => acc + (t.stock || 0), 0)

  const { data: producto, error } = await supabase
    .from('productos')
    .insert({
      nombre,
      descripcion: descripcion?.trim() || null,
      categoria: categoria || null,
      subcategoria: subcategoria || null,
      talle: null,
      costo,
      precio_venta,
      foto_url: null,
      fotos_urls: [],
      origen: 'web',
      estado: 'disponible',
      activo: true,
      stock: stockTotal,
    })
    .select('id')
    .single()

  if (error || !producto) return NextResponse.json({ error: error?.message ?? 'Error al crear el producto' }, { status: 500 })

  if (tallesValidos.length > 0) {
    const { error: errorTalles } = await supabase.from('producto_talles').insert(
      tallesValidos.map((t: { talle: string; color?: string; stock: number }) => ({
        producto_id: producto.id,
        talle: t.talle,
        color: t.color || '',
        stock: t.stock || 0,
      }))
    )
    if (errorTalles) {
      return NextResponse.json({ id: producto.id, tallesError: errorTalles.message }, { status: 201 })
    }
  }

  return NextResponse.json({ id: producto.id }, { status: 201 })
}
