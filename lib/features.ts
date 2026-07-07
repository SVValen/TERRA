import { createServiceClient } from './supabase/server'

// Toggle admin-configurable (tabla `negocio`, columna `personaliza_habilitado`).
// Server-only: los componentes cliente lo leen vía TiendaContext (`negocio.personalizaHabilitado`).
export async function personalizaHabilitado(): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('negocio').select('personaliza_habilitado').eq('id', 1).single()
  return data?.personaliza_habilitado ?? true
}
