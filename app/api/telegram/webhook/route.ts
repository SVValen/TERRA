import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitOrNull } from '@/lib/ratelimit'
import { sendMessage, answerCallbackQuery, getFile } from '@/lib/telegram/bot'
import { parseNumero } from '@/lib/telegram/parser'
import {
  buildKeyboardCategorias,
  buildKeyboardSubcategorias,
  buildKeyboardTalles,
  buildKeyboardColores,
  KB_LISTO_FOTOS,
  KB_CONFIRMAR,
} from '@/lib/telegram/categorias'
import type { BotPaso, DatosParciales, Categoria } from '@/lib/types'

type Supabase = ReturnType<typeof createServiceClient>

const SESION_MAX_AGE_MS = 24 * 60 * 60 * 1000

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /column/i.test(error?.message ?? '')
}

async function getCategorias(supabase: Supabase): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activa', true)
    .order('nombre')

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase.from('categorias').select('*').order('nombre')
    return fallback.data ?? []
  }

  return (data ?? []).filter((item: Categoria) => item.activa !== false)
}

async function getTalles(supabase: Supabase): Promise<string[]> {
  const { data } = await supabase.from('talles').select('nombre').order('nombre')
  return (data ?? []).map(t => t.nombre)
}

async function getColores(supabase: Supabase): Promise<string[]> {
  const { data } = await supabase.from('colores').select('nombre').order('nombre')
  return (data ?? []).map(c => c.nombre)
}

async function iniciarColoresParaTalle(
  chatId: string,
  datos: Partial<DatosParciales>,
  idx: number,
  supabase: Supabase
) {
  const talles = datos.talles_seleccionados ?? []
  const talleActual = talles[idx]
  const colores = await getColores(supabase)

  if (colores.length === 0) {
    const nuevosDatos = { ...datos, talle_actual_idx: idx, colores_pendientes: [''], colores_pendientes_idx: 0 }
    await actualizarSesion(supabase, chatId, 'esperando_cantidad_combinacion', nuevosDatos)
    await sendMessage(chatId, `📦 ¿Cuántas unidades hay del talle <b>${esc(talleActual)}</b>?`)
    return
  }

  const nuevosDatos = { ...datos, talle_actual_idx: idx, colores_seleccionados: [] }
  await actualizarSesion(supabase, chatId, 'esperando_colores', nuevosDatos)
  await sendMessage(
    chatId,
    `🎨 ¿De qué colores tiene el talle <b>${esc(talleActual)}</b>? Tocá los que correspondan y confirmá.`,
    buildKeyboardColores([], colores)
  )
}

async function avanzarAColoresPendientes(
  chatId: string,
  datos: Partial<DatosParciales>,
  colores: string[],
  supabase: Supabase
) {
  const talles = datos.talles_seleccionados ?? []
  const talleActual = talles[datos.talle_actual_idx ?? 0]
  const nuevosDatos = { ...datos, colores_pendientes: colores, colores_pendientes_idx: 0 }
  await actualizarSesion(supabase, chatId, 'esperando_cantidad_combinacion', nuevosDatos)
  const colorActual = colores[0]
  const pregunta = colorActual
    ? `📦 ¿Cuántas unidades hay del talle <b>${esc(talleActual)}</b> en color <b>${esc(colorActual)}</b>?`
    : `📦 ¿Cuántas unidades hay del talle <b>${esc(talleActual)}</b>?`
  await sendMessage(chatId, pregunta)
}

function secretValido(recibido: string | null): boolean {
  const esperado = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''
  const bufRecibido = Buffer.from(recibido ?? '')
  const bufEsperado = Buffer.from(esperado)
  if (bufRecibido.length !== bufEsperado.length) return false
  return timingSafeEqual(bufRecibido, bufEsperado)
}

