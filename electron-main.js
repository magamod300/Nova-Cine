'use strict';
const { app, BrowserWindow, session } = require('electron');
const path = require('path');

/* Permitir autoplay en webviews sin gesto del usuario */
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'AutoplayIgnoreWebAudio');

/* Ad-block de dominios conocidos */
const AD_DOMAINS = new Set([
  'popads.net','popcash.net','popunder.net','clickunder.net','popin.cc',
  'exoclick.com','trafficjunky.net','juicyads.com','hilltopads.net',
  'plugrush.com','adsterra.com','adcash.com','propellerads.com',
  'googlesyndication.com','doubleclick.net','googleadservices.com',
  'adnxs.com','appnexus.com','openx.net','pubmatic.com','rubiconproject.com',
  'criteo.com','taboola.com','outbrain.com','mgid.com','revcontent.com',
  'amazon-adsystem.com','adsrvr.org','mathtag.com','realsrv.com',
  'tsyndicate.com','adsterra.io','propellerclick.com',
]);

function isAd(url){
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++){
      if (AD_DOMAINS.has(parts.slice(i).join('.'))) return true;
    }
  } catch{}
  return false;
}

function setupAdBlock(sess){
  try {
    sess.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (det, cb) => {
      cb({ cancel: isAd(det.url) });
    });
  } catch{}
}

app.whenReady().then(() => {
  setupAdBlock(session.defaultSession);

  const win = new BrowserWindow({
    width: 1400, height: 880,
    minWidth: 960, minHeight: 600,
    backgroundColor: '#09090f',
    title: 'NovaCine',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      spellcheck: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.setMenuBarVisibility(false);

  /* Bloquear popups en iframes embed */
  win.webContents.setWindowOpenHandler(({ url }) => {
    /* Permitir abrir links explícitos del usuario (Buscar Latino, etc) en navegador del sistema */
    require('electron').shell.openExternal(url).catch(()=>{});
    return { action: 'deny' };
  });

  win.webContents.on('did-attach-webview', (_ev, wvContents) => {
    wvContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    setupAdBlock(wvContents.session);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
