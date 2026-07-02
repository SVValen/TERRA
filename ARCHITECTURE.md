# Arquitectura — Showroom
> Mapa técnico del proyecto. Generado con /snapshot. Actualizar con /snapshot --update tras refactorizaciones.

---

## Archivos clave

### Autenticación y sesión
- `middleware.ts` — intercepta todos los requests; define PUBLIC list; redirige `/` → `/tienda`; valida JWT de cookie `session`
- `lib/auth.ts` — JWT con `jose` (HS256, 7d), bcrypt para passwords, helpers `getSession` / `createSession` / `deleteSession`
- `app/api/auth/login/route.ts` — verifica credentials contra tabla `usuarios`, emite JWT en cookie httpOnly

### Base de datos (Supabase)
- `lib/supabase/server.ts` — `createServiceClient()` con `SUPABASE_SERVICE_ROLE_KEY`; bypasa RLS; **solo usar en server-side**
- `lib/supabase/client.ts` — `createBrowserClient()` con anon key; sujeto a RLS; para componentes client-side

### Tipos compartidos
- `lib/types.ts` — `Producto`, `ProductoTalle`, `Venta`, `Categoria`, `Retiro`, `BotSesion`, `BotPaso`, `DatosParciales`; fuente de verdad de todas las entidades

### Bot de Telegram
- `app/api/telegram/webhook/route.ts` — cerebro del bot; maneja `manejarPaso()` y `handleCallbackQuery()`; estado de conversación en tabla `bot_sesiones`
- `lib/telegram/bot.ts` — wrappers HTTP sobre la Telegram API (`sendMessage`, `sendPhoto`, `getFile`, `answerCallbackQuery`)
- `lib/telegram/categorias.ts` — teclados inline para categorías, subcategorías y talles (`buildKeyboardTalles`, multi-select)
- `lib/telegram/parser.ts` — parseo de mensajes entrantes

### Panel admin (`/admin`)
- `app/admin/layout.tsx` — Server Component; fetcha `negocio` (nombre, logo_url) y pasa a Sidebar
- `app/admin/Sidebar.tsx` — Client Component; navegación principal; link "Ver tienda" abre `/tienda` en nueva pestaña
- `app/admin/stock/page.tsx` — listado de productos con filtros
- `app/admin/stock/[id]/page.tsx` — detalle de producto: edición, registro de ventas (con modal cantidad), gestión de fotos
- `app/admin/negocio/page.tsx` — config del negocio: nombre, logo, whatsapp

### APIs protegidas (`/api/*`)
- `app/api/productos/route.ts` — CRUD de productos
- `app/api/productos/[id]/fotos/route.ts` — POST sube foto a Storage y appends a `fotos_urls`; DELETE elimina de array y Storage, actualiza `foto_url` al siguiente disponible
- `app/api/ventas/route.ts` — POST venta: requiere `talle`, descuenta el `stock` de esa variante en `producto_talles`, recalcula `productos.stock` como suma de variantes, marca `vendido` solo si el total llega a 0
- `app/api/negocio/route.ts` — GET/PATCH config del negocio (incluye `whatsapp` field)
- `app/api/categorias/route.ts` y `[id]/route.ts` — CRUD categorías con subcategorías como array

### Tienda pública (`/tienda`)
- `app/tienda/layout.tsx` — Server Component; fetcha `negocio` y pasa a TiendaShell
- `app/tienda/TiendaShell.tsx` — Client Component; React Context `TiendaContext` (whatsapp, nombre); header sticky con logo, footer
- `app/tienda/page.tsx` — Client Component; catálogo con filtros de categoría/subcategoría/búsqueda; usa `useTienda()` para contexto
- `app/tienda/[id]/page.tsx` — **Server Component**; `generateMetadata()` con Open Graph/Twitter Card; construye WhatsApp URL server-side con `getBaseUrl()`
- `app/tienda/[id]/FotoCarousel.tsx` — Client Component; carrusel interactivo de fotos (useState)

### APIs públicas (`/api/tienda/*`)
- `app/api/tienda/negocio/route.ts` — GET `nombre, logo_url, whatsapp`; sin auth
- `app/api/tienda/productos/route.ts` — GET productos `disponible` (ya no filtra por `stock > 0` — productos agotados se siguen mostrando, grisados en el cliente); incluye `producto_talles(talle, stock)` embebido; soporta filtros `q, categoria, subcategoria, talle` (el filtro `talle` usa `producto_talles!inner`); **omite `costo`**
- `app/api/tienda/productos/[id]/route.ts` — GET producto individual si `estado = disponible`

---

## Patrones

### Acceso a datos
Siempre `createServiceClient()` en API routes y Server Components. No hay ORM — queries directas con Supabase JS client:
```ts
const { data } = await supabase.from('tabla').select('...').eq('campo', valor).single()
```

