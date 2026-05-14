# NovaCine Design System

> **Streaming sin anuncios, en español primero.**
> Buscador de películas, series, anime y +18 — torrents P2P + servidores embed.

---

## ¿Qué es NovaCine?

NovaCine es una **app de escritorio (Electron)** para Windows que reúne en una sola interfaz lo que hoy está disperso entre torrents, embeds, scrapers y subtítulos. Es un visor multimedia tipo Netflix oscuro, hecho por un solo dev, con énfasis en:

- **Cero anuncios.** Ad-block en el `main` process bloquea ~80 dominios de tracking, popunders y redes adultas.
- **Español latino primero.** TMDB con `language=es-MX`, búsqueda automática en Cuevana3 / CineCalidad / Pelisplus / AnimeFLV, subtítulos `.srt → .vtt` desde SubDL y OpenSubtitles.
- **Torrents como fuente principal.** `WebTorrent` → servidor HTTP local con Range → `<video>` nativo. Sin depender de embeds que caen.
- **Fallback a embeds.** 18 servidores (Videasy, VidLink, vidsrc.su, etc.) si el torrent falla o aún no existe.
- **R18 funcional** sin que Windows Defender lo tumbe — scraping en `main`, embed en `webview` con sesión aislada.

Producto único, de un solo bundle: `NovaCine.exe` (Electron 29 + Node + Chromium).

---

## Producto y arquitectura

| Capa | Tecnología |
|---|---|
| Shell | Electron 29 + BrowserWindow 1300×860 |
| Backend Node | `main.js` — IPC, WebTorrent, ad-block, proxy de imagen, scraper R18, subs |
| Bridge | `preload.js` — `contextBridge` expone `window.nativeAPI` |
| Frontend | `src/index.html` — HTML/CSS/JS puro (~1900 líneas, sin framework) |
| Datos | TMDB API (catálogo) + YTS/EZTV/Nyaa/APIBAY (torrents) |
| Subs | SubDL → OpenSubtitles anónimo (SRT→VTT) |

**Una sola pantalla** con un header sticky (búsqueda + tipo + URL directa), home con *Tendencias* y *Continuar viendo*, y un player que despliega tabs `🧲 Torrents` / `📡 Servidores embed`.

---

## Fuentes utilizadas en este design system

Todo se construyó a partir del código real del repositorio público:

