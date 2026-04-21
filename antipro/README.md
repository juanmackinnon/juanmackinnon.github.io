# AntiPro

**Generá tu primer paso y destrábate en 5 minutos.**

Una PWA minimalista que te ayuda a empezar tareas grandes dividiéndolas en pasos micro-accionables.

---

## 🎯 Qué es AntiPro

AntiPro es una app que transforma tareas grandes en pasos tan pequeños que es imposible no empezar. Si te trabás, la app divide el paso en algo todavía más chico.

**El concepto:**
- Escribís la tarea ("Hacer la presentación de clientes")
- AntiPro te genera un primer paso ultra-accionable ("Abrí PowerPoint")
- Tenés 5 minutos para hacerlo
- Si terminás, generamos el siguiente paso
- Si te trabás, dividimos el paso en 2 más pequeños
- Todo se guarda automáticamente

---

## 🚀 Cómo instalar

### Opción 1: Clonar en GitHub Pages

```bash
# Cloná este repo en tu usuario de GitHub
git clone https://github.com/[tu-usuario]/antipro.git
cd antipro

# Configurá GitHub Pages en los settings del repo
# Settings → Pages → Source: main branch
# Ya está disponible en https://[tu-usuario].github.io/antipro
```

### Opción 2: Instalación local

```bash
# Desde una terminal cualquiera, servir los archivos
# Python 3
python -m http.server 8000

# O si tenés Node instalado
npx http-server

# Abrir http://localhost:8000 en el navegador
```

---

## 📱 Instalar como app

### iPhone
1. Abrí AntiPro en Safari
2. Tocá el botón **Compartir** (cuadrado con flecha hacia arriba)
3. Seleccioná **Añadir a pantalla de inicio**
4. Nominá la app y toqué **Añadir**

### Android
1. Abrí AntiPro en Chrome
2. Tocá el menú ⋮ (tres puntos)
3. Seleccioná **Instalar app** o **Añadir a pantalla de inicio**

### Desktop (Windows/Mac)
1. Abrí la app en Chrome/Edge
2. Tocá el ícono de instalar (arriba a la derecha)
3. Confirmá

---

## 🎮 Cómo usar

### 1. Escribir una tarea
```
¿Qué tenés que hacer?
[Escribir el informe trimestral]
```

O clickear en un ejemplo preconfigurado.

### 2. Generar primer paso
La app te muestra un paso tan pequeño que podés hacerlo en 5 minutos.

### 3. Empezar el timer
Clickea **Empezar** para poner el contador en marcha.

### 4. Tres opciones:
- **Listo** → Completaste el paso, mostramos el siguiente
- **Estoy trabado** → Dividimos el paso en uno más pequeño
- **Pausar** → Pausás el timer (el botón cambia a ⏸)

### 5. Historial
Al completar pasos, se guardan automáticamente en el historial que ves en la página.

---

## ⚙️ Características técnicas

### PWA Completa
- ✅ Funciona offline (después de la primera carga)
- ✅ "Instalar como app" en iPhone y Android
- ✅ Carga instantánea desde pantalla de inicio
- ✅ Sincronización automática (localStorage)

### Vanilla JavaScript
- Sin dependencias externas
- Sin bundler, sin npm
- Carga rápida (~50KB total)

### Persistencia
- Guarda estado en localStorage
- No perdes progreso al cerrar
- Historial de los últimos 20 pasos

### Tema dual
- Modo minimalista (default): limpio, sin ruido
- Modo con acento: colores y visualización más completa
- Toggle en la esquina superior derecha

### Mobile-first
- Diseñado para 375px (iPhone SE)
- Responsive en todos los breakpoints
- Touch-friendly (botones mín. 44px)

---

## 📁 Estructura de archivos

```
antipro/
├── index.html        # Estructura HTML
├── styles.css        # Estilos (variables CSS, responsive, dark mode)
├── app.js           # Lógica principal (generación de pasos, timer, localStorage)
├── manifest.json    # Configuración PWA
├── sw.js            # Service Worker (caché y offline)
└── README.md        # Este archivo
```

