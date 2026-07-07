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

### Identidad de marca
- `lib/color.ts` — `darkenHex()` (deriva `--accent-dark` a partir de `--accent`), `isValidHexColor()` (valida `#RRGGBB`)
- `app/layout.tsx` — Server Component raíz; fetcha `negocio.color_primario` e inyecta `<style>:root{--accent;--accent-dark}</style>` en `<head>`, aplicando el color de acento a toda la app (admin, tienda, login); monta `<Analytics />` de `@vercel/analytics/next` al final del `<body>` (Vercel Web Analytics, todas las páginas)
- `app/login/page.tsx` — Server Component; `generateMetadata()` con nombre/logo del negocio; delega el formulario a `LoginForm.tsx`
- `app/login/LoginForm.tsx` — Client Component; muestra el logo real del negocio (o iniciales del nombre como fallback) en vez de un ícono fijo

### Tienda pública — componentes compartidos
- `lib/tienda.ts` — `PRODUCTO_TIENDA_FIELDS` (constante con el `.select()` de campos seguros para exponer públicamente, nunca incluye `costo`), `getBaseUrl()` (`NEXT_PUBLIC_BASE_URL` → `VERCEL_URL` → `''`; usada por `[id]/page.tsx` y por cualquier componente que arme URLs de producto)
- `lib/whatsapp.ts` — `buildProductoWaUrl()` (mensaje de un solo producto, usado por `ProductoCard.tsx` y `SelectorVariante.tsx`), `buildInteresWaUrl()` (mensaje con varios productos, usado por `PanelInteres.tsx`) y `buildConsultaWaUrl()` (mensaje libre, usado por Custom Studio); las tres devuelven `null` si no hay `whatsapp` configurado y arman el saludo con `sustituirTokens(saludo, { tienda: nombreTienda })`. `sustituirTokens(texto, tokens)` reemplaza placeholders `{clave}` en cualquier texto configurable (usado también para `{item}` en `whatsapp_msg_estudio_item`). Constantes `*_DEFAULT` (saludo, intros, mensajes de estudio) re-exportadas desde `lib/contenido.ts`
- `lib/media.ts` — `getImageDimensions()`/`getVideoDimensions()` (leen el ancho/alto real de un `File` client-side antes de subirlo, vía `Image`/`<video>` temporal) y `esFormatoHero()` (valida 16:9 con tolerancia, mínimo 1280x720, recomendado 1920x1080); usado en `/admin/anuncios` y en el upload de video de producto (`/admin/stock/[id]`) para rechazar archivos que no van a verse bien en `Hero.tsx`
- `lib/contenido.ts` — valores genéricos por defecto para el contenido editable del negocio cuando la columna todavía es `null` (`GUIA_TALLES_DEFAULT`, `CAMBIOS_DEVOLUCIONES_DEFAULT`, `ENVIOS_DEFAULT`, `BANNER_ENVIOS_DEFAULT`, `BANNER_VELOCIDAD_DEFAULT`, `BANNER_DIRECCION_DEFAULT`, `TEXTO_DESTACADO_DEFAULT`, `MISION_DEFAULT`, `VISION_DEFAULT`, `CUSTOM_STUDIO_DEFAULT` (shape `CustomStudio`: textos de cada sección de `/tienda/personaliza`), `ETIQUETA_ENVIO_GRATIS_DEFAULT`, `ETIQUETA_ENVIO_DIA_DEFAULT`, más los `WHATSAPP_*_DEFAULT` re-exportados desde `lib/whatsapp.ts`); se importan tanto en `app/tienda/layout.tsx` (server) como en `app/admin/negocio/page.tsx` (client) para no duplicar los defaults
- `lib/negocioTienda.ts` — `getNegocioTienda()`: único query a `negocio` con todos los campos que necesita `TiendaShell` (colores, contacto, datos legales, contenido editable, con los mismos defaults de `lib/contenido.ts` ya aplicados); usado por `app/tienda/layout.tsx` y por `app/page.tsx` para no duplicar el fetch entre las dos rutas que arman el mismo shell
- `lib/features.ts` — `personalizaHabilitado()` (async, server-only): lee `negocio.personaliza_habilitado` (default `true`) directo de Supabase; usado solo por los route handlers públicos de `estudio_items` (los componentes cliente leen el mismo valor vía `TiendaContext`, ver Patrones → "Toggles de sección por deployment")
- `app/tienda/MisionVision.tsx` — sección "Nuestra Misión"/"Nuestra Visión" del home (texto + imagen opcional cada una, con fallback a texto placeholder si no hay imagen); consume `negocio.misionTexto`/`misionImagenUrl`/`visionTexto`/`visionImagenUrl` vía `useTienda()`; montada condicionalmente en `app/tienda/page.tsx` según `negocio.misionVisionHabilitado`
- `app/tienda/WhatsAppIcon.tsx` — ícono SVG compartido (antes duplicado inline en 4+ lugares)
- `app/tienda/InfoModal.tsx` — modal genérico centrado (título + botón cerrar + contenido en `children`), usado por `Footer.tsx` para mostrar la guía de talles / cambios y devoluciones / envíos
- `app/tienda/BannerEnvios.tsx` — cartel animado (marquee CSS puro, `@keyframes marquee` en `globals.css`, sin librería externa) con el texto de `negocio.bannerEnvios` repetido en loop (6 repeticiones x 2 bloques para loop continuo); no renderiza nada si el campo está vacío; velocidad y dirección configurables vía `negocio.bannerEnviosVelocidad` (segundos de duración de la animación) y `negocio.bannerEnviosDireccion` (`'izquierda' | 'derecha'`, invierte `animationDirection`); se monta en `Header.tsx` (dentro del `<header>` sticky) y en `Footer.tsx`
- `app/page.tsx` — Server Component en la ruta raíz `/`; usa `getNegocioTienda()` y envuelve con `TiendaShell` el componente default de `app/tienda/page.tsx` (importado directamente como `TiendaHome`) — es el home real de la tienda, `/tienda` ahora solo redirige acá (ver sección "Home de la tienda en `/`" más abajo)
- `app/tienda/layout.tsx` — Server Component; layout de todo lo que cuelga de `/tienda/*` (hoy en la práctica solo `/tienda/[id]`, ya que la home se movió a `/`); usa `getNegocioTienda()` y se lo pasa a `TiendaShell`
- `app/tienda/TiendaShell.tsx` — Client Component orquestador; define `TiendaContext` (`{ negocio, interes, catalogo }`, ver más abajo) y renderiza `Header` + `children` + `Footer` + `PanelInteres` + `CatalogoSidebar`; aplica `color_fondo` como `background` inline del wrapper y expone en el wrapper las variables CSS `--tienda-text` (texto general), `--tienda-header-bg`/`--tienda-header-text`, `--tienda-banner-bg`/`--tienda-banner-text` y `--tienda-boton-bg`/`--tienda-boton-text` — cada elemento de la tienda (header, banner de envíos, botones tipo CTA) tiene su propio par fondo/texto configurable desde `/admin/negocio`, independiente del `--accent` global que sigue usando el panel admin y el login
- `app/tienda/Header.tsx` — sticky (incluye `BannerEnvios` arriba de la fila principal); logo+nombre, menú de categorías (fetch a `/api/tienda/categorias`, dropdown on-hover en desktop, acordeón full-screen en mobile detrás de un botón hamburguesa — el panel mobile se renderiza como hermano del `<header>`, no anidado, porque un `fixed` dentro de un ancestro `sticky` queda atrapado en su containing block en Safari/iOS) — clickear una categoría/subcategoría llama `catalogo.setCategoriaActiva()`/`setSubcategoriaActiva()` + `catalogo.setAbierto(true)` (no navega, abre el panel); CTA de WhatsApp; ícono de búsqueda que abre el catálogo sin filtro; ícono de "Interés" con contador
- `app/tienda/Footer.tsx` — incluye `BannerEnvios` arriba de las columnas; columnas Ayuda (3 botones que abren `InfoModal` con guía de talles / cambios y devoluciones / envíos), Institucional (`razon_social`/`cuit`/`direccion`, solo si están completos) y Seguinos (WhatsApp + Instagram)
- `app/tienda/PanelInteres.tsx` — drawer lateral (full-screen en mobile) con la lista de productos que la clienta fue agregando desde `SelectorVariante.tsx`; botón "Consultar por WhatsApp" arma un solo mensaje con `buildInteresWaUrl()` y limpia la lista al confirmar
- `app/tienda/CatalogoSidebar.tsx` — panel lateral (full-screen en mobile, `sm:w-[85%] lg:w-[70%]` en desktop) oculto por defecto; contiene la búsqueda, pills de categoría/subcategoría, contador y grilla de `ProductoCard` que antes vivían inline en `page.tsx`; solo fetchea categorías/productos mientras `catalogo.abierto` es `true`; se abre desde `Header.tsx` o desde el botón "Ver catálogo completo" del home
- `app/tienda/Hero.tsx` — banner full-width (rompe el `max-w-6xl`) que arma un único carrousel combinando anuncios (tabla `anuncios`) y productos `destacado = true`, uno a pantalla ancha por vez (imagen o video de fondo + degradé + contenido según el tipo de slide), flechas y dots si hay más de un slide en total; no renderiza nada si ambas listas están vacías. Los slides de tipo `anuncio` muestran título/subtítulo y son clickeables si tienen `link_url` (interno con `Link` o externo con `<a target="_blank">`); los de tipo `producto` muestran nombre/precio/CTAs (Ver producto + WhatsApp) igual que antes, y reproducen `video_url` si el producto lo tiene cargado. Los anuncios van primero en el orden de los slides
- `app/tienda/ProductoCard.tsx` — card de producto (extraída de `page.tsx`): imagen con swap a la segunda foto on-hover (desktop), badge "Nuevo" (creado hace menos de `negocio.diasNuevo` días — configurable desde `/admin/negocio`, default 14) y "% OFF" (si `precio_anterior > precio_venta`), precio tachado si corresponde, etiquetas de envío (`producto.envio_gratis`/`envio_dia`, con el texto configurable `negocio.etiquetaEnvioGratis`/`etiquetaEnvioDia`)
- `app/tienda/ProductCarousel.tsx` — fila de `ProductoCard` con scroll-snap nativo (sin librería externa) y flechas prev/next en desktop; `justify-content: safe center` centra las cards cuando entran todas sin scroll (pocos productos) sin romper el scroll cuando desbordan; no renderiza nada si la lista de productos está vacía. Reutilizado en `app/tienda/[id]/page.tsx` para la sección "También te puede interesar"

