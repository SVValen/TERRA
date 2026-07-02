import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('metricas_tienda')
    .select('clicks_wa')
    .eq('fecha', today)
    .single()

  if (data) {
    await supabase.from('metricas_tienda').update({ clicks_wa: data.clicks_wa + 1 }).eq('fecha', today)
  } else {
    await supabase.from('metricas_tienda').insert({ fecha: today, visitas: 0, clicks_wa: 1 })
  }

  return new NextResponse(null, { status: 204 })
}
