'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Producto, Categoria } from '@/lib/types'

export default function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [producto, setProducto] = useState<Producto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [fotoActiva, setFotoActiva] = useState(0)

  // Form state
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [costo, setCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [estado, setEstado] = useState('')
  const [stock, setStock] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/productos/${id}`).then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]).then(([p, cats]: [Producto, Categoria[]]) => {
      setCategorias(cats)
      setProducto(p)
      setNombre(p.nombre)
      setCategoria(p.categoria ?? '')
      setSubcategoria(p.subcategoria ?? '')
      setCosto(String(p.costo))
      setPrecioVenta(String(p.precio_venta))
      setEstado(p.estado)
      setStock(String(p.stock))
      setLoading(false)
    })
  }, [id])

  const guardar = async () => {
    setGuardando(true)
    await fetch(`/api/productos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        categoria: categoria || null,
        subcategoria: subcategoria || null,
        costo: parseFloat(costo),
        precio_venta: parseFloat(precioVenta),
        estado,
        stock: parseInt(stock),
      }),
    })
    setGuardando(false)
    router.back()
  }

  const marcarVendido = async () => {
    if (!producto) return
    const precioStr = prompt(
      `Precio de venta para "${producto.nombre}":\n(sugerido: $${producto.precio_venta.toLocaleString('es-AR')})`,
      String(producto.precio_venta)
    )
    if (!precioStr) return
    const precio = parseFloat(precioStr)
    if (isNaN(precio)) return

    await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: id, precio_vendido: precio }),
    })
    router.push('/stock')
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar este producto? No se puede deshacer.')) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    router.push('/stock')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        Cargando...
      </div>
    )
  }

  if (!producto) {
    return <div className="p-8 text-red-500 text-sm">Producto no encontrado.</div>
  }

  const todasLasFotos = [
    ...(producto.foto_url ? [producto.foto_url] : []),
    ...(producto.fotos_urls ?? []).filter(f => f !== producto.foto_url),
  ]
  const fotoMostrada = todasLasFotos[fotoActiva] ?? null
  const margen = producto.costo > 0
    ? Math.round((producto.precio_venta - producto.costo) / producto.precio_venta * 100)
    : null
  const catData = categorias.find(c => c.nombre === categoria)
  const subcategorias = catData?.subcategorias ?? []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/stock" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Stock
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium line-clamp-1">{producto.nombre}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Columna izquierda: fotos */}
        <div className="space-y-3">
          {/* Foto principal */}
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
            {fotoMostrada ? (
              <img src={fotoMostrada} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <span className="text-6xl">📷</span>
                <span className="text-sm">Sin foto</span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <EstadoBadge estado={producto.estado} />
            </div>
          </div>

          {/* Thumbnails */}
          {todasLasFotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {todasLasFotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setFotoActiva(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === fotoActiva ? 'border-amber-400' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Info del origen */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Origen</span>
              <span className="capitalize font-medium text-gray-600">{producto.origen}</span>
            </div>
            <div className="flex justify-between">
              <span>Cargado</span>
              <span className="font-medium text-gray-600">
                {new Date(producto.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {margen !== null && (
              <div className="flex justify-between">
                <span>Margen</span>
                <span className={`font-semibold ${margen >= 40 ? 'text-emerald-600' : margen >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
                  {margen}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">{producto.nombre}</h1>
            <p className="text-sm text-gray-400">ID: {id.slice(0, 8)}...</p>
          </div>

          <FormField label="Nombre">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="input"
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

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio de costo">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                  className="input pl-7"
                />
              </div>
            </FormField>

            <FormField label="Precio de venta">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={precioVenta}
                  onChange={e => setPrecioVenta(e.target.value)}
                  className="input pl-7"
                />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estado">
              <select value={estado} onChange={e => setEstado(e.target.value)} className="input">
                <option value="disponible">Disponible</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </select>
            </FormField>

            <FormField label="Stock">
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                min="0"
                className="input"
              />
            </FormField>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {producto.estado === 'disponible' && (
              <button
                onClick={marcarVendido}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                Marcar como vendido
              </button>
            )}
          </div>

          {/* Zona de peligro */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Zona de peligro</p>
            <button
              onClick={eliminar}
              className="w-full py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
            >
              Eliminar producto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    disponible: 'bg-emerald-500 text-white',
    vendido:    'bg-gray-400 text-white',
    reservado:  'bg-amber-400 text-white',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow ${map[estado] ?? 'bg-gray-400 text-white'}`}>
      {estado}
    </span>
  )
}
