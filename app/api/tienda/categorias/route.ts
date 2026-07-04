import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /column/i.test(error?.message ?? '')
}

export async function GET() {
  const supabase = createServiceClient()

  const { data: categoriasData, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nombre, subcategorias, activa')
    .eq('activa', true)
    .order('nombre')

  if (categoriasError && isMissingColumnError(categoriasError)) {
    const fallback = await supabase
      .from('categorias')
      .select('id, nombre, subcategorias')
      .order('nombre')
    return NextResponse.json(fallback.data ?? [])
  }

  const categorias = (categoriasData ?? []).filter((item: { activa?: boolean }) => item.activa !== false)
  const nombres = categorias.map((item: { nombre: string }) => item.nombre).filter(Boolean)

  if (nombres.length === 0) {
    return NextResponse.json([])
  }

  const { data: productosData } = await supabase
    .from('productos')
    .select('categoria')
    .eq('estado', 'disponible')
    .eq('activo', true)
    .not('categoria', 'is', null)

  const categoriasConProducto = new Set((productosData ?? []).map((item: { categoria: string | null }) => item.categoria).filter(Boolean))
  const visibles = categorias.filter((item: { nombre: string }) => categoriasConProducto.has(item.nombre))

  return NextResponse.json(visibles)
}
