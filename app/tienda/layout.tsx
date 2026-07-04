import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getNegocioTienda } from '@/lib/negocioTienda'
import TiendaShell from './TiendaShell'

export async function generateMetadata(): Promise<Metadata> {
  const negocio = await getNegocioTienda()
  return {
    title: negocio.nombre || 'Tienda',
    icons: negocio.logoUrl ? { icon: negocio.logoUrl, apple: negocio.logoUrl } : undefined,
  }
}

export default async function TiendaLayout({ children }: { children: ReactNode }) {
  const negocio = await getNegocioTienda()
  return <TiendaShell {...negocio}>{children}</TiendaShell>
}
