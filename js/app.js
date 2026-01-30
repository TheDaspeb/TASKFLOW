// ==========================================================
// TASKFLOW - APP.JS (FULL VERSION)
// ==========================================================

// -------------------- GLOBAL ------------------------------
let tasks = [];

// -------------------- DOM ------------------------------
const body = document.body;
const darkModeToggle = document.getElementById('darkModeToggle');

const form = document.getElementById('taskForm');
const titleInput = document.getElementById('titulo');
const descInput = document.getElementById('descripcion');
const priorityInput = document.getElementById('prioridad');

const titleError = document.getElementById('tituloError');
const descError = document.getElementById('descripcionError');

const taskList = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');
const noResultsMessage = document.getElementById('noResultsMessage');

const filterEstado = document.getElementById('filterEstado');
const filterPrioridad = document.getElementById('filterPrioridad');

const statTotal = document.getElementById('statTotal');
const statPendientes = document.getElementById('statPendientes');
const statEnProceso = document.getElementById('statEnProceso');
const statCompletadas = document.getElementById('statCompletadas');
const taskListTitle = document.getElementById('taskListTitle');

// -------------------- CLASES ------------------------------
const PRIORITY_CLASSES = {
    baja: 'badge-baja',
    media: 'badge-media',
    alta: 'badge-alta'
};

const STATUS_CLASSES = {
    pendiente: 'border-pendiente',
    'en-proceso': 'border-en-proceso',
    completada: 'border-completada'
};

// -------------------- INIT ------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadDarkMode();
    loadTasks();
    renderAllTasks();
    updateStats();
});

// -------------------- DARK MODE --------------------------
function loadDarkMode() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const enabled = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', enabled ? 'enabled' : 'disabled');
    darkModeToggle.textContent = enabled ? '☀️' : '🌙';
});

// -------------------- LOCAL STORAGE ----------------------
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) tasks = JSON.parse(saved);
}

// -------------------- TOAST ------------------------------
function showToast(title, message, type = "success") {
    const toastEl = document.getElementById("formToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastBody = document.getElementById("toastBody");

    toastTitle.textContent = title;
    toastBody.textContent = message;
    toastBody.className = "toast-body text-bg-" + (type === 'error' ? 'danger' : type);

    new bootstrap.Toast(toastEl, { delay: 3000 }).show();
}

// -------------------- FORM ------------------------------
form.addEventListener('submit', e => {
    e.preventDefault();

    titleError.textContent = '';
    descError.textContent = '';

    if (titleInput.value.trim().length < 3) {
        titleError.textContent = 'Mínimo 3 caracteres';
        return;
    }
    if (descInput.value.trim().length < 5) {
        descError.textContent = 'Mínimo 5 caracteres';
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        titulo: titleInput.value.trim(),
        descripcion: descInput.value.trim(),
        prioridad: priorityInput.value,
        estado: 'pendiente',
        fecha: new Date().toLocaleDateString('es-ES')
    };

    tasks.push(newTask);
    filterEstado.value = 'todas';
    filterPrioridad.value = 'todas';

    saveTasks();
    renderAllTasks();
    taskList.scrollIntoView({ behavior: 'smooth' });
    updateStats();
    form.reset();
    showToast("Éxito", "Tarea creada");
    console.log("Creando tarea:", newTask);

});

// -------------------- RENDER ------------------------------
function renderAllTasks() {
    taskList.innerHTML = '';

    let visible = 0;

    tasks.forEach(task => {
        if (!passesFilters(task)) return;
        renderTask(task);
        visible++;
    });

    emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';
    noResultsMessage.style.display = visible === 0 && tasks.length > 0 ? 'block' : 'none';
}

function renderTask(task) {
    taskList.insertAdjacentHTML('beforeend', `
        <div class="col-12 col-md-6 col-lg-4" data-id="${task.id}">
            <div class="card task-card ${STATUS_CLASSES[task.estado]}">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge-prioridad ${PRIORITY_CLASSES[task.prioridad]}">
                            ${capitalize(task.prioridad)}
                        </span>
                        <button class="btn btn-sm btn-delete"><i class="bi bi-trash"></i></button>
                    </div>

                    <h5 contenteditable="true" class="task-title">${task.titulo}</h5>
                    <p contenteditable="true" class="task-desc">${task.descripcion}</p>

                    <select class="form-select form-select-sm status-select mt-2">
                        ${Object.keys(STATUS_CLASSES).map(s =>
                            `<option value="${s}" ${s === task.estado ? 'selected' : ''}>${capitalize(s.replace('-', ' '))}</option>`
                        ).join('')}
                    </select>

                    <small >Creada: ${task.fecha}</small>
                </div>
            </div>
        </div>
    `);
}

// -------------------- EVENTS LIST ------------------------
taskList.addEventListener('click', e => {
    if (e.target.closest('.btn-delete')) {
        const id = e.target.closest('[data-id]').dataset.id;
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderAllTasks();
        updateStats();
        showToast("Eliminada", "Tarea borrada", "info");
    }
});

taskList.addEventListener('change', e => {
    if (!e.target.classList.contains('status-select')) return;
    const id = e.target.closest('[data-id]').dataset.id;
    const task = tasks.find(t => t.id === id);
    task.estado = e.target.value;
    saveTasks();
    renderAllTasks();
    updateStats();
});

taskList.addEventListener('input', e => {
    const card = e.target.closest('[data-id]');
    if (!card) return;

    const task = tasks.find(t => t.id === card.dataset.id);
    if (e.target.classList.contains('task-title')) task.titulo = e.target.textContent;
    if (e.target.classList.contains('task-desc')) task.descripcion = e.target.textContent;
    saveTasks();
});

// -------------------- FILTERS ----------------------------
filterEstado.addEventListener('change', renderAllTasks);
filterPrioridad.addEventListener('change', renderAllTasks);

function passesFilters(task) {
    const estadoOk = filterEstado.value === 'todas' || task.estado === filterEstado.value;
    const prioridadOk = filterPrioridad.value === 'todas' || task.prioridad === filterPrioridad.value;
    return estadoOk && prioridadOk;
}

// -------------------- STATS ------------------------------
function updateStats() {
    statTotal.textContent = tasks.length;
    statPendientes.textContent = tasks.filter(t => t.estado === 'pendiente').length;
    statEnProceso.textContent = tasks.filter(t => t.estado === 'en-proceso').length;
    statCompletadas.textContent = tasks.filter(t => t.estado === 'completada').length;
    taskListTitle.textContent = `Tareas (${tasks.length})`;
}

// -------------------- UTILS ------------------------------
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
