import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('negocio')
    .select('nombre, logo_url, whatsapp')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? { nombre: '', logo_url: null, whatsapp: null })
}
