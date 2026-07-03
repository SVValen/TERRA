import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createServiceClient } from '@/lib/supabase/server'
import { darkenHex } from '@/lib/color'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Showroom SP',
  description: 'Panel de gestión',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServiceClient()
  const { data: negocio } = await supabase.from('negocio').select('color_primario').eq('id', 1).single()
  const accent = negocio?.color_primario || '#C9A574'
  const accentDark = darkenHex(accent)

  return (
    <html lang="es" className="h-full">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root { --accent: ${accent}; --accent-dark: ${accentDark}; }` }} />
        {/* Evita el flash de color incorrecto al cargar */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var s = localStorage.getItem('theme');
              if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e){}
          })();
        `}} />
      </head>
      <body className={`${inter.className} h-full antialiased`}>{children}</body>
    </html>
  )
}
