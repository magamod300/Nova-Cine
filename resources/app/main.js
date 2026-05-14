'use strict';
const { app, BrowserWindow, ipcMain, session } = require('electron');

/* Permitir autoplay en webviews sin gesto del usuario */
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'AutoplayIgnoreWebAudio');
const path  = require('path');
const https = require('https');
const http  = require('http');
const zlib  = require('zlib');
const os    = require('os');

let WebTorrent;
try { WebTorrent = require('webtorrent'); } catch(e) { console.warn('[NovaCine] WebTorrent no disponible:', e.message); }

/* ══ AD-BLOCK ══ */
const AD_DOMAINS = new Set([
  'popads.net','popcash.net','popunder.net','clickunder.net',
  'popin.cc','popuptraffic.com','trafficrouter.io','promo.acint.net',
  'cdn.4dsply.com','overlayads.com','bigbangmedia.net','clickfrog.net',
  'exoclick.com','trafficjunky.net','juicyads.com','hilltopads.net',
  'plugrush.com','adsterra.com','adcash.com','adskeeper.co.uk',
  'kadam.net','mgcash.com','clickadu.com','propellerads.com',
  'adf.ly','adfly.com','sh.st','shorte.st','ouo.io','fc.lc',
  'googlesyndication.com','doubleclick.net','googleadservices.com',
  'pagead2.googlesyndication.com','tpc.googlesyndication.com',
  'adservice.google.com','partner.googleadservices.com',
  'adsenseformobileapps.com','adnxs.com','appnexus.com',
  'openx.net','pubmatic.com','rubiconproject.com','criteo.com',
  'indexexchange.com','bidswitch.net','rlcdn.com','casalemedia.com',
  'sovrn.com','districtm.io','sharethrough.com','yieldmo.com',
  'undertone.com','lijit.com','turn.com','adsrvr.org','mathtag.com',
  '33across.com','amazon-adsystem.com','taboola.com','outbrain.com',
  'mgid.com','revcontent.com','media.net','zedo.com','adroll.com',
  'flashtalking.com','smartadserver.com','advertising.com',
  'adblade.com','bidvertiser.com','hotjar.com','quantserve.com',
  'scorecardresearch.com','clicksor.net','optimatic.com',
  'ads.twitter.com','advertising.microsoft.com','bs.serving-sys.com',
  /* dominios de tracking de sitios adultos */
  'ukankingwithea.co','traffichaus.com','trafichave.com',
  'traffic-media.co','sexad.net','trafficstars.com','etahub.com',
  'adsprofitter.com','tsyndicate.com','t.acam.co','t.acam.io',
  'realsrv.com','smatoo.com','liveintent.com',
]);

function isAd(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      if (AD_DOMAINS.has(parts.slice(i).join('.'))) return true;
    }
  } catch {}
  return false;
}

function setupAdBlock(sess) {
  try {
    sess.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (det, cb) => {
      cb({ cancel: isAd(det.url) });
    });
  } catch(e) { console.warn('AdBlock setup error:', e.message); }
}

/* ══ APP READY ══ */
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

