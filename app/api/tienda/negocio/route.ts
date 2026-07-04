import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimitOrNull } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const limitado = await rateLimitOrNull(request, 'tienda-negocio', 180, 60 * 1000)
  if (limitado) return limitado

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('negocio')
    .select('nombre, logo_url, whatsapp')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? { nombre: '', logo_url: null, whatsapp: null })
}
