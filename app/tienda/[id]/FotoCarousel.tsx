'use client'

import { useState } from 'react'

export default function FotoCarousel({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [activa, setActiva] = useState(0)
  const foto = fotos[activa] ?? null

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-stone-100 rounded-3xl overflow-hidden shadow-sm">
        {foto
          ? <img src={foto} alt={nombre} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-7xl text-stone-200">📷</div>
        }
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActiva(i)}
              style={{ width: 72, height: 72 }}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                i === activa ? 'border-amber-400 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
