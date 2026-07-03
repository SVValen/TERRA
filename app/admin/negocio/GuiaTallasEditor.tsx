'use client'

import type { GuiaTallas } from '@/lib/types'

export default function GuiaTallasEditor({
  guiaTallas,
  onChange,
}: {
  guiaTallas: GuiaTallas
  onChange: (v: GuiaTallas) => void
}) {
  const { columnas, filas } = guiaTallas

  const setColumna = (i: number, valor: string) => {
    const nuevas = columnas.map((c, ci) => (ci === i ? valor : c))
    onChange({ columnas: nuevas, filas })
  }

  const agregarColumna = () => {
    onChange({
      columnas: [...columnas, `Columna ${columnas.length + 1}`],
      filas: filas.map(f => [...f, '']),
    })
  }

  const eliminarColumna = (i: number) => {
    onChange({
      columnas: columnas.filter((_, ci) => ci !== i),
      filas: filas.map(f => f.filter((_, ci) => ci !== i)),
    })
  }

  const setCelda = (fi: number, ci: number, valor: string) => {
    onChange({
      columnas,
      filas: filas.map((f, xi) => (xi === fi ? f.map((c, yi) => (yi === ci ? valor : c)) : f)),
    })
  }

  const agregarFila = () => {
    onChange({ columnas, filas: [...filas, columnas.map(() => '')] })
  }

  const eliminarFila = (fi: number) => {
    onChange({ columnas, filas: filas.filter((_, xi) => xi !== fi) })
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1">
          <thead>
            <tr>
              {columnas.map((c, ci) => (
                <th key={ci} className="p-0">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={c}
                      onChange={e => setColumna(ci, e.target.value)}
                      className="input text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarColumna(ci)}
                      aria-label="Eliminar columna"
                      className="w-6 h-6 shrink-0 flex items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, fi) => (
              <tr key={fi}>
                {fila.map((celda, ci) => (
                  <td key={ci} className="p-0">
                    <div className="w-24">
                      <input
                        type="text"
                        value={celda}
                        onChange={e => setCelda(fi, ci, e.target.value)}
                        className="input text-xs"
                      />
                    </div>
                  </td>
                ))}
                <td className="p-0">
                  <button
                    type="button"
                    onClick={() => eliminarFila(fi)}
                    aria-label="Eliminar fila"
                    className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={agregarFila}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          + Agregar fila
        </button>
        <button
          type="button"
          onClick={agregarColumna}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          + Agregar columna
        </button>
      </div>
    </div>
  )
}