export async function POST(request: NextRequest) {
  const limitado = await rateLimitOrNull(request, 'telegram-webhook', 60, 60 * 1000)
  if (limitado) return limitado

  if (!secretValido(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const update = await request.json()
  const supabase = createServiceClient()

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, supabase)
    return NextResponse.json({ ok: true })
  }

  const message = update.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = String(message.chat.id)
  const texto = message.text?.trim() ?? ''
  const foto = message.photo

  if (texto === '/id') {
    await sendMessage(chatId, `Tu ID de Telegram es: <code>${chatId}</code>\n\nCompartilo con el administrador para que te dé acceso.`)
    return NextResponse.json({ ok: true })
  }

  const { data: usuarioAutorizado } = await supabase
    .from('usuarios')
    .select('id')
    .eq('telegram_id', chatId)
    .single()

  if (!usuarioAutorizado) {
    await sendMessage(chatId, '⛔ No tenés acceso a este bot.\n\nUsá /id para obtener tu ID y pedile acceso al administrador.')
    return NextResponse.json({ ok: true })
  }

  // Leer sesión y verificar expiración
  const { data: sesionRaw } = await supabase
    .from('bot_sesiones')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  let sesion = sesionRaw
  if (sesion && Date.now() - new Date(sesion.actualizado_en).getTime() > SESION_MAX_AGE_MS) {
    await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
    sesion = null
  }

  if (texto === '/cancelar') {
    await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
    await sendMessage(chatId, 'Cancelado. Usá /cargar para agregar un producto o /ayuda para ver opciones.')
    return NextResponse.json({ ok: true })
  }

  if (texto === '/ayuda' || texto === '/start') {
    await sendMessage(chatId, MENSAJE_AYUDA)
    return NextResponse.json({ ok: true })
  }

  if (texto.startsWith('/eliminar')) {
    const termino = texto.replace('/eliminar', '').trim()
    if (!termino) {
      await sendMessage(chatId, '¿Qué producto querés eliminar?\nUsá: /eliminar <nombre>\n\nEj: /eliminar campera azul')
      return NextResponse.json({ ok: true })
    }
    const { data: encontrados } = await supabase
      .from('productos')
      .select('id, nombre, estado, precio_venta')
      .ilike('nombre', `%${termino}%`)
      .limit(5)

    if (!encontrados?.length) {
      await sendMessage(chatId, `No encontré productos con "${esc(termino)}".`)
      return NextResponse.json({ ok: true })
    }

    const keyboard = {
      inline_keyboard: encontrados.map(p => ([{
        text: `🗑 ${p.nombre} · $${p.precio_venta.toLocaleString('es-AR')} · ${p.estado}`,
        callback_data: `eliminar:${p.id}`,
      }])),
    }
    await sendMessage(chatId, `Encontré ${encontrados.length} resultado(s). ¿Cuál querés eliminar?`, keyboard)
    return NextResponse.json({ ok: true })
  }

  if (texto === '/cargar') {
    if (sesion) {
      await sendMessage(chatId, 'Ya tenés una carga en curso. Usá /cancelar para empezar de nuevo.')
      return NextResponse.json({ ok: true })
    }
    await supabase.from('bot_sesiones').upsert({
      chat_id: chatId,
      paso: 'esperando_nombre' as BotPaso,
      datos_parciales: {},
      actualizado_en: new Date().toISOString(),
    })
    await sendMessage(chatId, '📝 <b>Nuevo producto</b>\n\n¿Cuál es el nombre del producto?')
    return NextResponse.json({ ok: true })
  }

  if (sesion) {
    await manejarPaso(chatId, sesion.paso as BotPaso, sesion.datos_parciales as Partial<DatosParciales>, texto, foto, supabase)
    return NextResponse.json({ ok: true })
  }

  if (texto) {
    const lower = texto.toLowerCase()
    const esConsulta = ['stock', 'precio', 'estado', 'hay', 'tenés', 'tenes'].some(p => lower.includes(p))
    if (esConsulta) {
      await manejarConsulta(chatId, texto, supabase)
    } else {
      await sendMessage(chatId, '📦 Usá /cargar para agregar un producto o /ayuda para más opciones.')
    }
  }

  return NextResponse.json({ ok: true })
}

