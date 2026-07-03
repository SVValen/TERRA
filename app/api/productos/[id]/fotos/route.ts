import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const fd = await request.formData()
  const file = fd.get('foto') as File | null
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'La imagen no puede superar 10MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `productos/${Date.now()}_${id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('Fotos')
    .upload(path, buffer, { contentType: file.type })

  if (uploadError) {
    console.error('[api/fotos POST] upload error:', uploadError)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
  const url = urlData.publicUrl

  const { data: producto } = await supabase
    .from('productos')
    .select('fotos_urls, foto_url')
    .eq('id', id)
    .single()

  const fotosActuales: string[] = producto?.fotos_urls ?? []
  const nuevasFotos = [...fotosActuales, url]

  const { data: updated } = await supabase
    .from('productos')
    .update({
      fotos_urls: nuevasFotos,
      foto_url: producto?.foto_url ?? url,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select('fotos_urls, foto_url')
    .single()

  revalidatePath('/tienda', 'layout')

  return NextResponse.json({ url, fotos_urls: updated?.fotos_urls ?? nuevasFotos, foto_url: updated?.foto_url }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { url } = await request.json()

  const { data: producto } = await supabase
    .from('productos')
    .select('fotos_urls, foto_url')
    .eq('id', id)
    .single()

  if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const nuevasFotos = (producto.fotos_urls ?? []).filter((f: string) => f !== url)
  const nuevaFotoPrincipal = producto.foto_url === url ? (nuevasFotos[0] ?? null) : producto.foto_url

  await supabase
    .from('productos')
    .update({
      fotos_urls: nuevasFotos,
      foto_url: nuevaFotoPrincipal,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)

  try {
    const match = new URL(url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
    if (match) await supabase.storage.from('Fotos').remove([match[1]])
  } catch {
    // Error de storage no es crítico — la foto ya fue removida del producto
  }

  revalidatePath('/tienda', 'layout')

  return NextResponse.json({ fotos_urls: nuevasFotos, foto_url: nuevaFotoPrincipal })
}
