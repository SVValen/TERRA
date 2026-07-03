import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

async function getNegocio() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('nombre, logo_url').eq('id', 1).single()
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const negocio = await getNegocio()
  return {
    title: negocio?.nombre ? `Ingresar · ${negocio.nombre}` : 'Ingresar',
    icons: negocio?.logo_url ? { icon: negocio.logo_url, apple: negocio.logo_url } : undefined,
  }
}

export default async function LoginPage() {
  const negocio = await getNegocio()
  return <LoginForm nombre={negocio?.nombre ?? ''} logoUrl={negocio?.logo_url ?? null} />
}
