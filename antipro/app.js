// ============================================
// ESTADO GLOBAL
// ============================================
let appState = {
    task: '',
    steps: [],
    currentStepIndex: 0,
    history: [],
    timerInterval: null,
    timerSeconds: 300, // 5 minutos
    isRunning: false,
    darkMode: false
};

// ============================================
// ELEMENTOS DOM
// ============================================
const taskInput = document.getElementById('taskInput');
const generateBtn = document.getElementById('generateBtn');
const quickExamplesSection = document.getElementById('quickExamples');
const exampleBtns = document.querySelectorAll('.example-btn');

const stepSection = document.getElementById('stepSection');
const stepText = document.getElementById('stepText');
const taskTitle = document.getElementById('taskTitle');
const stepCounter = document.getElementById('stepCounter');
const timerDisplay = document.getElementById('timerDisplay');

const startBtn = document.getElementById('startBtn');
const stuckBtn = document.getElementById('stuckBtn');
const doneBtn = document.getElementById('doneBtn');

const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const themeToggle = document.getElementById('themeToggle');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar estado desde localStorage
    loadState();
    
    // Aplicar tema guardado
    if (appState.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Event listeners
    generateBtn.addEventListener('click', generateFirstStep);
    startBtn.addEventListener('click', startTimer);
    stuckBtn.addEventListener('click', splitCurrentStep);
    doneBtn.addEventListener('click', completeStep);
    clearHistoryBtn.addEventListener('click', clearHistory);
    themeToggle.addEventListener('click', toggleTheme);
    
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const task = e.target.dataset.task;
            taskInput.value = task;
            generateFirstStep();
        });
    });
    
    // Permitir Enter en el input
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateFirstStep();
        }
    });
    
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('SW registration failed:', err);
        });
    }
    
    // Mostrar historial si existe
    updateHistoryUI();
});

// ============================================
// GENERAR PRIMER PASO
// ============================================
function generateFirstStep() {
    const task = taskInput.value.trim();
    
    if (!task) {
        alert('Escribí algo que tengas que hacer 👇');
        return;
    }
    
    appState.task = task;
    appState.steps = [generateFirstStepText(task)];
    appState.currentStepIndex = 0;
    appState.timerSeconds = 300;
    appState.isRunning = false;
    
    // Guardar y mostrar
    saveState();
    showStep();
    hideQuickExamples();
}

// ============================================
// GENERAR TEXTO DE PASOS (Lógica local simple)
// ============================================
function generateFirstStepText(task) {
    // Patrones de tareas comunes
    const patterns = [
        { match: /presentación|slides?|deck/i, first: 'Abrí la herramienta de diseño (Figma, PowerPoint, Google Slides)' },
        { match: /código|backend|frontend|función|bug|error/i, first: 'Abrí la carpeta del proyecto en tu editor' },
        { match: /informe|reporte|documento|mail|email/i, first: 'Abrí un documento en blanco' },
        { match: /reunión|meeting|llamada|zoom|meet/i, first: 'Definí la agenda en 30 segundos y escribila' },
        { match: /diseño|figma|mock|wireframe/i, first: 'Abrí Figma y creá un nuevo archivo' },
        { match: /video|recording|grabación/i, first: 'Abrí OBS o la herramienta de grabación' },
        { match: /blog|artículo|contenido|post/i, first: 'Escribí un título que te enganche' },
        { match: /lista|checklist|tareas|plan/i, first: 'Enumerá los primeros 3 items no más' },
    ];
    
    // Buscar patrón coincidente
    for (const pattern of patterns) {
        if (pattern.match.test(task)) {
            return pattern.first;
        }
    }
    
    // Default: generar algo genérico pero útil
    return `Abrí todo lo que necesitás para "${task}"`;
}

function generateSubstep(step) {
    // Dividir un paso en 2 más pequeños
    const subSteps = [
        `Cerrá todo lo que no necesitás en tu pantalla`,
        `Decí en voz alta qué vas a hacer en los próximos 5 minutos`,
        `Escribí el primer párrafo / línea de código`,
        `Escribí 3 puntos sobre qué querés lograr`,
        `Abrí un documento en blanco y ponele fecha`,
        `Hacé un boceto en papel si necesitás`,
        `Ponete de pie y tomá agua`,
        `Llamá a alguien si necesitás validar algo`,
        `Abrí la documentación o tutorial que necesitás`,
        `Eliminá las distracciones (mute Discord, desactivá notificaciones)`,
    ];
    
    // Elegir al azar
    return subSteps[Math.floor(Math.random() * subSteps.length)];
}

