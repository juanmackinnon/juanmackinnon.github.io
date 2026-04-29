/**
 * app.js — Mis Apps Home
 * Carga apps desde apps.json. Toggle dark/light via body.style-light
 */
 
const loadingEl     = document.getElementById('loading');
const appsListEl    = document.getElementById('appsList');
const emptyStateEl  = document.getElementById('emptyState');
const errorStateEl  = document.getElementById('errorState');
const errorDetailEl = document.getElementById('errorDetail');
const themeToggle   = document.getElementById('themeToggle');
 
const APPS_JSON_PATH  = './apps.json';
const STORAGE_THEME   = 'newco-apps-theme'; // 'light' | 'dark'
 
// ---- TEMA ----
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
 
themeToggle.addEventListener('click', toggleTheme);
 
// ---- CARGA ----
async function loadApps() {
    try {
        const response = await fetch(APPS_JSON_PATH);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const apps = await response.json();
        if (!Array.isArray(apps)) throw new Error('apps.json debe contener un array');
        return apps;
    } catch (error) {
        throw new Error(`No se pudo cargar apps.json: ${error.message}`);
    }
}
 
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
 
function createAppCard(app) {
    const card = document.createElement('a');
    card.href      = app.path;
    card.className = 'app-card';
    card.title     = app.description;
    card.innerHTML = `
        <div>
            <h2 class="app-name">${escapeHtml(app.name)}</h2>
            <p class="app-description">${escapeHtml(app.description)}</p>
        </div>
        <span class="app-link">Abrir app</span>
    `;
    return card;
}
 
function renderApps(apps) {
    loadingEl.style.display    = 'none';
    emptyStateEl.style.display = 'none';
    errorStateEl.style.display = 'none';
 
    if (apps.length === 0) {
        appsListEl.innerHTML   = '';
        emptyStateEl.style.display = 'block';
        return;
    }
 
    appsListEl.innerHTML = '';
    apps.forEach(app => appsListEl.appendChild(createAppCard(app)));
}
 
function showError(message) {
    loadingEl.style.display    = 'none';
    appsListEl.innerHTML       = '';
    emptyStateEl.style.display = 'none';
    errorStateEl.style.display = 'block';
    errorDetailEl.textContent  = message;
}
 
async function init() {
    applyTheme();
    try {
        const apps = await loadApps();
        renderApps(apps);
    } catch (error) {
        showError(error.message);
    }
}
 
document.addEventListener('DOMContentLoaded', init);
 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.log('SW error:', err));
    });
}
