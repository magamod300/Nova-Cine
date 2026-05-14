const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeAPI', {
  isElectron: true,

  /* Fetch sin CORS — Node.js hace la solicitud real */
  fetchURL: (url) => ipcRenderer.invoke('fetch-url', url),

  /* Proxy de imagen → data URL base64 (evita bloqueos AV/CSP) */
  proxyImage: (url) => ipcRenderer.invoke('proxy-image', url),

  /* Buscar torrents en YTS / EZTV / Nyaa */
  searchTorrents: (opts) => ipcRenderer.invoke('search-torrents', opts),

  /* Iniciar streaming de un magnet link → devuelve { url, name, size } */
  streamTorrent: (magnet) => ipcRenderer.invoke('stream-torrent', magnet),

  /* Detener el torrent activo y liberar recursos */
  stopTorrent: () => ipcRenderer.invoke('stop-torrent'),

  /* Progreso del torrent activo → { progress, downloadSpeed, peers } */
  torrentProgress: () => ipcRenderer.invoke('torrent-progress'),

  /* Buscar subtítulos en español (SubDL / OpenSubtitles) → VTT string o null */
  fetchSubtitles: (opts) => ipcRenderer.invoke('fetch-subtitles', opts),

  /* Guardar archivo del torrent activo en ~/Downloads */
  saveToDownloads: () => ipcRenderer.invoke('save-to-downloads'),

  /* Fullscreen nativo de Electron */
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),

  /* Buscar contenido R18 en xvideos (Node evita CORS y AV) */
  searchR18: (query) => ipcRenderer.invoke('search-r18', query),
});
