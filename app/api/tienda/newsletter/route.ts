import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const EMAIL_RE = /^\S+@\S+\.\S+$/

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('newsletter_suscriptores')
    .insert({ email: email.trim().toLowerCase() })

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Error al suscribirte' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
