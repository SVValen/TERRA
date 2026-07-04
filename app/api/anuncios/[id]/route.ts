import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if ('titulo' in body) updates.titulo = body.titulo?.trim() || null
  if ('subtitulo' in body) updates.subtitulo = body.subtitulo?.trim() || null
  if ('link_url' in body) updates.link_url = body.link_url?.trim() || null
  if ('orden' in body) updates.orden = Number(body.orden) || 0
  if ('activo' in body) updates.activo = !!body.activo

  const { data, error } = await supabase
    .from('anuncios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar el anuncio' }, { status: 500 })

  revalidatePath('/tienda', 'layout')

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: anuncio } = await supabase.from('anuncios').select('media_url').eq('id', id).single()
  if (!anuncio) return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 })

  await supabase.from('anuncios').delete().eq('id', id)

  try {
    const match = new URL(anuncio.media_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
    if (match) await supabase.storage.from('Fotos').remove([match[1]])
  } catch {
    // Error de storage no es crítico — el anuncio ya fue borrado de la base
  }

  revalidatePath('/tienda', 'layout')

  return NextResponse.json({ ok: true })
}
