import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import TiendaShell from './TiendaShell'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase
    .from('negocio')
    .select('nombre, logo_url')
    .eq('id', 1)
    .single()
  return {
    title: negocio?.nombre ?? 'Tienda',
    icons: negocio?.logo_url ? { icon: negocio.logo_url, apple: negocio.logo_url } : undefined,
  }
}

export default async function TiendaLayout({ children }: { children: ReactNode }) {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase
    .from('negocio')
    .select('nombre, logo_url, whatsapp, color_fondo, color_texto, instagram')
    .eq('id', 1)
    .single()

  return (
    <TiendaShell
      nombre={negocio?.nombre ?? ''}
      logoUrl={negocio?.logo_url ?? null}
      whatsapp={negocio?.whatsapp ?? null}
      colorFondo={negocio?.color_fondo ?? null}
      colorTexto={negocio?.color_texto ?? null}
      instagram={negocio?.instagram ?? null}
    >
      {children}
    </TiendaShell>
  )
}
