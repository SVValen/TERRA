'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Producto, Categoria, Talle, Color } from '@/lib/types'

type TalleForm = { id?: string; talle: string; color: string; stock: number }

export default function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [producto, setProducto] = useState<Producto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tallesDisponibles, setTallesDisponibles] = useState<Talle[]>([])
  const [coloresDisponibles, setColoresDisponibles] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [fotoActiva, setFotoActiva] = useState(0)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [talles, setTalles] = useState<TalleForm[]>([])
  const [costo, setCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [margenObjetivo, setMargenObjetivo] = useState<number | null>(null)
  const [estado, setEstado] = useState('')
  const [activo, setActivo] = useState(true)
  const [destacado, setDestacado] = useState(false)
  const [ordenDestacado, setOrdenDestacado] = useState('')
  const [precioAnterior, setPrecioAnterior] = useState('')
  const [envioGratis, setEnvioGratis] = useState(false)
  const [envioDia, setEnvioDia] = useState(false)

  // Modal venta
  const [modalVenta, setModalVenta] = useState(false)
  const [precioModal, setPrecioModal] = useState('')
  const [cantidadModal, setCantidadModal] = useState('1')
  const [varianteModalId, setVarianteModalId] = useState('')
  const [vendiendo, setVendiendo] = useState(false)

  // Fotos
  const [subiendo, setSubiendo] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/productos/${id}`).then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
      fetch('/api/negocio').then(r => r.json()),
      fetch('/api/talles').then(r => r.json()),
      fetch('/api/colores').then(r => r.json()),
    ]).then(([p, cats, neg, tallesRes, coloresRes]: [Producto, Categoria[], { margen_objetivo?: number }, Talle[], Color[]]) => {
      setCategorias(cats)
      setTallesDisponibles(tallesRes)
      setColoresDisponibles(coloresRes)
      setMargenObjetivo(neg.margen_objetivo ?? null)
      setProducto(p)
      setNombre(p.nombre)
      setDescripcion(p.descripcion ?? '')
      setCategoria(p.categoria ?? '')
      setSubcategoria(p.subcategoria ?? '')
      const variantes = p.producto_talles?.length
        ? p.producto_talles.map(t => ({ id: t.id, talle: t.talle, color: t.color, stock: t.stock }))
        : p.talle ? [{ talle: p.talle, color: '', stock: p.stock }] : []
      setTalles(variantes)
      setCosto(String(p.costo))
      setPrecioVenta(String(p.precio_venta))
      setEstado(p.estado)
      setActivo(p.activo)
      setDestacado(p.destacado)
      setOrdenDestacado(p.orden_destacado != null ? String(p.orden_destacado) : '')
      setPrecioAnterior(p.precio_anterior != null ? String(p.precio_anterior) : '')
      setEnvioGratis(p.envio_gratis)
      setEnvioDia(p.envio_dia)
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
        descripcion: descripcion.trim() || null,
        categoria: categoria || null,
        subcategoria: subcategoria || null,
        costo: parseFloat(costo),
        precio_venta: parseFloat(precioVenta),
        estado,
        activo,
        destacado,
        orden_destacado: destacado && ordenDestacado ? parseInt(ordenDestacado, 10) : null,
        precio_anterior: precioAnterior ? parseFloat(precioAnterior) : null,
        envio_gratis: envioGratis,
        envio_dia: envioDia,
        talles: talles.filter(t => t.talle.trim()),
      }),
    })
    setGuardando(false)
    router.back()
  }

  const tallesConStock = producto?.producto_talles?.filter(t => t.stock > 0) ?? []

  const abrirModalVenta = () => {
    setPrecioModal(String(producto?.precio_venta ?? ''))
    setCantidadModal('1')
    setVarianteModalId(tallesConStock[0]?.id ?? '')
    setModalVenta(true)
  }

  const confirmarVenta = async () => {
    if (!producto) return
    const precio = parseFloat(precioModal)
    const cantidad = parseInt(cantidadModal)
    const variante = tallesConStock.find(t => t.id === varianteModalId)
    if (isNaN(precio) || precio <= 0 || isNaN(cantidad) || cantidad <= 0 || !variante) return
    setVendiendo(true)
    await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: id, precio_vendido: precio, cantidad, talle: variante.talle, color: variante.color }),
    })
    setModalVenta(false)
    setVendiendo(false)
    router.push('/admin/stock')
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar este producto? No se puede deshacer.')) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    router.push('/admin/stock')
  }

  const subirFoto = async (file: File) => {
    setSubiendo(true)
    const fd = new FormData()
    fd.append('foto', file)
    const res = await fetch(`/api/productos/${id}/fotos`, { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      setProducto(prev => prev ? { ...prev, fotos_urls: data.fotos_urls, foto_url: data.foto_url } : prev)
      setFotoActiva((data.fotos_urls?.length ?? 1) - 1)
    }
    setSubiendo(false)
  }

  const eliminarFoto = async (url: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    const res = await fetch(`/api/productos/${id}/fotos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (res.ok) {
      setProducto(prev => prev ? { ...prev, fotos_urls: data.fotos_urls, foto_url: data.foto_url } : prev)
      setFotoActiva(0)
    }
  }

  const hacerPrincipal = async (url: string) => {
    if (!producto) return
    const nuevasFotos = [url, ...producto.fotos_urls.filter(f => f !== url)]
    const res = await fetch(`/api/productos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fotos_urls: nuevasFotos, foto_url: url }),
    })
    if (res.ok) {
      setProducto(prev => prev ? { ...prev, fotos_urls: nuevasFotos, foto_url: url } : prev)
      setFotoActiva(0)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 h-48 text-gray-400 dark:text-slate-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-200 dark:border-slate-700 border-t-gray-400 dark:border-t-slate-400 rounded-full animate-spin" />
        Cargando...
      </div>
    )
  }

  if (!producto) return <div className="p-8 text-red-500 text-sm">Producto no encontrado.</div>

  const todasLasFotos = producto.fotos_urls?.length
    ? producto.fotos_urls
    : producto.foto_url ? [producto.foto_url] : []

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
        <Link href="/admin/stock" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          ← Stock
        </Link>
        <span className="text-gray-300 dark:text-slate-700">/</span>
        <span className="text-gray-700 dark:text-slate-300 font-medium line-clamp-1">{producto.nombre}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Columna izquierda: fotos */}
        <div className="space-y-3">
          {/* Foto principal */}
          <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative">
            {fotoMostrada ? (
              <Image src={fotoMostrada} alt={producto.nombre} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 gap-2">
                <span className="text-6xl">📷</span>
                <span className="text-sm">Sin foto</span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <EstadoBadge estado={producto.estado} />
            </div>
          </div>

          {/* Gestión de fotos */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
              Fotos ({todasLasFotos.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {todasLasFotos.map((url, i) => (
                <div key={url} className="relative group">
                  <button
                    onClick={() => setFotoActiva(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${
                      i === fotoActiva ? 'border-amber-400' : 'border-transparent'
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                  {/* Eliminar */}
                  <button
                    onClick={() => eliminarFoto(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    ×
                  </button>
                  {/* Hacer principal (solo si no es ya la primera) */}
                  {i !== 0 && (
                    <button
                      onClick={() => hacerPrincipal(url)}
                      className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg"
                    >
                      principal
                    </button>
                  )}
                </div>
              ))}

              {/* Botón agregar */}
              <button
                onClick={() => fotoInputRef.current?.click()}
                disabled={subiendo}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:border-amber-400 hover:text-amber-500 transition-colors disabled:opacity-50"
              >
                {subiendo
                  ? <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-400 rounded-full animate-spin" />
                  : <span className="text-xl leading-none">+</span>
                }
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(f); e.target.value = '' }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-gray-400 dark:text-slate-500 space-y-1 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between">
              <span>Origen</span>
              <span className="capitalize font-medium text-gray-600 dark:text-slate-300">{producto.origen}</span>
            </div>
            <div className="flex justify-between">
              <span>Cargado</span>
              <span className="font-medium text-gray-600 dark:text-slate-300">
                {new Date(producto.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {margen !== null && (
              <div className="flex justify-between">
                <span>Margen</span>
                <span className={`font-semibold ${margen >= 40 ? 'text-emerald-600 dark:text-emerald-400' : margen >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                  {margen}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{producto.nombre}</h1>
            <p className="text-sm text-gray-400 dark:text-slate-500">ID: {id.slice(0, 8)}...</p>
          </div>

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
                <div key={t.id ?? `nuevo-${i}`} className="flex items-center gap-2">
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
                const costoNum = parseFloat(costo)
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

          <FormField label="Precio anterior (opcional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">$</span>
              <input
                type="number"
                value={precioAnterior}
                onChange={e => setPrecioAnterior(e.target.value)}
                placeholder="Dejar vacío si no hay descuento"
                className="input pl-7"
              />
            </div>
          </FormField>

          <FormField label="Estado">
            <select value={estado} onChange={e => setEstado(e.target.value)} className="input">
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </FormField>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500"
            />
            <span className="text-sm text-gray-700 dark:text-slate-300">
              {activo ? 'Visible en la tienda pública' : 'Oculto — solo vos lo ves en el panel'}
            </span>
          </label>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={destacado}
                onChange={e => setDestacado(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Destacado (aparece en el carrousel de home)</span>
            </label>
            {destacado && (
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  value={ordenDestacado}
                  onChange={e => setOrdenDestacado(e.target.value)}
                  placeholder="Orden"
                  min="0"
                  className="input"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={envioGratis}
                onChange={e => setEnvioGratis(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Envío gratis</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={envioDia}
                onChange={e => setEnvioDia(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Envío en el día</span>
            </label>
          </div>

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
                onClick={abrirModalVenta}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                Marcar como vendido
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Zona de peligro</p>
            <button
              onClick={eliminar}
              className="w-full py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Eliminar producto
            </button>
          </div>
        </div>
      </div>

      {/* Modal venta */}
      {modalVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalVenta(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Registrar venta</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 -mt-2">{producto.nombre}</p>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Precio de venta</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  value={precioModal}
                  onChange={e => setPrecioModal(e.target.value)}
                  className="input pl-7"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Talle / color</label>
              <select value={varianteModalId} onChange={e => setVarianteModalId(e.target.value)} className="input">
                {tallesConStock.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.color ? `${t.talle} - ${t.color}` : t.talle} (stock: {t.stock})
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const varianteModal = tallesConStock.find(t => t.id === varianteModalId)
              const stockVariante = varianteModal?.stock ?? 0
              return (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                      Cantidad vendida <span className="font-normal text-gray-400 dark:text-slate-500">(stock: {stockVariante})</span>
                    </label>
                    <input
                      type="number"
                      value={cantidadModal}
                      onChange={e => setCantidadModal(e.target.value)}
                      min="1"
                      max={String(stockVariante)}
                      className="input"
                    />
                  </div>

                  {parseInt(cantidadModal) >= stockVariante && varianteModal && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                      {varianteModal.color ? `${varianteModal.talle} - ${varianteModal.color}` : varianteModal.talle} se quedará sin stock.
                    </p>
                  )}
                </>
              )
            })()}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalVenta(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVenta}
                disabled={vendiendo || !precioModal || !cantidadModal || !varianteModalId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {vendiendo ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
