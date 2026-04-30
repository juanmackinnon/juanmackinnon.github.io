# JPM Apps — Home de micro-apps personales

Home dinámica que carga apps desde `apps.json` y las renderiza automáticamente. Punto de entrada del ecosistema de PWAs personales deployadas en GitHub Pages.

## Características

- Carga dinámica desde `apps.json` — no hace falta editar HTML
- PWA completa — funciona offline y se puede instalar en pantalla de inicio
- Mobile-first — diseñado para 375px, responsive en 768px y 1024px
- Toggle dark/light — dark por defecto, guardado en localStorage
- Sin dependencias — HTML, CSS y JavaScript vanilla
- GitHub Pages compatible — rutas relativas, funciona en subdirectorios
- Service Worker para caché y funcionamiento offline

## Estructura del repo

```
repo/
├── index.html          # Home / Linktree raíz
├── styles.css          # Estilos del ecosistema (dark-first, Space Grotesk)
├── app.js              # Lógica de la home
├── apps.json           # ← EDITAR AQUÍ para agregar/quitar apps
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (cache: apps-home-v2)
├── README.md           # Este archivo
├── icons/              # Íconos PNG para manifest y app cards
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── not-its-ias.png
│   ├── gastos.png
│   └── antipro.png
│
├── antipro/            # App: destrábate con pasos micro-accionables
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json
│   ├── sw.js
│   └── README.md
│
├── gastos/             # App: gestión de gastos, cuentas y transferencias
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json
│   ├── sw.js
│   └── README.md
│
├── not-ITS-ias/        # App: agregador de noticias ITS y Smart Cities
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json
│   ├── sw.js
│   ├── fetch_news.py
│   ├── news.json
│   └── README.md
│
└── .github/
    └── workflows/
        └── update-news.yml   # Cron 3x/día para actualizar noticias ITS
```

## Design system

- **Fuente principal:** Space Grotesk (400, 500, 600, 700) — Google Fonts
- **Fuente mono:** JetBrains Mono (400, 500) — Google Fonts
- **Tema:** Dark-first. Toggle manual con clase `style-light` en `<body>`
- **localStorage key (home):** `newco-apps-theme` → `'light'` | `'dark'`

### Colores principales
| Token | Dark | Light |
|---|---|---|
| `--bg-main` | `#080d14` | `#f0f4f8` |
| `--bg-surface` | `#0f172a` | `#e8edf4` |
| `--bg-card` | `#111827` | `#ffffff` |
| `--accent` | `#3b82f6` | `#2563eb` |
| `--text-primary` | `#f0f4f8` | `#0f172a` |

## Formato de apps.json

```json
[
  {
    "name": "Nombre de la App",
    "path": "./nombre-app/",
    "description": "Descripción breve (máx 80 caracteres)",
    "icon": "./icons/nombre-app.png"
  }
]
```

El campo `icon` es opcional. Si no está, la tarjeta muestra solo nombre y descripción.

## Agregar una nueva app

1. Crear carpeta `nombre-app/` con `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`
2. Agregar entrada en `apps.json`
3. Agregar ícono en `icons/nombre-app.png` (opcional)
4. Push a `main` — GitHub Pages actualiza en ~1 minuto

## Deploy en GitHub Pages

```bash
git clone https://github.com/juanmackinnon/juanmackinnon.github.io.git
cd juanmackinnon.github.io
# ... agregar archivos ...
git add .
git commit -m "feat: nueva app"
git push origin main
```

Habilitar Pages: Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`

**URL base:** `https://juanmackinnon.github.io/`  
**Cada app:** `https://juanmackinnon.github.io/nombre-app/`

## Instalar como PWA

### iPhone (Safari)
1. Abrí la home en Safari
2. Compartir (↑) → "Añadir a pantalla de inicio"

### Android (Chrome)
1. Abrí en Chrome
2. Menú ⋮ → "Instalar app"

## Troubleshooting

**"No hay apps disponibles"** — revisá que `apps.json` exista y sea JSON válido (`jsonlint.com`)

**"Error cargando las apps"** — F12 → Console para ver el error exacto

**Service Worker desactualizado** — F12 → Application → Service Workers → "Skip waiting" + recargá

**Iconos de apps no aparecen** — verificá que existen los archivos en `icons/` con los nombres exactos del `apps.json`

## Licencia

Uso personal. Modificá a gusto.

---

*JPM Personal Apps*
