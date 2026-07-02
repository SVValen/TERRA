import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, foto_url, fotos_urls, precio_venta, categoria, subcategoria, stock, creado_en, producto_talles(talle, stock)')
    .eq('id', id)
    .eq('estado', 'disponible')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
