'use client'

import type { ReactNode } from 'react'

export default function InfoModal({
  titulo,
  onClose,
  children,
}: {
  titulo: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[var(--tienda-fondo)] border border-[var(--tienda-text)]/20 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--tienda-text)]/20 shrink-0">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--tienda-text)]">{titulo}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center text-[var(--tienda-text)]/60 hover:text-red-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5 overflow-y-auto text-[var(--tienda-text)]">{children}</div>
      </div>
    </div>
  )
}
