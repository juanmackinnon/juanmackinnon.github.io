/* ========================================
   GASTOS APP - LÓGICA PRINCIPAL
   ======================================== */

// ============================================
// ALMACENAMIENTO Y DATOS
// ============================================

// Estructura de datos
const DEFAULT_DATA = {
  cuentas: [
    { id: 'eff', nombre: 'Efectivo', saldoInicial: 5000 },
    { id: 'deb', nombre: 'Débito BBVA', saldoInicial: 10000 },
    { id: 'mp', nombre: 'Mercado Pago', saldoInicial: 2000 }
  ],
  categorias: [
    { id: 'comida', nombre: 'Comida' },
    { id: 'super', nombre: 'Supermercado' },
    { id: 'trans', nombre: 'Transporte' },
    { id: 'salidas', nombre: 'Salidas' },
    { id: 'salud', nombre: 'Salud' },
    { id: 'serv', nombre: 'Servicios' },
    { id: 'otros', nombre: 'Otros' }
  ],
  gastos: [],
  ingresos: [],
  transferencias: [],
  theme: 'minimal'
};

// Cargar datos desde localStorage
function cargarDatos() {
  const datos = localStorage.getItem('gastos-app-data');
  return datos ? JSON.parse(datos) : { ...DEFAULT_DATA };
}

// Guardar datos en localStorage
function guardarDatos(datos) {
  localStorage.setItem('gastos-app-data', JSON.stringify(datos));
  actualizarUI();
}

// Estado global
let datos = cargarDatos();

// ============================================
// UTILIDADES
// ============================================

// Generar ID único
function generarID() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Formatear dinero
function formatoDinero(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(valor);
}

// Formatear fecha
function formatoFecha(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR').format(date);
}

// Obtener fecha hoy
function hoy() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Obtener mes de una fecha
function obtenerMes(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toISOString().slice(0, 7);
}

// Toast de notificación
function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = mensaje;
  toast.classList.remove('toast--hidden');
  setTimeout(() => {
    toast.classList.add('toast--hidden');
  }, 3000);
}

