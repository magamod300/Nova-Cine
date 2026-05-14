# NovaCine — Build .exe automáticamente con GitHub Actions

## Qué hace este setup
Cada vez que hagas push a un repo de GitHub con estos archivos, **GitHub te compila automáticamente** un `.exe` y `.exe portable` de NovaCine. Sin instalar nada en tu PC.

## Pasos UNA SOLA VEZ (5 min)

### 1. Crea un repo nuevo en GitHub
- Ve a [github.com/new](https://github.com/new)
- Nombre: `nova-cine-app` (o lo que quieras)
- **Public** (necesario para Actions gratis ilimitadas)
- Click **Create repository**

### 2. Sube TODOS los archivos del ZIP que descargaste
Arrastra y suelta a GitHub web:
- `index.html`
- `novacine.html`
- `colors_and_type.css`
- `manifest.json`
- `sw.js`
- `electron-main.js` ← nuevo
- `package.json` ← nuevo
- carpeta `.github/workflows/build-exe.yml` ← nuevo
- carpeta `assets/`
- carpeta `fonts/`

### 3. Espera 5 min
GitHub Actions arranca solo. Ve a la pestaña **Actions** del repo y verás cómo compila.

### 4. Descarga tu .exe
Cuando termine (✓ verde), click el workflow → scroll abajo → **Artifacts** → `NovaCine-installer`.
Descomprimes y tienes:
- `NovaCine-Setup-5.2.3.exe` (instalador con menú inicio + desktop)
- `NovaCine-Portable-5.2.3.exe` (no necesita instalación, doble click y listo)

### 5. Releases automáticas
Cada commit a `main` también crea una **Release** automáticamente en `Releases/`. Tus amigos van ahí, descargan el .exe, lo abren. Listo.

## Cómo actualizar la app
Solo edita `novacine.html` o `index.html` en GitHub web → commit → 5 min después tienes nuevo .exe.

## Ventajas vs. la web
- ⚡ **Adblock real** a nivel proceso (bloquea popups/trackers de iframes embed)
- 🎮 **Atajos del SO** (Esc fullscreen, etc.)
- 💾 **No depende del navegador**
- 📦 **App instalable** con icono en escritorio

## Si quieres compilar local en tu PC en vez de GitHub
```
npm install
npm run dist
```
Tarda 2-3 min. El .exe queda en `dist/`.
Requiere Node.js 20+ instalado: [nodejs.org](https://nodejs.org).
