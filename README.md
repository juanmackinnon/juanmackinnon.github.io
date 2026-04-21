# Mis Apps - Home Dinámica para GitHub Pages

Home minimalista que carga apps desde un archivo JSON y las renderiza automáticamente. Diseñada para ser la página principal de un sitio con múltiples micro-apps personales.

## 🚀 Características

- ✅ **Carga dinámica** desde `apps.json` - no hace falta editar HTML
- ✅ **PWA completa** - funciona offline y se puede instalar en pantalla de inicio
- ✅ **Mobile-first** - diseñado para funcionar en cualquier dispositivo
- ✅ **Toggle de estilos** - minimalista vs. con acento, guardado en localStorage
- ✅ **Sin dependencias** - puro HTML, CSS y JavaScript vanilla
- ✅ **GitHub Pages compatible** - rutas relativas, funciona en subdominios
- ✅ **Accesible** - WCAG AA, soporte keyboard navigation, dark mode
- ✅ **Rápido** - Service Worker para caché y offline-first

## 📁 Estructura de Carpetas

```
mi-repo/
├── index.html          # HTML principal
├── styles.css          # Estilos (minimalista + dark mode)
├── app.js              # Lógica de JavaScript
├── apps.json           # 👈 EDITA AQUÍ para agregar/quitar apps
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker
├── README.md           # Este archivo
│
├── antipro/            # Subcarpeta de ejemplo
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── gastos/             # Otra app
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
└── tareas/             # Otra más
    ├── index.html
    ├── styles.css
    └── app.js
```

## 🎨 Diseño Visual

### Paleta de Colores
- **Fondo claro**: #f8fafc (gris muy claro)
- **Fondo oscuro**: #0f172a (gris oscuro)
- **Acento**: #3b82f6 (azul)
- **Texto**: #0f172a (claro) / #f1f5f9 (oscuro)

### Características de Diseño
- Tipografía: Inter (400, 500, 600, 700)
- Border radius: 12px (tarjetas), 8px (botones)
- Espaciado: 16px base en móvil, 24px en desktop
- Modo ultra-minimal por defecto (blanco y negro)
- Toggle para modo con acentos visuales

## 📝 Formato de apps.json

Edita `apps.json` para agregar/cambiar apps. Estructura:

```json
[
  {
    "name": "Nombre de la App",
    "path": "./nombre-app/",
    "description": "Descripción breve de qué hace"
  },
  {
    "name": "Otra App",
    "path": "./otra-app/",
    "description": "Otra descripción"
  }
]
```

**Reglas importantes:**
- `name`: Nombre visible (máx 30 caracteres)
- `path`: Ruta relativa a la carpeta de la app (termina con `/`)
- `description`: Descripción corta (máx 80 caracteres)
- Debe ser un array JSON válido (usar `[` y `]`)
- Cada objeto separado por coma (excepto el último)

## 🔧 Instalación y Uso

### 1. **Clonar/Descargar**
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 2. **Agregar apps**
Edita `apps.json` y agrega tus apps:

```json
[
  {
    "name": "AntiPro",
    "path": "./antipro/",
    "description": "App para destrabarte y empezar tareas"
  },
  {
    "name": "Gastos",
    "path": "./gastos/",
    "description": "Seguimiento de cuentas y gastos"
  }
]
```

### 3. **Crear carpetas de apps**
Crea carpetas para cada app con su `index.html`, `styles.css`, etc.

### 4. **Subir a GitHub**
```bash
git add .
git commit -m "Home dinámica con apps"
git push origin main
```

### 5. **Habilitar GitHub Pages**
- Ir a Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)
- Save

**Tu site estará disponible en:** `https://tu-usuario.github.io/tu-repo/`

## 🌐 URLs de las Apps

Si tu home está en: `https://tu-usuario.github.io/mi-repo/`

Entonces en `apps.json` usa:
```json
{
  "path": "./antipro/"
}
```

Y la app será accesible en: `https://tu-usuario.github.io/mi-repo/antipro/`

## 🎯 Funcionamiento

### Carga de Apps
1. Cuando cargas la home, `app.js` ejecuta `loadApps()`
2. Se busca el archivo `apps.json` (ruta relativa)
3. Se valida que sea un array válido
4. Se renderiza una tarjeta por cada app

### Estados
- **Cargando**: Animación de pulse mientras se busca `apps.json`
- **Éxito**: Se muestran las tarjetas
- **Vacío**: Mensaje si no hay apps
- **Error**: Detalle del problema si falla

### Persistencia
- El toggle de estilos se guarda en `localStorage` con clave `apps-home-style`
- Al recargar, se aplica automáticamente el último estilo seleccionado

## 📱 PWA - Instalar como App

### iOS (Safari)
1. Abre la home en Safari
2. Toca el botón Compartir (↑)
3. "Añadir a la pantalla de inicio"
4. Listo - aparecerá un ícono en tu home

### Android (Chrome)
1. Abre la home en Chrome
2. Menú → "Instalar app"
3. Confirma
4. Aparecerá un ícono en tu home

## 🔒 Seguridad

- ✅ HTML escapado para prevenir XSS
- ✅ Validación de tipos en JavaScript
- ✅ Sin eval() ni innerHTML inseguro
- ✅ Service Worker solo cachea recursos locales

## ♿ Accesibilidad

- ✅ Soporte completo para dark mode
- ✅ Contraste de colores WCAG AA
- ✅ Navegación por teclado (Tab)
- ✅ Focus visible en botones e links
- ✅ Respeta `prefers-reduced-motion`
- ✅ Semántica HTML correcta

## 🚀 Performance

- 📦 ~15KB total (sin minify)
- ⚡ Service Worker para offline + caché
- 🎨 CSS sin compiled (vanilla)
- ⏱️ Carga < 500ms en 3G

## 🐛 Troubleshooting

### "No hay apps disponibles"
- Revisa que `apps.json` exista en la raíz
- Valida JSON en https://jsonlint.com/
- Abre DevTools → Console para ver errores

### "Error cargando las apps"
- Revisa la consola (F12 → Console)
- Comprueba que `apps.json` tiene sintaxis válida
- Verifica que las rutas en `path` sean correctas

### El toggle de estilos no funciona
- Limpia localStorage: F12 → Storage → Local Storage → Delete All
- Recarga la página

### Service Worker no cacheando
- Abre DevTools → Application → Service Workers
- Verifica que está "activated"
- En caso de problemas, desinstala y reinstala la app

## 📄 Licencia

Libre para usar en tus proyectos personales.

## 👨‍💻 Autor

Creado para NewCo - Sistemas de Transporte Inteligente.

---

**¿Necesitas ayuda?**
- Revisa la consola del navegador (F12)
- Valida tu `apps.json` en https://jsonlint.com/
- Comprueba que las rutas son relativas (./carpeta/)
