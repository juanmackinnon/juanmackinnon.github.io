/* ============================================================
   GASTOS APP — app.js  v2
   Tema: body.style-light / dark-first (localStorage: 'gastos-theme')
   SW registration: dentro de DOMContentLoaded
   ============================================================ */

// ============================================================
// DATOS Y ALMACENAMIENTO
// ============================================================

const STORAGE_KEY  = 'gastos-app-data';
const STORAGE_THEME = 'gastos-theme';

const DEFAULT_DATA = {
  cuentas: [
    { id: 'eff', nombre: 'Efectivo',     saldoInicial: 5000  },
    { id: 'deb', nombre: 'Débito BBVA',  saldoInicial: 10000 },
    { id: 'mp',  nombre: 'Mercado Pago', saldoInicial: 2000  }
  ],
  categorias: [
    { id: 'comida',  nombre: 'Comida'       },
    { id: 'super',   nombre: 'Supermercado' },
    { id: 'trans',   nombre: 'Transporte'   },
    { id: 'salidas', nombre: 'Salidas'      },
    { id: 'salud',   nombre: 'Salud'        },
    { id: 'serv',    nombre: 'Servicios'    },
    { id: 'otros',   nombre: 'Otros'        }
  ],
  gastos:         [],
  ingresos:       [],
  transferencias: []
};

function cargarDatos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_DATA };
  } catch { return { ...DEFAULT_DATA }; }
}

function guardarDatos(datos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  actualizarUI();
}

let datos = cargarDatos();

// ============================================================
// UTILIDADES
// ============================================================

function generarID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatoDinero(valor) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
}

