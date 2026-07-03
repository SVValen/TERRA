# Contexto de Proyecto — Showroom
> Leer al inicio de cada sesión de trabajo y antes de ejecutar /review.

## Descripción
App de gestión de showroom de indumentaria. Permite a la dueña administrar stock,
registrar ventas, controlar caja y retiros, y ver métricas del negocio. Incluye
un catálogo público (/tienda) con carousels de destacados/nuevos, menú de
categorías, panel de "Interés" (no es carrito de compra) y newsletter, para que
las clientas vean productos disponibles, elijan talle/color y consulten por
WhatsApp. Los productos se cargan vía bot de Telegram o desde el panel web
(`/admin/stock/nuevo`), con descripción y stock por combinación de talle+color.
Las listas de talles y colores disponibles son configurables desde el panel
(`/admin/categorias`).

## Stack
- **Next.js 16.2.9** — App Router, Server + Client Components, `generateMetadata`
- **React 19 + TypeScript**
- **Tailwind v4** — `@custom-variant dark` en globals.css
- **Supabase** — PostgreSQL (tablas: productos, producto_talles, ventas, caja, retiros, categorias, talles, colores, negocio, usuarios) + Storage bucket "Fotos"
- **Auth custom** — JWT firmado con `jose` + `bcryptjs`, cookie httpOnly `session` (7 días)
- **Telegram Bot API** — webhook en `/api/telegram/webhook`, bot de carga de productos por pasos
- **Vercel** — hosting + env vars

## Flujos críticos

### 1. Carga de producto (bot Telegram)
Pasos en secuencia: nombre → descripción (texto libre, "-" para omitir) → categoría (inline keyboard) → subcategoría → precio_costo → precio_venta → talles (selección múltiple) → **por cada talle elegido**: colores (selección múltiple, se saltea automáticamente si no hay colores configurados) → cantidad por cada combinación talle+color → fotos (múltiples) → confirmación/publicación. Cada combinación se guarda como fila en `producto_talles` (`talle`, `color`, `stock`); `productos.stock` es la suma de todas.

### 1b. Carga de producto (panel web)
`/admin/stock/nuevo` → formulario con nombre, descripción, categoría/subcategoría, talles/colores múltiples (selects poblados desde `/api/talles` y `/api/colores`) + stock por combinación, costo, precio de venta → `POST /api/productos` crea el producto y sus `producto_talles` → redirige a `/admin/stock/[id]` para subir fotos.

### 2. Venta
`POST /api/ventas` con `{ producto_id, precio_vendido, cantidad, talle, color }` → descuenta el stock de esa variante talle+color en `producto_talles` → registra en tabla `ventas` → recalcula `productos.stock` como suma de variantes → solo marca `estado = 'vendido'` cuando el total llega a 0.

### 3. Login admin
`POST /api/auth/login` → verifica password con bcrypt → emite JWT → cookie `session` → redirect `/admin/stock`.

### 4. Catálogo público (/tienda)
Endpoints `/api/tienda/*` son públicos. Solo exponen productos con `estado = 'disponible'` y `activo = true`. Los agotados (`stock = 0`) igual se muestran, grisados. **Nunca exponen `precio_costo`**. WhatsApp URL incluye link al producto con Open Graph.

### 5. Panel admin (/admin)
Rutas protegidas por middleware JWT. Stock (con alta manual y toggle de visibilidad), caja, retiros, métricas, categorías (más las listas configurables de talles y colores en la misma sección), configuración del negocio (logo, nombre, whatsapp, margen objetivo, color de marca).

### 6. Identidad de marca (logo, nombre, colores, contacto)
`negocio.nombre`, `negocio.logo_url` y `negocio.color_primario` alimentan: el título e ícono de pestaña de `/admin`, `/tienda` y `/login` (`generateMetadata` en cada layout/página), el logo mostrado en el login y en los headers, y la variable CSS `--accent` (con `--accent-dark` derivado automáticamente) inyectada en `app/layout.tsx` para toda la app. Además, `negocio.color_fondo` y `negocio.color_texto` personalizan el fondo y el color de los textos principales (nombre de marca, nombre de producto, precio) específicamente en `/tienda`. Header, banner de envíos y botones tipo CTA de la tienda tienen cada uno su propio par de color fondo/texto independiente (`color_header_fondo`/`color_header_texto`, `color_banner_fondo`/`color_banner_texto`, `color_boton_fondo`/`color_boton_texto`) — no comparten el `color_primario` global del panel admin. `negocio.instagram` agrega un link a Instagram en la sección "Contacto" del footer de la tienda, junto al de WhatsApp. Todo se configura desde `/admin/negocio`.

### 7. Tienda pública ampliada (estilo Cameo/Tiendanube)
`/tienda` (home) muestra un hero full-width con los productos `destacado = true` (uno a pantalla ancha por vez, con flechas/dots) seguido del carrousel "Nuevos" (últimos por `creado_en`, cards centradas si son pocas). El catálogo completo (búsqueda + filtros + grilla) **no vive en el home**: es un panel lateral oculto por defecto (`CatalogoSidebar.tsx`) que se abre desde el header o desde un botón "Ver catálogo completo" — se decidió así porque con pocos productos cargados una grilla fija dejaba mucho espacio vacío en desktop. El header incluye un menú desplegable de categorías (hover en desktop, acordeón full-screen en mobile) que al clickear abre directamente ese panel con el filtro correspondiente, y un ícono de "Interés" con contador. El panel de "Interés" (`PanelInteres.tsx`) es una lista de productos que la clienta arma mientras navega (persistida en `localStorage`, **no es un carrito de compra real** — no hay stock reservado ni checkout) y que se resuelve con **un solo mensaje de WhatsApp** listando todo. Cada card de producto muestra badge "Nuevo" (creado hace menos de `negocio.diasNuevo` días, default 14) y "% OFF" (si `precio_anterior > precio_venta`), con la segunda foto del producto on-hover en desktop. El footer suma columnas de Ayuda (guía de talles, cambios/devoluciones y envíos — cada una abre un modal con contenido editable desde `/admin/negocio`), Institucional (`razon_social`/`cuit`/`direccion`, solo los que estén completos) y Newsletter (`POST /api/tienda/newsletter` → tabla `newsletter_suscriptores`).

### 8. Contenido editable de la tienda (guía de talles, envíos, cambios/devoluciones)
Desde `/admin/negocio` se edita: la **guía de talles** como tabla genérica (columnas y filas libres, sin estructura fija — sirve tanto para remeras como para cualquier otra prenda), el texto de **cambios y devoluciones**, el texto de **envíos**, un **banner animado** (`banner_envios`, cartel tipo cinta que corre en el header y el footer de la tienda — vacío lo oculta) y las **etiquetas de envío** ("envío gratis"/"envío en el día", texto personalizable). Estas dos últimas se activan **por producto** con los checkboxes `envio_gratis`/`envio_dia` en `/admin/stock/[id]`, y se muestran como cartelitos en la card del producto en la tienda pública.

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