app.whenReady().then(() => {
  const playerSess = session.fromPartition('persist:player');
  setupAdBlock(playerSess);
  setupAdBlock(session.defaultSession);

  playerSess.setUserAgent(CHROME_UA);
  session.defaultSession.setUserAgent(CHROME_UA);

  const win = new BrowserWindow({
    width: 1300, height: 860,
    minWidth: 960, minHeight: 640,
    backgroundColor: '#090910',
    title: 'NovaCine',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      spellcheck: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.setMenuBarVisibility(false);

  win.webContents.on('did-attach-webview', (_ev, wvContents) => {
    wvContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    setupAdBlock(wvContents.session);
  });

  /* fullscreen IPC */
  ipcMain.handle('toggle-fullscreen', () => {
    win.setFullScreen(!win.isFullScreen());
    return win.isFullScreen();
  });
});

app.on('window-all-closed', () => {
  if (streamServer) { streamServer.close(); }
  if (wtClient)     { wtClient.destroy(); }
  if (process.platform !== 'darwin') app.quit();
});

/* ══ IPC: fetch-url ══ */
ipcMain.handle('fetch-url', (_e, url) => nodeFetch(url, 0));

/* ══ IPC: search-r18 ══
   Busca en xvideos.com desde Node (evita CORS y AV en renderer).
   Retorna array de { id, title, thumb, embedUrl }
*/
ipcMain.handle('search-r18', async (_e, query) => {
  const results = [];
  try {
    const q = query ? encodeURIComponent(query.trim()) : '';
    const url = q
      ? `https://www.xvideos.com/?k=${q}`
      : 'https://www.xvideos.com/new/0';
    const html = await nodeFetchRaw(url);
    if (!html) return results;

    /* Extraer IDs de video */
    const ids = [];
    const idRx = /id="video-(\d+)"/g;
    let m;
    while ((m = idRx.exec(html)) !== null) {
      if (!ids.includes(m[1])) ids.push(m[1]);
      if (ids.length >= 24) break;
    }

    for (const id of ids) {
      /* Título */
      const titleRx = new RegExp(`href="/video${id}/[^"]*"\\s+title="([^"]+)"`);
      const titleM  = html.match(titleRx);
      const title   = titleM ? titleM[1].trim() : `Video ${id}`;

      /* Miniatura: xvideos usa n:src o data-src en el thumb img dentro del bloque del video */
      const blockIdx = html.indexOf(`id="video-${id}"`);
      let thumb = null;
      if (blockIdx >= 0) {
        const block = html.slice(blockIdx, blockIdx + 2000);
        const thumbM = block.match(/(?:n:src|data-src|src)="(https:\/\/cdn[^"]+\.jpg[^"]*)"/);
        if (thumbM) thumb = thumbM[1].split(' ')[0]; /* quitar parámetros extra */
      }

      results.push({
        id,
        title,
        thumb,
        embedUrl: `https://www.xvideos.com/embedframe/${id}`,
        isR18direct: true,
      });
    }
  } catch(e) { console.warn('[search-r18] xvideos:', e.message); }
  return results;
});

/* ══ IPC: proxy-image ══
   Descarga una imagen vía Node.js y devuelve data-URL base64.
   Evita bloqueos de CSP / antivirus en el renderer.
*/
ipcMain.handle('proxy-image', async (_e, url) => {
  return new Promise(resolve => {
    if (!url || !url.startsWith('http')) { resolve(null); return; }
    const mod = url.startsWith('https') ? https : http;
    const opts = {
      headers: { 'User-Agent': CHROME_UA, 'Referer': (() => { try { return new URL(url).origin; } catch { return ''; } })() },
      timeout: 8000,
      rejectUnauthorized: false,
    };
    try {
      const req = mod.get(url, opts, res => {
        if (res.statusCode >= 400) { res.destroy(); resolve(null); return; }
        const ct = res.headers['content-type'] || 'image/jpeg';
        const enc = (res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        try {
          if (enc === 'gzip')    stream = res.pipe(zlib.createGunzip());
          else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());
        } catch { stream = res; }
        const chunks = [];
        stream.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        stream.on('end',  () => resolve(`data:${ct};base64,${Buffer.concat(chunks).toString('base64')}`));
        stream.on('error', () => resolve(null));
      });
      req.on('error',   () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch { resolve(null); }
  });
});

/* ══ WEBTORRENT ══ */
let wtClient     = null;
let activeTorrent = null;
let streamServer  = null;

function getWTClient() {
  if (!wtClient && WebTorrent) {
    wtClient = new WebTorrent();
    wtClient.on('error', err => console.warn('[WebTorrent]', err.message));
  }
  return wtClient;
}

function buildMagnet(hash, title) {
  const tr = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:80/announce',
    'udp://p4p.arenabg.com:1337/announce',
    'udp://tracker.tiny-vps.com:6969/announce',
    'udp://tracker.internetwarriors.net:1337/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.moeking.me:6969/announce',
    'https://tracker.opentrackr.org/announce',
    'https://open.stealth.si/announce',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.dev',
  ].map(t => `tr=${encodeURIComponent(t)}`).join('&');
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}&${tr}`;
}

function formatBytes(b) {
  if (!b) return '?';
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
  return (b / 1e6).toFixed(0) + ' MB';
}

/* ══ IPC: search-torrents ══ */
ipcMain.handle('search-torrents', async (_e, { imdbId, title, type, season, episode }) => {
  const results = [];

  if (type === 'movie' || type === 'r18') {
    /* ── YTS (películas) ── */
    try {
      const url = imdbId
        ? `https://yts.mx/api/v2/movie_details.json?imdb_id=${imdbId}`
        : `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(title)}&limit=5`;
      const data = await nodeFetchJSON(url);
      const movies = data?.data?.movie
        ? [data.data.movie]
        : (data?.data?.movies || []);
      movies.forEach(m => {
        (m.torrents || []).forEach(t => {
          results.push({
            source: 'YTS',
            quality: t.quality,
            size: t.size || formatBytes(t.size_bytes),
            seeds: t.seeds || 0,
            peers: t.peers || 0,
            magnet: buildMagnet(t.hash, m.title_long || title),
            lang: 'en',
          });
        });
      });
    } catch(e) { console.warn('[search-torrents] YTS:', e.message); }

    /* ── APIBAY fallback cuando YTS no devuelve nada ── */
    if (!results.length) {
      try {
        const q = encodeURIComponent(imdbId || title);
        const apiUrl = imdbId
          ? `https://apibay.org/q.php?q=${imdbId}&cat=207`
          : `https://apibay.org/q.php?q=${q}&cat=207`;
        const data = await nodeFetchJSON(apiUrl);
        const ZERO_HASH = '0000000000000000000000000000000000000000';
        (Array.isArray(data) ? data : [])
          .filter(t => t.info_hash && t.info_hash !== ZERO_HASH)
          .slice(0, 10)
          .forEach(t => {
            const name = t.name || title;
            results.push({
              source: 'TPB',
              quality: /2160|4k/i.test(name) ? '4K' : /1080/i.test(name) ? '1080p' : /720/i.test(name) ? '720p' : 'HD',
              size: formatBytes(parseInt(t.size) || 0),
              seeds: parseInt(t.seeders) || 0,
              peers: parseInt(t.leechers) || 0,
              magnet: buildMagnet(t.info_hash, name),
              lang: 'en',
            });
          });
        console.log(`[search-torrents] APIBAY: ${results.length} resultados`);
      } catch(e) { console.warn('[search-torrents] APIBAY:', e.message); }
    }

  } else {
    /* ── EZTV (series) ── */
    if (imdbId) {
      try {
        const imdbNum = imdbId.replace('tt', '');
        const data = await nodeFetchJSON(`https://eztv.re/api/get-torrents?imdb_id=${imdbNum}&limit=100`);
        (data?.torrents || [])
          .filter(t => season == null || String(t.season) === String(season))
          .filter(t => episode == null || String(t.episode) === String(episode))
          .forEach(t => {
            results.push({
              source: 'EZTV',
              quality: t.quality || 'HD',
              size: formatBytes(t.size_bytes),
              seeds: t.seeds || 0,
              peers: t.peers || 0,
              magnet: t.magnet_url,
              season: t.season,
              episode: t.episode,
              lang: 'en',
            });
          });
      } catch(e) { console.warn('[search-torrents] EZTV:', e.message); }
    }

    /* ── Nyaa (anime) ── */
    if (type === 'anime') {
      try {
        const q = encodeURIComponent(title);
        const rss = await nodeFetchRaw(`https://nyaa.si/?page=rss&q=${q}&c=1_0&f=0`);
        const matches = [...rss.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<nyaa:seeders>(\d+)<\/nyaa:seeders>[\s\S]*?<nyaa:size>([\s\S]*?)<\/nyaa:size>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/g)];
        matches.slice(0, 10).forEach(m => {
          results.push({
            source: 'Nyaa',
            quality: m[1].includes('1080') ? '1080p' : m[1].includes('720') ? '720p' : 'HD',
            size: m[3].trim(),
            seeds: parseInt(m[2]) || 0,
            magnet: m[4].trim(),
            lang: m[1].toLowerCase().includes('sub') ? 'sub' : m[1].toLowerCase().includes('dub') ? 'dub' : 'ja',
          });
        });
      } catch(e) { console.warn('[search-torrents] Nyaa:', e.message); }
    }
  }

  return results.sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
});

