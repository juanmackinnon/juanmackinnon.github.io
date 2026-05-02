/**
 * app.js — Not-ITS-ias
 * Reads news.json, renders articles by category, handles modal + theme.
 */

// ============================================================
// CONSTANTS & CONFIG
// ============================================================

const NEWS_JSON_URL   = './news.json';
const STORAGE_THEME   = 'not-its-ias-theme';   // 'dark' | 'light'
const STORAGE_CAT     = 'not-its-ias-last-cat'; // last active category

const CATEGORY_LABELS = {
  destacadas:     'Destacadas',
  trafico:        'Tráfico',
  smartcities:    'Smart Cities',
  movilidad:      'Movilidad',
  autonomos:      'Autónomos',
  infraestructura:'Infraestructura',
  industria:      'Industria',
  regulacion:     'Regulación',
};

const CATEGORY_COLORS = {
  destacadas:     '#f59e0b',
  trafico:        '#ef4444',
  smartcities:    '#3b82f6',
  movilidad:      '#10b981',
  autonomos:      '#8b5cf6',
  infraestructura:'#64748b',
  industria:      '#06b6d4',
  regulacion:     '#f97316',
};

// ============================================================
// STATE
// ============================================================

let newsData      = null;
let currentCat    = localStorage.getItem(STORAGE_CAT) || 'destacadas';
let isLightTheme  = localStorage.getItem(STORAGE_THEME) === 'light';

// ============================================================
// DOM REFERENCES
// ============================================================

const $   = id => document.getElementById(id);
const $$  = sel => document.querySelectorAll(sel);

const articlesGrid  = $('articlesGrid');
const stateLoading  = $('stateLoading');
const stateError    = $('stateError');
const stateEmpty    = $('stateEmpty');
const stateErrorMsg = $('stateErrorMsg');
const statsBar      = $('statsBar');
const statsText     = $('statsText');
const btnTheme      = $('btnTheme');
const categoryNav   = $('categoryNav');
const modalOverlay  = $('modalOverlay');
const modalClose    = $('modalClose');
const modalTitle    = $('modalTitle');
const modalSummary  = $('modalSummary');
const modalMeta     = $('modalMeta');
const modalLink     = $('modalLink');
const modalImageWrap= $('modalImageWrap');

// ============================================================
// THEME
// ============================================================

function applyTheme() {
  if (isLightTheme) {
    document.body.classList.add('style-light');
  } else {
    document.body.classList.remove('style-light');
  }
  localStorage.setItem(STORAGE_THEME, isLightTheme ? 'light' : 'dark');
}

function toggleTheme() {
  isLightTheme = !isLightTheme;
  applyTheme();
}

// ============================================================
// FETCH NEWS
// ============================================================

async function fetchNews(force = false) {
  showState('loading');

  try {
    const url = force
      ? `${NEWS_JSON_URL}?t=${Date.now()}`
      : NEWS_JSON_URL;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    newsData = await res.json();

    if (!newsData?.categories) {
      throw new Error('news.json tiene estructura inválida');
    }

    renderCurrentCategory();
  } catch (err) {
    console.error('[Not-ITS-ias] fetch error:', err);
    showState('error');
    stateErrorMsg.textContent = err.message || 'Error desconocido.';
  }
}

// ============================================================
// RENDER
// ============================================================

function renderCurrentCategory() {
  if (!newsData) return;

  const articles = newsData.categories[currentCat] || [];

  if (articles.length === 0) {
    showState('empty');
    return;
  }

  showState('articles');

  articlesGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  articles.forEach((article, idx) => {
    const card = buildCard(article);
    card.style.animationDelay = `${idx * 30}ms`;
    frag.appendChild(card);
  });

  articlesGrid.appendChild(frag);

  // Stats
  statsText.textContent = `${articles.length} artículos`;
  statsBar.classList.remove('hidden');
}

