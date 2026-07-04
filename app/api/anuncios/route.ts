import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_SIZE_IMAGEN = 15 * 1024 * 1024 // 15MB
const MAX_SIZE_VIDEO = 100 * 1024 * 1024 // 100MB (video Full HD 1920x1080)
const TIPOS_IMAGEN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const TIPOS_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('anuncios')
    .select('*')
    .order('orden', { ascending: true })
    .order('creado_en', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()

  const fd = await request.formData()
  const file = fd.get('media') as File | null
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

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

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase() ?? (esVideo ? 'mp4' : 'jpg')
  const path = `anuncios/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('Fotos')
    .upload(path, buffer, { contentType: file.type })

  if (uploadError) {
    console.error('[api/anuncios POST] upload error:', uploadError)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)

  const titulo = (fd.get('titulo') as string | null)?.trim() || null
  const subtitulo = (fd.get('subtitulo') as string | null)?.trim() || null
  const link_url = (fd.get('link_url') as string | null)?.trim() || null
  const orden = Number(fd.get('orden') ?? 0) || 0

  const { data, error } = await supabase
    .from('anuncios')
    .insert({
      media_url: urlData.publicUrl,
      media_tipo: esVideo ? 'video' : 'imagen',
      titulo,
      subtitulo,
      link_url,
      orden,
      activo: true,
    })
    .select()
    .single()

  if (error) {
    console.error('[api/anuncios POST] insert error:', error)
    return NextResponse.json({ error: 'Error al crear el anuncio' }, { status: 500 })
  }

  revalidatePath('/tienda', 'layout')
  revalidatePath('/')

  return NextResponse.json(data, { status: 201 })
}
