/* ========================================
   ANTI PROCRASTINACIÓN - LÓGICA APP
   Generación de pasos + Timer + localStorage
   ======================================== */

// ========== ESTADO DE LA APP ==========

const state = {
    currentTask: '',
    currentStep: '',
    stepHistory: [],
    timerRunning: false,
    timerSeconds: 300, // 5 minutos
    isTimerActive: false,
    theme: localStorage.getItem('theme') || 'minimal'
};

// ========== ELEMENTOS DEL DOM ==========

const taskInput = document.getElementById('task-input');
const generateBtn = document.getElementById('generate-btn');
const stepSection = document.getElementById('step-section');
const currentStepEl = document.getElementById('current-step');
const taskNameEl = document.getElementById('task-name');
const timerEl = document.getElementById('timer');
const timerToggleBtn = document.getElementById('timer-toggle');
const startBtn = document.getElementById('start-btn');
const stuckBtn = document.getElementById('stuck-btn');
const doneBtn = document.getElementById('done-btn');
const historyList = document.getElementById('history-list');
const motivationModal = document.getElementById('motivation-modal');
const motivationText = document.getElementById('motivation-text');
const themeToggle = document.getElementById('theme-toggle');
const exampleButtons = document.querySelectorAll('.example-btn');

// ========== DATOS PARA IA SIMULADA ==========

const stepGenerationPatterns = {
    'Informe': {
        first: 'Abrí el documento o crear uno nuevo',
        stuck: ['Escribí el primer párrafo (intro)', 'Hacé un outline de secciones', 'Copiá los datos del último informe']
    },
    'Llamada': {
        first: 'Escribí los 3 puntos clave que querés tratar',
        stuck: ['Mirá el email o contexto de la persona', 'Anotá una pregunta inicial', 'Llamá (de verdad, ahora)']
    },
    'Presentación': {
        first: 'Abrí PowerPoint o Google Slides',
        stuck: ['Hacé la portada con título', 'Copiá la estructura del último deck', 'Insertá los datos/números']
    },
    'Proveedores': {
        first: 'Abrí el email con las propuestas',
        stuck: ['Hacé una tabla con los 3 criterios principales', 'Anotá precio + ventajas de c/u', 'Llamá al proveedor favorito']
    },
    'Email': {
        first: 'Hacé clic en "Redactar"',
        stuck: ['Escribí el asunto', 'Copiá el mail anterior parecido', 'Escribí el saludo y primer párrafo']
    }
};

const motivationalMessages = [
    '¡Boludo! Ya lo empezaste. Lo más difícil pasó.',
    'Una tarea pequeña es una tarea menos.',
    '5 minutos es nada. Vas a poder.',
    'Después de empezar es fácil continuar.',
    'Cada paso cuenta.',
    'Ya casi estás. Uno más.',
    'Te lo mereces cuando termines.',
    'El futuro vos va a estar contento.',
    'Transcurrieron esos 5 minutos igual...',
];

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTheme();
    attachEventListeners();
    
    // Si hay un paso en progreso, mostrarlo
    if (state.currentStep) {
        showStepSection();
    }
});

// ========== THEME SWITCHING ==========

function initTheme() {
    if (state.theme === 'warm') {
        document.documentElement.classList.add('theme-warm');
        themeToggle.innerHTML = '<span class="theme-icon">◑</span>';
    } else {
        document.documentElement.classList.remove('theme-warm');
        themeToggle.innerHTML = '<span class="theme-icon">◐</span>';
    }
}

themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'minimal' ? 'warm' : 'minimal';
    localStorage.setItem('theme', state.theme);
    initTheme();
});

// ========== EVENT LISTENERS ==========

function attachEventListeners() {
    // Generar primer paso
    generateBtn.addEventListener('click', generateFirstStep);
    
    // Enter en input
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateFirstStep();
    });
    
    // Botones de acción
    startBtn.addEventListener('click', showMotivation);
    stuckBtn.addEventListener('click', generateSmallerStep);
    doneBtn.addEventListener('click', completeStep);
    
    // Timer
    timerToggleBtn.addEventListener('click', toggleTimer);
    
    // Ejemplos rápidos
    exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            taskInput.value = btn.dataset.task;
            generateFirstStep();
        });
    });
}

// ========== GENERACIÓN DE PASOS ==========

function generateFirstStep() {
    const task = taskInput.value.trim();
    
    if (!task) {
        alert('Escribí qué tenés que hacer, boludo.');
        return;
    }
    
    state.currentTask = task;
    state.currentStep = generateStepForTask(task);
    state.timerSeconds = 300;
    state.isTimerActive = false;
    
    saveState();
    showStepSection();
    taskInput.value = '';
    resetTimer();
    timerToggleBtn.textContent = 'Iniciar timer';
    timerToggleBtn.classList.remove('active');
    
    // Focus en el primer botón
    startBtn.focus();
}

function generateStepForTask(task) {
    // Buscar coincidencias en patrones
    for (const [keyword, patterns] of Object.entries(stepGenerationPatterns)) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
            return patterns.first;
        }
    }
    
    // Si no hay coincidencia, generar algo genérico pero útil
    const genericSteps = [
        `Abrí lo que necesitás para hacer "${task}"`,
        `Hacé un plan de 2-3 pasos para "${task}"`,
        `Buscá el material que necesitás para "${task}"`,
        `Anotá qué querés lograr exactamente en "${task}"`
    ];
    
    return genericSteps[Math.floor(Math.random() * genericSteps.length)];
}

