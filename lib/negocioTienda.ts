import { createServiceClient } from './supabase/server'
import {
  GUIA_TALLES_DEFAULT,
  CAMBIOS_DEVOLUCIONES_DEFAULT,
  ENVIOS_DEFAULT,
  ETIQUETA_ENVIO_GRATIS_DEFAULT,
  ETIQUETA_ENVIO_DIA_DEFAULT,
  TEXTO_DESTACADO_DEFAULT,
  BANNER_VELOCIDAD_DEFAULT,
  BANNER_DIRECCION_DEFAULT,
  MISION_DEFAULT,
  VISION_DEFAULT,
  CUSTOM_STUDIO_DEFAULT,
  WHATSAPP_SALUDO_DEFAULT,
  WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
  WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
  WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
} from './contenido'

const CAMPOS_NEGOCIO_TIENDA = `
  nombre, logo_url, whatsapp, color_fondo, color_texto, instagram,
  color_header_fondo, color_header_texto, color_banner_fondo, color_banner_texto,
  color_boton_fondo, color_boton_texto,
  razon_social, cuit, direccion, dias_nuevo,
  guia_talles, cambios_devoluciones, envios, banner_envios,
  banner_envios_velocidad, banner_envios_direccion,
  banner_destacado_velocidad, banner_destacado_direccion,
  etiqueta_envio_gratis, etiqueta_envio_dia, texto_destacado,
  mision_vision_habilitado, mision_texto, mision_imagen_url, vision_texto, vision_imagen_url,
  personaliza_habilitado, custom_studio, custom_diseno_imagen_url,
  whatsapp_saludo, whatsapp_msg_producto_intro, whatsapp_msg_interes_intro,
  whatsapp_msg_estudio_proceso, whatsapp_msg_estudio_general, whatsapp_msg_estudio_item
`

export async function getNegocioTienda() {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase
    .from('negocio')
    .select(CAMPOS_NEGOCIO_TIENDA)
    .eq('id', 1)
    .single()

  return {
    nombre: negocio?.nombre ?? '',
    logoUrl: negocio?.logo_url ?? null,
    whatsapp: negocio?.whatsapp ?? null,
    colorFondo: negocio?.color_fondo || '#131313',
    colorTexto: negocio?.color_texto || '#e2e2e2',
    colorHeaderFondo: negocio?.color_header_fondo || '#131313',
    colorHeaderTexto: negocio?.color_header_texto || '#e2e2e2',
    colorBannerFondo: negocio?.color_banner_fondo || '#e2e2e2',
    colorBannerTexto: negocio?.color_banner_texto || '#131313',
    colorBotonFondo: negocio?.color_boton_fondo || '#e2e2e2',
    colorBotonTexto: negocio?.color_boton_texto || '#131313',
    instagram: negocio?.instagram ?? null,
    razonSocial: negocio?.razon_social ?? null,
    cuit: negocio?.cuit ?? null,
    direccion: negocio?.direccion ?? null,
    diasNuevo: negocio?.dias_nuevo ?? 14,
    guiaTallas: negocio?.guia_talles ?? GUIA_TALLES_DEFAULT,
    cambiosDevoluciones: negocio?.cambios_devoluciones ?? CAMBIOS_DEVOLUCIONES_DEFAULT,
    envios: negocio?.envios ?? ENVIOS_DEFAULT,
    bannerEnvios: negocio?.banner_envios ?? null,
    bannerEnviosVelocidad: negocio?.banner_envios_velocidad ?? BANNER_VELOCIDAD_DEFAULT,
    bannerEnviosDireccion: negocio?.banner_envios_direccion ?? BANNER_DIRECCION_DEFAULT,
    etiquetaEnvioGratis: negocio?.etiqueta_envio_gratis ?? ETIQUETA_ENVIO_GRATIS_DEFAULT,
    etiquetaEnvioDia: negocio?.etiqueta_envio_dia ?? ETIQUETA_ENVIO_DIA_DEFAULT,
    textoDestacado: negocio?.texto_destacado ?? TEXTO_DESTACADO_DEFAULT,
    bannerDestacadoVelocidad: negocio?.banner_destacado_velocidad ?? BANNER_VELOCIDAD_DEFAULT,
    bannerDestacadoDireccion: negocio?.banner_destacado_direccion ?? BANNER_DIRECCION_DEFAULT,
    misionVisionHabilitado: negocio?.mision_vision_habilitado ?? true,
    misionTexto: negocio?.mision_texto ?? MISION_DEFAULT,
    misionImagenUrl: negocio?.mision_imagen_url ?? null,
    visionTexto: negocio?.vision_texto ?? VISION_DEFAULT,
    visionImagenUrl: negocio?.vision_imagen_url ?? null,
    personalizaHabilitado: negocio?.personaliza_habilitado ?? true,
    customStudio: negocio?.custom_studio ?? CUSTOM_STUDIO_DEFAULT,
    customDisenoImagenUrl: negocio?.custom_diseno_imagen_url ?? null,
    whatsappSaludo: negocio?.whatsapp_saludo ?? WHATSAPP_SALUDO_DEFAULT,
    whatsappMsgProductoIntro: negocio?.whatsapp_msg_producto_intro ?? WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
    whatsappMsgInteresIntro: negocio?.whatsapp_msg_interes_intro ?? WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
    whatsappMsgEstudioProceso: negocio?.whatsapp_msg_estudio_proceso ?? WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
    whatsappMsgEstudioGeneral: negocio?.whatsapp_msg_estudio_general ?? WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
    whatsappMsgEstudioItem: negocio?.whatsapp_msg_estudio_item ?? WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
  }
}