function buildCard(article) {
  const card = document.createElement('article');
  card.className = 'article-card';
  card.setAttribute('role', 'article');
  card.setAttribute('tabindex', '0');
  card.dataset.id = article.id;

  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.industria;
  card.style.setProperty('--cat-color', catColor);

  const hasImage = !!article.image;
  if (hasImage) card.classList.add('article-card--has-image');

  const dateStr = formatDate(article.date);

  // Show category tag only when NOT in that category's own view
  const showCatTag = currentCat === 'destacadas';

  card.innerHTML = `
    <div class="article-card__body">
      <div class="article-card__meta">
        <span class="article-card__source">${escapeHtml(article.source)}</span>
        ${showCatTag ? `<span class="article-card__category-tag" style="background-color:${catColor}">${CATEGORY_LABELS[article.category] || article.category}</span>` : ''}
        <span class="article-card__date">${dateStr}</span>
      </div>
      <h2 class="article-card__title">${escapeHtml(article.title)}</h2>
      ${article.summary ? `<p class="article-card__summary">${escapeHtml(article.summary)}</p>` : ''}
    </div>
    ${hasImage ? `
      <div class="article-card__image-wrap">
        <img class="article-card__image"
             src="${escapeHtml(article.image)}"
             alt=""
             loading="lazy"
             onerror="this.parentElement.style.display='none'">
      </div>` : ''}
  `;

  // Open modal on click or Enter
  card.addEventListener('click', () => openModal(article));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(article);
    }
  });

  return card;
}

// ============================================================
// MODAL
// ============================================================

function openModal(article) {
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.industria;

  // Image
  if (article.image) {
    modalImageWrap.innerHTML = `<img src="${escapeHtml(article.image)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">`;
    modalImageWrap.style.display = '';
    modalImageWrap.style.setProperty('--cat-color', catColor);
  } else {
    modalImageWrap.innerHTML = '';
    modalImageWrap.style.display = 'none';
  }

  // Meta
  modalMeta.innerHTML = `
    <span class="modal-source">${escapeHtml(article.source)}</span>
    <span class="modal-cat-tag" style="background-color:${catColor}; --cat-color:${catColor}">${CATEGORY_LABELS[article.category] || article.category}</span>
    <span class="modal-date">${formatDate(article.date)}</span>
  `;

  modalTitle.textContent   = article.title;
  modalSummary.textContent = article.summary || '';
  modalLink.href           = article.url;
  modalOverlay.style.setProperty('--cat-color', catColor);

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Focus trap: focus close button
  setTimeout(() => modalClose.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ============================================================
// CATEGORY SWITCHING
// ============================================================

function switchCategory(cat) {
  if (cat === currentCat) return;
  currentCat = cat;
  localStorage.setItem(STORAGE_CAT, cat);

  // Update tab UI
  $$('.cat-tab').forEach(tab => {
    const isActive = tab.dataset.cat === cat;
    tab.classList.toggle('cat-tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  // Scroll active tab into view
  const activeTab = document.querySelector(`.cat-tab[data-cat="${cat}"]`);
  if (activeTab) {
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  renderCurrentCategory();
}

// ============================================================
// STATE DISPLAY HELPERS
// ============================================================

function showState(state) {
  stateLoading.style.display = state === 'loading' ? 'block' : 'none';
  stateError.classList.toggle('hidden', state !== 'error');
  stateEmpty.classList.toggle('hidden', state !== 'empty');
  articlesGrid.style.display = state === 'articles' ? '' : 'none';
  statsBar.classList.toggle('hidden', state !== 'articles');
}

// ============================================================
// DATE / TIME HELPERS
// ============================================================

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-UY', {
      day:   '2-digit',
      month: 'short',
      hour:  '2-digit',
      minute:'2-digit',
    }).format(d);
  } catch { return isoString; }
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'fecha desconocida';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  } catch { return isoString; }
}



// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Category tabs
categoryNav.addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab');
  if (tab) switchCategory(tab.dataset.cat);
});


// Theme toggle
btnTheme.addEventListener('click', toggleTheme);

// Modal close
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ============================================================
// SERVICE WORKER
// ============================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.log('[SW] Error:', err));
  });
}

// ============================================================
// INIT
// ============================================================

function init() {
  // Apply saved theme
  applyTheme();

  // Restore active tab UI
  $$('.cat-tab').forEach(tab => {
    const isActive = tab.dataset.cat === currentCat;
    tab.classList.toggle('cat-tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  // Load articles grid visibility
  articlesGrid.style.display = 'none';

  // Fetch news
  fetchNews();
}

document.addEventListener('DOMContentLoaded', init);