### Auth flow
Middleware valida JWT con `jose` en cada request no-PUBLIC. Las API routes no re-validan la sesión (confían en que el middleware ya lo hizo). El bot de Telegram valida `TELEGRAM_WEBHOOK_SECRET` en el header antes de procesar cualquier update.

### Server / Client split
- Layouts: Server Components → fetchan datos iniciales (negocio)
- Páginas con estado interactivo: Client Components con `fetch` propio
- Excepción: `app/tienda/[id]/page.tsx` es Server Component para poder exportar `generateMetadata()`
- Componentes con interactividad extraídos: `FotoCarousel.tsx`, `TiendaShell.tsx`

### Fotos de productos
Dos campos en la tabla: `foto_url` (principal/thumbnail, string) y `fotos_urls` (todas las fotos, array). Al borrar una foto: se remueve de `fotos_urls` y `foto_url` se actualiza a `fotos_urls[0]` o null. Storage bucket: `Fotos`.

### Talles y stock por variante
Un producto puede tener varios talles, cada uno con su propio stock, en la tabla hija `producto_talles` (`producto_id` FK con `ON DELETE CASCADE`, `talle`, `stock`). `productos.stock` se mantiene como columna denormalizada = suma de `producto_talles.stock`, recalculada en el código (no hay triggers en la DB) cada vez que se vende (`/api/ventas`) o se edita el producto (`PATCH /api/productos/[id]`). `productos.talle` (columna vieja, escalar) queda sin usar — se elimina en una limpieza futura tras un período de verificación en producción. Un producto/talle sin stock no se oculta: se sigue mostrando (grisado) tanto en el panel admin como en la tienda pública, y el botón de WhatsApp se mantiene activo.

### WhatsApp URL
En tienda pública la URL del producto se construye con `getBaseUrl()`:
1. `NEXT_PUBLIC_BASE_URL` (env var de producción — debe configurarse en Vercel)
2. Fallback: `https://${VERCEL_URL}` (apunta al deployment actual, puede ser preview)

---

## Decisiones de arquitectura

- **Auth custom (JWT propio) en lugar de Supabase Auth**: Supabase se usa solo como DB + Storage. Simplifica el modelo al evitar sesiones Supabase y permite un control total sobre el payload de sesión (userId, telegramId, nombre).
- **Service role en todas las API routes**: No hay RLS activo en tablas de negocio. La seguridad viene del middleware JWT. El endpoint `/api/tienda/*` accede como service role pero filtra manualmente qué campos y estados se exponen.
- **Dos conjuntos de APIs separados** (`/api/` vs `/api/tienda/`): evita condicionamiento en un solo endpoint; hace explícito y auditeable qué datos son públicos.
- **Bot de Telegram como interfaz primaria de carga**: la dueña carga productos por chat, no por formulario web. Estado de conversación persistido en tabla `bot_sesiones`.
- **`app/tienda/[id]/page.tsx` como Server Component**: requisito para exportar `generateMetadata()` con OG tags. La interactividad (carrusel) se extrae a `FotoCarousel.tsx`.
- **React Context en TiendaShell**: `whatsapp` y `nombre` del negocio se fetchan una vez en el layout (Server) y se distribuyen a todos los componentes de la tienda via Context, sin prop drilling.
- **`producto_talles` como tabla hija en vez de columna JSON**: todo el código usa el query builder directo de Supabase JS (`.eq()`, `.gt()`, filtros embebidos); una tabla hija compone naturalmente con eso, mientras que un array JSON hubiera requerido operadores `jsonb` más frágiles sin ORM. El stock total en `productos.stock` se recalcula en los route handlers (no con triggers de DB) para mantener toda la lógica de negocio auditable en TypeScript, consistente con el resto del proyecto.

---

## Trabajo en curso

### Pendiente de configuración
- Dominio custom (Donweb → Vercel): DNS sin configurar → `NEXT_PUBLIC_BASE_URL` sin definir en Vercel
- Migración de talles múltiples ya aplicada (`CREATE TABLE producto_talles`, backfill, `ALTER TABLE ventas ADD COLUMN talle text`) en TERRA y SHOWROOM
- Limpieza pendiente tras período de verificación: `ALTER TABLE productos DROP COLUMN talle` (columna vieja escalar, ya no se usa)

### Deuda técnica conocida
- No hay RLS en Supabase: si el `SUPABASE_SERVICE_ROLE_KEY` se filtra, hay acceso total a la DB
- El bot no valida que el `telegram_id` pertenezca a un usuario registrado antes de procesar pasos de carga
- `app/admin/stock/[id]/page.tsx` es un Client Component pesado — candidato a split Server/Client cuando crezca
- `app/api/productos/route.ts` POST hace `insert(body)` passthrough sin manejar `talles`; no tiene caller conocido en el código actual (los productos se cargan vía bot)