// ============================================
// MOSTRAR PASO
// ============================================
function showStep() {
    const currentStep = appState.steps[appState.currentStepIndex];
    const totalSteps = appState.steps.length;
    
    stepText.textContent = currentStep;
    taskTitle.textContent = `Tarea: ${appState.task}`;
    stepCounter.textContent = `${appState.currentStepIndex + 1}/${totalSteps}`;
    
    stepSection.classList.remove('hidden');
    quickExamplesSection.parentElement.classList.add('hidden');
    
    // Reset timer
    appState.timerSeconds = 300;
    appState.isRunning = false;
    updateTimer();
    stopTimer();
}

// ============================================
// TIMER
// ============================================
function startTimer() {
    if (appState.isRunning) return;
    
    appState.isRunning = true;
    startBtn.textContent = '⏸ Pausar';
    
    appState.timerInterval = setInterval(() => {
        appState.timerSeconds--;
        updateTimer();
        saveState();
        
        if (appState.timerSeconds <= 0) {
            stopTimer();
            finishTimer();
        }
    }, 1000);
}

function stopTimer() {
    appState.isRunning = false;
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
    setTimeout(() => {
        timerDisplay.style.color = '';
    }, 2000);
}

// ============================================
// DIVIDIR PASO (Estoy trabado)
// ============================================
function splitCurrentStep() {
    const newSubstep = generateSubstep(appState.steps[appState.currentStepIndex]);
    
    // Insertar el substep ANTES del paso actual
    appState.steps.splice(appState.currentStepIndex, 0, newSubstep);
    
    // Mostrar el nuevo paso más pequeño
    saveState();
    showStep();
}

// ============================================
// COMPLETAR PASO (Listo)
// ============================================
function completeStep() {
    const completedStep = appState.steps[appState.currentStepIndex];
    
    // Agregar al historial
    appState.history.unshift({
        step: completedStep,
        task: appState.task,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });
    
    // Limitar historial a 20 items
    if (appState.history.length > 20) {
        appState.history.pop();
    }
    
    appState.currentStepIndex++;
    
    // ¿Hay más pasos?
    if (appState.currentStepIndex < appState.steps.length) {
        appState.timerSeconds = 300;
        appState.isRunning = false;
        stopTimer();
        saveState();
        showStep();
    } else {
        // Finalizó la tarea
        completeTask();
    }
}

function completeTask() {
    // Agregar la tarea completa al historial
    appState.history.unshift({
        step: `✓ Terminaste: ${appState.task}`,
        task: appState.task,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    });
    
    if (appState.history.length > 20) {
        appState.history.pop();
    }
    
    // Reset
    appState.task = '';
    appState.steps = [];
    appState.currentStepIndex = 0;
    taskInput.value = '';
    
    saveState();
    resetUI();
    updateHistoryUI();
    
    // Feedback visual
    setTimeout(() => {
        alert('🎉 ¡Terminaste! Bien hecho.');
    }, 300);
}

// ============================================
// HISTORIA
// ============================================
function updateHistoryUI() {
    if (appState.history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }
    
    historySection.classList.remove('hidden');
    historyList.innerHTML = '';
    
    appState.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
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
// TEMA (Dark mode)
// ============================================
function toggleTheme() {
    appState.darkMode = !appState.darkMode;
    
    if (appState.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    saveState();
}

// ============================================
// PERSISTENCIA (localStorage)
// ============================================
function saveState() {
    localStorage.setItem('antiproState', JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem('antiproState');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }
    
    // Asegurar que no quede un timer corriendo
    if (appState.isRunning) {
        appState.isRunning = false;
    }
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
    taskInput.focus();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// DETECTAR TEMA SISTEMA
// ============================================
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // El usuario prefiere modo oscuro, pero lo dejamos en claro por defecto
    // Descomentar la línea siguiente si querés que el sistema defina el default
    // appState.darkMode = true;
}
