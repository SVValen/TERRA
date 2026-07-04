import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  return error?.code === '42703' || /column/i.test(error?.message ?? '')
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('categorias')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error && body?.activa !== undefined && isMissingColumnError(error)) {
    const { activa, ...rest } = body
    const fallback = await supabase
      .from('categorias')
      .update(rest)
      .eq('id', id)
      .select()
      .single()

    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    return NextResponse.json(fallback.data)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
