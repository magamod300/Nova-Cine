# NovaCine — Notas de proyecto

## 🔬 Investigación de sistemas alternativos (mayo 2026)

### Lo que tienes hoy
Iframes embed de Videasy/VidLink/vidsrc/etc. — son cajas negras: cargas su URL, ellos te muestran el video con sus propios anuncios y popups, no controlas nada.

### Sistema mejor encontrado: **CinePro Core** + frontend personalizado

**Repo:** [`cinepro-org/core`](https://github.com/cinepro-org/core) — multi-site stream scraper para películas y series. Devuelve **50+ fuentes únicas por título** vía TMDB ID. <cite index="14-11">Get up to 50+ unique sources for a single movie/tv show!</cite>

**Cómo funciona — fundamental diferencia:**
```
Iframe embed (lo que tienes):
NovaCine → carga iframe → Videasy te muestra video + popups

CinePro Core (lo que cambiaría todo):
NovaCine → llama tu API CinePro → te devuelve [.m3u8 URL, calidad, idioma]
        → reproduces con hls.js en <video> nativo SIN iframe
        → sin popups, sin anuncios, controles propios, multi-quality
```

**Por qué es mejor:**
- <cite index="14-4">Modular Providers – drop-in provider system with auto-discovery, Type-Safe – full TypeScript with strict mode, Production-Ready – Redis caching, Docker, error handling, Multi-Source – movies and TV shows from multiple providers</cite>
- Si un provider muere, el resto sigue funcionando.
- TÚ controlas el reproductor → puedes inyectar subtítulos, cambiar calidad, hacer fullscreen real, descargar el .m3u8 con ffmpeg.
- Hay un frontend de referencia en [`ui.cinepro.cc`](https://ui.cinepro.cc/) — <cite index="12-1">CinePro Frontend is a modern web app for browsing and streaming movies and TV shows directly in your browser using HLS playback powered by CinePro Core</cite>

**Coste (gratis):**
- Self-host en **Railway** (capa gratis 500h/mes), **Render** (free tier), **Vercel** (serverless), o **Fly.io** (free tier)
- Solo necesita tu TMDB API key (la que ya tenemos)
- License: PolyForm Noncommercial 1.0 — <cite index="14-2,14-3">CinePro Core is designed for personal and home use only. Users are responsible for ensuring compliance with applicable laws and the terms of service of streaming sources.</cite> ✅ tu caso "yo + 1-2 amigos" cubre perfecto.

### Sistema secundario complementario: **Consumet API**

**Repo:** [`consumet/api.consumet.org`](https://github.com/consumet/api.consumet.org) — <cite index="10-1,10-2">Consumet provides an APIs for accessing information and links for various entertainments like movies, books, anime, etc. Consumet scrapes data from various websites and provides APIs for accessing the data</cite>

⚠️ Cambio importante: <cite index="10-21,10-22,10-23">Self-hosting the Consumet is required to use the API. Consumet API is no longer publicly available. Please refer to the Installation section for more information on hosting your own instance.</cite>

**Despliegue:**
```bash
docker pull riimuru/consumet-api
docker run -p 3000:3000 riimuru/consumet-api
```
Botones de deploy 1-click para Heroku, Vercel, Render, Railway.

**Para qué sirve aquí:** complementar CinePro con anime específicamente (gogoanime, zoro, etc.) — providers más especializados.

### Plan de implementación recomendado

**Cuenta(s) que necesitas crear (todas gratis):**
1. **Railway** ([railway.com](https://railway.com)) → desplegar CinePro Core
2. **GitHub** (ya tienes) → fork del repo
3. **TMDB** (ya tienes la API key)

**Pasos cuando tengas las cuentas:**
1. Fork `cinepro-org/core` a tu GitHub
2. En Railway: "New Project" → "Deploy from GitHub" → seleccionar tu fork
3. Variables de entorno: `TMDB_API_KEY=tu_key`
4. Railway te da una URL pública tipo `https://tu-cinepro.up.railway.app`
5. Tú me pasas esa URL → modifico NovaCine para usarla en lugar de iframes

**Resultado:**
- 50+ fuentes por película/serie en vez de 14 servidores embed actuales
- Cero anuncios cero popups (el .m3u8 va directo a `<video>` nativo)
- Subtítulos ES inyectables manualmente
- Descarga del .m3u8 con yt-dlp/ffmpeg directo (no extractores externos)
- Filtros por idioma/calidad antes de reproducir

### Alternativas extra (también gratis)

- **8-Stream** (`himanshu8443/8-Stream`) — <cite index="2-1">This is a free Movies/Series search engine built with Next.js and powered by the 8-StreamAPI and Consumet API</cite>
- **m3u8-player.net** — tester independiente <cite index="15-25,15-26,15-27">Adaptive bitrate streaming with intelligent buffering for smooth playback experience. ... Professional, free, and easy-to-use online M3U8 playback solution. Completely free with no registration required.</cite>
- **Jellyfin** ([railway.com/deploy/jellyfin-media-server](https://railway.com/deploy/jellyfin-media-server)) — <cite index="11-1,11-2">Deploy Jellyfin | Free Open-Source Media Streaming, Plex Alternative to the cloud for free with Railway, the all-in-one intelligent cloud provider. Self-host Jellyfin.</cite> — para si quieres una biblioteca propia

### Conclusión

**El sistema "mucho mejor" que pides existe y se llama CinePro Core.** Es exactamente lo que necesitas: reemplaza los 14 iframes por una API propia que te da 50+ fuentes con `.m3u8` directos. Cero anuncios. Reproductor que TÚ controlas.

**Cuando estés listo:** crea cuenta en Railway, despliega `cinepro-org/core` con tu TMDB key, pásame la URL pública, y yo modifico NovaCine en una sesión para que use CinePro en vez de los iframes.

---

## 📋 Changelog / Progreso

### v5.1.1 (mayo 14 2026) — R18 con MP4 directo

**R18: reproducción MP4 nativa (cuando esté disponible)**
- Al abrir un video adulto, ahora intenta primero la API de eporner `/api/v2/video/id` y busca campos `file/video_url/mp4/urls[1080|720|480]` con `.mp4` directo
- Si encuentra MP4 → reproduce con `<video>` nativo (sin embed, sin ads)
- Si no → cae al embed iframe normal (comportamiento anterior)
- Beneficios: controles nativos, descarga con click derecho, hardware acceleration

**Limitación conocida:** la API de eporner no siempre expone MP4 directo (depende del video). Para acceso forzado al MP4 a 1080p, queda el botón "Descargar MP4" que abre la página de descarga directa.

**Patrones de búsqueda mejorados:**
- `S._r18lang` se appendea al query si está seteado (preparado para toggle "Solo ES" en categorías R18)

### v5.1.0 (mayo 14 2026) — Source DB + Audio detection + Priority system

Implementación de las 3 mejoras más impactantes del feedback recibido:

**1. SOURCE DATABASE (cache de streams working)**
- `localStorage.nc_working_sources` → `{ "tmdbId:s:e": { url, lang, ts } }`
- Cuando un HLS reproduce con éxito (MANIFEST_PARSED), se marca como working
- En la próxima visita, ese stream se BUMPS al tope automáticamente
- Cap 500 entradas (purga las más antiguas)

**2. DETECTOR DE LINKS MUERTOS**
- `localStorage.nc_broken_sources` → Set de URLs que fallaron
- Al fatal HLS error, la URL se marca como rota
- Próximas vistas: se filtran automáticamente (cap 1000)

**3. AUTO-DETECCIÓN DE AUDIO ESPAÑOL**
- Al cargar HLS, escanea `hls.audioTracks`
- Si hay pista con lang/name conteniendo `lat|spa|esp|spanish|es-|castellano` → la selecciona automáticamente
- Toast "Audio español detectado y activado" al usuario

**4. SISTEMA DE PRIORIDADES (5 niveles)**
```
5 = Latino (lat, latino, es-la, spa-lat)
4 = Castellano (castellano, spain, es-es, es-mx)
3 = Dual / Multi-audio
2 = Sub ES (sub-es, spa-sub)
1 = ES genérico
0 = Otros / sin idioma
```
Las fuentes se ordenan por prioridad, luego por calidad descendente.
Visualmente: badge verde (LAT/CAST), dorado (DUAL/SUB), azul (ES genérico).

### Lo que NO se implementó del feedback (y por qué)

- **Indexador propio (database persistente cross-user)**: requiere backend con DB → fuera de scope PWA. La source DB local sirve para 1 usuario o pocos amigos compartiendo localStorage exportado.
- **Auto-test de audio con Whisper**: requiere worker WASM + buffer del primer minuto, muy pesado para web. Mejor como feature de Electron.
- **Playwright stealth para R18**: requiere headless browser server-side. Imposible en web pura, queda para versión Electron.
- **Migrar de Render a Fly.io/Railway/Oracle**: Fly y Koyeb ya no son gratis. Oracle Always Free requiere CC + setup técnico. Render sigue siendo la opción más simple aunque tenga sleep. Mitigación: cron-job.org cada 14 min.
- **Health checks automáticos**: en lugar de cron de probe, marcamos broken on-error (lazy approach que sí funciona en web).
- **Skip intro / chapters / hardware acceleration**: features de player avanzado que requieren `<video>` nativo en TODAS las fuentes — actualmente algunas son iframes. Pendiente cuando CinePro cubra 100% de los títulos.

### v5.0.x (mayo 2026) — CinePro live + cleanup masivo

**Backend desplegado en Render:**
- `https://nova-cine.onrender.com` corriendo con 12 providers OMSS-compliant
- Providers activos: 02MovieDownloader, CineSu, Icefy, Peachify, Popr, MafiaEmbed, Videasy, VidNest, VidRock, VidSrc, VidZee, VixSrc
- **Limitación Render free**: la instancia se duerme tras 15 min de inactividad → primera petición tarda ~50s. Mitigación posible: cron-job.org haciendo ping cada 14 min (gratis, sin tarjeta).

**Fixes críticos aplicados en cliente:**

| Versión | Fix |
|---|---|
| 5.0.1 | `provider` venía como objeto `{id,name}` → mostraba `[object Object]`. Ahora maneja string y objeto. |
| 5.0.2 | CORS bloqueando `.m3u8` → todos los HLS pasan por `/v1/proxy?data=...` de CinePro que reescribe manifest + segmentos. Fallback a URL original si proxy falla. |
| 5.0.3 | CinePro devolvía URLs `http://localhost:10000` (puerto interno del contenedor) → reescritura automática a dominio público antes de procesar. |
| 5.0.4 | Defensa extra en `playCineProSource` por si alguna URL escapa la reescritura. `?lang=es&audio=es` en request. |
| 5.0.5 | Limpieza dominios LAT dead (cuevana.icu, cuevanaa.icu, inkapelis, miradetodo, hdfull, veocine, cinehdplus, repelis24, pelispedia, seriespepito, seriesyonkis). |
| 5.0.5b | Forzar Español ahora usa **Google con `site:` operator** como primera opción — Google resuelve cualquier dominio LAT alive automáticamente. |
| 5.0.6 | Admin Map / Quick Save detecta tipo de URL: `.m3u8` → hls.js nativo, `.mp4` → `<video>` nativo, otros → iframe. |

**Por qué CinePro no encuentra español para muchos títulos:**
Los 12 providers de CinePro Core (Videasy, VidRock, VidSrc, VidZee, VixSrc, etc.) son **agregadores en inglés**. Sus catálogos vienen de fuentes anglosajonas (CDNs cacheados de Reino Unido/USA). El parámetro `?lang=es` se respeta solo cuando el provider tiene una pista de audio ES en el .m3u8 — y eso depende de si Hollywood liberó el doblaje para ese mercado específico.

**Para títulos sin doblaje en providers:**
1. **Workflow "Forzar Español" + browser extension + Admin Map** (recomendado):
   - Click "Forzar Español" → Google busca en pelisplus.lat / cinecalidad.lat / sololatino.net / gnula.nu (lo que esté alive)
   - Usuario encuentra la peli, le da play en ese sitio
   - Una extensión tipo Video DownloadHelper / Stream Detector / coontool detecta la URL real (.mp4 o .m3u8)
   - Copia esa URL → la pega en el banner "¿Ya encontraste la URL en español?" del player
   - Click Guardar → reproduce inline + se mapea permanentemente al TMDB ID

2. **Solo iframe externo**: usar los 14 servidores embed legacy (LAT bar — Videasy/VidLink con `?lang=es`, frembed, vidsrc.cc ES, etc.) — algunos sí tienen pistas ES.

## 🎯 Próximas investigaciones / sistemas a probar

### A) Añadir scrapers ES a CinePro
- Cuevana3 / Pelisplus tienen estructura HTML scrapeable desde Node
- Habría que escribir un provider custom (`providers/cuevana3.ts`) y agregarlo al fork de cinepro-org/core
- **Costo**: 1 día de trabajo en TypeScript + redeploy en Render
- **Repo**: el provider existe en `cinepro-org/core/src/providers/` como ejemplo. Tu fork tiene permiso de editar.

### B) Cambiar de Render a Cloudflare Workers para CinePro
- Cloudflare Workers tiene plan **truly free unlimited** (100k req/día)
- No se duerme, latencia <50ms global
- Limitación: 10 ms CPU por request → algunos providers que tardan más pueden fallar
- Habría que portar CinePro a Cloudflare Workers (no es Node directo, es Workers runtime)

### C) Stremio + Torrentio (camino más profesional)
- Stremio funciona en Web/Android/iOS/Windows nativo
- Addon Torrentio con Real-Debrid (~3€/mes) → catálogo en español masivo
- Trade-off: deja de ser "NovaCine" y usas Stremio (pero el catálogo de Torrentio para LAT es insuperable)

### D) Backend ES-first propio (más ambicioso)
- Server Node.js que scrapeé Cuevana3/Pelisplus en server-side
- Devuelve `.m3u8` directos pasando por proxy con headers correctos
- Despliegue en Render free igual que CinePro
- **Mejor solución a largo plazo si quieres app 100% en español sin depender de providers anglos**

### E) Lo que NO funciona
- Scrapear LAT sites directamente desde cliente (web/PWA) → CORS los bloquea siempre
- Auto-detectar el .mp4/.m3u8 desde el iframe → cross-origin sandbox del navegador no lo permite
- Free hosting "truly unlimited" para Node Express → no existe a 14 mayo 2026. Las opciones (Fly, Koyeb) ahora piden tarjeta o pagan. Solo Render free + Oracle Always Free quedan, ambas con caveats.

## 📦 Estado actual de archivos
- `index.html` / `novacine.html` → frontend completo v5.0.6
- `sw.js` → service worker v4 (network-first HTML)
- `manifest.json` → PWA manifest
- `colors_and_type.css` → tokens design system
- `assets/icons/icon.svg` → logo PWA
- Backend: `https://nova-cine.onrender.com` (CinePro Core, deploy del usuario)
- Frontend hosting: Cloudflare Workers (`https://novacine.magamod300.workers.dev/`)

### v5.0 (mayo 2026) — CinePro integration 🎯

**El gran cambio:** integración con CinePro Core desplegado en Render gratis.

- ✅ **Backend desplegado**: `https://nova-cine.onrender.com` con 12 providers activos (Videasy, VidRock, VidSrc, VidZee, VixSrc, CineSu, Icefy, Peachify, Popr, MafiaEmbed, 02MovieDownloader, VidNest)
- ✅ **hls.js cargado** desde CDN para reproducción nativa de `.m3u8`
- ✅ **Nuevo `<video>` nativo** en el player (junto al iframe existente como fallback)
- ✅ **Grupo "CINEPRO · 50+ FUENTES SIN ANUNCIOS"** al tope de los servidores cuando abres una peli/serie
- ✅ Fuentes ordenadas: ES/multi primero, calidad descendente
- ✅ Cada fuente muestra provider + calidad + bandera ES
- ✅ Click reproduce directamente con hls.js — sin iframe, sin anuncios, controles nativos
- ✅ Inyección automática de subtítulos del provider (si los trae)
- ✅ Fallback automático a iframes embed si CinePro está caído o sin fuentes
- ✅ Aviso "primera vez 30-50s" porque Render free duerme tras 15 min
- ✅ `goHome()` y `playIframe()` paran correctamente el video nativo + HLS

**URL configurable:** el cliente lee `localStorage.nc_cinepro_url` con fallback a `nova-cine.onrender.com`. Si despliegas otra instancia, solo hay que cambiar esa key.

### v4.11 (mayo 2026) — Títulos alternativos ES + Torrentio

**Sistema 4 implementado: TMDB Alternative Titles**
- Al abrir una peli/serie, NovaCine consulta `/alternative_titles` de TMDB en paralelo
- Filtra países de habla hispana (ES/MX/AR/CO/CL/PE/VE/UY/BO/PY/CR/GT/HN/SV/NI/PA/DO/EC)
- Muestra hasta 6 chips "Buscar como: …" en la barra Latino
- Click en cualquier título alternativo → re-renderiza todos los links del lat bar usando ese título
- Ej: "Doom" → puede salir "La Puerta al Infierno" o "Doom: Aniquilación" como alternativas
- Triplica la probabilidad de encontrar el contenido en Cuevana/Pelisplus

**Sistema 3 parcial: Torrentio (vía Stremio)**
- Si hay IMDB ID, se añaden 2 links: `stremio://torrentio.strem.fun/stream/...` y la URL web
- Funciona si tienes Stremio instalado (recomendado con Real-Debrid ~3€/mes)
- Indexa releases de Wolfmax4k, MejorTorrent, Cinecalidad — todos etiquetados [LAT][ESP][DUAL]

**Pendiente / cuando tenga servidor:**
- Sistema 1 (CinePro Core): requiere deployment Railway/Render. Reemplaza todos los iframe embeds por m3u8 directos con `hls.js` + `<video>` nativo.
- Sistema 2 (TMDB Embed API): similar, scraping server-side de Pelisplus → m3u8.

### v4.10 (mayo 2026) — Dominios actualizados + Mapeo Manual rápido

**Dominios LAT bar corregidos:**
- ✅ Cuevana3 (`cuevana3.eu`) → **Cuevana** (`cuevana.icu`) + mirror **Cuevana mirror** (`cuevanaa.icu`)
- ✅ Pelisplus (`pelisplushd.bz`) → **Pelisplus** (`pelisplus.lat`)
- ✅ CineCalidad (`cinecalidad.so`) → **CineCalidad** (`cinecalidad.lat`)
- 🗑 AnimeOnline (`www3.animeonline.ninja`) — eliminado (DOWN desde mayo 2026)
- Mismo cambio aplicado en `SERIES_LAT_EXTRA`, `forceSpanish`, y `DEFAULT_LAT_SITES`

**Mejoras de servidores LAT:**
- ✅ `vidsrc.vip` ahora con `?lang=es` y rebautizado **vidsrc.vip ES**
- ✅ `vidsrc.pro` con label "Multi-audio" (acepta varias pistas)

**Nuevo: Mapeo Manual express (UI accesible):**
- Al pulsar "Forzar Español" aparece un banner verde inline debajo del player con:
  - Mensaje "¿Ya encontraste la URL en español?"
  - Campo de URL + botón "Guardar"
  - Al guardar: añade al admin map, quita de pendientes, carga inmediato
- Función `openAdminForCurrent()` pre-rellena TMDB ID + título al abrir admin

**Por qué esta versión:**
La búsqueda por título en sitios externos es frágil (dominios cambian). El admin map (mapeo manual) es la solución correcta cuando ningún servidor automático tiene español. Antes nadie lo usaba porque era poco descubrible — ahora aparece automáticamente al "Forzar Español" y permite pegar la URL sin abrir el modal.

### v4.9 (mayo 2026) — Año + filtros sin cortar + speed

**Features:**
- ✅ **Selector de año** en todos los tabs (películas / series / anime / +18) — slider 1950→2027 con popup
- ✅ **Filtros no cortan el video**: al pulsar género/año/categoría con una peli abierta, se mueve al miniplayer flotante y la home se actualiza detrás (puedes seguir viendo mientras exploras)
- ✅ R18 acepta filtro de año (se appendea al query de Eporner)

**Speed optimization:**
- ✅ **Caché TMDB en sessionStorage** (1h) — trending, detalle, temporadas no se piden de nuevo dentro de la misma sesión
- ✅ **`<link rel="preconnect">`** a TMDB, image.tmdb, Eporner, Google
- ✅ **`dns-prefetch`** a Videasy, VidLink, VidFast, vidsrc.cc, embed.su, pstream, vidora
- ✅ Posters siguen con `loading="lazy"` + 2:3 aspect-ratio para evitar re-layout

### v4.8 (mayo 2026) — Auditoría PDF + Mobile + DNS
**Bugs críticos del análisis externo:**
- ✅ **BC-02** "Continuar viendo" ahora preserva temporada/episodio (antes siempre reiniciaba a T1·E1) → `openContent(item, {keepEpisode, curS, curE})`
- ✅ **BC-03** `toggleFav` ahora actualiza el botón DENTRO del player, no el del header → `$('pactions').querySelector('.btn-pur')`
- ✅ **BM-01** Doble click ya no dispara `openContent` dos veces (si ya estás en la misma peli, solo hace fullscreen)
- ✅ **BM-02** `loadSeason` con try/catch + toast de error
- ✅ **BM-03** Service Worker bumpeado a `novacine-v4`
- ✅ **M-06** `@keyframes spin` duplicado eliminado

**Servidores corregidos:**
- 🗑 **HiAnime eliminado** — cerrado el 13-mar-2026 por sentencia judicial $18.75M USD del ACE
- 🗑 **moviesapi.club eliminado** — 404 permanente desde sep 2025
- 🔧 **frembed.icu → frembed.pro** — dominio activo confirmado
- ➕ **vidsrc.vip** — 1080p multi, muy citado 2025-2026
- ➕ **vidsrc.pro** — variante 4K más estable
- ➕ **iframe.pstream.org** — 1080p SIN ANUNCIOS
- ➕ **vidora.su** — 1080p sin anuncios, TLD estable
- ➕ **9animetv.to** — sucesor directo de HiAnime para anime

**Mejoras de arquitectura:**
- ✅ `nc_history` capeado a 200 entradas (borra las más antiguas)
- ✅ `nc_srv_rank` auto-expira a 7 días (no penaliza para siempre)

**📱 Mobile responsive completo (nuevo):**
- Header se apila correctamente en <768px
- Tabs y botones con altura mínima 38-44px para touch
- Player vertical en móvil con poster centrado
- Grid 2 columnas en <768px
- Modal a pantalla completa en móvil
- FAB bar reposicionada
- Latbar y servidores con scroll vertical
- @media (hover: none) para no hover en touch
- Versión <480px: tabs sin iconos, calidad de servidores oculta, pactions wrap a 2 filas

**🛡 DNS adblock (en Admin → Ayuda):**
- AdGuard DNS (94.140.14.14 + DoH)
- Cloudflare for Families (1.1.1.2 + DoH)
- NextDNS (con cuenta configurable)
- Click en cualquier IP/DoH copia al portapapeles
- Instrucciones por SO (Android / iOS / Windows / Router)

### v4.7 (mayo 2026)
**Bugs corregidos:**
- ✅ Miniplayer ahora **mueve el iframe real** en vez de duplicarlo → preserva reproducción y posición
- ✅ Sorpréndeme funciona en todos los tipos (películas / series / anime / +18) — antes solo películas
- ✅ Auto-server al abrir peli: ignora servidores externos (que abren pestaña nueva) y selecciona el primer reproducible
- ✅ R18 cross-search ya no se acumula (`id="xxxBox"` + remove)
- ✅ `loadSimilar` no duplica "Te puede gustar" entre películas
- ✅ "Continuar viendo" filtra por tipo activo al cambiar de tab
- ✅ Footer corregido `v3` → `v4`

**Features añadidos:**
- ✅ Badge verde **"VISTO"** en cards con progreso ≥ 80%
- ✅ **Doble click en card** → fullscreen automático tras 2.2s
- ✅ **Click en miniplayer** → vuelve al player grande con scroll suave
- ✅ Servidor preferido memorizado (último usado por nombre)
- ✅ Búsqueda fuzzy en favoritos (cuando hay +8)
- ✅ Chips de **temas similares** (keywords TMDB) → buscar por tema
- ✅ Botón **🇪🇸 Forzar Español** → abre 4 sitios ES + guarda en pendientes admin
- ✅ Sección "Pendientes — sin doblaje encontrado" en admin
- ✅ 28 sitios externos LAT por defecto (antes 7) con favicons automáticos
- ✅ Admin → "Sitios externos personalizados" para añadir con favicon
- ✅ Servidores nuevos: VidLux, 2embed.stream, VidPlus, autoembed.co, EmbedMaster, VikingEmbed, MultiEmbed VIP

### v4.5 — anterior
- Admin Ctrl+Shift+A con mapeo manual (TMDB ID → URL custom con `{s}` `{e}`)
- Auto-fallback 8s si servidor no carga
- Filtros HD/ES/sin popup + toggle audio dub/sub
- Reputación de servidores (rotos al final)
- 11 atajos de teclado (S/C/F/M/J/K/L/,/./?/Esc/Ctrl+Shift+A)
- Tráiler vía Invidious
- Modo cine 🎬 con ambient color del poster
- Mini-player flotante con auto-show al scrollear
- Sorpréndeme 🎲
- Estadísticas (películas, series, horas)
- Nota personal + rating ★
- Export/Import JSON
- Deeplinks `#movie/123`
- PWA instalable

---

## Qué es

App de streaming (web/PWA + versión Electron win32) para ver películas, series, anime y +18 **sin anuncios**.

- **`novacine.html` / `index.html`** — versión web/PWA completa (la que usas en Netlify)
- **`resources/app/`** — versión Electron original con WebTorrent (no se distribuye ahora, queda como referencia)

Stack actual: HTML/CSS/JS puro · TMDB API · Eporner API · Cobalt/SaveFrom · ServiceWorker (PWA).

---

## Ambición del proyecto

- Ver cualquier contenido desde una sola app
- **Cero anuncios** en lo posible (sandbox iframe + filtros)
- **Español latino primero** — siempre intentar doblaje/sub ES antes que original
- **R18 funcional** sin que el antivirus lo bloquee
- Interfaz tipo Netflix oscuro, profesional, sin emojis cuando se puede

---

## ✅ Lo que YA funciona (v4.5)

### Catálogo y navegación
- Búsqueda TMDB (películas / series / anime / +18) con autocomplete y miniatura
- Tendencias / Próximamente / Mejor valoradas (toggle)
- Filtros por género TMDB (chips) según tipo
- Continuar viendo (localStorage, filtrado por tipo activo)
- Favoritos con búsqueda fuzzy (cuando hay +8)
- Tu rating ★ personal + nota por título
- Badge "VISTO" en cards con progreso ≥ 80%
- Deeplinks `#movie/123` para compartir
- Botón "Compartir" (copia URL al portapapeles)
- Estadísticas: total visto, películas vs series, horas estimadas, rating medio

### Reproductor
- 14 servidores LAT/ES + 14 servidores STD
- Servidores separados para series (CineCalidad TV, Pelisplus TV, Cuevana3 TV, SeriesFlix, soaper.live)
- Servidores separados para anime (AnimeFLV, JKAnime, Monoschinos, AnimeOnline, TioAnime, HiAnime, Miruro, AniPlay, AnimeKai, AnimePahe)
- Auto-fallback 8s si un servidor no carga (salta al siguiente)
- Filtros: Solo HD/1080p+, Solo ES/Multi, Sin popup
- Toggle audio: Cualquiera / Doblaje ES / Sub ES
- Reputación de servidores (rotos van al final)
- Servidor preferido memorizado
- Tráiler vía Invidious (sin tracking YouTube)
- Episodios para series con `<select>` de temporadas
- Postmessage progress tracking (VidLink + Videasy genérico)
- Modo cine 🎬 (ambient color del poster)
- Mini-player flotante al scrollear (click → vuelve al player grande)
- Doble click en card → fullscreen automático

### Buscar Latino
- 28 sitios externos por defecto, filtrados por tipo (movie/tv/anime)
- Favicons automáticos vía Google s2
- Botón "🇪🇸 Forzar Español" → abre 4 sitios ES + guarda en pendientes admin
- "Te puede gustar" (recommendations TMDB)
- Chips "Temas similares" (keywords TMDB) → buscar por tema

### +18 (Adulto)
- API Eporner (CORS abierto, sin proxy)
- 18 categorías con sesgo japonés/HD (modo "Premium HD" filtra > 10min ordenado por rating)
- Búsqueda autocomplete con miniaturas en vivo
- Versión adulto/parodia cruzada (busca el título de la peli en eporner)
- Videos relacionados al reproducir uno
- Descarga MP4 vía API eporner

### Admin (Ctrl+Shift+A)
- **Mapeo manual**: TMDB ID → URL custom (con `{s}` `{e}` para temporada/episodio). Soluciona casos como Doraemon en español
- **Pendientes**: títulos donde hiciste "Forzar Español" y no encontraste → cuando los encuentres, pegas URL y se mueve al mapeo
- **Sitios externos personalizados**: añade tus propios sitios con favicon automático

### Personalización
- 5 paletas de color (rojo, azul, púrpura, verde, ámbar)
- Toggle ad-block (sandbox iframe, off por defecto)
- Export/Import JSON de todos los datos
- Botón "Borrar todo"
- 11 atajos de teclado (S/C/F/M/J/K/L/,/./?/Esc/Ctrl+Shift+A)
- Sorpréndeme 🎲 (random de favoritos o trending)

### PWA
- Instalable (manifest.json + sw.js)
- Service Worker network-first para HTML, cache-first para assets
- Funciona offline el shell de la app (no el contenido externo)
- Theme color, icon SVG, splash

---

## ⚠️ Limitaciones por ser web/PWA (no Electron)

| Función | Por qué no funciona en web | Solución |
|---|---|---|
| **Subtítulos `.vtt` custom** | Iframes embed son cross-origin → no podemos inyectar `<track>` | Solo posible con Electron + `<video>` directo |
| **Backup auto en GitHub gist** | Gists anónimos eliminados en 2018, ahora requieren token | Usar Export/Import manual |
| **Web Push notifications** | Requiere backend que persista suscripciones | Necesita servidor propio |
| **Discord Rich Presence** | Requiere extensión Discord + WebSocket | Proyecto aparte |
| **WebTorrent P2P** | Restricciones del navegador (CORS, WebRTC trackers limitados) | Usa la versión Electron original |
| **Scraping de sites ES** (Cuevana3, Pelisplus para reproducir inline) | CORS los bloquea, proxies fallan al ~30% éxito | Necesita Electron Node fetch |
| **Buscar en xvideos / pornhub listados** | CORS total + Windows Defender | Solo Electron |
| **JAV directo (jable.tv, missav)** | Sin API pública + CORS | Solo Electron |
| **Subtítulos OpenSubtitles automáticos** | Iframes embed no permiten inyección | Solo Electron + `<video>` |
| **Descargar el video que estás viendo** (estilo Video DownloadHelper) | Sandbox cross-origin del navegador | **Solo Electron** — ver siguiente sección |

---

## 🎯 Mejoras pendientes — si vuelvo a Electron

### 1. Video DownloadHelper integrado (alta prioridad)

Replicar VDH de Firefox dentro de Electron:

```js
// main.js — interceptar tráfico del webview del player
playerWebview.webContents.session.webRequest.onBeforeRequest(
  { urls: ['*://*/*.m3u8', '*://*/*.mp4', '*://*/*.ts'] },
  (det, cb) => {
    detectedVideos.push({ url: det.url, size: 0 });
    mainWindow.webContents.send('video-detected', detectedVideos);
    cb({});
  }
);
```

Botón flotante "Videos detectados (N)" en el renderer → click → modal con lista → descargar con yt-dlp/ffmpeg. **1 día de trabajo.** Es la solución correcta a "descargar lo que estoy viendo".

### 2. Panel admin con scraping
Hacer que el botón "Forzar Español" no solo abra pestañas, sino que **scrappee Cuevana3/Pelisplus desde Node** y encuentre el embed URL automáticamente. Imposible en web por CORS.

### 3. Subtítulos OpenSubtitles + SubDL
Ya hay código en `main.js`. Cuando se reproduce un video en `<video>` nativo (no iframe), inyectar `<track kind="subtitles" src="...vtt">` automáticamente.

### 4. WebTorrent funcional
Ya hay código en `main.js` para YTS/EZTV/Nyaa + servidor HTTP local con Range. Solo conectar al renderer.

### 5. Ad-block fuerte (estilo uBlock Origin)
Ampliar lista de dominios bloqueados en `webRequest.onBeforeRequest`. Ya hay base.

### 6. R18 ampliado
Volver al scraping de xvideos (eporner es bueno pero limitado en catálogo japonés "premium" / JAV).
Añadir missav, jable.tv, javguru — solo embeds, no listados.

### 7. Reproducción inline de sites ES
Cuevana3 / Pelisplus tienen sus propios embeds (filemoon, streamtape, streamwish). Scrap Node → extraer embed URL → cargar en el iframe directamente. Solucionaría el problema del 30% de éxito actual.

### 8. Discord Rich Presence
Con `electron-discord-rpc` se puede mostrar "viendo Dune Parte Dos" en Discord.

---

## 🐛 Bugs conocidos / pendientes

- Algunos servidores (frembed, vidsrc.in) cambian de dominio cada mes — mantener URLs actualizadas
- `cinecalidad.so` cambia de TLD frecuentemente — usar listado dinámico si fuera posible
- TPB y rarbg mirrors mueren — verificar enlaces de descarga periódicamente
- Estimación de horas vistas es aproximada (basada en progreso × 1.2)

---

## 💡 Ideas futuras (orden libre)

1. **Buscador por persona** (actor/director TMDB → filmografía)
2. **Slider por año** (1950 → 2026)
3. **Modo "actrices"** R18 (eporner `/api/v2/stars/`)
4. **Recomendaciones post-reproducción** auto al terminar
5. **Watchlist con drag&drop** para reordenar prioridad
6. **Calidad video R18** selector 720p/1080p
7. **Colecciones TMDB** (sagas) → mostrar "Más de la saga"
8. **Modo incógnito** que no guarda historial
9. **Historial separado R18** (toggle "Ocultar historial adulto")
10. **Backup automático** vía jsonbin.io (alternativa a gist)
11. **Picture-in-Picture nativo** del navegador (`videoEl.requestPictureInPicture()`) — solo aplica al miniplayer
12. **Speed control** (0.5x / 1x / 1.5x / 2x) — solo si video es nativo, no iframe

---

## Variables de estado (S)

```js
S = {
  type,          // 'movie'|'tv'|'anime'|'r18'
  tmdbId, imdbId, title, poster,
  isSeries, seasons, curS, curE,
  reqId,         // race condition prevention
  genre,         // TMDB genre filter
  r18cat,        // index in R18_CATS
  r18mode,       // 'std' | 'premium'
}
```

## Estructura localStorage

```
nc_theme         → color de acento
nc_adblock       → sandbox iframe on/off
nc_favs          → { tmdbId: {title, poster, type, isSeries} }
nc_history       → { tmdbId: {progress, curS, curE, updatedAt} }
nc_notes         → { tmdbId: {rating, note} }
nc_admin_map     → { tmdbId: {title, url} }  ← mapeo manual
nc_pending       → { tmdbId: {title, type, addedAt} }  ← forzados sin encontrar
nc_custom_sites  → [{name, url, favicon}]
nc_srv_rank      → { srvName: {ok, fail, last} }
nc_filters       → { hd, es, nopop }
nc_audio_pref    → 'any' | 'dub' | 'sub'
nc_pref_srv      → nombre del último servidor usado
nc_home_view     → 'trending' | 'upcoming' | 'top'
```
