# REVIEW CONSOLIDADO — Showroom — Escaneo completo (`--full`)
**Fecha:** 2026-07-02
**Branch:** main
**Reviewers ejecutados:** security | architecture | qa

---

## Resumen Ejecutivo
**Veredicto:** REQUIERE CAMBIOS
**Nivel de riesgo:** ALTO
**Total hallazgos:** 0 críticos, 4 altos, 8 medios, 3 bajos

El codebase está bien estructurado para su scope (app single-tenant, single-admin). La separación
entre APIs públicas y protegidas es correcta, y la autenticación con JWT es sólida.
Los puntos que requieren resolución son: el webhook de Telegram sin autenticación obligatoria,
la ausencia de validación de stock en ventas (puede registrar más ventas que unidades disponibles),
y un posible bug silencioso en el cálculo de `ganancia` al insertar ventas.

---

## Hallazgos Consolidados

### 🔴 Críticos (bloquean merge)
Ninguno.

### 🟠 Altos (requieren resolución o decisión explícita)
| # | Área | Descripción | Fuente | Archivos |
|---|------|-------------|--------|----------|
| 1 | Auth bot | `TELEGRAM_WEBHOOK_SECRET` es opcional en código: si no está en env, el webhook acepta cualquier request sin verificar identidad. Un atacante puede cargar/eliminar productos enviando updates falsos. | security | `app/api/telegram/webhook/route.ts:23` |
| 2 | Ventas — lógica | Sin validación de `cantidad <= stock`. Se puede registrar una venta de 10 unidades con stock=1: se registra la venta, stock queda en 0 por `Math.max`, pero la cantidad vendida es incorrecta. | qa | `app/api/ventas/route.ts:49` |
| 3 | Ventas — campo | El INSERT de ventas no incluye `ganancia`. El tipo `Venta` lo declara como `number`. Si no hay trigger en DB, los inserts dejan el campo en NULL o fallan silenciosamente. | architecture | `app/api/ventas/route.ts:38` |
| 4 | Auth web | Sin rate limiting en `/api/auth/login`. Permite fuerza bruta ilimitada. | security | `app/api/auth/login/route.ts` |

### 🟡 Medios (deuda técnica a registrar)
| # | Área | Descripción | Fuente | Archivos |
|---|------|-------------|--------|----------|
| 5 | Config | `next.config.ts` vacío: sin headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options). | security | `next.config.ts` |
| 6 | API errors | Mensajes de error internos de Supabase expuestos al cliente en varios endpoints. | security | `ventas/route.ts:21`, `categorias/route.ts:33` |
| 7 | Storage | Upload de fotos sin validación de tipo de archivo ni tamaño máximo. | security + qa | `fotos/route.ts:18`, `webhook/route.ts:358` |
| 8 | Performance | `<img>` nativo en lugar de `next/image` en toda la UI. Sin optimización, lazy loading ni WebP. | architecture | `tienda/page.tsx`, `TiendaShell.tsx`, `tienda/[id]/page.tsx` |
| 9 | Escalabilidad | Sin paginación en stock admin ni catálogo público. Queries retornan todos los registros. | architecture | `tienda/productos/route.ts`, `admin/stock/page.tsx` |
| 10 | UX | Race condition en venta desde UI: botón no se deshabilita durante el fetch, doble click = 2 ventas. | qa | `admin/stock/[id]/page.tsx` |
| 11 | Bot | Sesiones de `bot_sesiones` sin expiración. Sesiones abandonadas persisten indefinidamente. | qa | `webhook/route.ts` |
| 12 | Bot | Input del usuario insertado directamente en HTML de mensajes de Telegram sin escapar. | qa | `webhook/route.ts:296,332` |

### 🔵 Bajos / Sugerencias
| # | Área | Descripción | Fuente | Archivos |
|---|------|-------------|--------|----------|
| 13 | DB | Eliminación física de productos desde bot (sin soft delete). Historial de ventas puede quedar sin referencia. | security | `webhook/route.ts:184` |
| 14 | Estructura | `webhook/route.ts` de 451 líneas: candidato a extraer handlers a `lib/telegram/handlers.ts`. | architecture | `webhook/route.ts` |
| 15 | Routing | `tienda/page.tsx` usa `/api/categorias` (endpoint de admin) en lugar de un endpoint público dedicado. | architecture | `tienda/page.tsx:34` |

---

## Acciones Requeridas

1. **[#1 — ALTO] Hacer `TELEGRAM_WEBHOOK_SECRET` obligatorio.**
   ```ts
   // webhook/route.ts:22
   const secret = request.headers.get('x-telegram-bot-api-secret-token')
   if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {  // sin el if condicional
     return new NextResponse('Unauthorized', { status: 401 })
   }
   ```
   Asegurarse de tener la variable configurada en Vercel.

2. **[#2 — ALTO] Validar `cantidad <= stock` en POST /api/ventas.**
   ```ts
   // ventas/route.ts, antes del INSERT
   if (cantidad > producto.stock) {
     return NextResponse.json({ error: 'Stock insuficiente' }, { status: 422 })
   }
   ```

3. **[#3 — ALTO] Resolver `ganancia` en INSERT de ventas.**
   Verificar si hay un trigger de DB que lo calcule. Si no, agregar:
   ```ts
   ganancia: (precio_vendido - producto.costo) * cantidad,
   ```

4. **[#4 — ALTO] Rate limiting en login.**
   Solución mínima: middleware con counter en memoria o Vercel KV. Alternativa: `upstash/ratelimit`.

---

## Decisión Final

> **REQUIERE CAMBIOS** — Los altos #1 (webhook abierto) y #2+#3 (integridad de datos en ventas) deben resolverse antes de considerar el sistema en producción.

Los ítems #1 al #4 son independientes y pueden resolverse en un único commit pequeño.
Una vez resueltos, el codebase puede considerarse production-ready para el scope actual (single-tenant, single-admin, catálogo público).