- **GitHub:** [`magamod300/nova-cine-`](https://github.com/magamod300/nova-cine-) (rama `main`)
- **Archivos clave importados:**
  - `resources/app/main.js` — backend Electron + IPC + WebTorrent + scrapers
  - `resources/app/preload.js` — bridge `nativeAPI`
  - `resources/app/src/index.html` — UI completa (~88 KB)
  - `resources/app/package.json` — `novacine` v2.0.0
  - `NOTAS.md` — notas del proyecto y roadmap del autor

> El `.exe` empaquetado de Electron NO es un binario nativo: es Chromium + Node + estos archivos web. Toda la UI vive en `index.html`.

---

## Index del design system

```
.
├── README.md                  ← este archivo (overview, content, visual, iconografía)
├── SKILL.md                   ← contrato para usar este sistema como skill
├── colors_and_type.css        ← tokens CSS: color + tipografía + spacing + radii + shadow
├── fonts/                     ← Bebas Neue + DM Sans (sustituidas vía Google Fonts CDN)
├── assets/                    ← logo, iconografía, posters de placeholder
├── preview/                   ← cards 700×… para la pestaña Design System
│   ├── color-*.html
│   ├── type-*.html
│   ├── spacing-*.html
│   └── component-*.html
└── ui_kits/
    └── desktop/               ← UI kit de la app Electron
        ├── README.md
        ├── index.html         ← prototipo navegable de NovaCine
        └── *.jsx              ← Header, Card, Player, etc.
```

---

## CONTENT FUNDAMENTALS

NovaCine habla en **español neutro / latino**, conversacional, con micro-toques de jerga técnica donde aporta (`magnet:`, `webview`, `embed`). Está hecho por un dev para sí mismo, así que la voz es **directa, sin marketing**, a veces un poco irónica. Nada de "experiencias premium" ni copy corporativo.

### Tono y voz

- **Funcional sobre aspiracional.** El copy describe qué hace el botón, no cómo te va a cambiar la vida.
  - ✅ `"Busca película, serie o anime…"`
  - ✅ `"Pega magnet: o URL directa (ok.ru / YouTube / Streamtape / Filemoon…)"`
  - ❌ `"Descubre tu próxima obsesión"`
- **Honesto sobre los límites.** Si algo falla, lo dice: `"El servidor no respondió"`, `"Probar siguiente servidor →"`, `"Timeout (30s) al obtener metadatos"`.
- **Voz neutra**, no usa "tú" ni "usted" — verbos en imperativo o infinitivo: `Buscar`, `Cargar`, `Detener`, `Guardar en Descargas`, `Probar siguiente servidor`.

### Casing

- **Botones primarios:** Sentence case con verbo. `Buscar`, `Cargar`, `↺ Recargar`, `⏹ Detener`, `💾 Guardar en Descargas`.
- **Secciones / labels pequeños:** UPPERCASE con `letter-spacing: .16em–.2em`. `ESPAÑOL / MULTI-AUDIO`, `AUDIO ORIGINAL — 4K → 1080p`, `Tendencias`, `Continuar viendo`.
- **Logo / títulos hero:** Bebas Neue ALL CAPS por naturaleza de la fuente.
- **Tags inline:** sentence o caps cortos: `4K`, `1080p`, `Multi-audio`, `Dob/Sub ES`, `Sub ES`.

### Vocabulario específico del dominio

| Término | Uso |
|---|---|
| **🧲 Torrents** | Tab principal — siempre con emoji de imán |
| **📡 Servidores embed** | Fallback — siempre con emoji de antena |
| **🌎 Buscar Latino** | Buscador de versiones en español |
| **🔞 +18 / R18** | Contenido adulto |
| **🎌 Anime** | Categoría separada de TV |
| **Dob / Sub ES** | Doblado / subtitulado al español |
| **Continuar viendo** | localStorage del progreso |
| **Tendencias** | TMDB trending |

### Emoji — sí, pero como icono funcional

NovaCine **usa emoji deliberadamente como iconografía** (no hay icon font ni SVG set propio). Cada categoría tiene su emoji fijo y se mantiene consistente en toda la app:

- 🎬 Película · 📺 Serie · 🎌 Anime · 🔞 +18
- 🧲 Torrent · 📡 Embed · 🌎 Latino · 🎧 Audio · 📝 Subs
- ⏹ Detener · ▶ Cargar · ↺ Recargar · 💾 Guardar · ⧉ PiP · ⚡ Velocidad
- ★ Rating · ♥ Favoritos · 🔍 Buscar · ⚙️ Settings

Funciona porque el contexto es claro (un app de video) y todos los emoji son universales. Ver sección **ICONOGRAPHY** abajo para reglas detalladas.

### Mensajes de estado

Cortos, descriptivos, a veces con consejo accionable:

- Loading: `"Buscando torrents…"`, `"Cargando…"`, `"Iniciando stream…"`
- Vacío: `"sin torrents"` (lower case, deliberadamente terso)
- Error: `"El servidor no respondió"`, `"Timeout (30s) al obtener metadatos"`
- Tip persistente: `"🎧 Audio español: Los servidores verdes ya llevan lang=es activado. En Videasy → dentro del player → ⚙️ → Audio → Spanish."`
- Footer: `"NovaCine v3 · 🧲 WebTorrent + 📡 Servidores embed · ⚠️ Solo uso personal"`

### El "vibe"

Si tuviéramos que describirlo en una línea: **"el .exe que tu primo hacker te pasó por Telegram, pero con buen gusto"**. Es funcional, oscuro, directo, sin pretensiones. No oculta lo que hace ni de dónde sale el contenido. El `⚠️ Solo uso personal` del footer es deliberadamente cómplice.

---

## VISUAL FOUNDATIONS

### Paleta — Netflix oscuro + rojo NovaCine

NovaCine usa una **paleta dark con 4 grises azulados** + un **rojo signature** + 4 acentos semánticos. No hay gradientes, no hay glass effects, no hay tintes púrpura. Es plano y serio.

```css
/* Backgrounds — del más oscuro al menos */
--bg:   #090910   /* página, casi negro con tinte azulado */
--s1:   #0f0f1a   /* superficie 1 — cards, inputs */
--s2:   #161625   /* superficie 2 — dropdowns, inputs activos */
--s3:   #1e1e32   /* superficie 3 — tabs activas, hover states */

/* Líneas y texto */
--bdr:   #252540  /* borders default */
--faint: #363655  /* tracks, separadores muy sutiles */
--dim:   #666685  /* texto secundario, placeholders */
--txt:   #eaeaf0  /* texto primario */

/* Acentos */
--red:   #e5383b  /* signature — botones primarios, focus, active */
--grn:   #4ade80  /* éxito, "Buscar Latino", seeders, progreso torrent */
--gold:  #fbbf24  /* rating ★, advertencias, doblaje */
--blu:   #60a5fa  /* tags de idioma, info */
--pur:   #a78bfa  /* favoritos ♥ */
```

**El rojo `#e5383b` es la única chance que tiene de sonreír.** Todo lo demás es funcional: el verde marca "esto trae audio español", el dorado marca rating o doblaje, el azul marca idioma original, el morado marca favoritos.

### Tipografía

Dos familias, ambas de Google Fonts, super contrastadas en personalidad:

- **Bebas Neue** — display ALL CAPS condensada. Logo, títulos de player, números de episodio. Usa `letter-spacing: .04em–.08em` para que respire.
- **DM Sans 300/400/500** — humanista, neutra, optimizada para UI. Body, botones, tablas de torrents, dropdowns. **No usa 600/700** — el peso máximo es 500.

```
Logo:        Bebas Neue 1.8rem, letter-spacing .08em
Title hero:  Bebas Neue clamp(1.35rem, 3.5vw, 2rem), letter-spacing .04em
Section lbl: DM Sans 500, .66rem, letter-spacing .2em, UPPERCASE, color dim
Body:        DM Sans 400, .76–.87rem
Caption:     DM Sans 400, .6–.7rem, color dim
Button:      DM Sans 500, .8rem
Tag:         DM Sans 500, .6–.64rem
```

### Spacing y radii — sistema apretado

Hecho para mucha info en poco espacio (catálogo + posters + tablas + progreso). El radio típico es **6px** — ni cuadrado ni redondeado. Los radii pequeños (3–4px) son para tags y elementos secundarios, los grandes (7–8px) para el player y modales.

```
radii:    3px (tags), 4–5px (botones), 6px (cards, inputs), 7–8px (player, video-wrap)
spacing:  4, 5, 7, 9, 11, 13, 14, 18 — escala irregular, sin sistema de 4/8
gaps:     5–11px típico entre items
padding:  6–14px típico en componentes
```

### Backgrounds e imágenes

- **Fondo plano.** `#090910` en toda la app — no hay imágenes hero, no hay gradientes, no hay patrones.
- **Posters TMDB en 2:3** — son el visual principal. Cards `aspect-ratio: 2/3`, `object-fit: cover`, fallback SVG inline gris con texto "Sin imagen".
- **Thumbs proxy.** Para R18 los thumbs vienen vía `proxy-image` → base64 (evita CSP/AV).
- **Sin imágenes de marca propias** — todo el peso visual lo cargan los posters de TMDB.

### Bordes, sombras, transparencias

- **1px borders en todos lados.** `border: 1px solid var(--bdr)`. NovaCine es un app de **líneas**, no de sombras.
- **Sombras sólo en elementos elevados:**
  - Dropdown sugerencias: `0 12px 40px rgba(0,0,0,.8)`
  - Video player: `0 18px 56px rgba(0,0,0,.7)`
  - Toast: `0 4px 24px rgba(0,0,0,.65)`
- **Transparencia con blur en header sticky:** `background: rgba(9,9,16,.94); backdrop-filter: blur(14px)`. Único uso de blur en la app.
- **Tags como capsules tinted:** color del acento al 10–18% de opacidad + borde al 25–30% + texto al color sólido.
  - Ej. rojo tag: `bg rgba(229,56,59,.15)`, `border rgba(229,56,59,.28)`, `color var(--red)`.

### Cards

```
background: var(--s1)
border:     1px solid var(--bdr)
radius:     6px
transition: transform .18s, border-color .18s
hover:      transform: translateY(-3 a -4px); border-color: var(--dim) (o var(--red) en CW)
```

Las cards son **literalmente solo poster + título + año/rating**. Density alta. Grid con `repeat(auto-fill, minmax(136px, 1fr))`.

### Animation

- **Solo transitions, no keyframes complejos** (excepto el spinner `spin .9s linear` y `pulse` para dots de loading).
- **Duración estándar: .15s–.22s.** Las cards usan `.18s`, los hover de botones `.15s`, los toasts `.22s`, el dropdown `.1s` en hover.
- **Easing:** mayormente el default del navegador (ease). No hay cubic-bezier custom.
- **Movimientos típicos:**
  - Card hover: `translateY(-3px ~ -4px)` + color de borde
  - Toast: entra con `translateY(72px → 0)` + `opacity 0 → 1`
  - Spinner: `border-top-color` + rotación
  - Loading dot: `pulse` opacidad `1 → .4 → 1`

### Hover y press states

| Elemento | Hover | Press |
|---|---|---|
| Botón primario rojo | `background: #c9292c` (rojo más oscuro) | — |
| Botón ghost | `border-color: var(--dim); color: var(--txt)` | — |
| Botón verde | `background: #22c55e` | disabled: `bg s2, color dim` |
| Card | `translateY(-3px); border-color: var(--dim)` | — |
| Ítem dropdown | `background: var(--s3)` | active: igual |
| Tab | `border-color: var(--dim); color: var(--txt)` | active `.on`: bg rojo |
| Video controls | `background: rgba(255,255,255,.15)` | — |

**No hay scale-down en press**, no hay micro-interactions. Es una UI seca.

### Layout rules

- **Container fijo:** `.w { max-width: 1180px; margin: 0 auto; padding: 0 18px }`. Toda la app vive en ese ancho.
- **Header sticky:** `position: sticky; top: 0; z-index: 100`. Backdrop-blur 14px.
- **Grid responsive:** `repeat(auto-fill, minmax(136px, 1fr))` para resultados, `minmax(105px, 1fr)` en mobile.
- **Scrolls horizontales en filas curadas:** Tendencias y Continuar viendo usan `display: flex; gap: 10px; overflow-x: auto`.
- **Mobile (≤600px):** header colapsa a columna, posters bajan a 105px, modal de player se vuelve vertical.

### Color vibe de imagery

Las imágenes son **posters originales de TMDB** — viene como viene. No hay overlay, no hay tinte, no hay grain. El único tratamiento es:

- `object-fit: cover` + `aspect-ratio: 2/3`
- Borde 1px del color del background del card
- Fallback SVG gris muy oscuro cuando falla la carga
- Para R18: thumbs descargados via Node y servidos como base64 data-URL

---

## ICONOGRAPHY

### El stack actual: emoji-first

NovaCine **no tiene un icon font ni un set de SVGs propio**. La iconografía es 100% emoji Unicode + 2–3 caracteres especiales (`★`, `♥`, `⏹`, `▶`, `↺`, `←`, `→`, `↑`, `↓`, `⧉`, `±`).

Esto funciona porque:

1. La app es para sí mismo / un grupo pequeño → no necesita ser pixel-perfect cross-platform.
2. La paleta de iconos es **cerrada y consistente** — cada emoji tiene un significado fijo:

| Emoji | Significado | Dónde aparece |
|---|---|---|
| 🎬 | Película | Tab, placeholder, trending |
| 📺 | Serie | Tab, placeholder |
| 🎌 | Anime | Tab |
| 🔞 | Adulto / R18 | Tab |
| 🧲 | Torrent | Player tab, badges |
| 📡 | Embed server | Player tab |
| 🌎 | Latino / español | Buscar Latino |
| 🎧 | Audio | Tips |
| 📝 | Subtítulos | Botón subs |
| ⚡ | Velocidad de reproducción | Selector de speed |
| 💾 | Guardar | Save to Downloads |
| ⧉ | Picture-in-Picture | Botón PiP |
| ⏹ | Detener | Stop torrent |
| ▶ | Cargar / Play | Botón cargar URL |
| ↺ | Reload | Retry search |
| ⚙️ | Settings | Tips (player settings) |
| ⚠️ | Aviso | Footer |
| ★ | Rating | Cards |
| ♥ | Favorito | Toggle favoritos |
| 🔍 | Búsqueda | Botón buscar latino |
| 🔥 | Hot | Trending hoy |

### Sin SVG icon set, sin Heroicons, sin Lucide

Si vas a crear nuevas pantallas o componentes para NovaCine:

1. **Primero, intenta usar el emoji existente** de la tabla de arriba.
2. **Si necesitas algo nuevo y específico** (chevrons, badges, indicadores muy pequeños) → caracteres Unicode (`›`, `«`, `»`, `•`, `◉`) **antes que** introducir un icon font.
3. **Solo como último recurso**, si la app eventualmente requiere iconos de UI complejos (settings, filtros, menús contextuales), recomiendo añadir **Lucide** (`stroke-width: 1.5px`, color `var(--dim)` / `var(--txt)`) — encaja con el peso visual fino de la app.

> ⚠️ **Flag para el usuario:** No copiamos ningún set de iconos a `/assets/` porque el código fuente no usa ninguno. El día que se quiera modernizar (ej. para versión web React), recomiendo Lucide vía CDN — coincide con la estética minimal-line de NovaCine. Si prefieres mantener emoji-first, ese es perfectamente válido y es la decisión actual del proyecto.

### Logo

El logo es **tipográfico, no es un SVG**. Se renderiza como HTML:

```html
<div class="logo">Nova<em>Cine</em></div>
```

Con `font-family: 'Bebas Neue'; letter-spacing: .08em` — la palabra **Cine** va en `var(--red)` mediante el `<em>` (sin estilo de itálica). Ver `assets/logo.html` y `preview/component-logo.html`.

---

## CAVEATS

- **Fuentes:** se usan vía Google Fonts CDN (Bebas Neue + DM Sans). No se copian archivos `.ttf/.woff2` al proyecto. Si quieres self-hosting, descarga desde [fonts.google.com](https://fonts.google.com/specimen/Bebas+Neue) y [DM Sans](https://fonts.google.com/specimen/DM+Sans).
- **Iconografía:** emoji-first por decisión del proyecto. No hay icon set para copiar.
- **Imágenes:** no hay imágenes de marca propias; los posters vienen de TMDB en runtime.
- **R18:** el design system documenta los componentes (tab `🔞 +18`, badges), pero el UI kit no recrea la búsqueda R18 — sólo el flujo principal de catálogo + player.
- **WebTorrent / Backend:** está fuera del scope visual. El design system cubre la UI; la migración a web (separar frontend/backend, reemplazar IPC) la documenta `NOTAS.md` del repo, no este sistema.
