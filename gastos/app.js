/* ========================================
   GASTOS APP - LÓGICA PRINCIPAL
   ======================================== */

// ============================================
// ALMACENAMIENTO Y DATOS
// ============================================

const DEFAULT_DATA = {
  cuentas: [
    { id: 'eff', nombre: 'Efectivo',    saldoInicial: 5000 },
    { id: 'deb', nombre: 'Débito BBVA', saldoInicial: 10000 },
    { id: 'mp',  nombre: 'Mercado Pago',saldoInicial: 2000 }
  ],
  categorias: [
    { id: 'comida',  nombre: 'Comida' },
    { id: 'super',   nombre: 'Supermercado' },
    { id: 'trans',   nombre: 'Transporte' },
    { id: 'salidas', nombre: 'Salidas' },
    { id: 'salud',   nombre: 'Salud' },
    { id: 'serv',    nombre: 'Servicios' },
    { id: 'otros',   nombre: 'Otros' }
  ],
  gastos: [],
  transferencias: [],
  theme: 'minimal'
};

function cargarDatos() {
  const datos = localStorage.getItem('gastos-app-data');
  return datos ? JSON.parse(datos) : { ...DEFAULT_DATA };
}

function guardarDatos(datos) {
  localStorage.setItem('gastos-app-data', JSON.stringify(datos));
  actualizarUI();
}

let datos = cargarDatos();

// ============================================
// UTILIDADES
// ============================================

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

function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = mensaje;
  toast.classList.remove('toast--hidden');
  setTimeout(() => toast.classList.add('toast--hidden'), 3000);
}

function mostrarConfirmacion(titulo, mensaje, callback) {
  const modal    = document.getElementById('modal-confirm');
  const btnCancel  = document.getElementById('btn-modal-cancel');
  const btnConfirm = document.getElementById('btn-modal-confirm');

  document.getElementById('modal-title').textContent   = titulo;
  document.getElementById('modal-message').textContent = mensaje;
  modal.classList.remove('modal--hidden');

  const handleConfirm = () => {
    modal.classList.add('modal--hidden');
    btnCancel.removeEventListener('click', handleCancel);
    btnConfirm.removeEventListener('click', handleConfirm);
    callback(true);
  };

  const handleCancel = () => {
    modal.classList.add('modal--hidden');
    btnCancel.removeEventListener('click', handleCancel);
    btnConfirm.removeEventListener('click', handleConfirm);
    callback(false);
  };

  btnCancel.addEventListener('click', handleCancel);
  btnConfirm.addEventListener('click', handleConfirm);
}

// ============================================
// LÓGICA DE CUENTAS
// ============================================

function calcularSaldoCuenta(cuentaID) {
  const cuenta = datos.cuentas.find(c => c.id === cuentaID);
  if (!cuenta) return 0;

  let saldo = cuenta.saldoInicial;

  datos.gastos.forEach(g => {
    if (g.cuentaID === cuentaID) saldo -= g.importe;
  });

  datos.transferencias.forEach(t => {
    if (t.origenID === cuentaID)  saldo -= t.importe;
    if (t.destinoID === cuentaID) saldo += t.importe;
  });

  return saldo;
}

function obtenerCuentasConSaldos() {
  return datos.cuentas.map(cuenta => ({
    ...cuenta,
    saldoActual: calcularSaldoCuenta(cuenta.id)
  }));
}

// ============================================
// LÓGICA DE GASTOS Y CATEGORÍAS
// ============================================

function calcularGastoPorCategoria(categoriaID) {
  return datos.gastos
    .filter(g => g.categoriaID === categoriaID)
    .reduce((sum, g) => sum + g.importe, 0);
}

function calcularTotalGastos() {
  return datos.gastos.reduce((sum, g) => sum + g.importe, 0);
}

