# Not-ITS-ias 📡

> Agregador de noticias ITS, Smart Cities y Movilidad Urbana.
> PWA estática deployable en GitHub Pages, cero costo, sin backend.

---

## ¿Qué es?

Not-ITS-ias es una Progressive Web App que agrega noticias de los principales medios de Sistemas de Transporte Inteligente (ITS) del mundo. Un script Python corre automáticamente 3 veces por día via GitHub Actions, consume los RSS feeds, filtra por relevancia, clasifica por categoría y genera un `news.json` estático. El frontend vanilla lee ese JSON y renderiza la app.

**Costo: $0** — GitHub Actions (free tier) + GitHub Pages.

---

## Estructura del proyecto

```
not-its-ias/
├── index.html                      # App PWA
├── styles.css                      # Estilos (dark-first, toggle light)
├── app.js                          # Lógica frontend
├── sw.js                           # Service Worker (offline)
├── manifest.json                   # PWA manifest
├── icon.svg                        # Ícono app (ITS/network graph)
│
├── fetch_news.py                   # Script Python de fetching
├── news.json                       # ← generado automáticamente (no editar)
│
├── setup_github.py                 # Instalador one-shot (ver abajo)
│
├── README.md
│
└── .github/
    └── workflows/
        └── update-news.yml         # GitHub Action (cron 3x/día)
```

---

## Feeds RSS incluidos

| Fuente | URL |
|---|---|
| Traffic Technology Today | traffictechnologytoday.com |
| ITS International | itsinternational.com |
| Intelligent Transport | intelligenttransport.com |
| Smart Cities World | smartcitiesworld.net |
| Smart Cities Dive | smartcitiesdive.com |
| Cities Today | cities-today.com |
| AV International | autonomousvehicleinternational.com |
| Electrive | electrive.com |
| Mobility Portal | mobilityportal.lat |
| Toll Review | tollreview.com |
| IBTTA | ibtta.org |
| ERTICO ITS Europe | ertico.com |
| ITS America | itsa.org |

---

## Categorías

| ID | Nombre | Contenido |
|---|---|---|
| `destacadas` | ⚡ Destacadas | Top 10 más recientes de todas las categorías |
| `trafico` | 🚦 Tráfico | Semáforos, ATMS, enforcement, gestión de tráfico |
| `smartcities` | 🏙️ Smart Cities | Ciudad conectada, sensores urbanos, govtech |
| `movilidad` | ⚡ Movilidad | EVs, MaaS, microtransporte, primera/última milla |
| `autonomos` | 🤖 Autónomos | AV, ADAS, V2X, C-ITS, vehículos conectados |
| `infraestructura` | 🛣️ Infraestructura | Peajes, túneles, autopistas, obra vial |
| `industria` | 🏢 Industria | Contratos, M&A, licitaciones, empresas del sector |
| `regulacion` | 📋 Regulación | Normativa, estándares, financiamiento público |

---

## Instalación rápida (setup automático)

### Requisitos
- Python 3.10+
- `pip install requests feedparser`
- Token de GitHub con permisos: Contents (rw) + Pages (rw) + Actions (rw)

### Un solo comando

```bash
git clone https://github.com/TU_USUARIO/not-its-ias.git
cd not-its-ias
pip install requests feedparser
python setup_github.py
```

El script interactivo va a:
1. Pedir tu GitHub token
2. Crear el repo (o actualizar si ya existe)
3. Subir todos los archivos
4. Habilitar GitHub Pages
5. Mostrarte la URL final

### Esperá ~2 minutos y abrí:
```
https://TU_USUARIO.github.io/not-its-ias/
```

---

## Instalación manual

### 1. Crear repo en GitHub
- Nombre: `not-its-ias`
- Visibilidad: pública (necesario para GitHub Pages gratis)
- Inicializar con README

### 2. Subir archivos
Subir todos los archivos a la raíz del repo (branch `main`).

### 3. Habilitar GitHub Pages
- Settings → Pages
- Source: Deploy from a branch
- Branch: `main` / Folder: `/ (root)`
- Save

### 4. Forzar primer fetch
- Actions → "Update News" → Run workflow

---

## Estructura de `news.json`

```json
{
  "version":    "1.0",
  "updated_at": "2025-01-15T13:00:00Z",
  "stats": {
    "total": 87,
    "by_category": { "trafico": 12, "movilidad": 18, ... },
    "by_source": { "Traffic Technology Today": 15, ... }
  },
  "categories": {
    "destacadas": [ ...10 artículos... ],
    "trafico":    [ ...artículos... ],
    ...
  }
}
```

Cada artículo:
```json
{
  "id":       "abc123def456",
  "title":    "City deploys AI-powered traffic signals",
  "summary":  "Kansas City has deployed...",
  "url":      "https://...",
  "source":   "Traffic Technology Today",
  "date":     "2025-01-15T10:30:00Z",
  "category": "trafico",
  "image":    "https://..."  // null si no hay
}
```

---

## Instalar como app en el móvil

### iPhone (Safari)
1. Abrí la app en Safari
2. Botón Compartir (↑)
3. "Añadir a la pantalla de inicio"
4. Nombre: `Not-ITS-ias`
5. Añadir

### Android (Chrome)
1. Abrí en Chrome
2. Menú ⋮ → "Instalar app"
3. Confirmar

---

## Personalización

### Agregar feeds RSS
En `fetch_news.py`, sección `FEEDS`:
```python
{"name": "Nuevo Medio", "url": "https://nuevo-medio.com/rss.xml"},
```

### Ajustar filtro de relevancia
En `fetch_news.py`, lista `RELEVANCE_KEYWORDS`:
```python
RELEVANCE_KEYWORDS = [
    "traffic", "ITS", ...
    "tu keyword adicional",
]
```

### Cambiar horario del cron
En `.github/workflows/update-news.yml`:
```yaml
- cron: '0 6 * * *'   # 06:00 UTC
- cron: '0 13 * * *'  # 13:00 UTC
- cron: '0 19 * * *'  # 19:00 UTC
```

### Temas visuales
La app incluye toggle dark/light en el header. El estado se guarda en `localStorage` (`not-its-ias-theme`).

---

## Troubleshooting

### `news.json` vacío o no se actualiza
1. Actions → "Update News" → ver logs
2. Verificar que el workflow tiene permisos: Settings → Actions → General → Workflow permissions → "Read and write"

### Algunos feeds no cargan
Normal. Los feeds con `bozo: true` se registran en los logs pero no rompen el script. Los artículos válidos de los otros feeds se procesan igual.

### GitHub Pages no se activa
Settings → Pages → Source debe ser `Deploy from a branch` (no GitHub Actions).

---

## Tecnologías

- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- **Backend**: Python 3 + feedparser (GitHub Actions)
- **Hosting**: GitHub Pages
- **Offline**: Service Worker + Cache API
- **Fuente**: Space Grotesk + JetBrains Mono (Google Fonts)

---

## Licencia

MIT — Usalo, modificalo, rompelo.

---

*Hecho para NewCo — Sistemas de Transporte Inteligente 🇺🇾*
