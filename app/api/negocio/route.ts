import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

  const logo = formData.get('logo') as File | null
  if (logo && logo.size > 0) {
    const arrayBuffer = await logo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = logo.name.split('.').pop() ?? 'jpg'
    const path = `negocio/logo.${ext}`

    // Eliminar logo anterior si existe
    await supabase.storage.from('Fotos').remove([path])

    const { error } = await supabase.storage
      .from('Fotos')
      .upload(path, buffer, { contentType: logo.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(path)
    // Cache-bust para que el browser no use la imagen anterior
    updates.logo_url = `${urlData.publicUrl}?t=${Date.now()}`
  }

  const { data, error } = await supabase
    .from('negocio')
    .upsert({ id: 1, ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