function formatoFecha(dateString) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(dateString + 'T00:00:00'));
}

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function obtenerMes(dateString) {
  return new Date(dateString + 'T00:00:00').toISOString().slice(0, 7);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ============================================================
// TEMA — dark-first, toggle via body.style-light
// ============================================================

function applyTheme() {
  const saved = localStorage.getItem(STORAGE_THEME);
  if (saved === 'light') {
    document.body.classList.add('style-light');
  } else {
    document.body.classList.remove('style-light');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('style-light');
  localStorage.setItem(STORAGE_THEME, isLight ? 'light' : 'dark');
}

// ============================================================
// TOAST Y MODAL
// ============================================================

function mostrarToast(mensaje) {
  const toast   = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  toastMsg.textContent = mensaje;
  toast.classList.remove('toast--hidden');
  setTimeout(() => toast.classList.add('toast--hidden'), 3000);
}

function mostrarConfirmacion(titulo, mensaje, callback) {
  const modal      = document.getElementById('modal-confirm');
  const modalTitle = document.getElementById('modal-title');
  const modalMsg   = document.getElementById('modal-message');
  const btnCancel  = document.getElementById('btn-modal-cancel');
  const btnConfirm = document.getElementById('btn-modal-confirm');

  modalTitle.textContent = titulo;
  modalMsg.textContent   = mensaje;
  modal.classList.remove('modal--hidden');

  const cleanup = () => {
    modal.classList.add('modal--hidden');
    btnCancel.removeEventListener('click', onCancel);
    btnConfirm.removeEventListener('click', onConfirm);
  };

  const onConfirm = () => { cleanup(); callback(true);  };
  const onCancel  = () => { cleanup(); callback(false); };

  btnCancel.addEventListener('click', onCancel);
  btnConfirm.addEventListener('click', onConfirm);
}

// ============================================================
// LÓGICA DE CUENTAS
// ============================================================

function calcularSaldoCuenta(cuentaID) {
  const cuenta = datos.cuentas.find(c => c.id === cuentaID);
  if (!cuenta) return 0;

  let saldo = cuenta.saldoInicial;

  datos.gastos.forEach(g => {
    if (g.cuentaID === cuentaID) saldo -= g.importe;
  });
  datos.ingresos.forEach(i => {
    if (i.cuentaID === cuentaID) saldo += i.importe;
  });
  datos.transferencias.forEach(t => {
    if (t.origenID  === cuentaID) saldo -= t.importe;
    if (t.destinoID === cuentaID) saldo += t.importe;
  });

  return saldo;
}

function obtenerCuentasConSaldos() {
  return datos.cuentas.map(c => ({ ...c, saldoActual: calcularSaldoCuenta(c.id) }));
}

// ============================================================
// LÓGICA DE RESUMEN
// ============================================================

function calcularGastoPorCategoria(categoriaID) {
  return datos.gastos.filter(g => g.categoriaID === categoriaID).reduce((s, g) => s + g.importe, 0);
}

function calcularIngresoPorCategoria(categoriaID) {
  return datos.ingresos.filter(i => i.categoriaID === categoriaID).reduce((s, i) => s + i.importe, 0);
}

function calcularTotalGastos()   { return datos.gastos.reduce((s, g) => s + g.importe, 0); }
function calcularTotalIngresos() { return datos.ingresos.reduce((s, i) => s + i.importe, 0); }

function obtenerUltimosMovimientos(limite = 10) {
  const movs = [];

  datos.gastos.forEach(g => {
    const cat   = datos.categorias.find(c => c.id === g.categoriaID);
    const cuenta = datos.cuentas.find(c => c.id === g.cuentaID);
    movs.push({ ...g, tipo: 'gasto', categoriaNombre: cat?.nombre || 'Sin categoría', cuentaNombre: cuenta?.nombre || 'Sin cuenta' });
  });

  datos.ingresos.forEach(i => {
    const cat   = i.categoriaID ? datos.categorias.find(c => c.id === i.categoriaID) : null;
    const cuenta = datos.cuentas.find(c => c.id === i.cuentaID);
    movs.push({ ...i, tipo: 'ingreso', categoriaNombre: cat?.nombre || '', cuentaNombre: cuenta?.nombre || 'Sin cuenta' });
  });

  datos.transferencias.forEach(t => {
    const origen  = datos.cuentas.find(c => c.id === t.origenID);
    const destino = datos.cuentas.find(c => c.id === t.destinoID);
    movs.push({ ...t, tipo: 'transferencia', origenNombre: origen?.nombre || 'Sin cuenta', destinoNombre: destino?.nombre || 'Sin cuenta' });
  });

  return movs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, limite);
}

// ============================================================
// RENDERIZADO DE UI
// ============================================================

function actualizarUI() {
  actualizarResumen();
  actualizarGastos();
  actualizarIngresos();
  actualizarTransferencias();
  actualizarCuentas();
  actualizarCategorias();
  actualizarSelectsCuentas();
  actualizarSelectsCategorias();
  actualizarMeses();
}

// --- RESUMEN ---
function calcularTotalPorCategoria(categoriaID) {
  return calcularIngresoPorCategoria(categoriaID) - calcularGastoPorCategoria(categoriaID);
}

function calcularBalance() {
  return calcularTotalIngresos() - calcularTotalGastos();
}

function actualizarResumen() {
  // Total unificado por categoría: ingresos suman y gastos restan.
  const elCategorias = document.getElementById('categorias-total');
  const catsConMovimiento = datos.categorias
    .map(c => ({
      ...c,
      gasto: calcularGastoPorCategoria(c.id),
      ingreso: calcularIngresoPorCategoria(c.id),
      total: calcularTotalPorCategoria(c.id)
    }))
    .filter(c => c.gasto > 0 || c.ingreso > 0)
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  elCategorias.innerHTML = catsConMovimiento.length === 0
    ? '<div class="empty-state">Sin movimientos por categoría</div>'
    : catsConMovimiento.map(c => `
        <div class="categoria-gasto-item">
          <span class="categoria-gasto-nombre">${escapeHtml(c.nombre)}</span>
          <span class="categoria-gasto-total ${c.total >= 0 ? 'categoria-ingreso-total' : ''}">${formatoDinero(c.total)}</span>
        </div>`).join('');

  document.getElementById('total-gastos').textContent = formatoDinero(calcularTotalGastos());
  document.getElementById('total-ingresos').textContent = formatoDinero(calcularTotalIngresos());
  document.getElementById('balance-categorias').textContent = formatoDinero(calcularBalance());

  // Últimos movimientos
  const elMovs = document.getElementById('ultimos-movimientos');
  const movs   = obtenerUltimosMovimientos(5);

  elMovs.innerHTML = movs.length === 0
    ? '<div class="empty-state">Sin movimientos registrados</div>'
    : movs.map(m => renderMovimiento(m)).join('');

  bindDeleteButtons('#ultimos-movimientos');
}

// --- HELPERS DE RENDER ---
function renderMovimiento(mov) {
  if (mov.tipo === 'gasto') {
    return `
      <div class="movimiento-item">
        <div class="movimiento-info">
          <div class="movimiento-descripcion">${escapeHtml(mov.descripcion)}</div>
          <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
          <div class="movimiento-cuenta">${escapeHtml(mov.cuentaNombre)}</div>
          <div class="movimiento-categoria">${escapeHtml(mov.categoriaNombre)}</div>
        </div>
        <div class="movimiento-importe">
          ${formatoDinero(mov.importe)}
          <button class="btn-delete" data-id="${mov.id}" data-tipo="gasto" title="Eliminar">×</button>
        </div>
      </div>`;
  }
  if (mov.tipo === 'ingreso') {
    return `
      <div class="movimiento-item">
        <div class="movimiento-info">
          <div class="movimiento-descripcion">${escapeHtml(mov.descripcion)}</div>
          <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
          <div class="movimiento-cuenta">${escapeHtml(mov.cuentaNombre)}</div>
          ${mov.categoriaNombre ? `<div class="movimiento-categoria">${escapeHtml(mov.categoriaNombre)}</div>` : ''}
        </div>
        <div class="movimiento-importe movimiento-importe--ingreso">
          +${formatoDinero(mov.importe)}
          <button class="btn-delete" data-id="${mov.id}" data-tipo="ingreso" title="Eliminar">×</button>
        </div>
      </div>`;
  }
  // transferencia
  return `
    <div class="movimiento-item">
      <div class="movimiento-info">
        <div class="movimiento-descripcion">${escapeHtml(mov.nota || 'Transferencia')}</div>
        <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
        <div class="movimiento-cuenta">${escapeHtml(mov.origenNombre)} → ${escapeHtml(mov.destinoNombre)}</div>
      </div>
      <div class="movimiento-importe movimiento-importe--transfer">
        ${formatoDinero(mov.importe)}
        <button class="btn-delete" data-id="${mov.id}" data-tipo="transferencia" title="Eliminar">×</button>
      </div>
    </div>`;
}

function bindDeleteButtons(scope) {
  document.querySelectorAll(`${scope} .btn-delete`).forEach(btn => {
    btn.addEventListener('click', handleBorrar);
  });
}

function handleBorrar(e) {
  const id   = e.currentTarget.dataset.id;
  const tipo = e.currentTarget.dataset.tipo;

  mostrarConfirmacion('Eliminar movimiento', '¿Seguro que querés eliminar este movimiento?', (ok) => {
    if (!ok) return;
    if (tipo === 'gasto')         datos.gastos         = datos.gastos.filter(g => g.id !== id);
    if (tipo === 'ingreso')       datos.ingresos       = datos.ingresos.filter(i => i.id !== id);
    if (tipo === 'transferencia') datos.transferencias = datos.transferencias.filter(t => t.id !== id);
    guardarDatos(datos);
    mostrarToast('Movimiento eliminado');
  });
}

// --- GASTOS ---
function actualizarGastos() {
  const el = document.getElementById('gastos-list');
  const items = [...datos.gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);

  el.innerHTML = items.length === 0
    ? '<div class="empty-state">Sin gastos aún</div>'
    : items.map(g => {
        const cat   = datos.categorias.find(c => c.id === g.categoriaID);
        const cuenta = datos.cuentas.find(c => c.id === g.cuentaID);
        return renderMovimiento({ ...g, tipo: 'gasto', categoriaNombre: cat?.nombre || 'Sin categoría', cuentaNombre: cuenta?.nombre || 'Sin cuenta' });
      }).join('');

  bindDeleteButtons('#gastos-list');
}

// --- INGRESOS ---
function actualizarIngresos() {
  const el = document.getElementById('ingresos-list');
  const items = [...datos.ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);

  el.innerHTML = items.length === 0
    ? '<div class="empty-state">Sin ingresos aún</div>'
    : items.map(i => {
        const cat   = i.categoriaID ? datos.categorias.find(c => c.id === i.categoriaID) : null;
        const cuenta = datos.cuentas.find(c => c.id === i.cuentaID);
        return renderMovimiento({ ...i, tipo: 'ingreso', categoriaNombre: cat?.nombre || '', cuentaNombre: cuenta?.nombre || 'Sin cuenta' });
      }).join('');

  bindDeleteButtons('#ingresos-list');
}

// --- TRANSFERENCIAS ---
function actualizarTransferencias() {
  const el = document.getElementById('transferencias-list');
  const items = [...datos.transferencias].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);

  el.innerHTML = items.length === 0
    ? '<div class="empty-state">Sin transferencias aún</div>'
    : items.map(t => {
        const origen  = datos.cuentas.find(c => c.id === t.origenID);
        const destino = datos.cuentas.find(c => c.id === t.destinoID);
        return renderMovimiento({ ...t, tipo: 'transferencia', origenNombre: origen?.nombre || 'Sin cuenta', destinoNombre: destino?.nombre || 'Sin cuenta' });
      }).join('');

  bindDeleteButtons('#transferencias-list');
}

