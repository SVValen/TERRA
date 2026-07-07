import type { CustomStudio, GuiaTallas } from './types'

export const GUIA_TALLES_DEFAULT: GuiaTallas = {
  columnas: ['Talle', 'Busto', 'Cintura', 'Cadera'],
  filas: [
    ['S', '86-90', '66-70', '90-94'],
    ['M', '91-95', '71-75', '95-99'],
    ['L', '96-100', '76-80', '100-104'],
    ['XL', '101-105', '81-85', '105-109'],
  ],
}

export const CAMBIOS_DEVOLUCIONES_DEFAULT =
  'Contás con 30 días desde la recepción de tu pedido para solicitar un cambio o devolución. ' +
  'El producto debe estar sin uso, con las etiquetas originales y en su empaque. ' +
  'Escribinos por WhatsApp para coordinar el cambio o la devolución.'

export const ENVIOS_DEFAULT =
  'Hacemos envíos a todo el país a través de correo o cadetería según la zona. ' +
  'El costo y tiempo de entrega se calculan al confirmar tu pedido por WhatsApp. ' +
  'En CABA y alrededores ofrecemos envío en el día para pedidos confirmados antes del mediodía.'

export const BANNER_ENVIOS_DEFAULT = 'Envíos a todo el país · Envío en el día en CABA'
export const BANNER_VELOCIDAD_DEFAULT = 20
export const BANNER_DIRECCION_DEFAULT = 'izquierda'

export const TEXTO_DESTACADO_DEFAULT = 'NUEVA COLECCIÓN'

export const MISION_DEFAULT =
  'Elevar el streetwear a una forma de arte estructural. Fusionamos la utilidad urbana con la ' +
  'alta costura para crear prendas que funcionen como una extensión de la identidad individual.'

export const VISION_DEFAULT =
  'Convertirnos en el epicentro de la disrupción visual. Visualizamos un mundo donde la ropa no ' +
  'sea solo cobertura, sino un sistema de expresión personal que desafíe el status quo.'

export const CUSTOM_STUDIO_DEFAULT: CustomStudio = {
  heroTitulo: 'CUSTOM STUDIO',
  heroSubtitulo: 'Architecture for the Individual',
  disenoTitulo: 'SOLO DISEÑO',
  disenoTexto:
    'Ofrecemos servicios de diseño gráfico disruptivo para marcas o proyectos personales que buscan ' +
    'romper con lo convencional. Minimalismo agresivo y estética urbana pura.',
  identidadTitulo: 'Identidad Visual',
  identidadTexto: 'Logotipos, tipografía custom y sistemas visuales para la era digital.',
  productoTitulo: 'DISEÑO + PRODUCTO',
  productoTexto: 'Prendas premium. Cortes arquitectónicos. Tu visión ejecutada en nuestros básicos.',
  prendaTitulo: 'TU PRENDA, NUESTRO DISEÑO',
  prendaTexto:
    'Traé tu prenda favorita y nosotros aplicamos el ADN de Terra. Transformamos lo ordinario en una ' +
    'pieza de colección mediante procesos de impresión y bordado premium.',
  prendaProceso: 'Proceso: Envío -> Diseño -> Ejecución',
  prendaBoton: 'Consultar proceso',
  ctaTitulo: 'LISTO PARA DISRUMPIR?',
}

export const ETIQUETA_ENVIO_GRATIS_DEFAULT = 'Envío gratis'
export const ETIQUETA_ENVIO_DIA_DEFAULT = 'Envío en el día'

export {
  SALUDO_DEFAULT as WHATSAPP_SALUDO_DEFAULT,
  MSG_PRODUCTO_INTRO_DEFAULT as WHATSAPP_MSG_PRODUCTO_INTRO_DEFAULT,
  MSG_INTERES_INTRO_DEFAULT as WHATSAPP_MSG_INTERES_INTRO_DEFAULT,
  MSG_ESTUDIO_PROCESO_DEFAULT as WHATSAPP_MSG_ESTUDIO_PROCESO_DEFAULT,
  MSG_ESTUDIO_GENERAL_DEFAULT as WHATSAPP_MSG_ESTUDIO_GENERAL_DEFAULT,
  MSG_ESTUDIO_ITEM_DEFAULT as WHATSAPP_MSG_ESTUDIO_ITEM_DEFAULT,
} from './whatsapp'
