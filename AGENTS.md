# Contexto de Proyecto — Showroom
> Leer al inicio de cada sesión de trabajo y antes de ejecutar /review.

## Descripción
App de gestión de showroom de indumentaria. Permite a la dueña administrar stock,
registrar ventas, controlar caja y retiros, y ver métricas del negocio. Incluye
un catálogo público (/tienda) para que las clientas vean productos disponibles y
consulten por WhatsApp. El stock se carga y gestiona principalmente vía bot de Telegram.

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
Pasos en secuencia: nombre → categoría (inline keyboard) → subcategoría → precio_costo → precio_venta → stock → talle (inline keyboard, con opción "Omitir") → fotos (múltiples) → confirmación/publicación.

### 2. Venta
`POST /api/ventas` con `{ producto_id, precio_venta, cantidad }` → descuenta stock → registra en tabla `ventas` → solo marca `estado = 'vendido'` cuando `stock` llega a 0.

### 3. Login admin
`POST /api/auth/login` → verifica password con bcrypt → emite JWT → cookie `session` → redirect `/admin/stock`.

### 4. Catálogo público (/tienda)
Endpoints `/api/tienda/*` son públicos. Solo exponen productos con `estado = 'disponible'` y `stock > 0`. **Nunca exponen `precio_costo`**. WhatsApp URL incluye link al producto con Open Graph.

### 5. Panel admin (/admin)
Rutas protegidas por middleware JWT. Stock, caja, retiros, métricas, categorías, configuración del negocio (logo, nombre, whatsapp).

## Reglas de negocio invariantes
- `stock` **nunca baja de 0** — `Math.max(0, stock - cantidad)` en cada venta.
- Producto se marca `vendido` **solo cuando stock llega exactamente a 0**, no antes.
- **`precio_costo` nunca se expone** en endpoints públicos (`/api/tienda/*`).
- Solo productos `disponible` con `stock > 0` son visibles en la tienda pública.
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
