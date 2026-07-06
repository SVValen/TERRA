import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitOrNull } from '@/lib/ratelimit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limitado = await rateLimitOrNull(request, 'tienda-estudio-items-id', 180, 60 * 1000)
  if (limitado) return limitado

  const { id } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('estudio_items')
    .select('id, nombre, subtitulo, descripcion, imagen_url, precio, orden')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(data)
}