function generateSmallerStep() {
    const task = state.currentTask;
    
    // Buscar pasos más pequeños en patrones
    for (const [keyword, patterns] of Object.entries(stepGenerationPatterns)) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
            if (patterns.stuck && patterns.stuck.length > 0) {
                const step = patterns.stuck[Math.floor(Math.random() * patterns.stuck.length)];
                state.currentStep = step;
                saveState();
                currentStepEl.textContent = step;
                showMotivationMessage('Mejor así. Hacé este.');
                return;
            }
        }
    }
    
    // Genérico: dividir en aún más chico
    const evenSmallerSteps = [
        `Abrí una pestaña nueva`,
        `Hacé una lista de 3 subtareas`,
        `Mirá un ejemplo similar`,
        `Escribí el título o tema`,
        `Pon una alarma de 5 minutos`,
        `Llamá a alguien para preguntar`
    ];
    
    const step = evenSmallerSteps[Math.floor(Math.random() * evenSmallerSteps.length)];
    state.currentStep = step;
    saveState();
    currentStepEl.textContent = step;
    showMotivationMessage('Tranquilo. Probá con esto.');
}

// ========== TIMER ==========

function toggleTimer() {
    state.isTimerActive = !state.isTimerActive;
    
    if (state.isTimerActive) {
        timerToggleBtn.classList.add('active');
        timerToggleBtn.textContent = 'Pausar timer';
        startTimer();
    } else {
        timerToggleBtn.classList.remove('active');
        timerToggleBtn.textContent = 'Reanudar';
        pauseTimer();
    }
}

function startTimer() {
    if (state.timerRunning) return;
    
    state.timerRunning = true;
    
    const interval = setInterval(() => {
        if (!state.isTimerActive) {
            clearInterval(interval);
            state.timerRunning = false;
            return;
        }
        
        state.timerSeconds--;
        updateTimerDisplay();
        
        if (state.timerSeconds <= 0) {
            clearInterval(interval);
            state.timerRunning = false;
            state.isTimerActive = false;
            timerToggleBtn.classList.remove('active');
            timerToggleBtn.textContent = 'Tiempo!';
            showMotivationMessage('¡Se acabó el tiempo! ¿Terminaste? Dale al botón "Listo" o "Estoy trabado"');
        }
    }, 1000);
}

function pauseTimer() {
    state.timerRunning = false;
}

function resetTimer() {
    state.timerSeconds = 300;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timerSeconds / 60);
    const seconds = state.timerSeconds % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ========== HISTORIAL ==========

function completeStep() {
    if (!state.currentStep) return;
    
    // Agregar al historial
    state.stepHistory.unshift({
        task: state.currentTask,
        step: state.currentStep,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });
    
    // Limitar historial a últimos 10 pasos
    if (state.stepHistory.length > 10) {
        state.stepHistory.pop();
    }
    
    saveState();
    renderHistory();
    
    // Mostrar motivación
    showMotivationMessage('¡Lo hiciste! Eso merece un aplauso. ¿Otro paso?');
    
    // Limpiar
    state.currentTask = '';
    state.currentStep = '';
    stepSection.classList.add('hidden');
    resetTimer();
    state.isTimerActive = false;
    timerToggleBtn.classList.remove('active');
    timerToggleBtn.textContent = 'Iniciar timer';
    
    // Focus en input
    taskInput.focus();
}

function renderHistory() {
    if (state.stepHistory.length === 0) {
        historyList.innerHTML = '<p class="history-empty">Sin pasos completados aún</p>';
        return;
    }
    
    historyList.innerHTML = state.stepHistory.map((item, idx) => `
        <div class="history-item">
            <strong>${item.task}</strong><br>
            <span style="color: var(--color-text-light); font-size: 0.9rem;">
                ${item.step}
            </span><br>
            <span style="color: var(--color-text-light); font-size: 0.85rem; margin-top: 0.5rem; display: block;">
                ${item.timestamp}
            </span>
        </div>
    `).join('');
}

// ========== MODALES Y MENSAJES ==========

function showMotivation() {
    const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    showMotivationMessage(msg);
}

function showMotivationMessage(msg) {
    motivationText.textContent = msg;
    motivationModal.classList.remove('hidden');
}

// Cerrar modal al hacer click fuera
motivationModal.addEventListener('click', (e) => {
    if (e.target === motivationModal) {
        motivationModal.classList.add('hidden');
    }
});

// ========== UI STATE ==========

function showStepSection() {
    stepSection.classList.remove('hidden');
    currentStepEl.textContent = state.currentStep;
    taskNameEl.textContent = `Tarea: ${state.currentTask}`;
    updateTimerDisplay();
}

// ========== STORAGE ==========

function saveState() {
    localStorage.setItem('antiProcrastinacionState', JSON.stringify({
        currentTask: state.currentTask,
        currentStep: state.currentStep,
        stepHistory: state.stepHistory,
        timerSeconds: state.timerSeconds,
        theme: state.theme
    }));
}

function loadState() {
    const saved = localStorage.getItem('antiProcrastinacionState');
    if (saved) {
        const loaded = JSON.parse(saved);
        state.currentTask = loaded.currentTask || '';
        state.currentStep = loaded.currentStep || '';
        state.stepHistory = loaded.stepHistory || [];
        state.timerSeconds = loaded.timerSeconds || 300;
        state.theme = loaded.theme || 'minimal';
    }
    
    renderHistory();
}

// ========== INITIAL RENDER ==========

updateTimerDisplay();
renderHistory();