### Tipos compartidos
- `lib/types.ts` — `Producto` (incluye `activo: boolean`, `descripcion: string | null`, `destacado: boolean`, `orden_destacado: number | null`, `precio_anterior: number | null`, `envio_gratis: boolean`, `envio_dia: boolean`), `ProductoTalle` (incluye `color: string`), `GuiaTallas` (`{ columnas: string[]; filas: string[][] }`, tabla genérica editable), `Negocio` (todos los campos de la tabla `negocio`, incluidos `razon_social`/`cuit`/`direccion`/`guia_talles`/`cambios_devoluciones`/`envios`/`banner_envios`/`banner_envios_velocidad`/`banner_envios_direccion` (`BannerDireccion = 'izquierda' | 'derecha'`)/`etiqueta_envio_gratis`/`etiqueta_envio_dia`/`texto_destacado`/`banner_destacado_velocidad`/`banner_destacado_direccion`/`mision_texto`/`mision_imagen_url`/`vision_texto`/`vision_imagen_url`/`custom_studio` (`CustomStudio | null`)/`custom_diseno_imagen_url`/`whatsapp_saludo`/`whatsapp_msg_producto_intro`/`whatsapp_msg_interes_intro`/`whatsapp_msg_estudio_proceso`/`whatsapp_msg_estudio_general`/`whatsapp_msg_estudio_item`, los 6 pares de color por elemento `color_header_fondo`/`color_header_texto`/`color_banner_fondo`/`color_banner_texto`/`color_boton_fondo`/`color_boton_texto`), `CustomStudio` (todos los textos de cada sección de `/tienda/personaliza`: `heroTitulo`/`heroSubtitulo`/`disenoTitulo`/`disenoTexto`/`identidadTitulo`/`identidadTexto`/`productoTitulo`/`productoTexto`/`prendaTitulo`/`prendaTexto`/`prendaProceso`/`prendaBoton`/`ctaTitulo`), `EstudioItem` (`nombre`, `subtitulo`/`descripcion`/`imagen_url`/`precio` opcionales, `orden`, `activo`, `creado_en`), `Anuncio` (`media_url`, `media_tipo: 'imagen' | 'video'`, `titulo`/`subtitulo`/`link_url` opcionales, `orden`, `activo`), `Venta`, `Categoria`, `Talle`, `Color`, `Retiro`, `BotSesion`, `BotPaso`, `DatosParciales`; fuente de verdad de todas las entidades

