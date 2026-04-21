/**
 * App.js - Home dinámica de apps
 * Carga apps desde apps.json y las renderiza con toggle de estilos
 */

// ==================================================
// ELEMENTOS DEL DOM
// ==================================================

const loadingEl = document.getElementById('loading');
const appsListEl = document.getElementById('appsList');
const emptyStateEl = document.getElementById('emptyState');
const errorStateEl = document.getElementById('errorState');
const errorDetailEl = document.getElementById('errorDetail');
const styleToggleBtn = document.getElementById('styleToggle');

// ==================================================
// CONSTANTES
// ==================================================

const APPS_JSON_PATH = './apps.json';
const STORAGE_KEY_STYLE = 'apps-home-style';
const STYLE_MINIMAL = 'minimal';
const STYLE_ACCENT = 'accent';

// ==================================================
// MANEJO DE ESTILOS
// ==================================================

/**
 * Inicializa el sistema de estilos
 * Lee del localStorage y aplica el estilo guardado
 */
function initializeStyles() {
    const savedStyle = localStorage.getItem(STORAGE_KEY_STYLE) || STYLE_MINIMAL;
    applyStyle(savedStyle);
}

/**
 * Aplica el estilo y lo guarda en localStorage
 * @param {string} style - 'minimal' o 'accent'
 */
function applyStyle(style) {
    if (style === STYLE_ACCENT) {
        document.body.classList.add('style-accent');
    } else {
        document.body.classList.remove('style-accent');
    }
    localStorage.setItem(STORAGE_KEY_STYLE, style);
}

/**
 * Toggle entre estilos mínimal y con acento
 */
function toggleStyle() {
    const currentStyle = localStorage.getItem(STORAGE_KEY_STYLE) || STYLE_MINIMAL;
    const newStyle = currentStyle === STYLE_MINIMAL ? STYLE_ACCENT : STYLE_MINIMAL;
    applyStyle(newStyle);
}

// ==================================================
// CARGA Y RENDERIZADO DE APPS
// ==================================================

/**
 * Carga el archivo apps.json
 * @returns {Promise<Array>} Array de apps
 */
async function loadApps() {
    try {
        const response = await fetch(APPS_JSON_PATH);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apps = await response.json();
        
        // Validar que sea un array
        if (!Array.isArray(apps)) {
            throw new Error('apps.json debe contener un array de apps');
        }
        
        return apps;
    } catch (error) {
        throw new Error(`No se pudo cargar apps.json: ${error.message}`);
    }
}

/**
 * Crea una tarjeta de app (elemento HTML)
 * @param {Object} app - Objeto con name, path, description
 * @returns {HTMLElement} Elemento de la tarjeta
 */
function createAppCard(app) {
    const card = document.createElement('a');
    card.href = app.path;
    card.className = 'app-card';
    card.title = app.description;
    
    // Crear contenido de la tarjeta
    card.innerHTML = `
        <div>
            <h2 class="app-name">${escapeHtml(app.name)}</h2>
            <p class="app-description">${escapeHtml(app.description)}</p>
        </div>
        <span class="app-link">Abrir app</span>
    `;
    
    return card;
}

/**
 * Renderiza la lista de apps
 * @param {Array} apps - Array de apps
 */
function renderApps(apps) {
    // Limpiar estados anteriores
    loadingEl.style.display = 'none';
    emptyStateEl.style.display = 'none';
    errorStateEl.style.display = 'none';
    
    if (apps.length === 0) {
        // Mostrar estado vacío
        appsListEl.innerHTML = '';
        emptyStateEl.style.display = 'block';
        return;
    }
    
    // Limpiar lista anterior
    appsListEl.innerHTML = '';
    
    // Renderizar cada app
    apps.forEach(app => {
        const card = createAppCard(app);
        appsListEl.appendChild(card);
    });
}

/**
 * Muestra un error en la interfaz
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    loadingEl.style.display = 'none';
    appsListEl.innerHTML = '';
    emptyStateEl.style.display = 'none';
    errorStateEl.style.display = 'block';
    errorDetailEl.textContent = message;
}

/**
 * Escapa caracteres HTML para evitar inyecciones
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================================================
// INICIALIZACIÓN
// ==================================================

/**
 * Inicializa la aplicación
 */
async function init() {
    // Inicializar estilos
    initializeStyles();
    
    // Agregar listener al botón de toggle
    styleToggleBtn.addEventListener('click', toggleStyle);
    
    // Cargar y renderizar apps
    try {
        const apps = await loadApps();
        renderApps(apps);
    } catch (error) {
        showError(error.message);
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// ==================================================
// SERVICE WORKER PARA PWA
// ==================================================

/**
 * Registra el service worker si está disponible
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('Error registrando Service Worker:', error);
            });
    });
}
