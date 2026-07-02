import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase.from('negocio').select('nombre, logo_url').eq('id', 1).single()
  return {
    title: negocio?.nombre ? `${negocio.nombre} · Admin` : 'Panel de gestión',
    icons: negocio?.logo_url ? { icon: negocio.logo_url, apple: negocio.logo_url } : undefined,
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase.from('negocio').select('nombre, logo_url').eq('id', 1).single()

  return (
    <Sidebar nombre={negocio?.nombre ?? ''} logoUrl={negocio?.logo_url ?? null}>
      {children}
    </Sidebar>
  )
}
