import { createServiceClient } from './supabase/server'
import {
  GUIA_TALLES_DEFAULT,
  CAMBIOS_DEVOLUCIONES_DEFAULT,
  ENVIOS_DEFAULT,
  ETIQUETA_ENVIO_GRATIS_DEFAULT,
  ETIQUETA_ENVIO_DIA_DEFAULT,
} from './contenido'

const CAMPOS_NEGOCIO_TIENDA = `
  nombre, logo_url, whatsapp, color_fondo, color_texto, instagram,
  color_header_fondo, color_header_texto, color_banner_fondo, color_banner_texto,
  color_boton_fondo, color_boton_texto,
  razon_social, cuit, direccion, dias_nuevo,
  guia_talles, cambios_devoluciones, envios, banner_envios,
  etiqueta_envio_gratis, etiqueta_envio_dia
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
    etiquetaEnvioGratis: negocio?.etiqueta_envio_gratis ?? ETIQUETA_ENVIO_GRATIS_DEFAULT,
    etiquetaEnvioDia: negocio?.etiqueta_envio_dia ?? ETIQUETA_ENVIO_DIA_DEFAULT,
  }
}
