import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMessage, getFile } from '@/lib/telegram/bot'
import { detectIntent, extraerTerminoBusqueda, parseNumero } from '@/lib/telegram/parser'
import type { BotPaso, DatosParciales } from '@/lib/types'

export async function POST(request: NextRequest) {
  // Validar webhook secret opcional
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const update = await request.json()
  const message = update.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = String(message.chat.id)
  const texto = message.text?.trim() ?? ''
  const foto = message.photo

  const supabase = createServiceClient()

  // Obtener sesión activa
  const { data: sesion } = await supabase
    .from('bot_sesiones')
    .select('*')
    .eq('chat_id', chatId)
    .single()

  // --- Comando /cancelar ---
  if (texto === '/cancelar') {
    await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
    await sendMessage(chatId, 'Cancelado. ¿En qué más te puedo ayudar?')
    return NextResponse.json({ ok: true })
  }

  // --- Comando /ayuda ---
  if (texto === '/ayuda' || texto === '/start') {
    await sendMessage(
      chatId,
      '<b>Cómo usar el bot:</b>\n\n' +
        '📷 <b>Cargar producto:</b> mandame una foto y te guío paso a paso.\n\n' +
        '🔍 <b>Consultar stock:</b> escribí algo como:\n' +
        '  • "stock campera jean"\n' +
        '  • "precio sweater"\n' +
        '  • "estado campera"\n\n' +
        '/cancelar — cancela lo que estés cargando\n' +
        '/ayuda — muestra este mensaje'
    )
    return NextResponse.json({ ok: true })
  }

  // --- Flujo de carga: hay sesión activa ---
  if (sesion) {
    await manejarPaso(chatId, sesion.paso as BotPaso, sesion.datos_parciales as Partial<DatosParciales>, texto, foto, supabase)
    return NextResponse.json({ ok: true })
  }

  // --- Sin sesión: foto nueva inicia carga ---
  if (foto) {
    await iniciarCargaConFoto(chatId, foto, supabase)
    return NextResponse.json({ ok: true })
  }

  // --- Sin sesión: texto → consulta o ayuda ---
  const intent = detectIntent(texto)
  if (intent === 'consulta') {
    await manejarConsulta(chatId, texto, supabase)
  } else {
    await sendMessage(
      chatId,
      'Mandame una foto para cargar un producto, o escribí "stock [nombre]" para consultar.\n\n/ayuda para más info.'
    )
  }

  return NextResponse.json({ ok: true })
}