async function handleCallbackQuery(
  cq: { id: string; message: { chat: { id: number } }; data: string },
  supabase: Supabase
) {
  const chatId = String(cq.message.chat.id)
  const data = cq.data

  await answerCallbackQuery(cq.id)

  const { data: sesionRaw } = await supabase
    .from('bot_sesiones')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  let sesion = sesionRaw
  if (sesion && Date.now() - new Date(sesion.actualizado_en).getTime() > SESION_MAX_AGE_MS) {
    await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
    sesion = null
  }

  if (!sesion && !data.startsWith('eliminar:') && !data.startsWith('confirmar_eliminar:') && data !== 'cancelar_eliminar') {
    await sendMessage(chatId, 'La sesión expiró. Usá /cargar para empezar de nuevo.')
    return
  }

  const paso = sesion?.paso as BotPaso
  const datos = sesion?.datos_parciales as Partial<DatosParciales>

  if (data.startsWith('eliminar:')) {
    const productoId = data.replace('eliminar:', '')
    const { data: prod } = await supabase.from('productos').select('nombre').eq('id', productoId).single()
    if (!prod) {
      await sendMessage(chatId, 'No encontré ese producto. Puede que ya haya sido eliminado.')
      return
    }
    const kb = {
      inline_keyboard: [[
        { text: '✅ Sí, eliminar', callback_data: `confirmar_eliminar:${productoId}` },
        { text: '❌ Cancelar',     callback_data: 'cancelar_eliminar' },
      ]],
    }
    await sendMessage(chatId, `¿Seguro que querés eliminar <b>${esc(prod.nombre)}</b>? Esta acción no se puede deshacer.`, kb)
    return
  }

  if (data.startsWith('confirmar_eliminar:')) {
    const productoId = data.replace('confirmar_eliminar:', '')
    const { data: prod } = await supabase.from('productos').select('nombre').eq('id', productoId).single()
    const { error } = await supabase.from('productos').delete().eq('id', productoId)
    if (error) {
      await sendMessage(chatId, '❌ Error al eliminar. Intentá de nuevo.')
      return
    }
    await sendMessage(chatId, `✅ <b>${esc(prod?.nombre ?? 'Producto')}</b> eliminado del stock.`)
    return
  }

  if (data === 'cancelar_eliminar') {
    await sendMessage(chatId, 'Cancelado.')
    return
  }

  if (data.startsWith('toggle_talle:') && paso === 'esperando_talles') {
    const talle = data.replace('toggle_talle:', '')
    const actuales = datos.talles_seleccionados ?? []
    const seleccionados = actuales.includes(talle)
      ? actuales.filter(t => t !== talle)
      : [...actuales, talle]
    await actualizarSesion(supabase, chatId, 'esperando_talles', { ...datos, talles_seleccionados: seleccionados })
    const disponibles = await getTalles(supabase)
    await sendMessage(chatId, '📏 ¿Qué talles tiene? Tocá los que correspondan y confirmá.', buildKeyboardTalles(seleccionados, disponibles))
    return
  }

  if (data === 'talles:skip' && paso === 'esperando_talles') {
    const nuevosDatos = { ...datos, talles_seleccionados: ['Único'], combinaciones: [] }
    await iniciarColoresParaTalle(chatId, nuevosDatos, 0, supabase)
    return
  }

  if (data === 'talles:confirmar' && paso === 'esperando_talles') {
    const seleccionados = datos.talles_seleccionados ?? []
    if (seleccionados.length === 0) {
      const disponibles = await getTalles(supabase)
      await sendMessage(chatId, 'Tocá al menos un talle antes de confirmar.', buildKeyboardTalles([], disponibles))
      return
    }
    const nuevosDatos = { ...datos, combinaciones: [] }
    await iniciarColoresParaTalle(chatId, nuevosDatos, 0, supabase)
    return
  }

  if (data.startsWith('toggle_color:') && paso === 'esperando_colores') {
    const color = data.replace('toggle_color:', '')
    const actuales = datos.colores_seleccionados ?? []
    const seleccionados = actuales.includes(color)
      ? actuales.filter(c => c !== color)
      : [...actuales, color]
    await actualizarSesion(supabase, chatId, 'esperando_colores', { ...datos, colores_seleccionados: seleccionados })
    const disponibles = await getColores(supabase)
    const talleActual = (datos.talles_seleccionados ?? [])[datos.talle_actual_idx ?? 0]
    await sendMessage(
      chatId,
      `🎨 ¿De qué colores tiene el talle <b>${esc(talleActual)}</b>? Tocá los que correspondan y confirmá.`,
      buildKeyboardColores(seleccionados, disponibles)
    )
    return
  }

  if (data === 'colores:skip' && paso === 'esperando_colores') {
    await avanzarAColoresPendientes(chatId, datos, [''], supabase)
    return
  }

  if (data === 'colores:confirmar' && paso === 'esperando_colores') {
    const seleccionados = datos.colores_seleccionados ?? []
    if (seleccionados.length === 0) {
      const disponibles = await getColores(supabase)
      const talleActual = (datos.talles_seleccionados ?? [])[datos.talle_actual_idx ?? 0]
      await sendMessage(
        chatId,
        `Tocá al menos un color antes de confirmar, o usá "Omitir (sin color)" para el talle <b>${esc(talleActual)}</b>.`,
        buildKeyboardColores([], disponibles)
      )
      return
    }
    await avanzarAColoresPendientes(chatId, datos, seleccionados, supabase)
    return
  }

  if (data.startsWith('cat:') && paso === 'esperando_categoria') {
    const categoria = data.replace('cat:', '')
    if (categoria === 'skip') {
      await actualizarSesion(supabase, chatId, 'esperando_costo', { ...datos, categoria: '' })
      await sendMessage(chatId, '💰 ¿Cuál es el precio de costo? (ej: 8000)')
      return
    }
    await actualizarSesion(supabase, chatId, 'esperando_subcategoria', { ...datos, categoria })
    const cats = await getCategorias(supabase)
    const catData = cats.find(c => c.nombre === categoria)
    const subs = catData?.subcategorias ?? []
    const kbSub = subs.length > 0
      ? buildKeyboardSubcategorias(subs)
      : { inline_keyboard: [[{ text: 'Omitir subcategoría', callback_data: 'subcat:skip' }]] }
    await sendMessage(chatId, `Categoría: <b>${esc(categoria)}</b>\n\n¿Subcategoría?`, kbSub)
    return
  }

  if (data.startsWith('subcat:') && paso === 'esperando_subcategoria') {
    const raw = data.replace('subcat:', '')
    const subcategoria = raw === 'skip' ? '' : raw
    const nuevosDatos = { ...datos, subcategoria }
    await actualizarSesion(supabase, chatId, 'esperando_costo', nuevosDatos)
    await sendMessage(chatId, `${subcategoria ? `Subcategoría: <b>${esc(subcategoria)}</b>\n\n` : ''}💰 ¿Cuál es el precio de costo? (ej: 8000)`)
    return
  }

  if (data === 'fotos:listo' && paso === 'esperando_fotos') {
    await actualizarSesion(supabase, chatId, 'esperando_confirmacion', datos)
    await sendMessage(chatId, resumenProducto(datos), KB_CONFIRMAR)
    return
  }

  if (data.startsWith('action:') && paso === 'esperando_confirmacion') {
    if (data === 'action:confirmar') {
      const fotosUrls: string[] = datos.fotos_urls ?? []
      const combinaciones = datos.combinaciones ?? []
      const stockTotal = combinaciones.reduce((a, c) => a + c.stock, 0)
      const { data: producto, error } = await supabase.from('productos').insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion?.trim() || null,
        categoria: datos.categoria || null,
        subcategoria: datos.subcategoria || null,
        talle: null,
        costo: datos.costo,
        precio_venta: datos.precio_venta,
        foto_url: fotosUrls[0] ?? null,
        fotos_urls: fotosUrls,
        origen: 'bot',
        stock: stockTotal,
        estado: 'disponible',
        activo: true,
      }).select('id').single()
      if (error || !producto) {
        console.error('[confirmar] insert error:', error)
        await sendMessage(chatId, '❌ Error al guardar. Intentá de nuevo con /cargar.')
        return
      }
      const filasTalles = combinaciones.map(c => ({
        producto_id: producto.id,
        talle: c.talle,
        color: c.color,
        stock: c.stock,
      }))
      const { error: errorTalles } = await supabase.from('producto_talles').insert(filasTalles)
      if (errorTalles) {
        console.error('[confirmar] producto_talles insert error:', errorTalles)
        await sendMessage(chatId, '⚠️ El producto se guardó pero hubo un error con los talles. Revisalo desde el panel.')
      }
      await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
      await sendMessage(chatId, `✅ <b>${esc(datos.nombre ?? '')}</b> cargado al stock.\n\nUsá /cargar para agregar otro producto.`)
    } else {
      await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
      await sendMessage(chatId, 'Cancelado. Usá /cargar cuando quieras.')
    }
    return
  }
}

