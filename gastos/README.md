# Gastos

App de gestión de gastos personal. Registrá gastos, cuentas y transferencias desde el móvil.

## Qué hace

- **Cuentas** — múltiples cuentas (Efectivo, Débito, Mercado Pago, etc.) con saldo inicial configurable y recálculo automático
- **Gastos** — registrá importe, descripción, fecha, cuenta y categoría. El saldo se actualiza solo
- **Categorías** — personalizables. Por defecto: Comida, Supermercado, Transporte, Salidas, Salud, Servicios, Otros
- **Transferencias** — entre cuentas. Actualizan ambos saldos automáticamente
- **Resumen** — saldos actuales, gastos por categoría, total gastado, últimos movimientos

## Instalar en el móvil

### iPhone (Safari)
1. Abrí `https://juanmackinnon.github.io/gastos/` en Safari
2. Compartir (↑) → "Añadir a pantalla de inicio"
3. Nombre: Gastos → Añadir

### Android (Chrome)
1. Abrí en Chrome
2. Menú ⋮ → "Instalar app"

## Datos

- Todo se guarda en `localStorage` del dispositivo
- No hay servidor ni sincronización entre dispositivos
- Clave de datos: `gastos-app-data`
- Clave de tema: `gastos-theme` → `'light'` | `'dark'`

**Exportar datos manualmente:**
```javascript
// En la consola del navegador (F12)
console.log(JSON.stringify(JSON.parse(localStorage.getItem('gastos-app-data')), null, 2))
```

**Borrar todos los datos:**
```javascript
localStorage.removeItem('gastos-app-data')
```

## Estructura de datos

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
  ]
}
```

## Tecnologías

- HTML5 semántico, CSS3 (variables CSS, Grid, Flexbox), JavaScript vanilla (ES6+)
- PWA: Web App Manifest + Service Worker (cache: `gastos-v2`)
- Tipografía: Space Grotesk + JetBrains Mono (Google Fonts)
- Persistencia: localStorage

## Estructura de archivos

```
gastos/
├── index.html      # HTML semántico con tabs
├── styles.css      # Dark-first, Space Grotesk, toggle style-light
├── app.js          # Lógica de cuentas, gastos, categorías y transferencias
├── manifest.json   # Config PWA
├── sw.js           # Service Worker (cache-first)
└── README.md       # Este archivo
```

## Roadmap

- [ ] Edición de movimientos en línea
- [ ] Filtro por mes funcional
- [ ] Gráficos y estadísticas
- [ ] Exportar a CSV
- [ ] Presupuestos y alertas

## Bugs conocidos

- El selector de filtro por mes (`#filter-mes`) se puebla correctamente pero no filtra los movimientos — pendiente implementar la lógica en `app.js`

---

*Parte del ecosistema JPM Apps — [Volver al menú](../)*