### Bot de Telegram
- `app/api/telegram/webhook/route.ts` — cerebro del bot; maneja `manejarPaso()` y `handleCallbackQuery()`; estado de conversación en tabla `bot_sesiones`
- `lib/telegram/bot.ts` — wrappers HTTP sobre la Telegram API (`sendMessage`, `sendPhoto`, `getFile`, `answerCallbackQuery`)
- `lib/telegram/categorias.ts` — teclados inline para categorías, subcategorías, talles y colores (`buildKeyboardTalles`, `buildKeyboardColores`, multi-select, ambos DB-driven)
- `lib/telegram/parser.ts` — parseo de mensajes entrantes

### Panel admin (`/admin`)
- `app/admin/layout.tsx` — Server Component; fetcha `negocio` (nombre, logo_url) y pasa a Sidebar
- `app/admin/Sidebar.tsx` — Client Component; navegación principal; link "Ver tienda" abre `/tienda` en nueva pestaña
- `app/admin/stock/page.tsx` — listado de productos con filtros; botón "Nuevo producto"; toggle rápido `activo` (visible/oculto en tienda) por tarjeta
- `app/admin/stock/nuevo/page.tsx` — alta de producto desde cero (nombre, descripción, categoría, talles/colores múltiples con stock por combinación, costo/precio); crea el producto vía `POST /api/productos` y redirige a `/admin/stock/[id]` para cargar fotos
- `app/admin/stock/[id]/page.tsx` — detalle de producto: edición (incluye descripción), registro de ventas (modal con un único selector de variante talle+color), gestión de fotos, gestión de video (un único `video_url` por producto, sube/reemplaza/elimina vía `/api/productos/[id]/video`), checkbox `activo`, checkbox `destacado` + input `orden_destacado` (solo visible si está tildado), input `precio_anterior` opcional, checkboxes `envio_gratis`/`envio_dia` (activan la etiqueta correspondiente en la card pública)
- `app/admin/categorias/page.tsx` — gestión de categorías/subcategorías, y (secciones nuevas) listas planas de **talles** y **colores** disponibles para cargar stock, vía el componente compartido `ListaSimple.tsx`
- `app/admin/negocio/page.tsx` — config del negocio: nombre, logo, contacto (whatsapp + instagram), datos legales (`razon_social`/`cuit`/`direccion`, para el footer), margen objetivo, días para el badge "Nuevo" (`dias_nuevo`, default 14), envíos (texto libre, banner animado con velocidad `banner_envios_velocidad` y dirección `banner_envios_direccion`, etiquetas de "envío gratis"/"envío en el día"), texto destacado del home (`texto_destacado` + su propio banner con `banner_destacado_velocidad`/`banner_destacado_direccion`), sección Misión/Visión (`mision_texto`/`mision_imagen_url`, `vision_texto`/`vision_imagen_url`), guía de talles (tabla editable vía `GuiaTallasEditor.tsx`) y cambios/devoluciones (texto libre). Sección "Colores" con 4 grupos independientes (General: acento/fondo/texto; Header; Banner de envíos; Botones), cada uno con su propio par fondo+texto (`input type="color"` + hex vía el subcomponente `ColorField`)
- `app/admin/negocio/GuiaTallasEditor.tsx` — editor de tabla genérica controlado (`GuiaTallas`): agrega/elimina columnas (con reindexado de todas las filas) y filas, cada celda es un `<input>` — sin límite de columnas ni filas
- `app/admin/anuncios/page.tsx` — CRUD de la tabla `anuncios`: formulario para subir una imagen o video + título/subtítulo/link opcionales vía `POST /api/anuncios` (input de archivo oculto detrás de un botón con borde punteado, mismo patrón que el upload de video de producto, en vez del `<input type="file">` nativo), listado con thumbnail, input numérico de `orden`, toggle `activo`/`inactivo`, botón "Editar" (reemplaza la fila por `AnuncioEditor`, que permite reeditar título/subtítulo/link y opcionalmente reemplazar el archivo vía `PATCH` multipart) y borrado; valida el formato 16:9 del archivo client-side con `lib/media.ts` antes de subir; no tiene fetch inicial en Server Component (todo vía `fetch` client-side, mismo patrón que el resto del admin)
- `app/admin/personaliza/page.tsx` — CMS de Custom Studio (redirige a `/admin/stock` si `personalizaHabilitado()` es `false`); `ContenidoForm` edita el objeto `custom_studio` completo (todos los campos de `CustomStudio`) más la imagen `custom_diseno_imagen` vía `PATCH /api/negocio`; `ItemsManager`/`ItemEditor` dan CRUD completo (crear/editar/borrar/activar/reordenar) sobre `estudio_items` vía `/api/estudio-items` y `/api/estudio-items/[id]`
- `app/admin/whatsapp/page.tsx` — edita los textos de los mensajes de WhatsApp de la tienda: `whatsapp_saludo`, `whatsapp_msg_producto_intro`, `whatsapp_msg_interes_intro` y, solo si `personalizaHabilitado()`, los tres mensajes de Custom Studio (`whatsapp_msg_estudio_proceso`/`whatsapp_msg_estudio_general`/`whatsapp_msg_estudio_item`); guarda vía `PATCH /api/negocio`

