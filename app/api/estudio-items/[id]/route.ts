import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { personalizaHabilitado } from '@/lib/features'

const MAX_SIZE_IMAGEN = 15 * 1024 * 1024 // 15MB
const TIPOS_IMAGEN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!personalizaHabilitado()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const { id } = await params
  const supabase = createServiceClient()
  const esMultipart = request.headers.get('content-type')?.includes('multipart/form-data')

  const updates: Record<string, unknown> = {}

  if (esMultipart) {
    const fd = await request.formData()
    if (fd.has('nombre')) updates.nombre = (fd.get('nombre') as string).trim()
    if (fd.has('subtitulo')) updates.subtitulo = (fd.get('subtitulo') as string).trim() || null
    if (fd.has('descripcion')) updates.descripcion = (fd.get('descripcion') as string).trim() || null
    if (fd.has('precio')) updates.precio = (fd.get('precio') as string).trim() || null
    if (fd.has('orden')) updates.orden = Number(fd.get('orden')) || 0
    if (fd.has('activo')) updates.activo = fd.get('activo') === 'true'

    const file = fd.get('imagen') as File | null
    if (file && file.size > 0) {
      if (!TIPOS_IMAGEN.includes(file.type)) {
        return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
      }
      if (file.size > MAX_SIZE_IMAGEN) {
        return NextResponse.json({ error: 'La imagen no puede superar 15MB' }, { status: 400 })
      }

      const { data: itemActual } = await supabase.from('estudio_items').select('imagen_url').eq('id', id).single()

      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `estudio/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('Fotos')
        .upload(path, buffer, { contentType: file.type })

      if (uploadError) {
        console.error('[api/estudio-items/[id] PATCH] upload error:', uploadError)
        return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
      updates.imagen_url = urlData.publicUrl

      if (itemActual?.imagen_url) {
        try {
          const match = new URL(itemActual.imagen_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
          if (match) await supabase.storage.from('Fotos').remove([match[1]])
        } catch {
          // Error de storage no es crítico — el archivo anterior queda huérfano en el bucket
        }
      }
    }
  } else {
    const body = await request.json()
    if ('nombre' in body) updates.nombre = body.nombre?.trim()
    if ('subtitulo' in body) updates.subtitulo = body.subtitulo?.trim() || null
    if ('descripcion' in body) updates.descripcion = body.descripcion?.trim() || null
    if ('precio' in body) updates.precio = body.precio?.trim() || null
    if ('orden' in body) updates.orden = Number(body.orden) || 0
    if ('activo' in body) updates.activo = !!body.activo
  }

  const { data, error } = await supabase
    .from('estudio_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar el ítem' }, { status: 500 })

  revalidatePath('/tienda/personaliza')

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!personalizaHabilitado()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const { id } = await params
  const supabase = createServiceClient()

  const { data: item } = await supabase.from('estudio_items').select('imagen_url').eq('id', id).single()
  if (!item) return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })

  await supabase.from('estudio_items').delete().eq('id', id)

  if (item.imagen_url) {
    try {
      const match = new URL(item.imagen_url).pathname.match(/\/object\/public\/Fotos\/(.+)/)
      if (match) await supabase.storage.from('Fotos').remove([match[1]])
    } catch {
      // Error de storage no es crítico — el ítem ya fue borrado de la base
    }
  }

  revalidatePath('/tienda/personaliza')

  return NextResponse.json({ ok: true })
}