async function manejarPaso(
  chatId: string,
  paso: BotPaso,
  datos: Partial<DatosParciales>,
  texto: string,
  foto: Array<{ file_id: string }> | undefined,
  supabase: Supabase
) {
  switch (paso) {
    case 'esperando_nombre': {
      if (!texto) { await sendMessage(chatId, 'Escribí el nombre del producto.'); return }
      await actualizarSesion(supabase, chatId, 'esperando_descripcion', { ...datos, nombre: texto })
      await sendMessage(chatId, `Nombre: <b>${esc(texto)}</b>\n\n📝 ¿Querés agregar una descripción? (o mandá "-" para omitir)`)
      break
    }

    case 'esperando_descripcion': {
      const descripcion = texto.trim() === '-' ? '' : texto.trim()
      await actualizarSesion(supabase, chatId, 'esperando_categoria', { ...datos, descripcion })
      const cats = await getCategorias(supabase)
      const kbCats = cats.length > 0
        ? buildKeyboardCategorias(cats)
        : { inline_keyboard: [[{ text: 'Sin categorías — cargá desde el panel', callback_data: 'cat:skip' }]] }
      await sendMessage(chatId, '¿Cuál es la categoría?', kbCats)
      break
    }

    case 'esperando_costo': {
      const costo = parseNumero(texto)
      if (!costo || costo <= 0) { await sendMessage(chatId, 'Ingresá un número válido. Ej: 8000'); return }
      await actualizarSesion(supabase, chatId, 'esperando_venta', { ...datos, costo })
      await sendMessage(chatId, `Costo: <b>$${costo.toLocaleString('es-AR')}</b>\n\n💵 ¿Cuál es el precio de venta?`)
      break
    }

    case 'esperando_venta': {
      const precio_venta = parseNumero(texto)
      if (!precio_venta || precio_venta <= 0) { await sendMessage(chatId, 'Ingresá un número válido. Ej: 15000'); return }
      await actualizarSesion(supabase, chatId, 'esperando_talles', { ...datos, precio_venta, talles_seleccionados: [] })
      const disponibles = await getTalles(supabase)
      await sendMessage(
        chatId,
        `Venta: <b>$${precio_venta.toLocaleString('es-AR')}</b>\n\n📏 ¿Qué talles tiene? Tocá los que correspondan y confirmá.`,
        buildKeyboardTalles([], disponibles)
      )
      break
    }

    case 'esperando_cantidad_combinacion': {
      const cantidad = parseInt(texto)
      if (isNaN(cantidad) || cantidad < 0) { await sendMessage(chatId, 'Ingresá un número entero. Ej: 1'); return }

      const talles = datos.talles_seleccionados ?? []
      const talleIdx = datos.talle_actual_idx ?? 0
      const talleActual = talles[talleIdx]
      const coloresPendientes = datos.colores_pendientes ?? ['']
      const colorIdx = datos.colores_pendientes_idx ?? 0
      const colorActual = coloresPendientes[colorIdx]

      const combinaciones = [...(datos.combinaciones ?? []), { talle: talleActual, color: colorActual, stock: cantidad }]

      const siguienteColorIdx = colorIdx + 1
      if (siguienteColorIdx < coloresPendientes.length) {
        await actualizarSesion(supabase, chatId, 'esperando_cantidad_combinacion', {
          ...datos,
          combinaciones,
          colores_pendientes_idx: siguienteColorIdx,
        })
        const siguienteColor = coloresPendientes[siguienteColorIdx]
        const pregunta = siguienteColor
          ? `📦 ¿Cuántas unidades hay del talle <b>${esc(talleActual)}</b> en color <b>${esc(siguienteColor)}</b>?`
          : `📦 ¿Cuántas unidades hay del talle <b>${esc(talleActual)}</b>?`
        await sendMessage(chatId, pregunta)
        return
      }

      const siguienteTalleIdx = talleIdx + 1
      if (siguienteTalleIdx < talles.length) {
        await iniciarColoresParaTalle(chatId, { ...datos, combinaciones }, siguienteTalleIdx, supabase)
        return
      }

      await actualizarSesion(supabase, chatId, 'esperando_fotos', {
        ...datos,
        combinaciones,
        fotos_urls: [],
      })
      await sendMessage(
        chatId,
        `📷 Ahora mandá las fotos del producto (una o varias). Cuando termines, tocá el botón.`,
        KB_LISTO_FOTOS
      )
      break
    }

    case 'esperando_fotos': {
      if (!foto) {
        await sendMessage(chatId, 'Mandá una foto o tocá "Listo" para continuar.', KB_LISTO_FOTOS)
        return
      }
      const mejorFoto = foto[foto.length - 1]
      const fileUrl = await getFile(mejorFoto.file_id)
      if (!fileUrl) { await sendMessage(chatId, 'No pude obtener la foto. Intentá de nuevo.', KB_LISTO_FOTOS); return }

      const response = await fetch(fileUrl)
      if (!response.ok) { await sendMessage(chatId, 'Error al descargar la foto.', KB_LISTO_FOTOS); return }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const nombreArchivo = `productos/${Date.now()}_${chatId}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('Fotos')
        .upload(nombreArchivo, buffer, { contentType: 'image/jpeg' })

      if (uploadError) {
        console.error('[foto] upload error:', JSON.stringify(uploadError))
        await sendMessage(chatId, 'Error al guardar la foto. Intentá de nuevo.', KB_LISTO_FOTOS)
        return
      }

      const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(nombreArchivo)
      const fotosUrls = [...(datos.fotos_urls ?? []), urlData.publicUrl]
      await actualizarSesion(supabase, chatId, 'esperando_fotos', { ...datos, fotos_urls: fotosUrls })
      await sendMessage(
        chatId,
        `📷 Foto ${fotosUrls.length} recibida. Mandá más o tocá "Listo".`,
        KB_LISTO_FOTOS
      )
      break
    }

    default: {
      await sendMessage(chatId, 'Usá los botones para continuar, o /cancelar para empezar de nuevo.')
      break
    }
  }
}

async function manejarConsulta(chatId: string, texto: string, supabase: Supabase) {
  const palabras = ['stock', 'precio', 'estado', 'hay', 'tenés', 'tenes', 'de', 'del', 'la', 'el']
  let termino = texto.toLowerCase()
  for (const p of palabras) termino = termino.replace(new RegExp(`\\b${p}\\b`, 'g'), '').trim()

  if (!termino) { await sendMessage(chatId, '¿Qué producto querés consultar? Ej: "stock campera jean"'); return }

  const { data } = await supabase
    .from('productos')
    .select('nombre, estado, stock, precio_venta, categoria, subcategoria')
    .ilike('nombre', `%${termino}%`)
    .limit(5)

  if (!data?.length) { await sendMessage(chatId, `No encontré productos con "${esc(termino)}".`); return }

  const lineas = data.map((p) => {
    const cat = [p.categoria, p.subcategoria].filter(Boolean).join(' › ')
    return `• <b>${esc(p.nombre)}</b>${cat ? ` <i>(${esc(cat)})</i>` : ''}\n  ${p.estado} · Stock: ${p.stock} · $${p.precio_venta.toLocaleString('es-AR')}`
  })
  await sendMessage(chatId, `Encontré ${data.length} resultado(s):\n\n${lineas.join('\n\n')}`)
}

async function actualizarSesion(
  supabase: Supabase,
  chatId: string,
  paso: BotPaso,
  datos: Partial<DatosParciales>
) {
  await supabase.from('bot_sesiones').update({
    paso,
    datos_parciales: datos,
    actualizado_en: new Date().toISOString(),
  }).eq('chat_id', chatId)
}

function resumenProducto(datos: Partial<DatosParciales>): string {
  const cat = [datos.categoria, datos.subcategoria].filter(Boolean).join(' › ')
  const fotos = datos.fotos_urls?.length ?? 0
  const combinaciones = datos.combinaciones ?? []
  const stockTotal = combinaciones.reduce((a, c) => a + c.stock, 0)
  const lineasTalles = combinaciones
    .map(c => `   ‣ ${esc(c.talle)}${c.color ? ` - ${esc(c.color)}` : ''}: ${c.stock} unidad${c.stock !== 1 ? 'es' : ''}`)
    .join('\n')
  return (
    `📦 <b>Resumen del producto</b>\n\n` +
    `• Nombre: <b>${esc(datos.nombre ?? '')}</b>\n` +
    (datos.descripcion ? `• Descripción: <b>${esc(datos.descripcion)}</b>\n` : '') +
    `• Categoría: <b>${esc(cat || 'Sin categoría')}</b>\n` +
    `• Talles:\n${lineasTalles || '   ‣ Sin talles'}\n` +
    `• Costo: <b>$${datos.costo?.toLocaleString('es-AR')}</b>\n` +
    `• Precio de venta: <b>$${datos.precio_venta?.toLocaleString('es-AR')}</b>\n` +
    `• Stock total: <b>${stockTotal} unidad${stockTotal !== 1 ? 'es' : ''}</b>\n` +
    `• Fotos: <b>${fotos}</b>\n\n` +
    `¿Confirmás?`
  )
}

const MENSAJE_AYUDA = `<b>Comandos disponibles:</b>

/cargar — Agregar un producto nuevo al stock
/eliminar &lt;nombre&gt; — Eliminar un producto del stock
/cancelar — Cancelar la carga actual
/ayuda — Mostrar este mensaje

<b>Consultar stock:</b>
Escribí algo como:
  • "stock campera jean"
  • "precio sweater"
  • "estado bolso"`