### APIs protegidas (`/api/*`)
- `app/api/productos/route.ts` — GET lista con filtros; POST crea producto desde el panel web (`origen: 'web'`, `estado: 'disponible'`, `activo: true`, `descripcion`) e inserta sus `producto_talles` (talle + color + stock por fila)
- `app/api/productos/[id]/fotos/route.ts` — POST sube foto a Storage y appends a `fotos_urls`; DELETE elimina de array y Storage, actualiza `foto_url` al siguiente disponible
- `app/api/productos/[id]/video/route.ts` — mismo patrón que `fotos/route.ts` pero para un único `video_url` por producto (no es un array): POST valida tipo (`mp4`/`webm`/`mov`) y tamaño (máx. 50MB), sube a `productos/videos/` en el mismo bucket `Fotos`, borra el video anterior del Storage si había uno, y actualiza `productos.video_url`; DELETE limpia la columna y borra el archivo del Storage
- `app/api/ventas/route.ts` — POST venta: requiere `talle` (y opcionalmente `color`, `''` si no aplica), descuenta el `stock` de esa variante talle+color en `producto_talles`, recalcula `productos.stock` como suma de todas las variantes, marca `vendido` solo si el total llega a 0
- `app/api/negocio/route.ts` — GET/PATCH config del negocio (incluye `whatsapp`, `instagram` (sin `@`), `razon_social`/`cuit`/`direccion`, `margen_objetivo`, `dias_nuevo` (umbral del badge "Nuevo" en la tienda), los 9 campos de color (`CAMPOS_COLOR`, un loop único que valida con `isValidHexColor()` en vez de un bloque `if` repetido por campo), `cambios_devoluciones`/`envios`/`banner_envios`/`banner_envios_velocidad`/`banner_envios_direccion`/`etiqueta_envio_gratis`/`etiqueta_envio_dia`/`texto_destacado`/`banner_destacado_velocidad`/`banner_destacado_direccion`/`mision_texto`/`vision_texto` (texto libre), `custom_studio` (objeto `CustomStudio` recibido como JSON string y parseado), los 6 mensajes de WhatsApp (`whatsapp_saludo`/`whatsapp_msg_producto_intro`/`whatsapp_msg_interes_intro`/`whatsapp_msg_estudio_proceso`/`whatsapp_msg_estudio_general`/`whatsapp_msg_estudio_item`) y `guia_talles` (recibido como JSON string en el `FormData`, parseado con `JSON.parse` y guardado tal cual en la columna `jsonb` — por eso `updates` es `Record<string, unknown>` y no `Record<string, string>`); helper `subirImagen()` sube hasta 4 imágenes (`logo`, `mision_imagen`, `vision_imagen`, `custom_diseno_imagen`) a `Fotos/negocio/` con cache-busting `?t=timestamp`; revalida `/tienda`, `/` y `/admin` (`revalidatePath`) tras un guardado exitoso
- `app/api/categorias/route.ts` y `[id]/route.ts` — CRUD categorías con subcategorías como array
- `app/api/talles/route.ts` y `[id]/route.ts`, `app/api/colores/route.ts` y `[id]/route.ts` — CRUD simple (mismo patrón que categorías, sin subcategorías) de las listas configurables de talles y colores
- `app/api/anuncios/route.ts` — GET lista completa (activos e inactivos) ordenada por `orden`; POST sube el archivo (imagen o video, detecta `media_tipo` por `content-type`) al bucket `Fotos` bajo `anuncios/` y crea la fila
- `app/api/anuncios/[id]/route.ts` — PATCH actualiza `titulo`/`subtitulo`/`link_url`/`orden`/`activo`; DELETE borra la fila y el archivo del Storage
- `app/api/estudio-items/route.ts` — gateado por `personalizaHabilitado()` (404 si está deshabilitado); GET lista `estudio_items` completa ordenada por `orden`/`creado_en`; POST crea un ítem (`nombre` requerido, `subtitulo`/`descripcion`/`precio`/`orden`, imagen opcional subida a `Fotos/estudio/`); revalida `/tienda/personaliza`
- `app/api/estudio-items/[id]/route.ts` — mismo gate; PATCH actualiza campos parciales (multipart o JSON) y reemplaza la imagen si se sube una nueva (borra la anterior del Storage, best-effort); DELETE borra la fila y su imagen; ambas revalidan `/tienda/personaliza`

### Tienda pública (`/tienda`)
- `app/tienda/page.tsx` — Client Component; home: fetchea `/api/tienda/anuncios` y `/api/tienda/productos?destacado=true` en paralelo y se los pasa a `Hero` (que arma un único carrousel combinado), seguido (dentro del contenedor `max-w-6xl`) del carrousel "Nuevos" y un botón "Ver catálogo completo" que abre `CatalogoSidebar` vía contexto; ya no tiene búsqueda/filtros/grilla inline (se movieron a `CatalogoSidebar.tsx`)
- `app/tienda/[id]/page.tsx` — **Server Component**; `generateMetadata()` con Open Graph/Twitter Card (usa `descripcion` si existe, si no arma un resumen); muestra la `descripcion` y el `precio_anterior` tachado si corresponde; pasa `producto.video_url` a `FotoCarousel` para que el video del producto sea navegable junto a las fotos; delega el selector interactivo talle/color, el link de WhatsApp y el botón "Agregar a mi interés" a `SelectorVariante.tsx`; debajo del detalle, `getRelacionados()` trae hasta 8 productos de la misma `categoria` (excluyendo el actual, `disponible` + `activo`) y si no llega a 4 completa con los más recientes de cualquier categoría, renderizados con el mismo `ProductCarousel` del home bajo el título "También te puede interesar"
- `app/tienda/[id]/FotoCarousel.tsx` — Client Component; carrusel interactivo de fotos de UN producto (useState, swipe, zoom) — no confundir con `ProductCarousel.tsx` (fila de productos en el home). Acepta un `videoUrl` opcional que se antepone a las fotos como primer slide (`<video controls>`, sin zoom/pan); la navegación del lightbox de zoom está acotada solo a las fotos (índices propios, offset por el slide de video) para que "siguiente"/"anterior" dentro del lightbox nunca aterrice en el video
- `app/tienda/[id]/SelectorVariante.tsx` — Client Component; recibe las variantes (talle, color, stock) del Server Component padre; selección de talle → colores disponibles para ese talle → arma el mensaje de WhatsApp con `buildProductoWaUrl()`. La selección es **opcional**: el botón de WhatsApp nunca se deshabilita, si no se elige nada se manda el mensaje genérico. Botón secundario "Agregar a mi interés" (usa `useTienda().interes.agregar()`) — ambos caminos conviven
- `app/tienda/personaliza/page.tsx` — Client Component; home de Custom Studio (redirige a `/` si `personalizaHabilitado()` es `false`); secciones alimentadas por `negocio.customStudio` (hero, "Solo diseño", "Diseño + producto" con ítems de `/api/tienda/estudio-items`, "Tu prenda, nuestro diseño" con CTA de WhatsApp usando `whatsapp_msg_estudio_proceso`, CTA final con `whatsapp_msg_estudio_general`)
- `app/tienda/personaliza/[id]/page.tsx` — Client Component; detalle de un ítem de "Diseño + producto" (redirige a `/` si el flag está apagado); fetchea `/api/tienda/estudio-items/[id]`; botón de WhatsApp con `sustituirTokens(whatsapp_msg_estudio_item, { item: nombre })`

### APIs públicas (`/api/tienda/*`)
- `app/api/tienda/negocio/route.ts` — GET `nombre, logo_url, whatsapp`; sin auth
- `app/api/tienda/categorias/route.ts` — GET `id, nombre, subcategorias`; alimenta el dropdown del header
- `app/api/tienda/productos/route.ts` — GET productos `disponible` y `activo = true` (ya no filtra por `stock > 0` — productos agotados se siguen mostrando, grisados en el cliente); usa `PRODUCTO_TIENDA_FIELDS` + `producto_talles(talle, color, stock)` embebido; soporta filtros `q, categoria, subcategoria, talle` (el filtro `talle` usa `producto_talles!inner`) y `destacado=true` (filtra + ordena por `orden_destacado`); **omite `costo`**
- `app/api/tienda/productos/[id]/route.ts` — GET producto individual si `estado = disponible` y `activo = true`; usa `PRODUCTO_TIENDA_FIELDS` + `producto_talles(talle, color, stock)`
- `app/api/tienda/anuncios/route.ts` — GET anuncios con `activo = true` ordenados por `orden`; alimenta `Hero.tsx` en el home
- `app/api/tienda/estudio-items/route.ts` y `[id]/route.ts` — GET público de `estudio_items` (solo `activo = true`), gateado por `personalizaHabilitado()` (404 si deshabilitado); alimenta `/tienda/personaliza` y `/tienda/personaliza/[id]`

---

## Patrones

### Acceso a datos
Siempre `createServiceClient()` en API routes y Server Components. No hay ORM — queries directas con Supabase JS client:
```ts
const { data } = await supabase.from('tabla').select('...').eq('campo', valor).single()
```

### Auth flow
Middleware valida JWT con `jose` en cada request no-PUBLIC. Las API routes no re-validan la sesión (confían en que el middleware ya lo hizo). El bot de Telegram valida `TELEGRAM_WEBHOOK_SECRET` en el header antes de procesar cualquier update.

### Toggles de sección por deployment
Secciones enteras de la tienda (Custom Studio, Misión/Visión) se pueden mostrar u ocultar desde el panel admin sin tocar código, vía booleans en `negocio` (`personaliza_habilitado`, `mision_vision_habilitado`, ambos default `true`) — existen porque el `origin` del repo pushea a la vez a `SVValen/TERRA` y `SVValen/SHOWROOM` (mismo código, dos deployments Vercel con Supabase separado cada uno) y cada instancia quiere decidir independientemente qué secciones mostrar. **El toggle solo afecta la vista pública, nunca el panel admin**: `/admin/personaliza` y `/admin/negocio` siempre están accesibles para poder cargar/editar contenido de antemano aunque la sección esté oculta. Puntos de entrada gateados: nav link "Personalizá tu diseño" (`Header.tsx`, vía `negocio.personalizaHabilitado` del `TiendaContext`), sección Misión/Visión en el home (`app/tienda/page.tsx`, vía `negocio.misionVisionHabilitado`), las 2 páginas públicas de Custom Studio (`/tienda/personaliza`, `/tienda/personaliza/[id]`, redirigen a `/` en un `useEffect` si está apagado) y los 2 route handlers públicos de `estudio_items` (`/api/tienda/estudio-items*`, 404 si está apagado, chequean `lib/features.ts#personalizaHabilitado()` directo contra la DB ya que no tienen `TiendaContext`). Cualquier feature nueva que deba diferir entre TERRA y SHOWROOM sigue este mismo patrón: un boolean en `negocio` con su checkbox en el admin, nunca una rama de git separada ni una env var.

### Server / Client split
- Layouts: Server Components → fetchan datos iniciales (negocio)
- Páginas con estado interactivo: Client Components con `fetch` propio
- Excepción: `app/tienda/[id]/page.tsx` es Server Component para poder exportar `generateMetadata()`
- Componentes con interactividad extraídos: `FotoCarousel.tsx`, `TiendaShell.tsx`, `Header.tsx`, `Footer.tsx`, `PanelInteres.tsx`, `ProductoCard.tsx`, `ProductCarousel.tsx`

### Panel de "Interés" (no es un carrito de compra)
`TiendaContext.interes` (definido en `TiendaShell.tsx`) mantiene `items: InteresItem[]` persistidos en `localStorage` (clave `sp-interes`, leído/escrito en efectos separados con un ref `cargado` para no pisar el storage antes de la carga inicial). No hay reserva de stock ni checkout: es solo una lista de productos+variante que la clienta arma mientras navega y que se resuelve con un único mensaje de WhatsApp (`buildInteresWaUrl()`) al confirmar desde `PanelInteres.tsx`, que además limpia la lista después de abrir el link.

### Fotos de productos
Dos campos en la tabla: `foto_url` (principal/thumbnail, string) y `fotos_urls` (todas las fotos, array). Al borrar una foto: se remueve de `fotos_urls` y `foto_url` se actualiza a `fotos_urls[0]` o null. Storage bucket: `Fotos`.

### Video de producto
`productos.video_url` (nullable, un único video por producto, no un array como las fotos) se sube al mismo bucket `Fotos` bajo el prefijo `productos/videos/` vía `/api/productos/[id]/video` (máx. 100MB, valida formato 16:9 client-side con `lib/media.ts` antes de subir). Se usa en dos lugares: `Hero.tsx` (si el producto destacado tiene `video_url`, el hero reproduce el video en autoplay muteado y loop en vez de la imagen) y `FotoCarousel.tsx` en el detalle de producto (como primer slide navegable, con controles, sin autoplay). No se reproduce en `ProductoCard.tsx` — se decidió así porque las cards son miniaturas chicas donde un video autoplay compite visualmente con el resto de la grilla.

### Talles, colores y stock por variante
Un producto puede tener varias combinaciones de talle+color, cada una con su propio stock, en la tabla hija `producto_talles` (`producto_id` FK con `ON DELETE CASCADE`, `talle`, `color`, `stock`, `UNIQUE(producto_id, talle, color)`). `color = ''` (string vacío) es el valor sentinela para "esta variante no distingue color" — es el mismo valor que dejó el `DEFAULT ''` de la migración que agregó la columna, así que las filas viejas (sin color) y las nuevas "sin color" son indistinguibles en toda la app. `productos.stock` se mantiene como columna denormalizada = suma de todas las filas de `producto_talles` del producto (sin importar color), recalculada en el código (no hay triggers en la DB) cada vez que se vende (`/api/ventas`) o se edita el producto (`PATCH /api/productos/[id]`). `productos.talle` (columna vieja, escalar) queda sin usar — se elimina en una limpieza futura tras un período de verificación en producción. Una variante sin stock no se oculta: se sigue mostrando (grisada/tachada) tanto en el panel admin como en la tienda pública, y el botón de WhatsApp se mantiene activo.

### Categorías, talles y colores configurables
Las tres listas (`categorias`, `talles`, `colores`) viven en tablas propias, gestionadas desde `/admin/categorias`, **sin foreign key** hacia `productos`/`producto_talles` — son catálogos de sugerencias para poblar los `<select>` de los formularios (web y bot), no restricciones a nivel de base de datos. Borrar un talle/color de la lista no afecta las filas de `producto_talles` que ya usan ese texto. `talles` se sembró inicialmente con la lista que antes estaba hardcodeada en el bot (XS, S, M, L, XL, XXL, Único); `colores` arranca vacía — tanto el bot como los formularios web saltean el paso de color automáticamente hasta que se cargue al menos un color.

### Visibilidad en la tienda (`activo`)
`productos.activo` (boolean, `DEFAULT true`) es independiente de `estado`: permite ocultar un producto de `/tienda` sin tocar su stock ni marcarlo `vendido`/`reservado`. Se controla desde el panel admin (toggle rápido en la tarjeta del listado, o checkbox en el detalle) y se filtra junto con `estado = 'disponible'` en las tres queries públicas (`/api/tienda/productos`, `/api/tienda/productos/[id]`, `app/tienda/[id]/page.tsx`). Un producto inactivo sigue siendo visible para la dueña en `/admin/stock` (con opacidad reducida) para que no lo pierda de vista.

### WhatsApp URL
En tienda pública la URL del producto se construye con `getBaseUrl()`:
1. `NEXT_PUBLIC_BASE_URL` (env var de producción — debe configurarse en Vercel)
2. Fallback: `https://${VERCEL_URL}` (apunta al deployment actual, puede ser preview)

### Rate limiting y hardening de endpoints públicos
`lib/ratelimit.ts` — usa Upstash Redis (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) si esas env vars están seteadas, para que el límite se comparta entre todas las instancias serverless; si no están configuradas (o la llamada a Redis falla), cae automáticamente a un `Map` en memoria por proceso — funciona sin configuración extra pero deja de ser distribuido. Expone `checkRateLimit(key, max, windowMs)` (async) de bajo nivel y `rateLimitOrNull(request, bucket, max, windowMs)` (agrupa por IP vía `x-forwarded-for`, devuelve un `NextResponse` 429 listo para retornar o `null` si está OK). Aplicado en todos los endpoints públicos que escriben o consultan sin autenticación: `POST /api/auth/login` (10/15min), `POST /api/tienda/visita` y `/click-wa` (30/min), `POST /api/telegram/webhook` (60/min, además de validar el secret), y las lecturas públicas `GET /api/tienda/{productos,productos/[id],categorias,negocio,anuncios}` (180/min, generoso para no afectar navegación real mientras frena scraping/bots). El secret del webhook de Telegram se compara con `crypto.timingSafeEqual` en vez de `!==` para evitar timing attacks.
Cabeceras de seguridad en `next.config.ts`: además de `X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy` (ya existían), se agregó `Strict-Transport-Security` y un `Content-Security-Policy` (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `img-src`/`media-src` habilitando `*.supabase.co` para las fotos/videos servidos directo desde Storage). El CSP usa `'unsafe-inline'` en `script-src`/`style-src` porque Next.js inyecta scripts de hidratación sin nonce y la tienda usa `style={{...}}` inline extensivamente para los colores configurables — es un CSP pragmático, no estricto.

### Revalidación de `/tienda` tras cambios en el admin
`app/tienda/layout.tsx` y `page.tsx` son estáticos con ISR (Next.js los prerenderiza y los sirve cacheados hasta que algo los revalida) — sin un trigger explícito, un cambio guardado en la base podía tardar minutos (o quedar cacheado indefinidamente si nadie visitaba la página en ese momento) en reflejarse públicamente, aunque el guardado en sí funcionara bien. Por eso todo endpoint de `/api/*` que modifica datos consumidos por `/tienda` llama `revalidatePath('/tienda', 'layout')` **y también** `revalidatePath('/')` (la home vive en una ruta aparte, ver más abajo) al final de un guardado exitoso: `app/api/negocio/route.ts` (PATCH), `app/api/productos/route.ts` (POST), `app/api/productos/[id]/route.ts` (PATCH/DELETE), `app/api/productos/[id]/fotos/route.ts` (POST/DELETE), `app/api/productos/[id]/video/route.ts` (POST/DELETE), `app/api/ventas/route.ts` (POST), `app/api/anuncios/route.ts` (POST), `app/api/anuncios/[id]/route.ts` (PATCH/DELETE). Cualquier endpoint nuevo que toque `productos`, `producto_talles`, `negocio` o `anuncios` debe sumar ambas líneas.

### Home de la tienda en `/` en vez de `/tienda`
`app/page.tsx` (ruta `/`) y `app/tienda/page.tsx` (ruta `/tienda/[id]` en adelante, y la propia `/tienda` que ahora solo redirige) son rutas separadas en el App Router, así que no alcanza con un layout compartido: `app/page.tsx` importa directamente el componente default de `app/tienda/page.tsx` (`TiendaHome`) y lo envuelve con `TiendaShell` (el mismo componente que usa `app/tienda/layout.tsx`), pasándole las props de negocio ya resueltas. `lib/negocioTienda.ts` centraliza el query a `negocio` con todos los campos que necesita `TiendaShell` (colores, contacto, contenido editable) para que ese fetch no viva duplicado entre `app/page.tsx` y `app/tienda/layout.tsx`. El middleware (`middleware.ts`) marca `/` como ruta pública (antes redirigía a `/tienda`) y agrega un caso especial: `pathname === '/tienda'` (exacto, no sus subrutas) redirige a `/` para que no queden dos URLs sirviendo el mismo home. Los links internos que antes apuntaban a `/tienda` (logo del header, "Volver al catálogo", "Ver tienda" del Sidebar admin) se actualizaron a `/`; los links a `/tienda/[id]` (detalle de producto) no cambiaron.

---

## Decisiones de arquitectura

- **Auth custom (JWT propio) en lugar de Supabase Auth**: Supabase se usa solo como DB + Storage. Simplifica el modelo al evitar sesiones Supabase y permite un control total sobre el payload de sesión (userId, telegramId, nombre).
- **Service role en todas las API routes**: No hay RLS activo en tablas de negocio. La seguridad viene del middleware JWT. El endpoint `/api/tienda/*` accede como service role pero filtra manualmente qué campos y estados se exponen.
- **Dos conjuntos de APIs separados** (`/api/` vs `/api/tienda/`): evita condicionamiento en un solo endpoint; hace explícito y auditeable qué datos son públicos.
- **Bot de Telegram como interfaz primaria de carga**: la dueña carga productos por chat, no por formulario web. Estado de conversación persistido en tabla `bot_sesiones`.
- **`app/tienda/[id]/page.tsx` como Server Component**: requisito para exportar `generateMetadata()` con OG tags. La interactividad (carrusel) se extrae a `FotoCarousel.tsx`.
- **React Context en TiendaShell**: el negocio completo (`nombre, logoUrl, whatsapp, instagram, colores, datos legales`) se fetcha una vez en el layout (Server) y se distribuye a todos los componentes de la tienda vía un único Context (`{ negocio, interes, catalogo }`), sin prop drilling. Se mantiene un solo Context (no uno separado por feature) porque todos viven en `TiendaShell.tsx` y se consumen desde los mismos puntos (`Header.tsx` dispara tanto `interes` como `catalogo`).
- **Catálogo como panel lateral en vez de grilla inline en el home**: con pocos productos cargados, una grilla `grid-cols-4` o un carrousel de anchos fijos dejan mucho espacio vacío a la derecha en desktop (se ve "roto"/angosto). Mover el catálogo completo a un panel oculto por defecto (`CatalogoSidebar.tsx`, mismo patrón visual que `PanelInteres.tsx`) evita ese problema estructuralmente y deja el home enfocado en el hero + "Nuevos". El estado del filtro (categoría/subcategoría activa) vive en el Context en vez de en la URL — se decidió no usar query params (`?categoria=`) porque el panel y el trigger (`Header.tsx`) están en el mismo árbol de componentes y compartir estado por Context es más simple que sincronizar con la URL.
- **Select de productos unificado**: `lib/tienda.ts` centraliza `PRODUCTO_TIENDA_FIELDS`, el string de `.select()` compartido por `app/api/tienda/productos/route.ts`, `app/api/tienda/productos/[id]/route.ts` y `app/tienda/[id]/page.tsx` — antes cada uno mantenía su propio string casi idéntico, agregar un campo nuevo (como `precio_anterior`/`destacado`) requería sincronizar 3 lugares a mano.
- **Builder de WhatsApp unificado**: `lib/whatsapp.ts` reemplaza los builders de mensaje que antes vivían duplicados e inconsistentes en `page.tsx` (calculaba el origin client-side) y `SelectorVariante.tsx` (recibía la URL ya armada server-side). Ahora todas las URLs de producto se arman server-side y se pasan como prop.
- **`producto_talles` como tabla hija en vez de columna JSON**: todo el código usa el query builder directo de Supabase JS (`.eq()`, `.gt()`, filtros embebidos); una tabla hija compone naturalmente con eso, mientras que un array JSON hubiera requerido operadores `jsonb` más frágiles sin ORM. El stock total en `productos.stock` se recalcula en los route handlers (no con triggers de DB) para mantener toda la lógica de negocio auditable en TypeScript, consistente con el resto del proyecto.

---

## Trabajo en curso

### Política del bucket de Storage "Fotos" pendiente de verificar/aplicar en TERRA y SHOWROOM
Todos los uploads (`/api/productos/*/fotos`, `/video`, `/api/anuncios`) usan el service role key server-side, que **bypasea RLS** — no necesitan que el bucket permita escritura pública. El único acceso público real que hace falta es lectura (para que `/tienda` muestre fotos/videos sin login). Correr en el SQL Editor de Supabase para confirmar que no haya una policy de `insert`/`update`/`delete` abierta a `anon`/`public`:
```sql
-- 1. Revisar policies existentes sobre storage.objects
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects';

-- 2. Si no existe ya, asegurar RLS habilitado (suele estarlo por defecto)
alter table storage.objects enable row level security;

-- 3. Policy de lectura pública, acotada al bucket "Fotos" (no todos los buckets)
create policy "Fotos: lectura publica"
on storage.objects for select
to public
using (bucket_id = 'Fotos');
```
Si el paso 1 muestra alguna policy `insert`/`update`/`delete` con rol `anon` o `public` sobre el bucket `Fotos`, hay que borrarla (`drop policy "nombre" on storage.objects;`) — esa sería la única forma en que alguien externo podría subir/borrar archivos sin pasar por las APIs autenticadas.

### Pendiente de configuración
- Dominio custom (Donweb → Vercel): DNS sin configurar → `NEXT_PUBLIC_BASE_URL` sin definir en Vercel
- Migración de talles múltiples ya aplicada (`CREATE TABLE producto_talles`, backfill, `ALTER TABLE ventas ADD COLUMN talle text`) en TERRA y SHOWROOM
- Migración de visibilidad ya aplicada (`ALTER TABLE productos ADD COLUMN activo boolean NOT NULL DEFAULT true`) en TERRA y SHOWROOM
- Migración de descripción + color ya aplicada (`ALTER TABLE productos ADD COLUMN descripcion text`; tablas `talles`/`colores`; `ALTER TABLE producto_talles ADD COLUMN color text NOT NULL DEFAULT ''` + swap de constraint UNIQUE a `(producto_id, talle, color)`; `ALTER TABLE ventas ADD COLUMN color text`) en TERRA y SHOWROOM
- Migración de color de marca **pendiente de correr**: `ALTER TABLE negocio ADD COLUMN color_primario text;` en TERRA y SHOWROOM
- Migración de fondo/texto/instagram **pendiente de correr**: `ALTER TABLE negocio ADD COLUMN color_fondo text; ALTER TABLE negocio ADD COLUMN color_texto text; ALTER TABLE negocio ADD COLUMN instagram text;` en TERRA y SHOWROOM
- Migración de la tienda estilo Cameo **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE productos ADD COLUMN destacado boolean NOT NULL DEFAULT false;
  ALTER TABLE productos ADD COLUMN orden_destacado integer;
  ALTER TABLE productos ADD COLUMN precio_anterior numeric;

  ALTER TABLE negocio ADD COLUMN razon_social text;
  ALTER TABLE negocio ADD COLUMN cuit text;
  ALTER TABLE negocio ADD COLUMN direccion text;
  ```
- Migración del badge "Nuevo" configurable **pendiente de correr** en TERRA y SHOWROOM: `ALTER TABLE negocio ADD COLUMN dias_nuevo integer;`
- Migración de contenido editable (guía de talles, cambios/devoluciones, envíos, banner y etiquetas de envío) **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN guia_talles jsonb;
  ALTER TABLE negocio ADD COLUMN cambios_devoluciones text;
  ALTER TABLE negocio ADD COLUMN envios text;
  ALTER TABLE negocio ADD COLUMN banner_envios text;
  ALTER TABLE negocio ADD COLUMN etiqueta_envio_gratis text;
  ALTER TABLE negocio ADD COLUMN etiqueta_envio_dia text;

  ALTER TABLE productos ADD COLUMN envio_gratis boolean NOT NULL DEFAULT false;
  ALTER TABLE productos ADD COLUMN envio_dia boolean NOT NULL DEFAULT false;
  ```
- Migración de colores por elemento **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN color_header_fondo text;
  ALTER TABLE negocio ADD COLUMN color_header_texto text;
  ALTER TABLE negocio ADD COLUMN color_banner_fondo text;
  ALTER TABLE negocio ADD COLUMN color_banner_texto text;
  ALTER TABLE negocio ADD COLUMN color_boton_fondo text;
  ALTER TABLE negocio ADD COLUMN color_boton_texto text;
  ```
- Migración de video de producto **pendiente de correr** en TERRA y SHOWROOM: `ALTER TABLE productos ADD COLUMN video_url text;`
- Migración de anuncios de la tienda **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  CREATE TABLE anuncios (
    id uuid primary key default gen_random_uuid(),
    media_url text NOT NULL,
    media_tipo text NOT NULL CHECK (media_tipo IN ('imagen', 'video')),
    titulo text,
    subtitulo text,
    link_url text,
    orden integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    creado_en timestamptz NOT NULL DEFAULT now()
  );
  ```
- Limpieza pendiente tras período de verificación: `ALTER TABLE productos DROP COLUMN talle` (columna vieja escalar, ya no se usa)
- Migración de velocidad/dirección de banners y texto destacado **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN banner_envios_velocidad integer;
  ALTER TABLE negocio ADD COLUMN banner_envios_direccion text;
  ALTER TABLE negocio ADD COLUMN texto_destacado text;
  ALTER TABLE negocio ADD COLUMN banner_destacado_velocidad integer;
  ALTER TABLE negocio ADD COLUMN banner_destacado_direccion text;
  ```
- Migración de Misión/Visión **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN mision_vision_habilitado boolean NOT NULL DEFAULT true;
  ALTER TABLE negocio ADD COLUMN mision_texto text;
  ALTER TABLE negocio ADD COLUMN mision_imagen_url text;
  ALTER TABLE negocio ADD COLUMN vision_texto text;
  ALTER TABLE negocio ADD COLUMN vision_imagen_url text;
  ```
- Migración de Custom Studio **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN personaliza_habilitado boolean NOT NULL DEFAULT true;
  ALTER TABLE negocio ADD COLUMN custom_studio jsonb;
  ALTER TABLE negocio ADD COLUMN custom_diseno_imagen_url text;

  CREATE TABLE estudio_items (
    id uuid primary key default gen_random_uuid(),
    nombre text NOT NULL,
    subtitulo text,
    descripcion text,
    imagen_url text,
    precio text,
    orden integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    creado_en timestamptz NOT NULL DEFAULT now()
  );
  ```
- Migración de mensajes de WhatsApp configurables **pendiente de correr** en TERRA y SHOWROOM:
  ```sql
  ALTER TABLE negocio ADD COLUMN whatsapp_saludo text;
  ALTER TABLE negocio ADD COLUMN whatsapp_msg_producto_intro text;
  ALTER TABLE negocio ADD COLUMN whatsapp_msg_interes_intro text;
  ALTER TABLE negocio ADD COLUMN whatsapp_msg_estudio_proceso text;
  ALTER TABLE negocio ADD COLUMN whatsapp_msg_estudio_general text;
  ALTER TABLE negocio ADD COLUMN whatsapp_msg_estudio_item text;
  ```

### Deuda técnica conocida
- No hay RLS en Supabase: si el `SUPABASE_SERVICE_ROLE_KEY` se filtra, hay acceso total a la DB
- El CSP (`next.config.ts`) usa `'unsafe-inline'` en `script-src`/`style-src` — no protege contra XSS si ya se logró inyectar un `<script>` inline. Se evaluó pasar a nonces por-request pero se descartó a propósito: `/tienda` es estática con ISR (ver "Revalidación de `/tienda`" más abajo), y un nonce generado en cada request del middleware no coincidiría con el nonce ya "horneado" en el HTML cacheado, rompiendo scripts/estilos de forma intermitente. Solo sería viable pasando `/tienda` a rendering dinámico, y no vale el trade-off de performance/carga a Supabase que eso implica
- El bot no valida que el `telegram_id` pertenezca a un usuario registrado antes de procesar pasos de carga
- `app/admin/stock/[id]/page.tsx` es un Client Component pesado — candidato a split Server/Client cuando crezca
- El contenido de "Guía de talles" y "Cambios y devoluciones" en el footer (`Footer.tsx`) es texto estático hardcodeado, no editable desde el admin — pendiente si se necesita CMS a futuro
- El dropdown de categorías del header navega con query params (`?categoria=`/`?subcategoria=`) que `page.tsx` lee client-side en un efecto al montar (no hay SSR de los filtros ni sincronización de vuelta a la URL cuando se cambia el filtro desde los pills de la página)
