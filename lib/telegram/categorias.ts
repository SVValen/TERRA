import type { Categoria } from '@/lib/types'

export function buildKeyboardCategorias(categorias: Categoria[]) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (let i = 0; i < categorias.length; i += 2) {
    rows.push(
      categorias.slice(i, i + 2).map(c => ({ text: c.nombre, callback_data: `cat:${c.nombre}` }))
    )
  }
  if (rows.length === 0) {
    rows.push([{ text: 'Sin categoría', callback_data: 'cat:skip' }])
  }
  return { inline_keyboard: rows }
}

export function buildKeyboardSubcategorias(subcategorias: string[]) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (let i = 0; i < subcategorias.length; i += 3) {
    rows.push(
      subcategorias.slice(i, i + 3).map(s => ({ text: s, callback_data: `subcat:${s}` }))
    )
  }
  rows.push([{ text: 'Omitir subcategoría', callback_data: 'subcat:skip' }])
  return { inline_keyboard: rows }
}

export const KB_TALLE = {
  inline_keyboard: [
    [
      { text: 'XS',    callback_data: 'talle:XS' },
      { text: 'S',     callback_data: 'talle:S' },
      { text: 'M',     callback_data: 'talle:M' },
    ],
    [
      { text: 'L',     callback_data: 'talle:L' },
      { text: 'XL',    callback_data: 'talle:XL' },
      { text: 'XXL',   callback_data: 'talle:XXL' },
    ],
    [
      { text: 'Único', callback_data: 'talle:Único' },
      { text: 'Omitir talle', callback_data: 'talle:skip' },
    ],
  ],
}

export const KB_LISTO_FOTOS = {
  inline_keyboard: [[{ text: '✅ Listo, no hay más fotos', callback_data: 'fotos:listo' }]],
}

export const KB_CONFIRMAR = {
  inline_keyboard: [[
    { text: '✅ Confirmar', callback_data: 'action:confirmar' },
    { text: '❌ Cancelar',  callback_data: 'action:cancelar'  },
  ]],
}
