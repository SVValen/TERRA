'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Categoria, Talle, Color } from '@/lib/types'

type TalleForm = { talle: string; color: string; stock: number }

export default function NuevoProductoPage() {
  const router = useRouter()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tallesDisponibles, setTallesDisponibles] = useState<Talle[]>([])
  const [coloresDisponibles, setColoresDisponibles] = useState<Color[]>([])
  const [margenObjetivo, setMargenObjetivo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [talles, setTalles] = useState<TalleForm[]>([])
  const [costo, setCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/categorias').then(r => r.json()),
      fetch('/api/negocio').then(r => r.json()),
      fetch('/api/talles').then(r => r.json()),
      fetch('/api/colores').then(r => r.json()),
    ]).then(([cats, neg, tallesRes, coloresRes]: [Categoria[], { margen_objetivo?: number }, Talle[], Color[]]) => {
      setCategorias(cats)
      setMargenObjetivo(neg.margen_objetivo ?? null)
      setTallesDisponibles(tallesRes)
      setColoresDisponibles(coloresRes)
      setLoading(false)
    })
  }, [])

  const catData = categorias.find(c => c.nombre === categoria)
  const subcategorias = catData?.subcategorias ?? []

  const costoNum = parseFloat(costo)
  const precioNum = parseFloat(precioVenta)
  const puedeCrear = nombre.trim() !== '' && costoNum > 0 && precioNum > 0

  const crear = async () => {
    if (!puedeCrear) return
    setGuardando(true)
    setError('')
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        descripcion: descripcion.trim() || null,
        categoria: categoria || null,
        subcategoria: subcategoria || null,
        costo: costoNum,
        precio_venta: precioNum,
        talles: talles.filter(t => t.talle.trim()),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear el producto')
      setGuardando(false)
      return
    }
    router.push(`/admin/stock/${data.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-gray-400 dark:text-slate-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin/stock" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          ← Stock
        </Link>
        <span className="text-gray-300 dark:text-slate-700">/</span>
        <span className="text-gray-700 dark:text-slate-300 font-medium">Nuevo producto</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Nuevo producto</h1>

      <div className="space-y-5">
        <FormField label="Nombre">
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input" />
        </FormField>

        <FormField label="Descripción">
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Detalles del producto: tela, caída, cuidados..."
            rows={3}
            className="input resize-none"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Categoría">
            <select
              value={categoria}
              onChange={e => { setCategoria(e.target.value); setSubcategoria('') }}
              className="input"
            >
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </FormField>
          <FormField label="Subcategoría">
            <select
              value={subcategoria}
              onChange={e => setSubcategoria(e.target.value)}
              className="input"
              disabled={!categoria || subcategorias.length === 0}
            >
              <option value="">Sin subcategoría</option>
              {subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label={`Talles y colores (stock total: ${talles.reduce((a, t) => a + (t.stock || 0), 0)})`}>
          <div className="space-y-2">
            {talles.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <select
                    value={t.talle}
                    onChange={e => setTalles(prev => prev.map((x, xi) => xi === i ? { ...x, talle: e.target.value } : x))}
                    className="input"
                  >
                    <option value="">Talle...</option>
                    {tallesDisponibles.map(td => <option key={td.id} value={td.nombre}>{td.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={t.color}
                    onChange={e => setTalles(prev => prev.map((x, xi) => xi === i ? { ...x, color: e.target.value } : x))}
                    className="input"
                  >
                    <option value="">Sin color</option>
                    {coloresDisponibles.map(cd => <option key={cd.id} value={cd.nombre}>{cd.nombre}</option>)}
                  </select>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={t.stock}
                    onChange={e => setTalles(prev => prev.map((x, xi) => xi === i ? { ...x, stock: parseInt(e.target.value) || 0 } : x))}
                    min="0"
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTalles(prev => prev.filter((_, xi) => xi !== i))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTalles(prev => [...prev, { talle: '', color: '', stock: 0 }])}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              + Agregar talle/color
            </button>
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Precio de costo">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">$</span>
              <input type="number" value={costo} onChange={e => setCosto(e.target.value)} className="input pl-7" />
            </div>
          </FormField>
          <FormField label={`Precio de venta${margenObjetivo ? ` (margen obj. ${margenObjetivo}%)` : ''}`}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">$</span>
              <input type="number" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} className="input pl-7" />
            </div>
            {(() => {
              if (!margenObjetivo || !costoNum || costoNum <= 0) return null
              const sugerido = Math.round(costoNum / (1 - margenObjetivo / 100))
              if (sugerido === parseInt(precioVenta)) return null
              return (
                <button
                  type="button"
                  onClick={() => setPrecioVenta(String(sugerido))}
                  className="mt-1 text-xs text-amber-700 dark:text-amber-400 hover:underline text-left"
                >
                  Sugerido: ${sugerido.toLocaleString('es-AR')} →
                </button>
              )
            })()}
          </FormField>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <p className="text-xs text-gray-400 dark:text-slate-500">
          Después de crear el producto vas a poder subir las fotos.
        </p>

        <button
          onClick={crear}
          disabled={!puedeCrear || guardando}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {guardando ? 'Creando...' : 'Crear producto'}
        </button>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
