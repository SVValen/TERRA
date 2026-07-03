# Contexto de Proyecto — Showroom
> Leer al inicio de cada sesión de trabajo y antes de ejecutar /review.

## Descripción
App de gestión de showroom de indumentaria. Permite a la dueña administrar stock,
registrar ventas, controlar caja y retiros, y ver métricas del negocio. Incluye
un catálogo público (/tienda) para que las clientas vean productos disponibles y
consulten por WhatsApp. Los productos se cargan vía bot de Telegram o desde el
panel web (`/admin/stock/nuevo`), y pueden tener varios talles con stock independiente.

## Stack
- **Next.js 16.2.9** — App Router, Server + Client Components, `generateMetadata`
- **React 19 + TypeScript**
- **Tailwind v4** — `@custom-variant dark` en globals.css
- **Supabase** — PostgreSQL (tablas: productos, ventas, caja, retiros, categorias, negocio, usuarios) + Storage bucket "Fotos"
- **Auth custom** — JWT firmado con `jose` + `bcryptjs`, cookie httpOnly `session` (7 días)
- **Telegram Bot API** — webhook en `/api/telegram/webhook`, bot de carga de productos por pasos
- **Vercel** — hosting + env vars

## Flujos críticos

### 1. Carga de producto (bot Telegram)
Pasos en secuencia: nombre → categoría (inline keyboard) → subcategoría → precio_costo → precio_venta → talles (selección múltiple, inline keyboard) → cantidad por cada talle elegido → fotos (múltiples) → confirmación/publicación. Cada talle se guarda como fila en `producto_talles`; `productos.stock` es la suma.

### 1b. Carga de producto (panel web)
`/admin/stock/nuevo` → formulario con nombre, categoría/subcategoría, talles múltiples + stock, costo, precio de venta → `POST /api/productos` crea el producto y sus `producto_talles` → redirige a `/admin/stock/[id]` para subir fotos.

### 2. Venta
`POST /api/ventas` con `{ producto_id, precio_vendido, cantidad, talle }` → descuenta el stock de esa variante en `producto_talles` → registra en tabla `ventas` → recalcula `productos.stock` como suma de variantes → solo marca `estado = 'vendido'` cuando el total llega a 0.

### 3. Login admin
`POST /api/auth/login` → verifica password con bcrypt → emite JWT → cookie `session` → redirect `/admin/stock`.

### 4. Catálogo público (/tienda)
Endpoints `/api/tienda/*` son públicos. Solo exponen productos con `estado = 'disponible'` y `activo = true`. Los agotados (`stock = 0`) igual se muestran, grisados. **Nunca exponen `precio_costo`**. WhatsApp URL incluye link al producto con Open Graph.

### 5. Panel admin (/admin)
Rutas protegidas por middleware JWT. Stock (con alta manual y toggle de visibilidad), caja, retiros, métricas, categorías, configuración del negocio (logo, nombre, whatsapp).

## Reglas de negocio invariantes
- `stock` **nunca baja de 0** — se valida contra el stock de la variante (`producto_talles`) antes de descontar en cada venta.
- Producto se marca `vendido` **solo cuando el stock total (suma de variantes) llega exactamente a 0**, no antes.
- **`precio_costo` nunca se expone** en endpoints públicos (`/api/tienda/*`).
- Solo productos `disponible` y `activo = true` son visibles en la tienda pública (`activo` es independiente de `estado`: permite ocultar sin tocar stock ni marcar vendido/reservado).
- Rutas públicas: `/login`, `/api/auth`, `/api/telegram`, `/api/tienda`, `/tienda`. Todo lo demás requiere JWT válido.
- `/` redirige a `/tienda`.

## Variables de entorno críticas (nunca exponer al cliente)
- `SUPABASE_SERVICE_ROLE_KEY` — acceso total a DB sin RLS, solo server-side
- `TELEGRAM_BOT_TOKEN` — token del bot, solo server-side
- `TELEGRAM_WEBHOOK_SECRET` — valida que el webhook viene de Telegram
- `AUTH_SECRET` — firma los JWT de sesión de usuarios admin
- `NEXT_PUBLIC_SUPABASE_URL` — pública (prefijo `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pública, sujeta a RLS
- `NEXT_PUBLIC_BASE_URL` — URL de producción para links de producto en WhatsApp (ej: `https://midominio.com`)
