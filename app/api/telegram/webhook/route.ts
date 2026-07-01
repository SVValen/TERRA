import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMessage, answerCallbackQuery, getFile } from '@/lib/telegram/bot'
import { parseNumero } from '@/lib/telegram/parser'
import {
  buildKeyboardCategorias,
  buildKeyboardSubcategorias,
  KB_LISTO_FOTOS,
  KB_CONFIRMAR,
} from '@/lib/telegram/categorias'
import type { BotPaso, DatosParciales, Categoria } from '@/lib/types'

type Supabase = ReturnType<typeof createServiceClient>

async function getCategorias(supabase: Supabase): Promise<Categoria[]> {
  const { data } = await supabase.from('categorias').select('*').order('nombre')
  return data ?? []
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
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

  // Comando público: devuelve el chat_id sin verificar acceso
  if (texto === '/id') {
    await sendMessage(chatId, `Tu ID de Telegram es: <code>${chatId}</code>\n\nCompartilo con el administrador para que te dé acceso.`)
    return NextResponse.json({ ok: true })
  }

  // Verificar que el chat_id esté autorizado
  const { data: usuarioAutorizado } = await supabase
    .from('usuarios')
    .select('id')
    .eq('telegram_id', chatId)
    .single()

  if (!usuarioAutorizado) {
    await sendMessage(chatId, '⛔ No tenés acceso a este bot.\n\nUsá /id para obtener tu ID y pedile acceso al administrador.')
    return NextResponse.json({ ok: true })
  }

  const texto = message.text?.trim() ?? ''
  const foto = message.photo

  const { data: sesion } = await supabase
    .from('bot_sesiones')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  // Comandos globales
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
      await sendMessage(chatId, `No encontré productos con "${termino}".`)
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

  // Si hay sesión activa → continuar el flujo
  if (sesion) {
    await manejarPaso(chatId, sesion.paso as BotPaso, sesion.datos_parciales as Partial<DatosParciales>, texto, foto, supabase)
    return NextResponse.json({ ok: true })
  }

  // Sin sesión: consulta de stock
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

  const { data: sesion } = await supabase
    .from('bot_sesiones')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  if (!sesion) {
    await sendMessage(chatId, 'La sesión expiró. Usá /cargar para empezar de nuevo.')
    return
  }

  const paso = sesion.paso as BotPaso
  const datos = sesion.datos_parciales as Partial<DatosParciales>

  // Eliminar producto
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
    await sendMessage(chatId, `¿Seguro que querés eliminar <b>${prod.nombre}</b>? Esta acción no se puede deshacer.`, kb)
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
    await sendMessage(chatId, `✅ <b>${prod?.nombre ?? 'Producto'}</b> eliminado del stock.`)
    return
  }

  if (data === 'cancelar_eliminar') {
    await sendMessage(chatId, 'Cancelado.')
    return
  }

  // Selección de categoría
  if (data.startsWith('cat:') && paso === 'esperando_categoria') {
    const categoria = data.replace('cat:', '')
    if (categoria === 'skip') {
      // Sin categorías cargadas, saltear directo a costo
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
    await sendMessage(chatId, `Categoría: <b>${categoria}</b>\n\n¿Subcategoría?`, kbSub)
    return
  }

  // Selección de subcategoría
  if (data.startsWith('subcat:') && paso === 'esperando_subcategoria') {
    const raw = data.replace('subcat:', '')
    const subcategoria = raw === 'skip' ? '' : raw
    const nuevosDatos = { ...datos, subcategoria }
    await actualizarSesion(supabase, chatId, 'esperando_costo', nuevosDatos)
    await sendMessage(chatId, `${subcategoria ? `Subcategoría: <b>${subcategoria}</b>\n\n` : ''}💰 ¿Cuál es el precio de costo? (ej: 8000)`)
    return
  }

  // Fin de fotos
  if (data === 'fotos:listo' && paso === 'esperando_fotos') {
    await actualizarSesion(supabase, chatId, 'esperando_confirmacion', datos)
    await sendMessage(chatId, resumenProducto(datos), KB_CONFIRMAR)
    return
  }

  // Confirmar o cancelar
  if (data.startsWith('action:') && paso === 'esperando_confirmacion') {
    if (data === 'action:confirmar') {
      const fotosUrls: string[] = datos.fotos_urls ?? []
      const { error } = await supabase.from('productos').insert({
        nombre: datos.nombre,
        categoria: datos.categoria || null,
        subcategoria: datos.subcategoria || null,
        costo: datos.costo,
        precio_venta: datos.precio_venta,
        foto_url: fotosUrls[0] ?? null,
        fotos_urls: fotosUrls,
        origen: 'bot',
        stock: datos.stock ?? 1,
        estado: 'disponible',
      })
      if (error) {
        console.error('[confirmar] insert error:', error)
        await sendMessage(chatId, '❌ Error al guardar. Intentá de nuevo con /cargar.')
        return
      }
      await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
      await sendMessage(chatId, `✅ <b>${datos.nombre}</b> cargado al stock.\n\nUsá /cargar para agregar otro producto.`)
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
      await actualizarSesion(supabase, chatId, 'esperando_categoria', { ...datos, nombre: texto })
      const cats = await getCategorias(supabase)
      const kbCats = cats.length > 0
        ? buildKeyboardCategorias(cats)
        : { inline_keyboard: [[{ text: 'Sin categorías — cargá desde el panel', callback_data: 'cat:skip' }]] }
      await sendMessage(chatId, `Nombre: <b>${texto}</b>\n\n¿Cuál es la categoría?`, kbCats)
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
      await actualizarSesion(supabase, chatId, 'esperando_stock', { ...datos, precio_venta })
      await sendMessage(chatId, `Venta: <b>$${precio_venta.toLocaleString('es-AR')}</b>\n\n📦 ¿Cuántas unidades hay en stock?`)
      break
    }

    case 'esperando_stock': {
      const stock = parseInt(texto)
      if (isNaN(stock) || stock < 0) { await sendMessage(chatId, 'Ingresá un número entero. Ej: 1'); return }
      await actualizarSesion(supabase, chatId, 'esperando_fotos', { ...datos, stock, fotos_urls: [] })
      await sendMessage(
        chatId,
        `Stock: <b>${stock} unidad${stock !== 1 ? 'es' : ''}</b>\n\n📷 Ahora mandá las fotos del producto (una o varias). Cuando termines, tocá el botón.`,
        KB_LISTO_FOTOS
      )
      break
    }

    case 'esperando_fotos': {
      if (!foto) {
        // Texto recibido en paso de fotos — ignorar y recordar
        await sendMessage(chatId, 'Mandá una foto o tocá "Listo" para continuar.', KB_LISTO_FOTOS)
        return
      }
      // Subir foto
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

    // Los pasos esperando_categoria, esperando_subcategoria y esperando_confirmacion
    // se manejan por callback_query, no por texto
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

  if (!data?.length) { await sendMessage(chatId, `No encontré productos con "${termino}".`); return }

  const lineas = data.map((p) => {
    const cat = [p.categoria, p.subcategoria].filter(Boolean).join(' › ')
    return `• <b>${p.nombre}</b>${cat ? ` <i>(${cat})</i>` : ''}\n  ${p.estado} · Stock: ${p.stock} · $${p.precio_venta.toLocaleString('es-AR')}`
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
  return (
    `📦 <b>Resumen del producto</b>\n\n` +
    `• Nombre: <b>${datos.nombre}</b>\n` +
    `• Categoría: <b>${cat || 'Sin categoría'}</b>\n` +
    `• Costo: <b>$${datos.costo?.toLocaleString('es-AR')}</b>\n` +
    `• Precio de venta: <b>$${datos.precio_venta?.toLocaleString('es-AR')}</b>\n` +
    `• Stock: <b>${datos.stock ?? 1} unidad${(datos.stock ?? 1) !== 1 ? 'es' : ''}</b>\n` +
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
