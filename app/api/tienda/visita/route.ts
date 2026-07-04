import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitOrNull } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const limitado = await rateLimitOrNull(request, 'visita', 30, 60 * 1000)
  if (limitado) return limitado

  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('metricas_tienda')
    .select('visitas')
    .eq('fecha', today)
    .single()

  if (data) {
    await supabase.from('metricas_tienda').update({ visitas: data.visitas + 1 }).eq('fecha', today)
  } else {
    await supabase.from('metricas_tienda').insert({ fecha: today, visitas: 1, clicks_wa: 0 })
  }

  return new NextResponse(null, { status: 204 })
}
