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

const TALLES_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único']

export function buildKeyboardTalles(seleccionados: string[]) {
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (let i = 0; i < TALLES_DISPONIBLES.length; i += 3) {
    rows.push(
      TALLES_DISPONIBLES.slice(i, i + 3).map(t => ({
        text: seleccionados.includes(t) ? `✓ ${t}` : t,
        callback_data: `toggle_talle:${t}`,
      }))
    )
  }
  rows.push([{ text: '✅ Confirmar talles', callback_data: 'talles:confirmar' }])
  rows.push([{ text: 'Omitir (talle único)', callback_data: 'talles:skip' }])
  return { inline_keyboard: rows }
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
