# AntiPro

**Generá tu primer paso y destrábate en 5 minutos.**

Una PWA minimalista con integración a Groq (LLM gratis) para dividir tareas en pasos micro-accionables.

---

## 🎯 Qué es AntiPro

AntiPro es una app que transforma tareas grandes en pasos tan pequeños que es imposible no empezar. Si te trabás, la app divide el paso en algo todavía más chico.

**Cómo funciona:**
1. Escribís la tarea ("Hacer la presentación de clientes")
2. AntiPro pide a Groq que divida la tarea en pasos
3. Te muestra un primer paso ultra-accionable ("Abrí PowerPoint")
4. Tenés 5 minutos para hacerlo
5. Si terminás, generamos el siguiente paso
6. Si te trabás, dividimos el paso en 2 más pequeños
7. Todo se guarda automáticamente

---

## 🚀 Instalación rápida

### Requisitos previos
- Repo en GitHub Pages (ya activo)
- API key de Groq (gratis, sin tarjeta): https://console.groq.com/keys
- Cloudflare Worker con tu API key configurada

### Deploy
1. Descargar los 5 archivos (index.html, app.js, styles.css, manifest.json, sw.js)
2. Subirlos a tu repo de GitHub
3. Esperar 1 minuto a que se actualice GitHub Pages
4. Abrí tu app: `https://[tu-usuario].github.io/[repo]/`

---

## 📱 Instalar como app en el móvil

### iPhone
1. Abrí AntiPro en Safari
2. Botón Compartir (↑)
3. "Añadir a pantalla de inicio"
4. Nombre: AntiPro
5. Añadir

### Android
1. Abrí AntiPro en Chrome
2. Menú ⋮ → "Instalar app"
3. Confirmar

---

## 🎮 Cómo usar

### Escribir una tarea
```
¿Qué tenés que hacer?
[Escribir el informe trimestral]
```

O clickear en un ejemplo preconfigurado.

### Generar pasos
Clickear "Generar primer paso".
- Si Groq funciona: muestra pasos inteligentes en ~500ms
- Si Groq falla: muestra pasos fallback locales (igual de útiles)

### Timer
Clickear **Empezar** para poner el contador en marcha (5 minutos).

### Acciones
- **Listo** → Completaste el paso, mostramos el siguiente
- **Estoy trabado** → Dividimos el paso en uno más pequeño
- **Pausar** → Pausás el timer

### Historial
Los pasos completados se guardan automáticamente en el historial visible en la página.

---

## ⚙️ Cómo funciona internamente

### Arquitectura
```
GitHub Pages (tu app)
    ↓ fetch JSON
Cloudflare Worker
    ↓ API call con API key
Groq API (gratis)
    ↓ JSON response
GitHub Pages (muestra pasos)
    ↓ Si falla
Fallback local (patrones hardcodeados)
```

### API key segura
- Tu API key de Groq está **solo en el Cloudflare Worker**, nunca en el frontend
- El frontend solo ve JSON de pasos
- Si alguien captura el tráfico, no ve la key

### Fallback automático
Si Groq falla o tarda >8 segundos:
- La app automáticamente usa patrones locales
- El usuario nunca ve error, siempre obtiene pasos

---

## 🔧 Configuración

En `app.js`, línea 7:
```javascript
const CONFIG = {
    llmEndpoint: 'https://antipro-llm.juanmacki.workers.dev',
    llmTimeout: 8000,       // Timeout en ms
    maxRetries: 1,          // Reintentos
    minSteps: 3,            // Mínimo de pasos
    maxSteps: 6,            // Máximo de pasos
};
```

Para usar **solo fallback local** (sin Groq):
```javascript
llmEndpoint: '',  // Dejar vacío
```

---

## 📊 Características técnicas

### PWA Completa
- ✅ Funciona offline (después de primer acceso)
- ✅ Instalable en iPhone y Android
- ✅ Carga instantánea desde pantalla de inicio
- ✅ localStorage para persistencia

