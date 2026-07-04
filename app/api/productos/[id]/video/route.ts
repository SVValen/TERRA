import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_SIZE = 100 * 1024 * 1024 // 100MB (video Full HD 1920x1080)
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const fd = await request.formData()
  const file = fd.get('video') as File | null
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido (mp4, webm o mov)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El video no puede superar 100MB' }, { status: 400 })
  }

  const { data: producto } = await supabase
    .from('productos')
    .select('video_url')
    .eq('id', id)
    .single()

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const path = `productos/videos/${Date.now()}_${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('Fotos')
    .upload(path, buffer, { contentType: file.type })

  if (uploadError) {
    console.error('[api/video POST] upload error:', uploadError)
    return NextResponse.json({ error: 'Error al subir el video' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
  const url = urlData.publicUrl

  if (producto?.video_url) {
    try {
      const match = new URL(producto.video_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
      if (match) await supabase.storage.from('Fotos').remove([match[1]])
    } catch {
      // Error de storage no es crítico — el video anterior queda huérfano en el bucket
    }
  }

  await supabase
    .from('productos')
    .update({ video_url: url, actualizado_en: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/tienda', 'layout')
  revalidatePath('/')

  return NextResponse.json({ video_url: url }, { status: 201 })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: producto } = await supabase
    .from('productos')
    .select('video_url')
    .eq('id', id)
    .single()

  if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  await supabase
    .from('productos')
    .update({ video_url: null, actualizado_en: new Date().toISOString() })
    .eq('id', id)

  if (producto.video_url) {
    try {
      const match = new URL(producto.video_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
      if (match) await supabase.storage.from('Fotos').remove([match[1]])
    } catch {
      // Error de storage no es crítico — el video ya fue removido del producto
    }
  }

  revalidatePath('/tienda', 'layout')
  revalidatePath('/')

  return NextResponse.json({ video_url: null })
}
