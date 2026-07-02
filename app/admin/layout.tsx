import type { ReactNode } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase.from('negocio').select('nombre, logo_url').eq('id', 1).single()

  return (
    <Sidebar nombre={negocio?.nombre ?? ''} logoUrl={negocio?.logo_url ?? null}>
      {children}
    </Sidebar>
  )
}
