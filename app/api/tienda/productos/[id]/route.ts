import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PRODUCTO_TIENDA_FIELDS } from '@/lib/tienda'
import { rateLimitOrNull } from '@/lib/ratelimit'

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /column/i.test(error?.message ?? '')
}

async function getCategoriasVisibles(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase
    .from('categorias')
    .select('nombre')
    .eq('activa', true)

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase.from('categorias').select('nombre')
    return (fallback.data ?? []).map((item: { nombre: string }) => item.nombre)
  }

  return (data ?? []).map((item: { nombre: string }) => item.nombre)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limitado = await rateLimitOrNull(request, 'tienda-producto', 180, 60 * 1000)
  if (limitado) return limitado

  const { id } = await params
  const supabase = createServiceClient()
  const categoriasVisibles = await getCategoriasVisibles(supabase)

  if (categoriasVisibles.length === 0) {
    return NextResponse.json({ error: 'No hay categorías disponibles' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('productos')
    .select(`${PRODUCTO_TIENDA_FIELDS}, producto_talles(talle, color, stock)`)
    .eq('id', id)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .in('categoria', categoriasVisibles)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
