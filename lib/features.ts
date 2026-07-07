// Feature flags por deployment (mismo código, distinto env var en Vercel por proyecto).
// Habilitado por defecto: no requiere configurar nada en TERRA, solo desactivar en SHOWROOM.
export function personalizaHabilitado(): boolean {
  return process.env.NEXT_PUBLIC_HABILITAR_PERSONALIZA !== 'false'
}
