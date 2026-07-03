import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidHexColor } from '@/lib/color'

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? { id: 1, nombre: 'Showroom SP', logo_url: null })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient()
  const formData = await request.formData()

  const updates: Record<string, string> = {
    actualizado_en: new Date().toISOString(),
  }

  const nombre = formData.get('nombre')
  if (nombre) updates.nombre = String(nombre).trim()

  const whatsapp = formData.get('whatsapp')
  if (whatsapp !== null) updates.whatsapp = String(whatsapp).trim()

  const margen = formData.get('margen_objetivo')
  if (margen !== null && margen !== '') updates.margen_objetivo = String(parseInt(String(margen), 10))

  const colorPrimario = formData.get('color_primario')
  if (colorPrimario !== null && colorPrimario !== '') {
    if (!isValidHexColor(String(colorPrimario))) {
      return NextResponse.json({ error: 'Color inválido, debe ser un hex de 6 dígitos (ej: #C9A574)' }, { status: 400 })
    }
    updates.color_primario = String(colorPrimario)
  }

  const logo = formData.get('logo') as File | null
  if (logo && logo.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }
    if (logo.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ error: 'El logo no puede superar 5MB' }, { status: 400 })
    }

    const arrayBuffer = await logo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = logo.name.split('.').pop() ?? 'jpg'
    const path = `negocio/logo.${ext}`

    await supabase.storage.from('Fotos').remove([path])

    const { error } = await supabase.storage
      .from('Fotos')
      .upload(path, buffer, { contentType: logo.type, upsert: true })

    if (error) {
      console.error('[api/negocio PATCH] storage error:', error)
      return NextResponse.json({ error: 'Error al subir el logo' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
    updates.logo_url = `${urlData.publicUrl}?t=${Date.now()}`
  }

  const { data, error } = await supabase
    .from('negocio')
    .upsert({ id: 1, ...updates })
    .select()
    .single()

  if (error) {
    console.error('[api/negocio PATCH]', error)
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
  return NextResponse.json(data)
}