// --- CUENTAS ---
function actualizarCuentas() {
  const el = document.getElementById('cuentas-list');
  const cuentas = obtenerCuentasConSaldos();

  el.innerHTML = cuentas.length === 0
    ? '<div class="empty-state">Sin cuentas</div>'
    : cuentas.map(c => `
        <div class="cuenta-item">
          <div>
            <div class="cuenta-nombre">${escapeHtml(c.nombre)}</div>
            <div class="cuenta-inicial">Inicial: ${formatoDinero(c.saldoInicial)}</div>
          </div>
          <div class="saldo-item-right">
            <div class="cuenta-valor ${c.saldoActual < 0 ? 'saldo-negativo' : ''}">${formatoDinero(c.saldoActual)}</div>
            <button class="btn-delete" data-id="${c.id}" data-tipo="cuenta" title="Eliminar">×</button>
          </div>
        </div>`).join('');

  document.querySelectorAll('#cuentas-list .btn-delete').forEach(btn => {
    btn.addEventListener('click', handleBorrarCuenta);
  });
}

function handleBorrarCuenta(e) {
  const id = e.currentTarget.dataset.id;
  mostrarConfirmacion('Eliminar cuenta', '¿Seguro? Se perderán todos sus movimientos.', (ok) => {
    if (!ok) return;
    datos.cuentas         = datos.cuentas.filter(c => c.id !== id);
    datos.gastos          = datos.gastos.filter(g => g.cuentaID !== id);
    datos.ingresos        = datos.ingresos.filter(i => i.cuentaID !== id);
    datos.transferencias  = datos.transferencias.filter(t => t.origenID !== id && t.destinoID !== id);
    guardarDatos(datos);
    mostrarToast('Cuenta eliminada');
  });
}

