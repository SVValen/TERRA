import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase.from('productos').select('*, producto_talles(*)').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { talles, ...body } = await request.json()

  if (Array.isArray(talles)) {
    const { data: actuales } = await supabase.from('producto_talles').select('id').eq('producto_id', id)
    const idsActuales = new Set((actuales ?? []).map(t => t.id))
    const idsEntrantes = new Set(talles.filter(t => t.id).map(t => t.id))

    const aEliminar = [...idsActuales].filter(tid => !idsEntrantes.has(tid))
    if (aEliminar.length > 0) {
      await supabase.from('producto_talles').delete().in('id', aEliminar)
    }

    const aActualizar = talles.filter((t: { id?: string; talle: string; color?: string; stock: number }) => t.id)
    for (const t of aActualizar) {
      await supabase.from('producto_talles').update({ talle: t.talle, color: t.color || '', stock: t.stock }).eq('id', t.id)
    }

    const aInsertar = talles
      .filter((t: { id?: string; talle: string; color?: string; stock: number }) => !t.id)
      .map((t: { talle: string; color?: string; stock: number }) => ({ producto_id: id, talle: t.talle, color: t.color || '', stock: t.stock }))
    if (aInsertar.length > 0) {
      await supabase.from('producto_talles').insert(aInsertar)
    }

    body.stock = talles.reduce((acc: number, t: { stock: number }) => acc + t.stock, 0)
  }

  const { data, error } = await supabase
    .from('productos')
    .update({ ...body, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select('*, producto_talles(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/tienda', 'layout')

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  // Eliminar ventas asociadas primero (FK constraint)
  await supabase.from('ventas').delete().eq('producto_id', id)

  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/tienda', 'layout')

  return new NextResponse(null, { status: 204 })
}