### Tamaño de archivos
- `index.html`: ~5 KB
- `styles.css`: ~14 KB
- `app.js`: ~9 KB
- `manifest.json`: ~2 KB
- `sw.js`: ~4 KB
- **Total**: ~34 KB (sin contar Google Fonts)

---

## 🔧 Personalizar

### Cambiar colores
En `styles.css`, modificá las variables CSS del `:root`:

```css
:root {
    --color-accent-primary: #3b82f6;  /* Azul actual */
    --color-success: #10b981;         /* Verde actual */
    --color-warning: #f59e0b;         /* Ámbar actual */
    --color-error: #ef4444;           /* Rojo actual */
}
```

### Cambiar ejemplos de tareas
En `index.html`, modificá los botones en `.examples-grid`:

```html
<button class="example-btn" data-task="Tu tarea aquí">Etiqueta</button>
```

### Agregar más patrones de pasos
En `app.js`, modificá la función `generateFirstStepText()`:

```javascript
const patterns = [
    { match: /tu-palabra-clave/i, first: 'Tu primer paso aquí' },
    // ...
];
```

---

## 🐛 Troubleshooting

### "No funciona el Service Worker"
- Abrí DevTools (F12) → Application → Service Workers
- Verificá que esté activo y running
- Limpiá el cache manualmente y recargá

### "No se guarda el estado"
- Verificá que localStorage esté habilitado (no estés en modo privado)
- En iPhone, Settings → Safari → Advanced → JavaScript debe estar ON

### "No puedo instalar como app"
- Asegurate que sea HTTPS (localhost funciona en desarrollo)
- Esperá unos segundos después de cargar la app por primera vez
- Recargá la página (Ctrl+Shift+R o Cmd+Shift+R)

### "El timer no funciona"
- Verificá que JavaScript esté habilitado
- Abrí la consola (F12) y buscá errores rojos

---

## 💡 Tips de uso

### Para máxima productividad:
1. **Escribí la tarea específica**, no genérica ("Reescribir el welcome" vs "Trabajar en el sitio")
2. **Usa el timer** para crear un mini-sprint de 5 minutos
3. **Clickea "Listo"** cuando hayas terminado el paso, aunque sea pequeño
4. **"Estoy trabado"** es tu amigo — divide el paso sin culpa
5. **Revisa el historial** para motivarte viendo qué ya hiciste

---

## 📊 Paleta de colores

### Modo claro (default)
- Fondo: `#f8fafc` (gris muy claro)
- Tarjetas: `#ffffff` (blanco)
- Texto: `#0f172a` (gris oscuro)
- Acento: `#3b82f6` (azul)

### Modo oscuro
- Fondo: `#0f172a` (azul oscuro)
- Tarjetas: `#1e293b` (azul grisáceo)
- Texto: `#f1f5f9` (blanco)
- Acento: `#60a5fa` (azul más claro)

---

## 🎯 Roadmap (futuro)

- [ ] Sincronización con backend (guardar en la nube)
- [ ] Estadísticas: "Pasos completados esta semana"
- [ ] Notificaciones push para recordatorios
- [ ] Modo colaborativo (compartir tareas con equipo)
- [ ] Integración con Slack o Discord
- [ ] Templates por tipo de tarea
- [ ] Estimación de tiempo real vs planificado

---

## 📝 Licencia

MIT — Úsalo como quieras.

---

## 🙋 Preguntas frecuentes

**¿Necesito internet?**
No después de la primera carga. AntiPro funciona completamente offline.

**¿Se sincroniza entre dispositivos?**
No. El estado se guarda localmente. (Roadmap futuro.)

**¿Puedo usar AntiPro en iPad?**
Sí, funciona perfectamente.

**¿Cuándo elimina el historial?**
Nunca automáticamente. Vos decidís cuándo tocás "Limpiar historial".

---

**Hecho con ❤️ en Montevideo.**

AntiPro te ayuda a destrabar. ¿Necesitas ayuda?
