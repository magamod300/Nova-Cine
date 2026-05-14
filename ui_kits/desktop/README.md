# NovaCine Desktop — UI Kit

Recreación navegable de la app Electron de NovaCine. Una sola pantalla con:

- **Header sticky** — logo, búsqueda, tipo (Película / Serie / Anime / +18), URL bar
- **Home** — `Continuar viendo` (scroll horizontal) + `Tendencias` (grid)
- **Player** — meta con poster + tags, tabs `🧲 Torrents` / `📡 Servidores embed`, lista de torrents con progreso, video player fake, server pills con status dots, `🌎 Buscar Latino`
- **Footer** — versión + créditos cómplices

Click cualquier card → entra al player. Click logo o "Buscar" → vuelve.

## Por qué un solo HTML

NovaCine original es así: 1 `index.html` con HTML/CSS/JS puro, sin framework. El UI kit replica esa decisión arquitectónica. Los "componentes JSX" del prompt no aplican porque no hay React aquí — toda la modularidad es CSS classes + funciones globales.

## Fakes intencionales

- Posters: gradientes coloreados + título en Bebas Neue (en la app real son imágenes de TMDB)
- Video: caja negra con ▶ + spinner (en real es `<video>` con stream HTTP local desde WebTorrent)
- Servidores: status dots fijos para demo (ok / loading / fail / idle)
- Subtítulos: badge verde estático
