# Anti Procrastinación - PWA

Una app web progresiva minimalista para romper la procrastinación generando pasos accionables pequeños.

## 🎯 Qué hace

- **Convierte tareas en pasos chicos**: Escribís una tarea ("Terminar informe") y la app te genera un primer paso accionable ("Abrí el documento")
- **Timer de 5 minutos**: Para darle tiempo fijo a cada paso
- **"Estoy trabado"**: Si te atasca, genera un paso todavía más chico
- **"Listo"**: Completa el paso y genera el siguiente
- **Historial**: Registra los últimos pasos completados para motivación
- **Sin backend**: Todo funciona localmente en el navegador
- **Offline**: Funciona sin conexión (PWA con service worker)
- **Instalable en iPhone**: Desde Safari → "Añadir a pantalla de inicio"

## 📁 Estructura de carpetas

```
anti-procrastinacion/
├── index.html          # Estructura HTML
├── styles.css          # Estilos (2 temas: minimal + warm)
├── app.js              # Lógica principal + generación de pasos
├── manifest.json       # Config PWA (instalación)
├── sw.js               # Service worker (offline)
├── README.md           # Este archivo
└── assets/             # (Opcional) Para íconos custom si querés reemplazar los SVG
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable.png
```

## 🚀 Instalación

### En GitHub Pages

1. **Fork o crea un repo** llamado `anti-procrastinacion`
2. **Subí los 5 archivos** al root del repo:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
3. **Activa GitHub Pages** (Settings > Pages > Deploy from branch > main)
4. **Accedé a**: `https://tu-usuario.github.io/anti-procrastinacion`

### Localmente (testing)

```bash
# Cloná el repo
git clone https://github.com/tu-usuario/anti-procrastinacion.git
cd anti-procrastinacion

# Levantá un servidor local (Python 3)
python -m http.server 8000

# Abrí en el navegador
# http://localhost:8000
```

## 📱 Instalación en iPhone

1. **Abrí la app en Safari** (desde GitHub Pages o localhost)
2. **Tocá el ícono de compartir** (↑ en la barra)
3. **Toca "Añadir a pantalla de inicio"**
4. **Dale nombre** y listo - se instala como app nativa

### Instalación en Android

1. **Chrome**: Menú > "Instalar app" (aparece automáticamente)
2. **Firefox**: Menú > "Instalar"

## 🎨 Temas

### Ultra Minimal (por defecto)
- Blanco y negro puro
- Tipografía system
- Máxima claridad y velocidad

### Warm (opcional)
- Tonos tierra: beige, marrón, verde suave
- Más acogedora
- Mismo rendimiento

**Para cambiar**: Toca el ícono ◐/◑ arriba a la derecha

## ⚙️ Cómo funciona

### Generación de pasos

La app tiene patrones predefinidos para tareas comunes:
- **Informe** → "Abrí el documento"
- **Llamada** → "Escribí los 3 puntos clave"
- **Presentación** → "Abrí PowerPoint/Slides"
- **Proveedores** → "Abrí el email con propuestas"

Si no coincide con ninguno, genera algo genérico pero útil.

### Comando "Estoy trabado"

Divide el paso actual en uno más chico. Ejemplo:
- Paso 1: "Hacé la presentación" 
- Trabado → "Abrí PowerPoint"
- Trabado → "Hacé la portada"

### Timer

5 minutos predeterminados. Pausable/reanudable. Al terminar, notifica.

### Historial

Guarda últimos 10 pasos completados en **localStorage**. Persiste al cerrar/reabrir.

## 💾 Persistencia

Todo se guarda automáticamente en `localStorage`:
- Tarea actual en progreso
- Historial de pasos completados
- Tema seleccionado
- Estado del timer

No se borra al cerrar la app. Los datos se mantienen.

## 🔧 Personalización

### Cambiar ejemplos rápidos

En `index.html`, busca `quick-examples` y reemplaza:

```html
<button class="example-btn" data-task="Tu tarea aquí">Etiqueta</button>
```

### Agregar más patrones de pasos

En `app.js`, busca `stepGenerationPatterns` y agrega:

```javascript
'Tu palabra clave': {
    first: 'Primer paso muy chico',
    stuck: ['Paso 1 si se traba', 'Paso 2 si se traba', ...]
}
```

### Cambiar tiempo del timer

En `app.js`:

```javascript
state.timerSeconds = 300; // Cambiar a segundos deseados
```

### Reemplazar íconos

Actualmente usa **SVG inline** en `index.html` y `manifest.json`. Para usar PNG custom:

1. **Crea** `/assets/icon-192.png`, `icon-512.png`, `icon-maskable.png`
2. **En manifest.json**, reemplaza:

```json
"icons": [
    {
        "src": "/assets/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
    }
]
```

3. **En index.html**, reemplaza `apple-touch-icon`:

```html
<link rel="apple-touch-icon" href="/assets/icon-192.png">
```

## 🌐 URLs importantes

- **App en vivo**: `https://tu-usuario.github.io/anti-procrastinacion`
- **manifest.json**: `/manifest.json`
- **Service Worker**: `/sw.js`

Todos los archivos deben estar en el root o rutas relativas correctas.

## 🔒 Privacidad

- **Todo funciona localmente** - No se envía nada a servidores
- **Sin analytics** - No hay tracking
- **localStorage solo**: Los datos nunca salen del navegador
- **Offline first**: Funciona sin conexión

## 📋 Checklist antes de subir

- [ ] Los 5 archivos en root del repo
- [ ] `manifest.json` con URLs relativas (`./index.html`)
- [ ] `sw.js` con rutas relativas en `urlsToCache`
- [ ] GitHub Pages activado y funcionando
- [ ] Testear en iPhone/Android desde navegador
- [ ] Instalar como app en teléfono
- [ ] Probar offline (modo avión)
- [ ] Cambiar tema (◐/◑ arriba)

## 🐛 Troubleshooting

### "No se instala en iPhone"
- Abrí en **Safari** (no Chrome)
- Probá: Settings > Privacy > Cookies - limpia y reinicia
- La URL debe ser HTTPS (GitHub Pages lo es automáticamente)

### "El service worker no cachea"
- Abrí DevTools (F12) > Application > Service Workers
- Verificá que esté "activated"
- En Chrome, podés forzar actualización: Shift+F5

### "No guarda el historial"
- Verificá que localStorage no esté bloqueado
- DevTools > Application > Local Storage
- Borrá datos y reiniciá

### "Timer sigue contando en background"
- Normal - el timer se pausa cuando cambias de tab
- Al volver a la app, continúa

## 📚 Stack técnico

- **HTML5**: Estructura semántica
- **CSS3**: Variables, Grid, Flexbox, Mobile-first
- **JavaScript vanilla**: Sin librerías, ~400 líneas
- **Service Worker**: Cache-first strategy
- **PWA**: Web app manifest + installable

## 🚀 Mejoras futuras (opcional)

- Notificaciones push
- Sincronización con nube
- Estadísticas de productividad
- Integración con calendario
- Dark mode automático por hora
- Pasos inteligentes con IA real

## 📝 Licencia

Uso libre. Modificá como quieras.

---

**Hecho para romper la procrastinación. Adelante! 🚀**
