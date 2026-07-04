import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_SIZE_IMAGEN = 15 * 1024 * 1024 // 15MB
const MAX_SIZE_VIDEO = 100 * 1024 * 1024 // 100MB (video Full HD 1920x1080)
const TIPOS_IMAGEN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const TIPOS_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const esMultipart = request.headers.get('content-type')?.includes('multipart/form-data')

  const updates: Record<string, unknown> = {}

  if (esMultipart) {
    const fd = await request.formData()
    if (fd.has('titulo')) updates.titulo = (fd.get('titulo') as string).trim() || null
    if (fd.has('subtitulo')) updates.subtitulo = (fd.get('subtitulo') as string).trim() || null
    if (fd.has('link_url')) updates.link_url = (fd.get('link_url') as string).trim() || null
    if (fd.has('orden')) updates.orden = Number(fd.get('orden')) || 0
    if (fd.has('activo')) updates.activo = fd.get('activo') === 'true'

    const file = fd.get('media') as File | null
    if (file) {
      const esImagen = TIPOS_IMAGEN.includes(file.type)
      const esVideo = TIPOS_VIDEO.includes(file.type)
      if (!esImagen && !esVideo) {
        return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
      }
      if (esImagen && file.size > MAX_SIZE_IMAGEN) {
        return NextResponse.json({ error: 'La imagen no puede superar 15MB' }, { status: 400 })
      }
      if (esVideo && file.size > MAX_SIZE_VIDEO) {
        return NextResponse.json({ error: 'El video no puede superar 100MB' }, { status: 400 })
      }

      const { data: anuncioActual } = await supabase.from('anuncios').select('media_url').eq('id', id).single()

      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop()?.toLowerCase() ?? (esVideo ? 'mp4' : 'jpg')
      const path = `anuncios/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('Fotos')
        .upload(path, buffer, { contentType: file.type })

      if (uploadError) {
        console.error('[api/anuncios/[id] PATCH] upload error:', uploadError)
        return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
      updates.media_url = urlData.publicUrl
      updates.media_tipo = esVideo ? 'video' : 'imagen'

      if (anuncioActual?.media_url) {
        try {
          const match = new URL(anuncioActual.media_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
          if (match) await supabase.storage.from('Fotos').remove([match[1]])
        } catch {
          // Error de storage no es crítico — el archivo anterior queda huérfano en el bucket
        }
      }
    }
  } else {
    const body = await request.json()
    if ('titulo' in body) updates.titulo = body.titulo?.trim() || null
    if ('subtitulo' in body) updates.subtitulo = body.subtitulo?.trim() || null
    if ('link_url' in body) updates.link_url = body.link_url?.trim() || null
    if ('orden' in body) updates.orden = Number(body.orden) || 0
    if ('activo' in body) updates.activo = !!body.activo
  }

  const { data, error } = await supabase
    .from('anuncios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar el anuncio' }, { status: 500 })

  revalidatePath('/tienda', 'layout')
  revalidatePath('/')

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
  revalidatePath('/')

  return NextResponse.json({ ok: true })
}