/* ══ IPC: stream-torrent ══ */
ipcMain.handle('stream-torrent', (_e, magnet) => {
  return new Promise((resolve, reject) => {
    const client = getWTClient();
    if (!client) { reject(new Error('WebTorrent no disponible')); return; }

    /* Parar torrent anterior */
    if (streamServer)  { streamServer.close(); streamServer = null; }
    if (activeTorrent) {
      try { client.remove(activeTorrent.infoHash); } catch {}
      activeTorrent = null;
    }

    let settled = false;
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      if (err) reject(err); else resolve(val);
    };

    const to = setTimeout(() => done(new Error('Timeout (30s) al obtener metadatos')), 30000);

    client.once('error', err => done(err));

    client.add(magnet, { path: path.join(os.tmpdir(), 'novacine') }, torrent => {
      activeTorrent = torrent;

      /* Archivo de video más grande */
      const VIDEO_EXT = ['.mp4','.mkv','.avi','.mov','.webm','.m4v','.ts'];
      const vFiles = torrent.files.filter(f =>
        VIDEO_EXT.some(x => f.name.toLowerCase().endsWith(x))
      );
      const vFile = (vFiles.length ? vFiles : torrent.files)
        .reduce((a, b) => a.length > b.length ? a : b);

      vFile.select();

      /* Servidor HTTP con soporte Range (necesario para <video> seeking) */
      /* Servir siempre como video/mp4 — Chromium/Electron lo acepta para MKV/AVI/MP4 */
      const ctype = 'video/mp4';

      const srv = http.createServer((req, res) => {
        const total = vFile.length;
        const rangeHeader = req.headers.range;

        if (rangeHeader) {
          const [s, e] = rangeHeader.replace(/bytes=/, '').split('-');
          const start = parseInt(s, 10);
          const end   = e ? parseInt(e, 10) : Math.min(start + 5 * 1024 * 1024, total - 1);
          res.writeHead(206, {
            'Content-Range':  `bytes ${start}-${end}/${total}`,
            'Accept-Ranges':  'bytes',
            'Content-Length': end - start + 1,
            'Content-Type':   ctype,
            'Access-Control-Allow-Origin': '*',
          });
          vFile.createReadStream({ start, end }).pipe(res).on('error', () => {});
        } else {
          res.writeHead(200, {
            'Content-Length': total,
            'Content-Type':   ctype,
            'Accept-Ranges':  'bytes',
            'Access-Control-Allow-Origin': '*',
          });
          vFile.createReadStream().pipe(res).on('error', () => {});
        }
        res.on('error', () => {});
      });

      srv.listen(0, '127.0.0.1', () => {
        streamServer = srv;
        done(null, {
          url:      `http://127.0.0.1:${srv.address().port}/video`,
          name:     vFile.name,
          size:     formatBytes(vFile.length),
          infoHash: torrent.infoHash,
        });
      });

      srv.on('error', err => done(err));
    });
  });
});