// --- CATEGORÍAS ---
function actualizarCategorias() {
  const el = document.getElementById('categorias-list');

  el.innerHTML = datos.categorias.length === 0
    ? '<div class="empty-state">Sin categorías</div>'
    : datos.categorias.map(c => `
        <div class="categoria-item">
          <div class="categoria-nombre">${escapeHtml(c.nombre)}</div>
          <button class="btn-delete" data-id="${c.id}" data-tipo="categoria" title="Eliminar">×</button>
        </div>`).join('');

  document.querySelectorAll('#categorias-list .btn-delete').forEach(btn => {
    btn.addEventListener('click', handleBorrarCategoria);
  });
}

function handleBorrarCategoria(e) {
  const id = e.currentTarget.dataset.id;
  mostrarConfirmacion('Eliminar categoría', '¿Seguro que querés eliminar esta categoría?', (ok) => {
    if (!ok) return;
    datos.categorias = datos.categorias.filter(c => c.id !== id);
    datos.gastos     = datos.gastos.filter(g => g.categoriaID !== id);
    guardarDatos(datos);
    mostrarToast('Categoría eliminada');
  });
}

// --- SELECTS ---
function actualizarSelectsCuentas() {
  const ids = ['gasto-cuenta', 'ingreso-cuenta', 'transfer-origen', 'transfer-destino'];
  ids.forEach(id => {
    const sel = document.getElementById(id);
    const val = sel.value;
    sel.innerHTML = '<option value="">Elegí una cuenta</option>' +
      datos.cuentas.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    sel.value = val;
  });
}

