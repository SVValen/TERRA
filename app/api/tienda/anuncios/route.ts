import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('anuncios')
    .select('id, media_url, media_tipo, titulo, subtitulo, link_url, orden')
    .eq('activo', true)
    .order('orden', { ascending: true })
    .order('creado_en', { ascending: false })
  return NextResponse.json(data ?? [])
}
