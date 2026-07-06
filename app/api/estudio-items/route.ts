import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_SIZE_IMAGEN = 15 * 1024 * 1024 // 15MB
const TIPOS_IMAGEN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('estudio_items')
    .select('*')
    .order('orden', { ascending: true })
    .order('creado_en', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const fd = await request.formData()

  const nombre = (fd.get('nombre') as string | null)?.trim()
  if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const subtitulo = (fd.get('subtitulo') as string | null)?.trim() || null
  const descripcion = (fd.get('descripcion') as string | null)?.trim() || null
  const precio = (fd.get('precio') as string | null)?.trim() || null
  const orden = Number(fd.get('orden') ?? 0) || 0

  let imagenUrl: string | null = null
  const file = fd.get('imagen') as File | null
  if (file && file.size > 0) {
    if (!TIPOS_IMAGEN.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_IMAGEN) {
      return NextResponse.json({ error: 'La imagen no puede superar 15MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `estudio/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('Fotos')
      .upload(path, buffer, { contentType: file.type })

    if (uploadError) {
      console.error('[api/estudio-items POST] upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
    imagenUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('estudio_items')
    .insert({ nombre, subtitulo, descripcion, precio, imagen_url: imagenUrl, orden, activo: true })
    .select()
    .single()

  if (error) {
    console.error('[api/estudio-items POST] insert error:', error)
    return NextResponse.json({ error: 'Error al crear el ítem' }, { status: 500 })
  }

  revalidatePath('/tienda/personaliza')

  return NextResponse.json(data, { status: 201 })
}