async function iniciarCargaConFoto(
  chatId: string,
  foto: Array<{ file_id: string; file_size: number }>,
  supabase: ReturnType<typeof createServiceClient>
) {
  // Tomar la foto de mayor resolución
  const mejorFoto = foto[foto.length - 1]
  const fileUrl = await getFile(mejorFoto.file_id)

  if (!fileUrl) {
    await sendMessage(chatId, 'No pude obtener la foto. Intentá de nuevo.')
    return
  }

  // Descargar y subir a Supabase Storage
  const response = await fetch(fileUrl)
  if (!response.ok) {
    console.error('[foto] fetch falló:', response.status, fileUrl)
    await sendMessage(chatId, 'No pude descargar la foto. Intentá de nuevo.')
    return
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const nombreArchivo = `productos/${Date.now()}_${chatId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('Fotos')
    .upload(nombreArchivo, buffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    console.error('[foto] upload error:', JSON.stringify(uploadError))
    await sendMessage(chatId, 'Error al guardar la foto. Intentá de nuevo.')
    return
  }

  const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(nombreArchivo)

  // Crear sesión
  await supabase.from('bot_sesiones').upsert({
    chat_id: chatId,
    paso: 'esperando_nombre' as BotPaso,
    datos_parciales: { foto_url: urlData.publicUrl },
    actualizado_en: new Date().toISOString(),
  })

  await sendMessage(chatId, '📷 Recibí la foto. ¿Cuál es el nombre del producto?')
}

async function manejarPaso(
  chatId: string,
  paso: BotPaso,
  datos: Partial<DatosParciales>,
  texto: string,
  foto: unknown,
  supabase: ReturnType<typeof createServiceClient>
) {
  const actualizarSesion = async (nuevoPaso: BotPaso, nuevosDatos: Partial<DatosParciales>) => {
    await supabase.from('bot_sesiones').update({
      paso: nuevoPaso,
      datos_parciales: nuevosDatos,
      actualizado_en: new Date().toISOString(),
    }).eq('chat_id', chatId)
  }

  switch (paso) {
    case 'esperando_nombre': {
      if (!texto) { await sendMessage(chatId, 'Escribí el nombre del producto.'); return }
      await actualizarSesion('esperando_costo', { ...datos, nombre: texto })
      await sendMessage(chatId, `Nombre: <b>${texto}</b>\n\n¿Cuál es el precio de costo?`)
      break
    }

    case 'esperando_costo': {
      const costo = parseNumero(texto)
      if (!costo || costo <= 0) { await sendMessage(chatId, 'Mandame un número válido para el costo. Ej: 8000'); return }
      await actualizarSesion('esperando_venta', { ...datos, costo })
      await sendMessage(chatId, `Costo: <b>$${costo.toLocaleString('es-AR')}</b>\n\n¿Cuál es el precio de venta?`)
      break
    }

    case 'esperando_venta': {
      const precio_venta = parseNumero(texto)
      if (!precio_venta || precio_venta <= 0) { await sendMessage(chatId, 'Mandame un número válido para el precio de venta. Ej: 15000'); return }
      await actualizarSesion('esperando_categoria', { ...datos, precio_venta })
      await sendMessage(chatId, `Precio de venta: <b>$${precio_venta.toLocaleString('es-AR')}</b>\n\n¿Categoría? (o mandá "skip" para omitir)`)
      break
    }

    case 'esperando_categoria': {
      const categoria = texto.toLowerCase() === 'skip' ? undefined : texto
      const nuevosDatos = { ...datos, ...(categoria ? { categoria } : {}) }
      await actualizarSesion('esperando_confirmacion', nuevosDatos)

      const resumen =
        `📦 <b>Resumen del producto:</b>\n\n` +
        `• Nombre: <b>${nuevosDatos.nombre}</b>\n` +
        `• Costo: <b>$${nuevosDatos.costo?.toLocaleString('es-AR')}</b>\n` +
        `• Venta: <b>$${nuevosDatos.precio_venta?.toLocaleString('es-AR')}</b>\n` +
        `• Categoría: <b>${nuevosDatos.categoria ?? 'Sin categoría'}</b>\n\n` +
        `¿Confirmás? (sí / no)`

      await sendMessage(chatId, resumen)
      break
    }

    case 'esperando_confirmacion': {
      const respuesta = texto.toLowerCase()
      if (['si', 'sí', 's', 'ok', 'dale', 'yes'].includes(respuesta)) {
        const { error } = await supabase.from('productos').insert({
          nombre: datos.nombre,
          categoria: datos.categoria ?? null,
          costo: datos.costo,
          precio_venta: datos.precio_venta,
          foto_url: datos.foto_url,
          origen: 'bot',
          stock: 1,
          estado: 'disponible',
        })

        if (error) {
          await sendMessage(chatId, 'Hubo un error al guardar. Intentá de nuevo.')
          return
        }

        await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
        await sendMessage(chatId, '✅ ¡Listo, lo cargué! El producto ya está en el stock.')
      } else if (['no', 'n', 'nope'].includes(respuesta)) {
        await supabase.from('bot_sesiones').delete().eq('chat_id', chatId)
        await sendMessage(chatId, 'Cancelado. Mandame la foto de nuevo cuando quieras cargarlo.')
      } else {
        await sendMessage(chatId, 'Respondé "sí" para confirmar o "no" para cancelar.')
      }
      break
    }
  }
}

async function manejarConsulta(
  chatId: string,
  texto: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const termino = extraerTerminoBusqueda(texto)
  if (!termino) {
    await sendMessage(chatId, '¿Qué producto querés consultar? Ej: "stock campera jean"')
    return
  }

  const { data, error } = await supabase
    .from('productos')
    .select('nombre, estado, stock, precio_venta, costo, categoria')
    .ilike('nombre', `%${termino}%`)
    .limit(5)

  if (error || !data?.length) {
    await sendMessage(chatId, `No encontré productos con "${termino}".`)
    return
  }

  const lineas = data.map((p) =>
    `• <b>${p.nombre}</b> — ${p.estado} — Stock: ${p.stock} — Venta: $${p.precio_venta.toLocaleString('es-AR')}`
  )

  await sendMessage(chatId, `Encontré ${data.length} resultado(s):\n\n${lineas.join('\n')}`)
}
