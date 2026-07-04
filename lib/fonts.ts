import { Anton, JetBrains_Mono } from 'next/font/google'

// Fuentes de la identidad "Urban Brutalist" de /tienda — no se aplican al panel admin.
export const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' })
export const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-jetbrains' })