function actualizarSelectsCategorias() {
  const selGasto   = document.getElementById('gasto-categoria');
  const selIngreso = document.getElementById('ingreso-categoria');
  const valGasto   = selGasto.value;
  const valIngreso = selIngreso.value;

  const opts = datos.categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');

  selGasto.innerHTML   = '<option value="">Elegí una categoría</option>' + opts;
  selIngreso.innerHTML = '<option value="">Sin categoría</option>'       + opts;

  selGasto.value   = valGasto;
  selIngreso.value = valIngreso;
}

function actualizarMeses() {
  const sel   = document.getElementById('filter-mes');
  const meses = new Set();
  datos.gastos.forEach(g => meses.add(obtenerMes(g.fecha)));
  datos.transferencias.forEach(t => meses.add(obtenerMes(t.fecha)));

  const opts = Array.from(meses).sort().reverse().map(m => {
    const [y, mn] = m.split('-');
    const label   = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(y, parseInt(mn) - 1));
    return `<option value="${m}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');

  sel.innerHTML = '<option value="">Todos los meses</option>' + opts;
}

// ============================================================
// NAVEGACIÓN DE TABS
// ============================================================

function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      const tabName = e.target.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('nav-tab--active'));
      e.target.classList.add('nav-tab--active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'));
      document.getElementById(tabName).classList.add('tab-content--active');
    });
  });
}

// ============================================================
// FORMULARIOS
// ============================================================

function initForms() {
  // Gasto
  document.getElementById('form-gasto').addEventListener('submit', e => {
    e.preventDefault();
    datos.gastos.push({
      id:          generarID(),
      importe:     parseFloat(document.getElementById('gasto-importe').value),
      descripcion: document.getElementById('gasto-descripcion').value,
      fecha:       document.getElementById('gasto-fecha').value,
      cuentaID:    document.getElementById('gasto-cuenta').value,
      categoriaID: document.getElementById('gasto-categoria').value
    });
    guardarDatos(datos);
    e.target.reset();
    document.getElementById('gasto-fecha').value = hoy();
    mostrarToast('Gasto registrado');
  });

  // Ingreso
  document.getElementById('form-ingreso').addEventListener('submit', e => {
    e.preventDefault();
    datos.ingresos.push({
      id:          generarID(),
      importe:     parseFloat(document.getElementById('ingreso-importe').value),
      descripcion: document.getElementById('ingreso-descripcion').value,
      fecha:       document.getElementById('ingreso-fecha').value,
      cuentaID:    document.getElementById('ingreso-cuenta').value,
      categoriaID: document.getElementById('ingreso-categoria').value || null
    });
    guardarDatos(datos);
    e.target.reset();
    document.getElementById('ingreso-fecha').value = hoy();
    mostrarToast('Ingreso registrado');
  });

  // Transferencia
  document.getElementById('form-transferencia').addEventListener('submit', e => {
    e.preventDefault();
    const origen  = document.getElementById('transfer-origen').value;
    const destino = document.getElementById('transfer-destino').value;
    if (origen === destino) { mostrarToast('Elegí cuentas distintas'); return; }
    datos.transferencias.push({
      id:        generarID(),
      importe:   parseFloat(document.getElementById('transfer-importe').value),
      origenID:  origen,
      destinoID: destino,
      fecha:     document.getElementById('transfer-fecha').value,
      nota:      document.getElementById('transfer-nota').value || ''
    });
    guardarDatos(datos);
    e.target.reset();
    document.getElementById('transfer-fecha').value = hoy();
    mostrarToast('Transferencia registrada');
  });

  // Cuenta
  document.getElementById('form-cuenta').addEventListener('submit', e => {
    e.preventDefault();
    datos.cuentas.push({
      id:           generarID(),
      nombre:       document.getElementById('cuenta-nombre').value,
      saldoInicial: parseFloat(document.getElementById('cuenta-saldo-inicial').value)
    });
    guardarDatos(datos);
    e.target.reset();
    mostrarToast('Cuenta creada');
  });

  // Categoría
  document.getElementById('form-categoria').addEventListener('submit', e => {
    e.preventDefault();
    datos.categorias.push({
      id:     generarID(),
      nombre: document.getElementById('categoria-nombre').value
    });
    guardarDatos(datos);
    e.target.reset();
    mostrarToast('Categoría creada');
  });

  // Demo data
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    mostrarConfirmacion('Cargar datos de ejemplo', '¿Reemplazás los datos actuales con datos de prueba?', (ok) => {
      if (!ok) return;
      datos = {
        ...DEFAULT_DATA,
        gastos: [
          { id: generarID(), importe: 850,  descripcion: 'Almuerzo en Ámbar',    fecha: '2024-01-15', cuentaID: 'eff', categoriaID: 'comida'  },
          { id: generarID(), importe: 2400, descripcion: 'Compra Carrefour',     fecha: '2024-01-14', cuentaID: 'deb', categoriaID: 'super'   },
          { id: generarID(), importe: 450,  descripcion: 'Uber al trabajo',      fecha: '2024-01-13', cuentaID: 'mp',  categoriaID: 'trans'   },
          { id: generarID(), importe: 5200, descripcion: 'Cena con amigos',      fecha: '2024-01-12', cuentaID: 'deb', categoriaID: 'salidas' },
          { id: generarID(), importe: 1200, descripcion: 'Farmacia',             fecha: '2024-01-11', cuentaID: 'eff', categoriaID: 'salud'   }
        ],
        ingresos: [
          { id: generarID(), importe: 2100, descripcion: 'Devolución cena',      fecha: '2024-01-13', cuentaID: 'deb', categoriaID: 'salidas' }
        ],
        transferencias: [
          { id: generarID(), importe: 1000, origenID: 'deb', destinoID: 'mp',   fecha: '2024-01-10', nota: 'Fondos a Mercado Pago' }
        ]
      };
      guardarDatos(datos);
      mostrarToast('Datos de ejemplo cargados');
    });
  });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initTabs();
  initForms();
  actualizarUI();

  // Fechas hoy en formularios
  document.getElementById('gasto-fecha').value    = hoy();
  document.getElementById('ingreso-fecha').value  = hoy();
  document.getElementById('transfer-fecha').value = hoy();

  // Toggle de tema
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('[SW] Error:', err);
    });
  }
});
