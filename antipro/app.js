// ============================================
// CONFIGURACIÓN LLM CON GROQ
// ============================================
const CONFIG = {
    llmEndpoint: 'https://antipro-llm.juanmacki.workers.dev',
    llmTimeout: 10000,
    maxRetries: 2,
    minSteps: 3,
    maxSteps: 12,
};

// ============================================
// ESTADO GLOBAL
// ============================================
let appState = {
    task: '',
    steps: [],
    currentStepIndex: 0,
    history: [],
    timerInterval: null,
    timerSeconds: 300,
    isRunning: false,
    isLoading: false,
};

// ============================================
// ELEMENTOS DOM
// ============================================
const taskInput           = document.getElementById('taskInput');
const generateBtn         = document.getElementById('generateBtn');
const quickExamplesSection= document.getElementById('quickExamples');
const exampleBtns         = document.querySelectorAll('.example-btn');
const stepSection         = document.getElementById('stepSection');
const stepText            = document.getElementById('stepText');
const taskTitle           = document.getElementById('taskTitle');
const stepCounter         = document.getElementById('stepCounter');
const timerDisplay        = document.getElementById('timerDisplay');
const startBtn            = document.getElementById('startBtn');
const stuckBtn            = document.getElementById('stuckBtn');
const doneBtn             = document.getElementById('doneBtn');
const historySection      = document.getElementById('historySection');
const historyList         = document.getElementById('historyList');
const clearHistoryBtn     = document.getElementById('clearHistoryBtn');
const themeToggle         = document.getElementById('themeToggle');

// ============================================
// TEMA — dark/light via body.style-light
// ============================================
const STORAGE_THEME = 'antipro-theme';

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

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    loadState();

    generateBtn.addEventListener('click', generateFirstStep);
    startBtn.addEventListener('click', startTimer);
    stuckBtn.addEventListener('click', splitCurrentStep);
    doneBtn.addEventListener('click', completeStep);
    clearHistoryBtn.addEventListener('click', clearHistory);
    themeToggle.addEventListener('click', toggleTheme);

    exampleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            taskInput.value = e.target.dataset.task;
            generateFirstStep();
        });
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateFirstStep();
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    updateHistoryUI();
});

// ============================================
// GENERAR PRIMER PASO
// ============================================
async function generateFirstStep() {
    const task = taskInput.value.trim();
    if (!task) { alert('Escribí algo que tengas que hacer 👇'); return; }

    appState.task      = task;
    appState.isLoading = true;
    showLoadingState();

    try {
        const breakdown = await fetchTaskBreakdown(task, 'initial');
        if (breakdown?.steps?.length > 0) {
            appState.steps = breakdown.steps.map(s => ({ title: s.title, minutes: s.minutes || 5 }));
        } else {
            appState.steps = applyFallback(task, 'initial');
        }
    } catch {
        appState.steps = applyFallback(task, 'initial');
    }

    appState.currentStepIndex = 0;
    appState.timerSeconds = (appState.steps[0]?.minutes || 5) * 60;
    appState.isRunning    = false;
    appState.isLoading    = false;

    saveState();
    showStep();
    hideQuickExamples();
}

// ============================================
// FETCH CON TIMEOUT Y RETRY
// ============================================
async function fetchTaskBreakdown(task, mode = 'initial') {
    if (!CONFIG.llmEndpoint) return null;

    for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), CONFIG.llmTimeout);

            const response = await fetch(CONFIG.llmEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task, mode }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!validateBreakdown(data)) return null;
            return data;
        } catch (error) {
            if (attempt < CONFIG.maxRetries) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    return null;
}

function validateBreakdown(data) {
    if (!data || !Array.isArray(data.steps)) return false;
    if (data.steps.length < 1 || data.steps.length > CONFIG.maxSteps) return false;
    for (const step of data.steps) {
        if (!step.title?.trim()) return false;
        const mins = parseInt(step.minutes, 10);
        if (isNaN(mins) || mins < 1 || mins > 5) return false;
    }
    return true;
}

// ============================================
// FALLBACK LOCAL
// ============================================
function applyFallback(task, mode) {
    if (mode === 'initial') return generateInitialStepsLocal(task);
    if (mode === 'stuck')   return generateSubstepLocal();
    return [];
}