/* ══ IPC: save-to-downloads ══ */
ipcMain.handle('save-to-downloads', async () => {
  if (!activeTorrent) return { ok: false, error: 'No hay torrent activo' };
  const VIDEO_EXT = ['.mp4','.mkv','.avi','.mov','.webm','.m4v','.ts'];
  const vFiles = activeTorrent.files.filter(f =>
    VIDEO_EXT.some(x => f.name.toLowerCase().endsWith(x))
  );
  const vFile = (vFiles.length ? vFiles : activeTorrent.files)
    .reduce((a, b) => a.length > b.length ? a : b);
  const dest = path.join(os.homedir(), 'Downloads', vFile.name);
  const src  = path.join(os.tmpdir(), 'novacine', vFile.path);
  const fs   = require('fs');
  try {
    await fs.promises.copyFile(src, dest);
    return { ok: true, path: dest, name: vFile.name };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

/* ══ IPC: stop-torrent ══ */
ipcMain.handle('stop-torrent', async () => {
  if (streamServer) { streamServer.close(); streamServer = null; }
  if (activeTorrent && wtClient) {
    try { wtClient.remove(activeTorrent.infoHash); } catch {}
    activeTorrent = null;
  }
});

/* ══ IPC: torrent-progress ══ */
ipcMain.handle('torrent-progress', () => {
  if (!activeTorrent) return null;
  return {
    progress:      Math.round(activeTorrent.progress * 100),
    downloadSpeed: formatBytes(activeTorrent.downloadSpeed) + '/s',
    uploadSpeed:   formatBytes(activeTorrent.uploadSpeed)   + '/s',
    peers:         activeTorrent.numPeers,
    ratio:         activeTorrent.ratio?.toFixed(2),
  };
});

/* ══ ZIP EXTRACTOR (sin dependencias externas) ══
   Extrae el primer .srt de un buffer ZIP usando zlib.inflateRawSync
*/
function extractSrtFromZip(buf) {
  let pos = 0;
  while (pos < buf.length - 30) {
    if (buf[pos] === 0x50 && buf[pos+1] === 0x4b && buf[pos+2] === 0x03 && buf[pos+3] === 0x04) {
      const method     = buf.readUInt16LE(pos + 8);
      const compSize   = buf.readUInt32LE(pos + 18);
      const uncompSize = buf.readUInt32LE(pos + 22);
      const fnLen      = buf.readUInt16LE(pos + 26);
      const extraLen   = buf.readUInt16LE(pos + 28);
      const filename   = buf.slice(pos + 30, pos + 30 + fnLen).toString('utf8');
      const dataStart  = pos + 30 + fnLen + extraLen;
      if (filename.toLowerCase().endsWith('.srt')) {
        try {
          const raw  = buf.slice(dataStart, dataStart + (compSize || uncompSize));
          const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
          return data.toString('utf8');
        } catch { /* intentar siguiente entrada */ }
      }
      const next = dataStart + (compSize || 0);
      pos = next > pos ? next : pos + 1;
    } else { pos++; }
  }
  return null;
}

async function downloadBinary(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http;
    const opts = {
      headers: { 'User-Agent': CHROME_UA },
      timeout: 15000,
      rejectUnauthorized: false,
    };
    try {
      const req = mod.get(url, opts, res => {
        if (res.statusCode >= 400) { res.destroy(); resolve(null); return; }
        const chunks = [];
        res.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end',  () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('error',   () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch { resolve(null); }
  });
}

/* ══ IPC: fetch-subtitles ══
   1. SubDL (gratis, sin key requerida para uso bajo)
   2. OpenSubtitles REST anónimo (fallback, ~5 req/día)
*/
ipcMain.handle('fetch-subtitles', async (_e, { imdbId, lang = 'es', type = 'movie', season, episode }) => {
  if (!imdbId) return null;

  /* ── 1. SubDL ── */
  try {
    const isTV = type === 'tv' || type === 'anime';
    let sdUrl = `https://api.subdl.com/api/v1/subtitles/?imdb_id=${imdbId}&languages=ES&subs_per_page=5&type=${isTV ? 'tv' : 'movie'}`;
    if (isTV && season)  sdUrl += `&season_number=${season}`;
    if (isTV && episode) sdUrl += `&episode_number=${episode}`;
    const sdData = await nodeFetchJSON(sdUrl);
    const subs   = sdData?.subtitles || [];
    const best   = subs.find(s => /spanish|español|^es$/i.test(s.lang)) || subs[0];
    if (best?.url) {
      const zipBuf = await downloadBinary(`https://dl.subdl.com${best.url}`);
      if (zipBuf) {
        const srt = extractSrtFromZip(zipBuf);
        if (srt) { console.log('[subs] SubDL ✓'); return srtToVtt(srt); }
      }
    }
  } catch(e) { console.warn('[fetch-subtitles] SubDL:', e.message); }

  /* ── 2. OpenSubtitles (anónimo, sin Api-Key) ── */
  try {
    const osType = (type === 'tv' || type === 'anime') ? 'episode' : 'movie';
    const data = await nodeFetchJSON(
      `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId.replace('tt','')}&languages=${lang}&type=${osType}`,
      { 'Content-Type': 'application/json' }
    );
    const files = data?.data?.[0]?.attributes?.files;
    if (files?.length) {
      const fileId = files[0].file_id;
      const dlData = await nodeFetchJSON(
        'https://api.opensubtitles.com/api/v1/download',
        { 'Content-Type': 'application/json' },
        'POST',
        JSON.stringify({ file_id: fileId })
      );
      if (dlData?.link) {
        const srt = await nodeFetchRaw(dlData.link);
        console.log('[subs] OpenSubtitles ✓');
        return srtToVtt(srt);
      }
    }
  } catch(e) { console.warn('[fetch-subtitles] OpenSubtitles:', e.message); }

  return null;
});

function srtToVtt(srt) {
  return 'WEBVTT\n\n' + srt
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .replace(/^\d+\n/gm, '');
}

/* ══ HTTP HELPERS ══ */
function nodeFetch(url, hops) {
  return new Promise(resolve => {
    if (hops > 5) { resolve({ ok:false, error:'too many redirects' }); return; }
    const mod = url.startsWith('https') ? https : http;
    const opts = {
      headers: {
        'User-Agent': CHROME_UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout: 12000,
      rejectUnauthorized: false,
    };
    try {
      const req = mod.get(url, opts, res => {
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          res.destroy();
          let loc = res.headers.location;
          if (!loc.startsWith('http')) { try { loc = new URL(loc, url).href; } catch { resolve({ok:false,error:'bad redirect'}); return; } }
          nodeFetch(loc, hops+1).then(resolve);
          return;
        }
        collectBody(res, resolve, res.statusCode);
      });
      req.on('error',   e => resolve({ok:false, error:e.message}));
      req.on('timeout', () => { req.destroy(); resolve({ok:false, error:'timeout'}); });
    } catch(e) { resolve({ok:false, error:String(e)}); }
  });
}

async function nodeFetchJSON(url, extraHeaders = {}, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'User-Agent': CHROME_UA,
        'Accept': 'application/json',
        ...extraHeaders,
      },
      timeout: 15000,
      rejectUnauthorized: false,
    };
    const req = mod.request(opts, res => {
      collectBody(res, r => {
        if (!r.ok) { reject(new Error(`HTTP ${r.status}`)); return; }
        try { resolve(JSON.parse(r.body)); } catch(e) { reject(e); }
      }, res.statusCode);
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function nodeFetchRaw(url) {
  const res = await nodeFetch(url, 0);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.body;
}

function collectBody(res, resolve, status) {
  const enc = (res.headers['content-encoding']||'').toLowerCase();
  let stream = res;
  try {
    if (enc==='gzip')    stream = res.pipe(zlib.createGunzip());
    else if (enc==='deflate') stream = res.pipe(zlib.createInflate());
    else if (enc==='br') stream = res.pipe(zlib.createBrotliDecompress());
  } catch { stream=res; }
  const chunks=[]; let total=0;
  stream.on('data', c => { chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c)); total+=c.length; if(total>5e6) stream.destroy(); });
  stream.on('end',  () => { try { resolve({ok:status>=200&&status<400, body:Buffer.concat(chunks).toString('utf8'), status}); } catch(e){ resolve({ok:false,error:'decode:'+e.message}); }});
  stream.on('error', e => resolve({ok:false, error:e.message}));
}