### Vanilla JavaScript
- Sin dependencias externas
- Sin npm ni bundler
- Carga rápida (~30 KB)

### Persistencia
- Guarda estado en localStorage
- No pierdes progreso al cerrar
- Historial de últimos 20 pasos

### Tema dual
- Modo claro (default): minimalista
- Modo oscuro: con colores
- Toggle en esquina superior derecha

### Mobile-first
- Diseñado para 375px (iPhone SE)
- Responsive en todos los breakpoints
- Botones 44px mín. (touch-friendly)

---

## 💰 Costo

- **Cloudflare Worker**: Gratis
- **Groq API**: Gratis (5,000 requests/día)
- **GitHub Pages**: Gratis
- **TOTAL**: $0

---

## 🐛 Troubleshooting

### "No genera pasos, solo fallback"
1. Verificar que la URL del Worker en `app.js` sea correcta
2. Abrir DevTools (F12) → Console → Ver errores rojos
3. Verificar que el Worker está deployed en Cloudflare
4. Verificar que la API key está en Cloudflare (Settings → Environment variables)

### "Timeout en el Worker"
- Groq tarda >8 segundos (raro)
- Aumentar `llmTimeout` a 15000 en `CONFIG`

### "No puedo instalar como app"
1. Asegurate que sea HTTPS (localhost funciona en desarrollo)
2. Espera unos segundos después de cargar la app
3. Recarga la página (Ctrl+Shift+R o Cmd+Shift+R)

---

## 🎨 Personalizar

### Cambiar colores
En `styles.css`, variables CSS del `:root`:
```css
--color-accent-primary: #3b82f6;  /* Azul actual */
--color-success: #10b981;         /* Verde actual */
--color-warning: #f59e0b;         /* Ámbar actual */
```

### Cambiar ejemplos
En `index.html`, sección `.examples-grid`:
```html
<button class="example-btn" data-task="Tu tarea">Etiqueta</button>
```

### Agregar patrones de pasos
En `app.js`, función `generateInitialStepsLocal()`:
```javascript
{ 
    match: /palabra-clave/i, 
    steps: [
        { title: 'Primer paso', minutes: 1 },
        { title: 'Segundo paso', minutes: 2 }
    ]
}
```

---

## 📝 Estructura de archivos

```
antipro/
├── index.html           # HTML semántico
├── app.js              # Lógica principal + Groq
├── styles.css          # Estilos responsive + dark mode
├── manifest.json       # Config PWA
├── sw.js              # Service Worker
└── README.md          # Este archivo
```

---

## ✨ Tips de uso

### Para máxima productividad
1. Escribí la tarea **específica**, no genérica
2. Usa el timer para crear un mini-sprint
3. Clickea "Listo" apenas termines el paso
4. "Estoy trabado" es tu amigo — no hay culpa
5. Revisa el historial para motivarte

---

## 🚀 Roadmap (ideas futuras)

- [ ] Cachear respuestas del LLM
- [ ] Estadísticas: pasos completados
- [ ] Tareas favoritas
- [ ] Integración Slack
- [ ] Usar GPT-4 o Mistral
- [ ] Sincronización en la nube

---

## 📝 Licencia

MIT — Úsalo como quieras.

---

## 🙋 FAQs

**¿Necesito internet?**
No después de la primera carga. El LLM necesita internet, pero no es obligatorio usar.

**¿Se sincroniza entre dispositivos?**
No. El estado se guarda localmente. La sincronización es roadmap futuro.

**¿Puedo cambiar el LLM?**
Sí. Modificar el Worker para usar Mistral, HF, o cualquier otro.

**¿Cuándo se borra el historial?**
Nunca automáticamente. Vos clickeas "Limpiar historial" cuando quieras.

**¿Funciona en iPad?**
Sí, perfectamente.

---

**Hecho en Montevideo. 🇺🇾**

AntiPro: Del bloqueo mental al primer paso. En 5 minutos.
