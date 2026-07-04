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
      <div className="relative bg-black border border-white/20 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="h-14 flex items-center justify-between px-5 border-b border-white/20 shrink-0">
          <span className="font-mono text-xs uppercase tracking-widest text-white">{titulo}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-red-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5 overflow-y-auto text-white">{children}</div>
      </div>
    </div>
  )
}
