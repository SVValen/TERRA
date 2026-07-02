import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPassword, createSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
      { status: 429 }
    )
  }

  const { telegram_id, password } = await request.json()

  if (!telegram_id || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, telegram_id, nombre, password_hash')
    .eq('telegram_id', String(telegram_id).trim())
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const ok = await verifyPassword(password, usuario.password_hash)
  if (!ok) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  await createSession({ userId: usuario.id, telegramId: usuario.telegram_id, nombre: usuario.nombre })
  return NextResponse.json({ ok: true })
}
