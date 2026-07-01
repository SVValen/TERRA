import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)

  let query = supabase.from('productos').select('*').order('creado_en', { ascending: false })

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
  const body = await request.json()

  const { data, error } = await supabase
    .from('productos')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
