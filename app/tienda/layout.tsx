import type { ReactNode } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import TiendaShell from './TiendaShell'

export default async function TiendaLayout({ children }: { children: ReactNode }) {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase
    .from('negocio')
    .select('nombre, logo_url, whatsapp')
    .eq('id', 1)
    .single()

  return (
    <TiendaShell
      nombre={negocio?.nombre ?? ''}
      logoUrl={negocio?.logo_url ?? null}
      whatsapp={negocio?.whatsapp ?? null}
    >
      {children}
    </TiendaShell>
  )
}
