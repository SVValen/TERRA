import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /column/i.test(error?.message ?? '')
}

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const { nombre } = await request.json()

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const payload = { nombre: nombre.trim(), subcategorias: [], activa: true }

  const { data, error } = await supabase
    .from('categorias')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (isMissingColumnError(error)) {
      const fallback = await supabase
        .from('categorias')
        .insert({ nombre: nombre.trim(), subcategorias: [] })
        .select()
        .single()

      if (fallback.error) {
        if (fallback.error.code === '23505') {
          return NextResponse.json({ error: 'Ya existe esa categoría' }, { status: 409 })
        }
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }

      return NextResponse.json(fallback.data, { status: 201 })
    }

    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe esa categoría' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
