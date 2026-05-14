# NovaCine — Notas de proyecto

## Qué es
App Electron (win32) para ver películas/series/anime/R18 **sin anuncios**.  
Stack: `Electron 29` · `Node.js` · `WebTorrent@1` · `TMDB API` · HTML/CSS/JS puro (sin framework).

```
resources/app/
  main.js       ← proceso Node: WebTorrent, IPC, ad-block, proxy imagen, subtítulos
  preload.js    ← bridge contextBridge → renderer
  src/index.html ← toda la UI + lógica (~1800 líneas)
  node_modules/webtorrent/
```

---

## Ambición del usuario
- **Ver cualquier contenido** (películas, series, anime, R18) desde una sola app limpia
- **Sin anuncios** en ninguna capa (main process bloquea ~60 dominios ad)
- **Español latino primero** — que el contenido se pueda ver en español siempre que exista
- **Torrents como fuente principal** — stream P2P → `<video>` nativo, sin depender de servers embed externos que caen
- **R18 funcional** — que se pueda buscar y reproducir sin que el antivirus lo bloquee
- Interfaz bonita tipo Netflix oscuro, que "se vea bien"

---

## Lo que funciona hoy (v3)

| Feature | Estado |
|---|---|
| Búsqueda TMDB (películas/series/anime/+18) | ✅ |
| Trending home al arrancar | ✅ |
| Continuar viendo (localStorage) | ✅ |
| Favoritos | ✅ |
| Ad-block en webview + main process | ✅ |
| Tab Torrents: busca YTS/EZTV/Nyaa | ✅ |
| Stream torrent → `<video>` local (Range HTTP) | ✅ |
| Subtítulos ES via OpenSubtitles (.srt→.vtt) | ✅ (necesita API key válida) |
| Tab Servidores embed (12 servers) | ✅ |
| Servidores ES: Videasy, VidLink, vidsrc.su, 2embed, NontonGo, frembed, Warezcdn | ✅ |
| Servidores STD: StreamIMDB, vidsrc.to, VidFast, vidsrc.cc, autoembed, embed.su, vidsrc.me, moviesapi, 111movies, MultiEmbed, sflix | ✅ |
| Tráiler via Invidious (evita Error 153 YouTube) | ✅ |
| IMDB URL / tt-ID en buscador → carga directa | ✅ |
| R18 TMDB adulto → auto tab servidores | ✅ |
| R18 Pornhub embed → webview (tracking bloqueado) | ✅ |
| Proxy imagen vía Node (evita bloqueo AV) | ✅ |
| Atajos teclado: Espacio/F/←→/↑↓/M | ✅ |
| Magnet directo en campo URL | ✅ |
| Buscar Latino: YouTube/ok.ru/Cuevana3/CineCalidad/Pelisplus/AnimeFLV | ✅ |
| Progreso torrent en tiempo real | ✅ |

---

## Problemas conocidos / pendientes

### Críticos
```
1. Subtítulos: API key OpenSubtitles hardcodeada es falsa → siempre falla
   Fix: registrar en opensubtitles.com y poner clave real, o usar YifySubtitles (sin key)
   URL: https://yifysubtitles.ch/movie-imdb/{imdbId}

2. Torrents en películas recientes (2025-2026): YTS las indexa con días/semanas de retraso
   → El usuario ve "sin torrents" para películas nuevas. Normal. Informar mejor en UI.

3. R18 Pornhub: Windows Defender puede seguir bloqueando a nivel proceso aunque
   los dominios ad están en la lista negra. Solución real: no llamar a PH API desde
   Node (main process), sino desde el renderer directamente dentro del webview.
```

### Mejoras pendientes
```
4. Historial antiguo: posters guardados antes del fix (sin "/" inicial) siguen rotos.
   Fix rápido: al cargar historial, si poster no empieza con "/", añadir "/".

5. Subtítulos para series: fetchSubtitles pasa type=movie siempre.
   Fix: pasar type correcto + season/episode.

6. Auto-fallback de servidores al siguiente si el actual falla en <5s
   (actualmente espera 15s).

7. Descargar para offline: WebTorrent ya descarga en /tmp/novacine,
   solo falta un botón "Guardar en Descargas" que mueva el archivo.

8. Más fuentes torrents en español:
   - DivxTotal: scraping (español latino)
   - PeliculasYSeries: scraping
   - MejorTorrent: scraping

9. Recomendaciones post-reproducción: TMDB endpoint /movie/{id}/recommendations

10. Velocidad de reproducción (1x/1.25x/1.5x/2x) en el <video> nativo.

11. Picture-in-Picture: videoEl.requestPictureInPicture() — una línea.

12. Modo offline: mostrar solo "Continuar viendo" si no hay red.
```

### Servidores R18 adicionales (TMDB adult IDs)
```js
// Estos aceptan TMDB IDs y tienen contenido adulto indexado:
{ n:'vidsrc.to R18', imdb:true, m:id=>`https://vidsrc.to/embed/movie/${id}` }
{ n:'embed.su R18',  m:id=>`https://embed.su/embed/movie/${id}` }
// Para Pornhub embed sin bloqueo AV → cargar en webview con sesión aislada,
// no en main process.
```

---

## Arquitectura IPC actual

```
renderer → preload (contextBridge) → main process (Node.js)

window.nativeAPI.{
  fetchURL(url)           → nodeFetch bypass CORS
  proxyImage(url)         → descarga img → base64
  searchTorrents(opts)    → YTS + EZTV + Nyaa
  streamTorrent(magnet)   → WebTorrent → localhost:PORT
  stopTorrent()
  torrentProgress()       → { progress, speed, peers }
  fetchSubtitles(opts)    → OpenSubtitles → VTT string
  toggleFullscreen()
}
```

---

## Variables de estado (S)
```js
S = {
  type,          // 'movie'|'tv'|'anime'|'r18'
  tmdbId, imdbId, title, posterPath,
  isSeries, seasons, curS, curE,
  dynUrls,       // fuentes "Buscar Latino"
  activeBtn, activeSrv,
  reqId,         // race condition prevention
  activeTab,     // 'torrent'|'server'
  activeMagnet,
  progressInterval,
}
```

---

## Próximos pasos sugeridos (orden de impacto)

1. **Fix subtítulos** → YifySubtitles sin API key
2. **Fix historial roto** → migrar posters con "/" faltante  
3. **Download offline** → mover archivo de /tmp a Downloads
4. **Recomendaciones** → sección "Te puede gustar" post-reproducción
5. **DivxTotal scraping** → torrents en español
6. **PiP** → una línea de código
7. **Velocidad reproducción** → control en UI del `<video>`
