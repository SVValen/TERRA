import type { Metadata } from 'next'
import { getNegocioTienda } from '@/lib/negocioTienda'
import TiendaShell from './tienda/TiendaShell'
import TiendaHome from './tienda/page'

export async function generateMetadata(): Promise<Metadata> {
  const negocio = await getNegocioTienda()
  return {
    title: negocio.nombre || 'Tienda',
    icons: negocio.logoUrl ? { icon: negocio.logoUrl, apple: negocio.logoUrl } : undefined,
  }
}

export default async function RootPage() {
  const negocio = await getNegocioTienda()
  return (
    <TiendaShell {...negocio}>
      <TiendaHome />
    </TiendaShell>
  )
}
