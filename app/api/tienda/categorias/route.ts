import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('categorias')
    .select('id, nombre, subcategorias')
    .order('nombre')
  return NextResponse.json(data ?? [])
}
