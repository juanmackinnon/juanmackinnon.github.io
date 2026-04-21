# 💰 Gastos - App de Gestión de Gastos Personal

Una PWA (Progressive Web App) minimalista y rápida para registrar gastos, gestionar múltiples cuentas, categorías y transferencias. Diseñada para usar desde iPhone con "Añadir a pantalla de inicio".

## 🎯 Características principales

### Cuentas
- Crear múltiples cuentas (Efectivo, Débito, Mercado Pago, etc.)
- Visualizar saldo actual de cada cuenta (se recalcula automáticamente)
- Saldo inicial configurable
- Eliminar cuentas

### Gastos
- Registrar gastos rápidamente
- Cada gasto requiere: importe, descripción, fecha, cuenta y categoría
- El saldo de la cuenta se actualiza automáticamente
- Ver últimos gastos registrados
- Editar y eliminar gastos

### Categorías
- Crear categorías personalizadas
- Categorías por defecto: Comida, Supermercado, Transporte, Salidas, Salud, Servicios, Otros
- Ver gasto total por categoría
- Eliminar categorías

### Transferencias
- Registrar transferencias entre cuentas
- NO afectan a las categorías de gastos
- Se actualizan automáticamente los saldos de origen y destino
- Incluye nota opcional

### Resumen
- Ver saldos actuales de todas las cuentas
- Ver gasto total por categoría
- Ver gasto total general
- Últimos movimientos (gastos y transferencias)
- Filtro por mes

### UI/UX
- Diseño mobile-first, optimizado para iPhone
- Dos modos visuales: **Minimal** (blanco/negro) y **Acentuado** (con color azul)
- Toggle para cambiar tema
- Muy rápida y responsiva
- Interfaz en español rioplatense

## 📱 Instalación en iPhone

### Desde Safari

1. Abre esta URL en Safari: `https://[tu-usuario].github.io/gastos/`
2. Toca el botón de **Compartir** (icono de cuadrado con flecha)
3. Desplázate y selecciona **"Añadir a pantalla de inicio"**
4. Dale un nombre a la app (sugerencia: "Gastos")
5. Toca **"Añadir"**

¡Listo! La app aparecerá como una aplicación nativa en tu iPhone.

### En Android

1. Abre en Chrome: `https://[tu-usuario].github.io/gastos/`
2. Toca el menú (⋮) > **"Instalar app"** o **"Añadir a pantalla de inicio"**

## 🚀 Despliegue en GitHub Pages

### Estructura de carpetas

```
mi-repositorio/
├── gastos/                  ← Carpeta de la app
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.json
│   ├── sw.js
│   └── README.md
└── (otras carpetas...)
```

### Pasos para desplegar

1. **Cloná o creá tu repositorio de GitHub Pages:**
   ```bash
   git clone https://github.com/[tu-usuario]/[tu-usuario].github.io.git
   cd [tu-usuario].github.io
   ```

2. **Creá la carpeta `/gastos/`:**
   ```bash
   mkdir gastos
   cd gastos
   ```

3. **Copiá todos los archivos de la app aquí:**
   - index.html
   - styles.css
   - app.js
   - manifest.json
   - sw.js

4. **Pusheá a GitHub:**
   ```bash
   git add .
   git commit -m "Add gastos app"
   git push
   ```

5. **Esperá ~2 minutos** y accedé a:
   ```
   https://[tu-usuario].github.io/gastos/
   ```

## 💾 Almacenamiento de datos

- **Todos los datos se guardan localmente en tu dispositivo** usando `localStorage`
- No hay servidor backend
- Los datos **no se sincronizan** entre dispositivos
- **No se pierden** al cerrar la app (persisten)
- Podés cargar datos de ejemplo para probar la app

### Exportar/importar datos

Para exportar tus datos en JSON (opcionalmente):

```javascript
// En la consola del navegador (F12)
console.log(JSON.stringify(JSON.parse(localStorage.getItem('gastos-app-data')), null, 2))
```

## 🎨 Modos visuales

### Modo Minimal (default)
- Diseño blanco y negro
- Minimalista, sin sombras
- Muy limpio y simple
- Perfecto para lectura rápida

### Modo Acentuado
- Introduce color azul (#3b82f6)
- Sombras sutiles
- Mejor contraste
- Más visual

Toca el icono **◐** en la esquina superior derecha para cambiar entre modos.

## 📊 Estructura de datos

```javascript
{
  cuentas: [
    { id: "...", nombre: "Efectivo", saldoInicial: 5000 }
  ],
  categorias: [
    { id: "comida", nombre: "Comida" }
  ],
  gastos: [
    {
      id: "...",
      importe: 850,
      descripcion: "Almuerzo",
      fecha: "2024-01-15",
      cuentaID: "...",
      categoriaID: "comida"
    }
  ],
  transferencias: [
    {
      id: "...",
      importe: 1000,
      origenID: "...",
      destinoID: "...",
      fecha: "2024-01-15",
      nota: ""
    }
  ],
  theme: "minimal" // o "accent"
}
```

## 🔒 Privacidad y seguridad

- ✅ **Funciona offline** - no necesita conexión a internet
- ✅ **Datos locales** - todo está en tu dispositivo
- ✅ **Sin servidor** - nadie accede a tus datos
- ✅ **Sin login** - directamente en el navegador
- ✅ **Sin tracking** - sin Analytics ni terceros

## 🛠️ Tecnologías

- **HTML5** semántico
- **CSS3** moderno (variables CSS, Grid, Flexbox)
- **JavaScript vanilla** (ES6+)
- **PWA** (Web App Manifest, Service Worker)
- **localStorage** para persistencia
- **Tipografía:** Inter (Google Fonts)

## 📱 Compatible con

- ✅ iPhone Safari (iOS 12+)
- ✅ Android Chrome
- ✅ Edge
- ✅ Opera
- ✅ Samsung Internet

## ❓ Preguntas frecuentes

### ¿Dónde se guardan mis datos?
En el almacenamiento local de tu navegador (`localStorage`). Si limpias los datos de la app o borras el navegador, se perderán.

### ¿Puedo sincronizar entre dispositivos?
No en esta versión. Cada dispositivo tiene su propia copia local. Podrías exportar datos manualmente en JSON y importarlos en otro dispositivo.

### ¿Puedo editar un movimiento?
Actualmente podés borrar y volver a crear. Una versión futura podría permitir edición en línea.

### ¿Hay límite de registros?
No hay límite técnico, pero si guardás miles de movimientos la app podría ralentizarse un poco.

### ¿Funciona sin internet?
Sí, completamente offline una vez instalada.

### ¿Cómo borro todos mis datos?
Opción 1: En iPhone, Configuración > Safari > Avanzado > Datos de sitios web > [tu sitio] > Borrar
Opción 2: En la consola (F12): `localStorage.removeItem('gastos-app-data')`

## 🐛 Bugs conocidos / Limitaciones

- El filtro por mes está pensado para futuras versiones
- No hay sincronización en la nube
- No hay gráficos estadísticos (v2.0)

## 🚀 Roadmap / Futuras versiones

- [ ] Edición de movimientos en línea
- [ ] Gráficos y estadísticas
- [ ] Exportar a CSV/PDF
- [ ] Presupuestos y alertas
- [ ] Búsqueda y filtros avanzados
- [ ] Sincronización con Google Drive
- [ ] Soporte para múltiples monedas

## 📝 Licencia

Uso personal gratuito. Modificá a tu gusto.

---

**¿Necesitás ayuda?** Revisá la app en `https://[tu-usuario].github.io/gastos/`

Hecha con ❤️ para simplificar tu vida financiera.
