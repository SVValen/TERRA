import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidHexColor } from '@/lib/color'

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const CAMPOS_COLOR = [
  'color_primario', 'color_fondo', 'color_texto',
  'color_header_fondo', 'color_header_texto',
  'color_banner_fondo', 'color_banner_texto',
  'color_boton_fondo', 'color_boton_texto',
]

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('*').eq('id', 1).single()
  return NextResponse.json(data ?? { id: 1, nombre: 'Showroom SP', logo_url: null })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient()
  const formData = await request.formData()

  const updates: Record<string, unknown> = {
    actualizado_en: new Date().toISOString(),
  }

  const nombre = formData.get('nombre')
  if (nombre) updates.nombre = String(nombre).trim()

  const whatsapp = formData.get('whatsapp')
  if (whatsapp !== null) updates.whatsapp = String(whatsapp).trim()

  const margen = formData.get('margen_objetivo')
  if (margen !== null && margen !== '') updates.margen_objetivo = String(parseInt(String(margen), 10))

  const diasNuevo = formData.get('dias_nuevo')
  if (diasNuevo !== null && diasNuevo !== '') updates.dias_nuevo = String(parseInt(String(diasNuevo), 10))

  for (const campo of CAMPOS_COLOR) {
    const valor = formData.get(campo)
    if (valor === null || valor === '') continue
    if (!isValidHexColor(String(valor))) {
      return NextResponse.json({ error: `Color inválido en "${campo}", debe ser un hex de 6 dígitos (ej: #C9A574)` }, { status: 400 })
    }
    updates[campo] = String(valor)
  }

  const instagram = formData.get('instagram')
  if (instagram !== null) updates.instagram = String(instagram).trim().replace(/^@/, '')

  const razonSocial = formData.get('razon_social')
  if (razonSocial !== null) updates.razon_social = String(razonSocial).trim()

  const cuit = formData.get('cuit')
  if (cuit !== null) updates.cuit = String(cuit).trim()

  const direccion = formData.get('direccion')
  if (direccion !== null) updates.direccion = String(direccion).trim()

  const cambiosDevoluciones = formData.get('cambios_devoluciones')
  if (cambiosDevoluciones !== null) updates.cambios_devoluciones = String(cambiosDevoluciones).trim()

  const envios = formData.get('envios')
  if (envios !== null) updates.envios = String(envios).trim()

  const bannerEnvios = formData.get('banner_envios')
  if (bannerEnvios !== null) updates.banner_envios = String(bannerEnvios).trim()

  const etiquetaEnvioGratis = formData.get('etiqueta_envio_gratis')
  if (etiquetaEnvioGratis !== null) updates.etiqueta_envio_gratis = String(etiquetaEnvioGratis).trim()

  const etiquetaEnvioDia = formData.get('etiqueta_envio_dia')
  if (etiquetaEnvioDia !== null) updates.etiqueta_envio_dia = String(etiquetaEnvioDia).trim()

  const guiaTallas = formData.get('guia_talles')
  if (guiaTallas !== null && guiaTallas !== '') {
    try {
      updates.guia_talles = JSON.parse(String(guiaTallas))
    } catch {
      return NextResponse.json({ error: 'Guía de talles inválida' }, { status: 400 })
    }
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

  revalidatePath('/tienda', 'layout')
  revalidatePath('/admin', 'layout')

  return NextResponse.json(data)
}