function generateInitialStepsLocal(task) {
    const patterns = [
        { match: /presentación|slides?|deck/i, steps: [
            { title: 'Abrí la herramienta de diseño (Figma, PowerPoint, Google Slides)', minutes: 1 },
            { title: 'Creá un archivo nuevo con el nombre de la presentación', minutes: 2 },
            { title: 'Escribí el objetivo principal en una sola frase', minutes: 2 },
        ]},
        { match: /código|backend|frontend|función|bug|error/i, steps: [
            { title: 'Abrí la carpeta del proyecto en tu editor', minutes: 1 },
            { title: 'Abrí la terminal y navegá al proyecto', minutes: 1 },
            { title: 'Hacé un comentario describiendo qué querés cambiar', minutes: 2 },
        ]},
        { match: /informe|reporte|documento|mail|email|resumen/i, steps: [
            { title: 'Abrí un documento en blanco (Google Docs, Word, Notion)', minutes: 1 },
            { title: 'Escribí un título tentativo', minutes: 1 },
            { title: 'Listá los 3 puntos principales que querés cubrir', minutes: 3 },
        ]},
        { match: /reunión|meeting|llamada|zoom|meet/i, steps: [
            { title: 'Escribí la agenda en 3 puntos máximo', minutes: 2 },
            { title: 'Abrí la plataforma de videoconferencia', minutes: 1 },
            { title: 'Enviá el enlace a los participantes', minutes: 1 },
        ]},
        { match: /diseño|figma|mock|wireframe|prototipo/i, steps: [
            { title: 'Abrí Figma (o tu herramienta de diseño)', minutes: 1 },
            { title: 'Creá un nuevo archivo o abrí el existente', minutes: 1 },
            { title: 'Dibujá un rectángulo como base para tu primer elemento', minutes: 2 },
        ]},
        { match: /blog|artículo|contenido|post|twitter|linkedin/i, steps: [
            { title: 'Escribí un título que te enganche', minutes: 2 },
            { title: 'Escribí los primeros 2 párrafos sin perfeccionar', minutes: 3 },
            { title: 'Releé y editá solo para claridad', minutes: 2 },
        ]},
        { match: /lista|checklist|tareas|plan|roadmap/i, steps: [
            { title: 'Abrí un documento o app de tareas', minutes: 1 },
            { title: 'Enumerá los primeros 5 items sin editarlos', minutes: 2 },
            { title: 'Ordenalos por prioridad (solo top 3)', minutes: 2 },
        ]},
    ];

    for (const pattern of patterns) {
        if (pattern.match.test(task)) return pattern.steps;
    }

    return [
        { title: `Abrí todo lo que necesitás para: ${task}`, minutes: 2 },
        { title: 'Escribí en un documento qué querés lograr exactamente', minutes: 2 },
        { title: 'Hacé el primer intento sin perfeccionismo', minutes: 3 },
    ];
}

function generateSubstepLocal() {
    const subSteps = [
        { title: 'Cerrá todo lo que no necesitás en pantalla', minutes: 1 },
        { title: 'Ponete de pie, estirá, hacé 3 respiraciones profundas', minutes: 1 },
        { title: 'Escribí qué intentaste y dónde te quedaste', minutes: 2 },
        { title: 'Tomá agua y descansá 30 segundos', minutes: 1 },
        { title: 'Buscá en Google una palabra clave del problema', minutes: 3 },
        { title: 'Llamá a alguien y explicale en qué te trabaste', minutes: 3 },
        { title: 'Hacé un boceto en papel de lo que querés lograr', minutes: 2 },
        { title: 'Empezá desde cero en un doc nuevo sin expectativas', minutes: 2 },
        { title: 'Silenciá Discord y desactivá notificaciones', minutes: 1 },
    ];
    return [subSteps[Math.floor(Math.random() * subSteps.length)]];
}

// ============================================
// MOSTRAR PASO
// ============================================
function showStep() {
    const currentStep = appState.steps[appState.currentStepIndex];
    if (!currentStep) return;

    stepText.textContent    = currentStep.title;
    taskTitle.textContent   = `Tarea: ${appState.task}`;
    stepCounter.textContent = `${appState.currentStepIndex + 1}/${appState.steps.length}`;
    appState.timerSeconds   = (currentStep.minutes || 5) * 60;

    stepSection.classList.remove('hidden');
    quickExamplesSection.parentElement.classList.add('hidden');

    appState.isRunning = false;
    updateTimer();
    stopTimer();
}

// ============================================
// LOADING STATE
// ============================================
function showLoadingState() {
    generateBtn.disabled    = true;
    generateBtn.textContent = '⏳ Generando...';
}