function obtenerUltimosMovimientos(limite = 10) {
  const movimientos = [];

  datos.gastos.forEach(gasto => {
    const categoria = datos.categorias.find(c => c.id === gasto.categoriaID);
    const cuenta    = datos.cuentas.find(c => c.id === gasto.cuentaID);
    movimientos.push({
      ...gasto,
      tipo: 'gasto',
      categoriaNombre: categoria?.nombre || 'Sin categoría',
      cuentaNombre: cuenta?.nombre || 'Sin cuenta'
    });
  });

  datos.transferencias.forEach(transfer => {
    const origen  = datos.cuentas.find(c => c.id === transfer.origenID);
    const destino = datos.cuentas.find(c => c.id === transfer.destinoID);
    movimientos.push({
      ...transfer,
      tipo: 'transferencia',
      origenNombre:  origen?.nombre  || 'Sin cuenta',
      destinoNombre: destino?.nombre || 'Sin cuenta'
    });
  });

  return movimientos
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limite);
}

// ============================================
// RENDERIZADO DE UI
// ============================================

function actualizarUI() {
  actualizarResumen();
  actualizarGastos();
  actualizarTransferencias();
  actualizarCuentas();
  actualizarCategorias();
  actualizarSelectsCuentas();
  actualizarSelectsCategorias();
  actualizarMeses();
}

// --- RESUMEN ---
function actualizarResumen() {
  // Saldos
  const saldosContainer   = document.getElementById('saldos-container');
  const cuentasConSaldos  = obtenerCuentasConSaldos();

  saldosContainer.innerHTML = cuentasConSaldos.map(cuenta => `
    <div class="saldo-item">
      <div><div class="saldo-nombre">${cuenta.nombre}</div></div>
      <div class="saldo-item-right">
        <div class="saldo-valor ${cuenta.saldoActual < 0 ? 'saldo-negativo' : ''}">
          ${formatoDinero(cuenta.saldoActual)}
        </div>
      </div>
    </div>
  `).join('');

  // Categorías con gastos
  const categoriasGastos = document.getElementById('categorias-gastos');
  const categoriasConGasto = datos.categorias
    .map(cat => ({ ...cat, gasto: calcularGastoPorCategoria(cat.id) }))
    .filter(cat => cat.gasto > 0);

  if (categoriasConGasto.length === 0) {
    categoriasGastos.innerHTML = '<div class="empty-state"><p>Sin gastos registrados</p></div>';
  } else {
    categoriasGastos.innerHTML = categoriasConGasto.map(cat => `
      <div class="categoria-gasto-item">
        <span class="categoria-gasto-nombre">${cat.nombre}</span>
        <span class="categoria-gasto-total">${formatoDinero(cat.gasto)}</span>
      </div>
    `).join('');
  }

  // Total gastos
  document.getElementById('total-gastos').textContent = formatoDinero(calcularTotalGastos());

  // Últimos movimientos
  const ultimos    = document.getElementById('ultimos-movimientos');
  const movimientos = obtenerUltimosMovimientos(5);

  if (movimientos.length === 0) {
    ultimos.innerHTML = '<div class="empty-state"><p>Sin movimientos registrados</p></div>';
  } else {
    ultimos.innerHTML = movimientos.map(mov => {
      if (mov.tipo === 'gasto') {
        return `
          <div class="movimiento-item">
            <div class="movimiento-info">
              <div class="movimiento-descripcion">${mov.descripcion}</div>
              <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
              <div class="movimiento-cuenta">${mov.cuentaNombre}</div>
              <div class="movimiento-categoria">${mov.categoriaNombre}</div>
            </div>
            <div class="movimiento-importe">
              ${formatoDinero(mov.importe)}
              <button class="btn-delete" data-id="${mov.id}" data-tipo="gasto">×</button>
            </div>
          </div>`;
      } else {
        return `
          <div class="movimiento-item">
            <div class="movimiento-info">
              <div class="movimiento-descripcion">${mov.nota || 'Transferencia'}</div>
              <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
              <div class="movimiento-cuenta">${mov.origenNombre} → ${mov.destinoNombre}</div>
            </div>
            <div class="movimiento-importe movimiento-importe--transfer">
              +${formatoDinero(mov.importe)}
              <button class="btn-delete" data-id="${mov.id}" data-tipo="transferencia">×</button>
            </div>
          </div>`;
      }
    }).join('');
  }

  registrarBotonesEliminar();
}

