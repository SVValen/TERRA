import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitOrNull } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const limitado = await rateLimitOrNull(request, 'tienda-estudio-items', 180, 60 * 1000)
  if (limitado) return limitado

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('estudio_items')
    .select('id, nombre, subtitulo, descripcion, imagen_url, precio, orden')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .order('creado_en', { ascending: false })
  return NextResponse.json(data ?? [])
}