// Modal de confirmación
function mostrarConfirmacion(titulo, mensaje, callback) {
  const modal = document.getElementById('modal-confirm');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const btnCancel = document.getElementById('btn-modal-cancel');
  const btnConfirm = document.getElementById('btn-modal-confirm');

  modalTitle.textContent = titulo;
  modalMessage.textContent = mensaje;

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

// Calcular saldo actual de una cuenta
function calcularSaldoCuenta(cuentaID) {
  const cuenta = datos.cuentas.find(c => c.id === cuentaID);
  if (!cuenta) return 0;

  let saldo = cuenta.saldoInicial;

  // Restar gastos
  datos.gastos.forEach(g => {
    if (g.cuentaID === cuentaID) {
      saldo -= g.importe;
    }
  });

  // Sumar ingresos
  datos.ingresos.forEach(i => {
    if (i.cuentaID === cuentaID) {
      saldo += i.importe;
    }
  });

  // Aplicar transferencias
  datos.transferencias.forEach(t => {
    if (t.origenID === cuentaID) {
      saldo -= t.importe;
    } else if (t.destinoID === cuentaID) {
      saldo += t.importe;
    }
  });

  return saldo;
}

// Obtener todas las cuentas con saldos actualizados
function obtenerCuentasConSaldos() {
  return datos.cuentas.map(cuenta => ({
    ...cuenta,
    saldoActual: calcularSaldoCuenta(cuenta.id)
  }));
}

// ============================================
// LÓGICA DE GASTOS Y CATEGORÍAS
// ============================================

// Calcular gasto total por categoría
function calcularGastoPorCategoria(categoriaID) {
  return datos.gastos
    .filter(g => g.categoriaID === categoriaID)
    .reduce((sum, g) => sum + g.importe, 0);
}

// Calcular ingreso total por categoría
function calcularIngresoPorCategoria(categoriaID) {
  return datos.ingresos
    .filter(i => i.categoriaID === categoriaID)
    .reduce((sum, i) => sum + i.importe, 0);
}

// Calcular gasto total general
function calcularTotalGastos() {
  return datos.gastos.reduce((sum, g) => sum + g.importe, 0);
}

// Calcular ingreso total general
function calcularTotalIngresos() {
  return datos.ingresos.reduce((sum, i) => sum + i.importe, 0);
}

// Obtener últimos movimientos (gastos + ingresos + transferencias)
function obtenerUltimosMovimientos(limite = 10) {
  const movimientos = [];

  datos.gastos.forEach(gasto => {
    const categoria = datos.categorias.find(c => c.id === gasto.categoriaID);
    const cuenta = datos.cuentas.find(c => c.id === gasto.cuentaID);
    movimientos.push({
      ...gasto,
      tipo: 'gasto',
      categoriaNombre: categoria?.nombre || 'Sin categoría',
      cuentaNombre: cuenta?.nombre || 'Sin cuenta'
    });
  });

  datos.ingresos.forEach(ingreso => {
    const categoria = ingreso.categoriaID ? datos.categorias.find(c => c.id === ingreso.categoriaID) : null;
    const cuenta = datos.cuentas.find(c => c.id === ingreso.cuentaID);
    movimientos.push({
      ...ingreso,
      tipo: 'ingreso',
      categoriaNombre: categoria?.nombre || '',
      cuentaNombre: cuenta?.nombre || 'Sin cuenta'
    });
  });

  datos.transferencias.forEach(transfer => {
    const origen = datos.cuentas.find(c => c.id === transfer.origenID);
    const destino = datos.cuentas.find(c => c.id === transfer.destinoID);
    movimientos.push({
      ...transfer,
      tipo: 'transferencia',
      origenNombre: origen?.nombre || 'Sin cuenta',
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

// Actualizar todo la interfaz
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
function actualizarResumen() {
  // Gastos por categoría
  const categoriasGastos = document.getElementById('categorias-gastos');
  const categoriasConGasto = datos.categorias.map(cat => ({
    ...cat,
    gasto: calcularGastoPorCategoria(cat.id)
  })).filter(cat => cat.gasto > 0);

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

  // Ingresos por categoría (solo si hay categoría asignada)
  const categoriasIngresos = document.getElementById('categorias-ingresos');
  const categoriasConIngreso = datos.categorias.map(cat => ({
    ...cat,
    ingreso: calcularIngresoPorCategoria(cat.id)
  })).filter(cat => cat.ingreso > 0);

  if (categoriasConIngreso.length === 0) {
    categoriasIngresos.innerHTML = '<div class="empty-state"><p>Sin ingresos registrados</p></div>';
  } else {
    categoriasIngresos.innerHTML = categoriasConIngreso.map(cat => `
      <div class="categoria-gasto-item">
        <span class="categoria-gasto-nombre">${cat.nombre}</span>
        <span class="categoria-gasto-total categoria-ingreso-total">${formatoDinero(cat.ingreso)}</span>
      </div>
    `).join('');
  }

  // Total ingresos
  document.getElementById('total-ingresos').textContent = formatoDinero(calcularTotalIngresos());

  // Últimos movimientos
  const ultimos = document.getElementById('ultimos-movimientos');
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
          </div>
        `;
      } else if (mov.tipo === 'ingreso') {
        return `
          <div class="movimiento-item">
            <div class="movimiento-info">
              <div class="movimiento-descripcion">${mov.descripcion}</div>
              <div class="movimiento-fecha">${formatoFecha(mov.fecha)}</div>
              <div class="movimiento-cuenta">${mov.cuentaNombre}</div>
              ${mov.categoriaNombre ? `<div class="movimiento-categoria">${mov.categoriaNombre}</div>` : ''}
            </div>
            <div class="movimiento-importe movimiento-importe--ingreso">
              +${formatoDinero(mov.importe)}
              <button class="btn-delete" data-id="${mov.id}" data-tipo="ingreso">×</button>
            </div>
          </div>
        `;
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
          </div>
        `;
      }
    }).join('');
  }

  // Delegación de eventos para botones de borrado
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

function handleBorrar(e) {
  const id = e.currentTarget.dataset.id;
  const tipo = e.currentTarget.dataset.tipo;

  mostrarConfirmacion(
    'Eliminar movimiento',
    '¿Seguro que querés eliminar este movimiento?',
    (confirmar) => {
      if (confirmar) {
        if (tipo === 'gasto') {
          datos.gastos = datos.gastos.filter(g => g.id !== id);
        } else if (tipo === 'ingreso') {
          datos.ingresos = datos.ingresos.filter(i => i.id !== id);
        } else if (tipo === 'transferencia') {
          datos.transferencias = datos.transferencias.filter(t => t.id !== id);
        }
        guardarDatos(datos);
        mostrarToast('Movimiento eliminado');
      }
    }
  );
}

// --- GASTOS ---
function actualizarGastos() {
  const gastosList = document.getElementById('gastos-list');
  const ultimosGastos = datos.gastos
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  if (ultimosGastos.length === 0) {
    gastosList.innerHTML = '<div class="empty-state"><p>Sin gastos aún. ¡Agregá el primero!</p></div>';
  } else {
    gastosList.innerHTML = ultimosGastos.map(gasto => {
      const categoria = datos.categorias.find(c => c.id === gasto.categoriaID);
      const cuenta = datos.cuentas.find(c => c.id === gasto.cuentaID);
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
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('#gastos-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

// --- INGRESOS ---
function actualizarIngresos() {
  const ingresosList = document.getElementById('ingresos-list');
  const ultimosIngresos = datos.ingresos
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  if (ultimosIngresos.length === 0) {
    ingresosList.innerHTML = '<div class="empty-state"><p>Sin ingresos aún. ¡Agregá el primero!</p></div>';
  } else {
    ingresosList.innerHTML = ultimosIngresos.map(ingreso => {
      const cuenta = datos.cuentas.find(c => c.id === ingreso.cuentaID);
      const categoria = ingreso.categoriaID ? datos.categorias.find(c => c.id === ingreso.categoriaID) : null;
      return `
        <div class="movimiento-item">
          <div class="movimiento-info">
            <div class="movimiento-descripcion">${ingreso.descripcion}</div>
            <div class="movimiento-fecha">${formatoFecha(ingreso.fecha)}</div>
            <div class="movimiento-cuenta">${cuenta?.nombre || 'Sin cuenta'}</div>
            ${categoria ? `<div class="movimiento-categoria">${categoria.nombre}</div>` : ''}
          </div>
          <div class="movimiento-importe movimiento-importe--ingreso">
            +${formatoDinero(ingreso.importe)}
            <button class="btn-delete" data-id="${ingreso.id}" data-tipo="ingreso">×</button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('#ingresos-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}
function actualizarTransferencias() {
  const transferList = document.getElementById('transferencias-list');
  const ultimasTransfers = datos.transferencias
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10);

  if (ultimasTransfers.length === 0) {
    transferList.innerHTML = '<div class="empty-state"><p>Sin transferencias aún</p></div>';
  } else {
    transferList.innerHTML = ultimasTransfers.map(transfer => {
      const origen = datos.cuentas.find(c => c.id === transfer.origenID);
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
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('#transferencias-list .btn-delete').forEach(btn => {
    btn.removeEventListener('click', handleBorrar);
    btn.addEventListener('click', handleBorrar);
  });
}

// --- CUENTAS ---
function actualizarCuentas() {
  const cuentasList = document.getElementById('cuentas-list');
  const cuentasConSaldos = obtenerCuentasConSaldos();

  cuentasList.innerHTML = cuentasConSaldos.map(cuenta => `
    <div class="cuenta-item">
      <div>
        <div class="cuenta-nombre">${cuenta.nombre}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
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
      if (confirmar) {
        datos.cuentas = datos.cuentas.filter(c => c.id !== id);
        datos.gastos = datos.gastos.filter(g => g.cuentaID !== id);
        datos.transferencias = datos.transferencias.filter(t => 
          t.origenID !== id && t.destinoID !== id
        );
        guardarDatos(datos);
        mostrarToast('Cuenta eliminada');
      }
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
      if (confirmar) {
        datos.categorias = datos.categorias.filter(c => c.id !== id);
        datos.gastos = datos.gastos.filter(g => g.categoriaID !== id);
        guardarDatos(datos);
        mostrarToast('Categoría eliminada');
      }
    }
  );
}

// --- SELECTS ---
function actualizarSelectsCuentas() {
  const selects = [
    document.getElementById('gasto-cuenta'),
    document.getElementById('ingreso-cuenta'),
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
  const gasto_select = document.getElementById('gasto-categoria');
  const ingreso_select = document.getElementById('ingreso-categoria');
  
  const valor_gasto = gasto_select.value;
  const valor_ingreso = ingreso_select.value;
  
  gasto_select.innerHTML = '<option value="">Elegí una categoría</option>' +
    datos.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  gasto_select.value = valor_gasto;
  
  // Para ingresos, la categoría es opcional
  ingreso_select.innerHTML = '<option value="">Sin categoría</option>' +
    datos.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  ingreso_select.value = valor_ingreso;
}

// --- MESES PARA FILTRO ---
function actualizarMeses() {
  const select = document.getElementById('filter-mes');
  const meses = new Set();

  datos.gastos.forEach(g => meses.add(obtenerMes(g.fecha)));
  datos.transferencias.forEach(t => meses.add(obtenerMes(t.fecha)));

  const mesesOrdenados = Array.from(meses).sort().reverse();

  const opcionesHTML = mesesOrdenados.map(mes => {
    const [año, mes_num] = mes.split('-');
    const fecha = new Date(año, parseInt(mes_num) - 1);
    const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fecha);
    return `<option value="${mes}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
  }).join('');

  select.innerHTML = '<option value="">Todos los meses</option>' + opcionesHTML;
}

// ============================================
// EVENTOS Y HANDLERS
// ============================================

// Navegación entre tabs
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;

    // Actualizar clases activas
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('nav-tab--active'));
    e.target.classList.add('nav-tab--active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'));
    document.getElementById(tabName).classList.add('tab-content--active');
  });
});

// Formulario de gastos
document.getElementById('form-gasto').addEventListener('submit', (e) => {
  e.preventDefault();

  const gasto = {
    id: generarID(),
    importe: parseFloat(document.getElementById('gasto-importe').value),
    descripcion: document.getElementById('gasto-descripcion').value,
    fecha: document.getElementById('gasto-fecha').value,
    cuentaID: document.getElementById('gasto-cuenta').value,
    categoriaID: document.getElementById('gasto-categoria').value
  };

  datos.gastos.push(gasto);
  guardarDatos(datos);

  // Limpiar formulario y poner fecha hoy
  e.target.reset();
  document.getElementById('gasto-fecha').value = hoy();

  mostrarToast('¡Gasto registrado!');
});

// Formulario de ingresos
document.getElementById('form-ingreso').addEventListener('submit', (e) => {
  e.preventDefault();

  const ingreso = {
    id: generarID(),
    importe: parseFloat(document.getElementById('ingreso-importe').value),
    descripcion: document.getElementById('ingreso-descripcion').value,
    fecha: document.getElementById('ingreso-fecha').value,
    cuentaID: document.getElementById('ingreso-cuenta').value,
    categoriaID: document.getElementById('ingreso-categoria').value || null
  };

  datos.ingresos.push(ingreso);
  guardarDatos(datos);

  // Limpiar formulario y poner fecha hoy
  e.target.reset();
  document.getElementById('ingreso-fecha').value = hoy();

  mostrarToast('¡Ingreso registrado!');
});

// Formulario de transferencias
document.getElementById('form-transferencia').addEventListener('submit', (e) => {
  e.preventDefault();

  const origen = document.getElementById('transfer-origen').value;
  const destino = document.getElementById('transfer-destino').value;

  if (origen === destino) {
    mostrarToast('Elegí cuentas distintas');
    return;
  }

  const transferencia = {
    id: generarID(),
    importe: parseFloat(document.getElementById('transfer-importe').value),
    origenID: origen,
    destinoID: destino,
    fecha: document.getElementById('transfer-fecha').value,
    nota: document.getElementById('transfer-nota').value || ''
  };

  datos.transferencias.push(transferencia);
  guardarDatos(datos);

  e.target.reset();
  document.getElementById('transfer-fecha').value = hoy();

  mostrarToast('¡Transferencia registrada!');
});

// Formulario de cuentas
document.getElementById('form-cuenta').addEventListener('submit', (e) => {
  e.preventDefault();

  const cuenta = {
    id: generarID(),
    nombre: document.getElementById('cuenta-nombre').value,
    saldoInicial: parseFloat(document.getElementById('cuenta-saldo-inicial').value)
  };

  datos.cuentas.push(cuenta);
  guardarDatos(datos);

  e.target.reset();
  mostrarToast('¡Cuenta creada!');
});

// Formulario de categorías
document.getElementById('form-categoria').addEventListener('submit', (e) => {
  e.preventDefault();

  const categoria = {
    id: generarID(),
    nombre: document.getElementById('categoria-nombre').value
  };

  datos.categorias.push(categoria);
  guardarDatos(datos);

  e.target.reset();
  mostrarToast('¡Categoría creada!');
});

// Toggle de tema
document.querySelector('.toggle-theme-btn').addEventListener('click', () => {
  document.body.classList.toggle('theme-accent');
  datos.theme = document.body.classList.contains('theme-accent') ? 'accent' : 'minimal';
  guardarDatos(datos);
});

// Cargar datos demo
document.getElementById('btn-reset-data').addEventListener('click', () => {
  mostrarConfirmacion(
    'Cargar datos de ejemplo',
    '¿Querés cargar datos de prueba? Se reemplazarán los datos actuales.',
    (confirmar) => {
      if (confirmar) {
        datos = {
          ...DEFAULT_DATA,
          gastos: [
            { id: generarID(), importe: 850, descripcion: 'Almuerzo en Ámbar', fecha: '2024-01-15', cuentaID: 'eff', categoriaID: 'comida' },
            { id: generarID(), importe: 2400, descripcion: 'Compra Carrefour', fecha: '2024-01-14', cuentaID: 'deb', categoriaID: 'super' },
            { id: generarID(), importe: 450, descripcion: 'Uber al trabajo', fecha: '2024-01-13', cuentaID: 'mp', categoriaID: 'trans' },
            { id: generarID(), importe: 5200, descripcion: 'Cena con amigos', fecha: '2024-01-12', cuentaID: 'deb', categoriaID: 'salidas' },
            { id: generarID(), importe: 1200, descripcion: 'Farmacia', fecha: '2024-01-11', cuentaID: 'eff', categoriaID: 'salud' }
          ],
          ingresos: [
            { id: generarID(), importe: 2100, descripcion: 'Devolución cena con amigos', fecha: '2024-01-13', cuentaID: 'deb', categoriaID: 'salidas' }
          ],
          transferencias: [
            { id: generarID(), importe: 1000, origenID: 'deb', destinoID: 'mp', fecha: '2024-01-10', nota: 'Fondos a Mercado Pago' }
          ],
          theme: 'minimal'
        };
        guardarDatos(datos);
        mostrarToast('Datos de ejemplo cargados');
      }
    }
  );
});

// Inicializar fechas hoy en formularios
document.getElementById('gasto-fecha').valueAsDate = new Date();
document.getElementById('ingreso-fecha').valueAsDate = new Date();
document.getElementById('transfer-fecha').valueAsDate = new Date();

// Aplicar tema guardado
if (datos.theme === 'accent') {
  document.body.classList.add('theme-accent');
}

// Inicializar UI
actualizarUI();

// Registrar service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => {
    console.log('Service Worker no registrado:', err);
  });
}