function registrarBotonesEliminar() {
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

function handleBorrar(e) {
  const id   = e.currentTarget.dataset.id;
  const tipo = e.currentTarget.dataset.tipo;

  mostrarConfirmacion(
    'Eliminar movimiento',
    '¿Seguro que querés eliminar este movimiento?',
    (confirmar) => {
      if (!confirmar) return;
      if (tipo === 'gasto') {
        datos.gastos = datos.gastos.filter(g => g.id !== id);
      } else if (tipo === 'transferencia') {
        datos.transferencias = datos.transferencias.filter(t => t.id !== id);
      }
      guardarDatos(datos);
      mostrarToast('Movimiento eliminado');
    }
  );
}

// --- GASTOS ---
function actualizarGastos() {
  const gastosList = document.getElementById('gastos-list');
  const ultimosGastos = [...datos.gastos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  if (ultimosGastos.length === 0) {
    gastosList.innerHTML = '<div class="empty-state"><p>Sin gastos aún. ¡Agregá el primero!</p></div>';
    return;
  }

  gastosList.innerHTML = ultimosGastos.map(gasto => {
    const categoria = datos.categorias.find(c => c.id === gasto.categoriaID);
    const cuenta    = datos.cuentas.find(c => c.id === gasto.cuentaID);
    return `
      <div class="movimiento-item">
        <div class="movimiento-info">
          <div class="movimiento-descripcion">${gasto.descripcion}</div>
          <div class="movimiento-fecha">${formatoFecha(gasto.fecha)}</div>
          <div class="movimiento-cuenta">${cuenta?.nombre || 'Sin cuenta'}</div>
          <div class="movimiento-categoria">${categoria?.nombre || 'Sin categoría'}</div>
        </div>
        <div class="movimiento-importe">
          ${formatoDinero(gasto.importe)}
          <button class="btn-delete" data-id="${gasto.id}" data-tipo="gasto">×</button>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('#gastos-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

// --- TRANSFERENCIAS ---
function actualizarTransferencias() {
  const transferList = document.getElementById('transferencias-list');
  const ultimasTransfers = [...datos.transferencias]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  if (ultimasTransfers.length === 0) {
    transferList.innerHTML = '<div class="empty-state"><p>Sin transferencias aún</p></div>';
    return;
  }

  transferList.innerHTML = ultimasTransfers.map(transfer => {
    const origen  = datos.cuentas.find(c => c.id === transfer.origenID);
    const destino = datos.cuentas.find(c => c.id === transfer.destinoID);
    return `
      <div class="movimiento-item">
        <div class="movimiento-info">
          <div class="movimiento-descripcion">${transfer.nota || 'Transferencia'}</div>
          <div class="movimiento-fecha">${formatoFecha(transfer.fecha)}</div>
          <div class="movimiento-cuenta">${origen?.nombre || 'Sin cuenta'} → ${destino?.nombre || 'Sin cuenta'}</div>
        </div>
        <div class="movimiento-importe movimiento-importe--transfer">
          +${formatoDinero(transfer.importe)}
          <button class="btn-delete" data-id="${transfer.id}" data-tipo="transferencia">×</button>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('#transferencias-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

// --- CUENTAS ---
function actualizarCuentas() {
  const cuentasList      = document.getElementById('cuentas-list');
  const cuentasConSaldos = obtenerCuentasConSaldos();

  cuentasList.innerHTML = cuentasConSaldos.map(cuenta => `
    <div class="cuenta-item">
      <div>
        <div class="cuenta-nombre">${cuenta.nombre}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">
          Inicial: ${formatoDinero(cuenta.saldoInicial)}
        </div>
      </div>
      <div class="saldo-item-right">
        <div class="cuenta-valor ${cuenta.saldoActual < 0 ? 'saldo-negativo' : ''}">
          ${formatoDinero(cuenta.saldoActual)}
        </div>
        <button class="btn-delete" data-id="${cuenta.id}" data-tipo="cuenta">×</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('#cuentas-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrarCuenta);
    btn.addEventListener('click', handleBorrarCuenta);
  });
}

function handleBorrarCuenta(e) {
  const id = e.currentTarget.dataset.id;
  mostrarConfirmacion(
    'Eliminar cuenta',
    '¿Seguro que querés eliminar esta cuenta? Se perderán todos sus movimientos.',
    (confirmar) => {
      if (!confirmar) return;
      datos.cuentas        = datos.cuentas.filter(c => c.id !== id);
      datos.gastos         = datos.gastos.filter(g => g.cuentaID !== id);
      datos.transferencias = datos.transferencias.filter(t => t.origenID !== id && t.destinoID !== id);
      guardarDatos(datos);
      mostrarToast('Cuenta eliminada');
    }
  );
}

// --- CATEGORÍAS ---
function actualizarCategorias() {
  const categoriasList = document.getElementById('categorias-list');

  categoriasList.innerHTML = datos.categorias.map(cat => `
    <div class="categoria-item">
      <div class="categoria-nombre">${cat.nombre}</div>
      <button class="btn-delete" data-id="${cat.id}" data-tipo="categoria">×</button>
    </div>
  `).join('');

  document.querySelectorAll('#categorias-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrarCategoria);
    btn.addEventListener('click', handleBorrarCategoria);
  });
}

function handleBorrarCategoria(e) {
  const id = e.currentTarget.dataset.id;
  mostrarConfirmacion(
    'Eliminar categoría',
    '¿Seguro que querés eliminar esta categoría?',
    (confirmar) => {
      if (!confirmar) return;
      datos.categorias = datos.categorias.filter(c => c.id !== id);
      datos.gastos     = datos.gastos.filter(g => g.categoriaID !== id);
      guardarDatos(datos);
      mostrarToast('Categoría eliminada');
    }
  );
}

// --- SELECTS ---
function actualizarSelectsCuentas() {
  const selects = [
    document.getElementById('gasto-cuenta'),
    document.getElementById('transfer-origen'),
    document.getElementById('transfer-destino')
  ];

  selects.forEach(select => {
    const valor = select.value;
    select.innerHTML = '<option value="">Elegí una cuenta</option>' +
      datos.cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    select.value = valor;
  });
}

function actualizarSelectsCategorias() {
  const select = document.getElementById('gasto-categoria');
  const valor  = select.value;
  select.innerHTML = '<option value="">Elegí una categoría</option>' +
    datos.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  select.value = valor;
}

// --- MESES ---
function actualizarMeses() {
  const select = document.getElementById('filter-mes');
  const meses  = new Set();

  datos.gastos.forEach(g => meses.add(obtenerMes(g.fecha)));
  datos.transferencias.forEach(t => meses.add(obtenerMes(t.fecha)));

  const mesesOrdenados = Array.from(meses).sort().reverse();
  const opcionesHTML   = mesesOrdenados.map(mes => {
    const [año, mes_num] = mes.split('-');
    const fecha = new Date(año, parseInt(mes_num) - 1);
    const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fecha);
    return `<option value="${mes}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');

  select.innerHTML = '<option value="">Todos los meses</option>' + opcionesHTML;
}

// ============================================
// EVENTOS
// ============================================

// Navegación tabs
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('nav-tab--active'));
    e.target.classList.add('nav-tab--active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'));
    document.getElementById(tabName).classList.add('tab-content--active');
  });
});

// Formulario gastos
document.getElementById('form-gasto').addEventListener('submit', (e) => {
  e.preventDefault();
  const gasto = {
    id:          generarID(),
    importe:     parseFloat(document.getElementById('gasto-importe').value),
    descripcion: document.getElementById('gasto-descripcion').value,
    fecha:       document.getElementById('gasto-fecha').value,
    cuentaID:    document.getElementById('gasto-cuenta').value,
    categoriaID: document.getElementById('gasto-categoria').value
  };
  datos.gastos.push(gasto);
  guardarDatos(datos);
  e.target.reset();
  document.getElementById('gasto-fecha').value = hoy();
  mostrarToast('¡Gasto registrado!');
});

// Formulario transferencias
document.getElementById('form-transferencia').addEventListener('submit', (e) => {
  e.preventDefault();
  const origen  = document.getElementById('transfer-origen').value;
  const destino = document.getElementById('transfer-destino').value;

  if (origen === destino) { mostrarToast('Elegí cuentas distintas'); return; }

  const transferencia = {
    id:       generarID(),
    importe:  parseFloat(document.getElementById('transfer-importe').value),
    origenID: origen,
    destinoID: destino,
    fecha:    document.getElementById('transfer-fecha').value,
    nota:     document.getElementById('transfer-nota').value || ''
  };
  datos.transferencias.push(transferencia);
  guardarDatos(datos);
  e.target.reset();
  document.getElementById('transfer-fecha').value = hoy();
  mostrarToast('¡Transferencia registrada!');
});

// Formulario cuentas
document.getElementById('form-cuenta').addEventListener('submit', (e) => {
  e.preventDefault();
  const cuenta = {
    id:           generarID(),
    nombre:       document.getElementById('cuenta-nombre').value,
    saldoInicial: parseFloat(document.getElementById('cuenta-saldo-inicial').value)
  };
  datos.cuentas.push(cuenta);
  guardarDatos(datos);
  e.target.reset();
  mostrarToast('¡Cuenta creada!');
});

// Formulario categorías
document.getElementById('form-categoria').addEventListener('submit', (e) => {
  e.preventDefault();
  const categoria = {
    id:     generarID(),
    nombre: document.getElementById('categoria-nombre').value
  };
  datos.categorias.push(categoria);
  guardarDatos(datos);
  e.target.reset();
  mostrarToast('¡Categoría creada!');
});

// Toggle de tema — clase unificada: style-accent
document.querySelector('.toggle-theme-btn').addEventListener('click', () => {
  const isLight = document.body.classList.toggle('style-light');
  localStorage.setItem('gastos-theme', isLight ? 'light' : 'dark');
});

// Datos demo
document.getElementById('btn-reset-data').addEventListener('click', () => {
  mostrarConfirmacion(
    'Cargar datos de ejemplo',
    '¿Querés cargar datos de prueba? Se reemplazarán los datos actuales.',
    (confirmar) => {
      if (!confirmar) return;
      datos = {
        ...DEFAULT_DATA,
        gastos: [
          { id: generarID(), importe: 850,  descripcion: 'Almuerzo en Ámbar',     fecha: '2024-01-15', cuentaID: 'eff', categoriaID: 'comida'  },
          { id: generarID(), importe: 2400, descripcion: 'Compra Carrefour',       fecha: '2024-01-14', cuentaID: 'deb', categoriaID: 'super'   },
          { id: generarID(), importe: 450,  descripcion: 'Uber al trabajo',        fecha: '2024-01-13', cuentaID: 'mp',  categoriaID: 'trans'   },
          { id: generarID(), importe: 5200, descripcion: 'Cena con amigos',        fecha: '2024-01-12', cuentaID: 'deb', categoriaID: 'salidas' },
          { id: generarID(), importe: 1200, descripcion: 'Farmacia',               fecha: '2024-01-11', cuentaID: 'eff', categoriaID: 'salud'   }
        ],
        transferencias: [
          { id: generarID(), importe: 1000, origenID: 'deb', destinoID: 'mp', fecha: '2024-01-10', nota: 'Fondos a Mercado Pago' }
        ],
        theme: 'minimal'
      };
      guardarDatos(datos);
      mostrarToast('Datos de ejemplo cargados');
    }
  );
});

// ============================================
// INICIALIZACIÓN
// ============================================

// Fechas de hoy en formularios
document.getElementById('gasto-fecha').valueAsDate    = new Date();
document.getElementById('transfer-fecha').valueAsDate = new Date();

// Service Worker
if (localStorage.getItem('gastos-theme') === 'light') {
  document.body.classList.add('style-light');
}

actualizarUI();