function hideLoadingState() {
    generateBtn.disabled    = false;
    generateBtn.textContent = 'Generar primer paso';
}

// ============================================
// TIMER
// ============================================
function startTimer() {
    if (appState.isRunning) return;

    appState.isRunning  = true;
    startBtn.textContent = '⏸ Pausar';

    appState.timerInterval = setInterval(() => {
        appState.timerSeconds--;
        updateTimer();
        saveState();
        if (appState.timerSeconds <= 0) { stopTimer(); finishTimer(); }
    }, 1000);
}

function stopTimer() {
    appState.isRunning   = false;
    startBtn.textContent = '▶ Empezar';
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
    }
}

function updateTimer() {
    const mins = Math.floor(appState.timerSeconds / 60);
    const secs = appState.timerSeconds % 60;
    timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function finishTimer() {
    timerDisplay.style.color = '#ef4444';
    setTimeout(() => { timerDisplay.style.color = ''; }, 2000);
}

// ============================================
// DIVIDIR PASO (Estoy trabado)
// ============================================
async function splitCurrentStep() {
    const currentStep = appState.steps[appState.currentStepIndex];
    if (!currentStep) return;

    stuckBtn.disabled    = true;
    stuckBtn.textContent = '⏳...';

    try {
        const breakdown = await fetchTaskBreakdown(currentStep.title, 'stuck');
        const newSubsteps = breakdown?.steps?.length > 0
            ? breakdown.steps.map(s => ({ title: s.title, minutes: s.minutes || 1 }))
            : generateSubstepLocal();

        appState.steps.splice(appState.currentStepIndex, 0, ...newSubsteps);
        saveState();
        showStep();
    } catch {
        const newSubsteps = generateSubstepLocal();
        appState.steps.splice(appState.currentStepIndex, 0, ...newSubsteps);
        saveState();
        showStep();
    } finally {
        stuckBtn.disabled    = false;
        stuckBtn.textContent = '⚡ Estoy trabado';
    }
}

// ============================================
// COMPLETAR PASO
// ============================================
function completeStep() {
    const completedStep = appState.steps[appState.currentStepIndex];

    appState.history.unshift({
        step: completedStep.title,
        task: appState.task,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });

    if (appState.history.length > 20) appState.history.pop();

    appState.currentStepIndex++;

    if (appState.currentStepIndex < appState.steps.length) {
        appState.timerSeconds = (appState.steps[appState.currentStepIndex]?.minutes || 5) * 60;
        appState.isRunning    = false;
        stopTimer();
        saveState();
        showStep();
    } else {
        completeTask();
    }
}

function completeTask() {
    appState.history.unshift({
        step: `✓ Terminaste: ${appState.task}`,
        task: appState.task,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });

    if (appState.history.length > 20) appState.history.pop();

    appState.task             = '';
    appState.steps            = [];
    appState.currentStepIndex = 0;
    taskInput.value           = '';

    saveState();
    resetUI();
    updateHistoryUI();

    setTimeout(() => alert('🎉 ¡Terminaste! Bien hecho.'), 300);
}

// ============================================
// HISTORIAL
// ============================================
function updateHistoryUI() {
    if (appState.history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }

    historySection.classList.remove('hidden');
    historyList.innerHTML = '';

    appState.history.forEach(item => {
        const div       = document.createElement('div');
        div.className   = 'history-item';
        div.innerHTML   = `
            <div class="history-item-text">${escapeHtml(item.step)}</div>
            <div class="history-item-time">${item.timestamp}</div>
        `;
        historyList.appendChild(div);
    });
}

function clearHistory() {
    if (confirm('¿Seguro que querés limpiar el historial?')) {
        appState.history = [];
        saveState();
        updateHistoryUI();
        historySection.classList.add('hidden');
    }
}

// ============================================
// PERSISTENCIA
// ============================================
function saveState() {
    localStorage.setItem('antiproState', JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem('antiproState');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            appState = { ...appState, ...loaded };
        } catch {}
    }
    if (appState.isRunning) appState.isRunning = false;
}

// ============================================
// UI HELPERS
// ============================================
function hideQuickExamples() {
    quickExamplesSection.parentElement.classList.add('hidden');
}

function resetUI() {
    stepSection.classList.add('hidden');
    quickExamplesSection.parentElement.classList.remove('hidden');
    hideLoadingState();
    taskInput.focus();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
