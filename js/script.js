/**
 * Life Dashboard — script.js
 * Features: Live Clock · Focus Timer · To-Do List · Quick Links
 * Challenges: Dark/Light Mode · Custom Name · Duplicate Task Prevention
 * Storage: localStorage (all data persists across sessions)
 */

/* ═══════════════════════════════════════════════════
   CONSTANTS & STATE
   ═══════════════════════════════════════════════════ */
const STORAGE_KEYS = {
  TASKS:  'lifedash_tasks',
  LINKS:  'lifedash_links',
  THEME:  'lifedash_theme',
  NAME:   'lifedash_name',
};

let state = {
  tasks:        [],
  links:        [],
  theme:        'light',
  name:         '',
  filter:       'all',
  editingTaskId: null,
};

/* ═══════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════ */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return '';
  }
}

function normaliseTask(text) {
  return text.trim().replace(/\s+/g, ' ');
}

/* ═══════════════════════════════════════════════════
   PERSISTENCE
   ═══════════════════════════════════════════════════ */

function saveState() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(state.links));
  localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
  localStorage.setItem(STORAGE_KEYS.NAME,  state.name);
}

function loadState() {
  state.tasks  = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  state.links  = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINKS) || '[]');
  state.theme  = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  state.name   = localStorage.getItem(STORAGE_KEYS.NAME)  || '';
}

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════ */

let toastContainer;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

function showToast(msg, type = '') {
  ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = ['toast', type ? `toast--${type}` : ''].filter(Boolean).join(' ');
  toast.textContent = msg;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2550);
}

/* ═══════════════════════════════════════════════════
   THEME  (Challenge 1)
   ═══════════════════════════════════════════════════ */

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon      = document.getElementById('theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

function initTheme() { applyTheme(state.theme); }

themeToggleBtn.addEventListener('click', () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  saveState();
  showToast(`${state.theme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode enabled`);
});

/* ═══════════════════════════════════════════════════
   LIVE CLOCK & GREETING
   ═══════════════════════════════════════════════════ */

const clockEl       = document.getElementById('live-clock');
const greetingEl    = document.getElementById('greeting-text');
const greetingName  = document.getElementById('greeting-name');
const currentDateEl = document.getElementById('current-date');

function tickClock() {
  const now  = new Date();
  const h    = now.getHours();
  const min  = now.getMinutes().toString().padStart(2, '0');
  const sec  = now.getSeconds().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = (h % 12 || 12).toString().padStart(2, '0');

  clockEl.textContent       = `${h12}:${min}:${sec} ${ampm}`;
  greetingEl.textContent    = getGreeting(h) + ',';
  currentDateEl.textContent = formatDate(now);
}

function initClock() {
  tickClock();
  setInterval(tickClock, 1000);
}

/* ═══════════════════════════════════════════════════
   CUSTOM NAME  (Challenge 2)
   ═══════════════════════════════════════════════════ */

const nameForm  = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');

function updateGreetingName() {
  greetingName.textContent = state.name
    ? `Hello, ${state.name}! 👋`
    : 'Welcome 👋';
}

function initName() {
  nameInput.value = state.name;
  updateGreetingName();
}

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const trimmed = nameInput.value.trim();
  state.name = trimmed;
  saveState();
  updateGreetingName();
  showToast(trimmed ? `Name saved: ${trimmed}` : 'Name cleared.', 'success');
});

/* ═══════════════════════════════════════════════════
   FOCUS TIMER  — fixed 25-minute Pomodoro
   ═══════════════════════════════════════════════════ */

const TIMER_DURATION = 25 * 60; // 1500 seconds — fixed, never changes
const RING_C         = 2 * Math.PI * 84; // circumference for r=84 ≈ 527.79

const timerDisplay = document.getElementById('timer-display');
const timerStatus  = document.getElementById('timer-status');
const timerRingEl  = document.getElementById('timer-ring-progress');
const btnStart     = document.getElementById('timer-start');
const btnStop      = document.getElementById('timer-stop');
const btnReset     = document.getElementById('timer-reset');

// Timer state — not persisted (resets on page load by design)
let timerLeft     = TIMER_DURATION; // seconds remaining
let timerRunning  = false;
let timerInterval = null;

/** Formats seconds as MM:SS */
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Drives the SVG ring and colour states from current timerLeft */
function updateRing() {
  const offset = RING_C * (1 - timerLeft / TIMER_DURATION);
  timerRingEl.style.strokeDashoffset = offset;

  timerRingEl.classList.remove('ring--warning', 'ring--done');
  if (timerLeft === 0) {
    timerRingEl.classList.add('ring--done');
  } else if (timerRunning && timerLeft <= 300) {
    timerRingEl.classList.add('ring--warning');
  }
}

/** Syncs all visual elements to the current timer state */
function renderTimer() {
  timerDisplay.textContent = formatTime(timerLeft);

  timerDisplay.classList.toggle('timer--running',
    timerRunning && timerLeft > 300);
  timerDisplay.classList.toggle('timer--warning',
    timerRunning && timerLeft <= 300 && timerLeft > 0);

  if (timerLeft === 0) {
    timerStatus.textContent = 'Complete!';
  } else if (timerRunning) {
    timerStatus.textContent = timerLeft <= 300 ? 'Almost there…' : 'Focusing';
  } else if (timerLeft < TIMER_DURATION) {
    timerStatus.textContent = 'Paused';
  } else {
    timerStatus.textContent = 'Ready';
  }

  updateRing();

  document.title = timerRunning
    ? `${formatTime(timerLeft)} — Life Dashboard`
    : 'Life Dashboard';
}

/** Called every second while the timer is running */
function timerTick() {
  if (timerLeft <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    renderTimer();
    showToast('🎉 Focus session complete! Take a break.', 'success');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    return;
  }
  timerLeft--;
  renderTimer();
}

// Start — begins the 25-minute countdown
btnStart.addEventListener('click', () => {
  if (timerRunning) return;
  // Auto-reset if the session already finished
  if (timerLeft === 0) timerLeft = TIMER_DURATION;
  timerRunning  = true;
  timerInterval = setInterval(timerTick, 1000);
  renderTimer();
  showToast('⏱ Focus timer started!');
});

// Stop — pauses the countdown
btnStop.addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  renderTimer();
  showToast('⏸ Timer paused.');
});

// Reset — returns to 25:00
btnReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft    = TIMER_DURATION;
  renderTimer();
  showToast('🔄 Timer reset to 25:00.');
});

function initTimer() {
  renderTimer(); // shows 25:00 and full ring on page load
}

/* ═══════════════════════════════════════════════════
   TO-DO LIST  (Challenge 3: Duplicate Prevention)
   ═══════════════════════════════════════════════════ */

const todoForm      = document.getElementById('todo-form');
const todoInput     = document.getElementById('todo-input');
const todoError     = document.getElementById('todo-error');
const todoListEl    = document.getElementById('todo-list');
const todoCount     = document.getElementById('todo-count');
const clearBtn      = document.getElementById('clear-completed');
const filterBtns    = document.querySelectorAll('.filter-btn');
const progressFill  = document.getElementById('todo-progress-fill');
const progressLabel = document.getElementById('todo-progress-label');

/* Edit modal */
const editModal     = document.getElementById('edit-modal');
const editInput     = document.getElementById('edit-input');
const editError     = document.getElementById('edit-error');
const editSaveBtn   = document.getElementById('edit-save');
const editCancelBtn = document.getElementById('edit-cancel');
const editCancelX   = document.getElementById('edit-cancel-x');

function isDuplicateTask(text, excludeId = null) {
  const norm = normaliseTask(text).toLowerCase();
  return state.tasks.some(
    (t) => t.text.toLowerCase() === norm && t.id !== excludeId
  );
}

/** Updates the progress bar and label */
function updateProgress() {
  const total     = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width    = `${pct}%`;
  progressLabel.textContent   = `${pct}%`;
}

function renderTasks() {
  todoListEl.innerHTML = '';

  const filtered = state.tasks.filter((t) => {
    if (state.filter === 'active')    return !t.completed;
    if (state.filter === 'completed') return  t.completed;
    return true;
  });

  if (filtered.length === 0) {
    const li  = document.createElement('li');
    li.className = 'empty-state';

    const icon = document.createElement('span');
    icon.className   = 'empty-state__icon';
    icon.textContent =
      state.filter === 'completed' ? '🎉'
      : state.filter === 'active'  ? '✅'
      : '📋';

    const msg = document.createElement('span');
    msg.textContent =
      state.filter === 'completed' ? 'No completed tasks yet.'
      : state.filter === 'active'  ? 'No active tasks — great work!'
      : 'No tasks yet. Add one above!';

    li.appendChild(icon);
    li.appendChild(msg);
    todoListEl.appendChild(li);
  } else {
    filtered.forEach((task) => todoListEl.appendChild(createTaskEl(task)));
  }

  const activeCount = state.tasks.filter((t) => !t.completed).length;
  todoCount.textContent =
    `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`;

  updateProgress();
}

function createTaskEl(task) {
  const li = document.createElement('li');
  li.className = ['todo-item', task.completed ? 'completed' : ''].join(' ').trim();
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label',
    `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Text
  const span = document.createElement('span');
  span.className   = 'todo-item__text';
  span.textContent = task.text;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-item__actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'todo-item__btn todo-item__btn--edit';
  editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.title = 'Edit';
  editBtn.addEventListener('click', () => openEditModal(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-item__btn todo-item__btn--delete';
  deleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.title = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(actions);

  return li;
}

function addTask(text) {
  const norm = normaliseTask(text);
  if (!norm) return;

  if (isDuplicateTask(norm)) {
    todoError.textContent = `⚠️ "${norm}" already exists in your list.`;
    todoInput.focus();
    showToast('Duplicate task — not added.', 'warning');
    return;
  }

  todoError.textContent = '';
  const task = { id: uid(), text: norm, completed: false, createdAt: Date.now() };
  state.tasks.unshift(task);
  saveState();
  renderTasks();
  showToast('Task added!', 'success');
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveState();
  renderTasks();
}

function deleteTask(id, el) {
  el.classList.add('todo-item--removing');
  el.addEventListener('animationend', () => {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState();
    renderTasks();
  }, { once: true });
  showToast('Task deleted.', 'error');
}

function openEditModal(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  state.editingTaskId    = id;
  editInput.value        = task.text;
  editError.textContent  = '';
  editModal.hidden       = false;
  editInput.focus();
  editInput.select();
}

function closeEditModal() {
  editModal.hidden       = true;
  state.editingTaskId    = null;
  editError.textContent  = '';
}

editSaveBtn.addEventListener('click', () => {
  const norm = normaliseTask(editInput.value);
  if (!norm) {
    editError.textContent = 'Task text cannot be empty.';
    return;
  }
  if (isDuplicateTask(norm, state.editingTaskId)) {
    editError.textContent = `⚠️ "${norm}" already exists in your list.`;
    showToast('Duplicate task — edit not saved.', 'warning');
    return;
  }
  const task = state.tasks.find((t) => t.id === state.editingTaskId);
  if (task) {
    task.text = norm;
    saveState();
    renderTasks();
    showToast('Task updated!', 'success');
  }
  closeEditModal();
});

editCancelBtn.addEventListener('click', closeEditModal);
editCancelX.addEventListener('click', closeEditModal);
editModal.querySelector('.modal__backdrop').addEventListener('click', closeEditModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editModal.hidden) closeEditModal();
});

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') editSaveBtn.click();
});

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('input', () => {
  if (todoError.textContent) todoError.textContent = '';
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    state.filter = btn.dataset.filter;
    renderTasks();
  });
});

clearBtn.addEventListener('click', () => {
  const completedCount = state.tasks.filter((t) => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear.', 'warning');
    return;
  }
  state.tasks = state.tasks.filter((t) => !t.completed);
  saveState();
  renderTasks();
  showToast(
    `${completedCount} completed task${completedCount !== 1 ? 's' : ''} cleared.`,
    'success'
  );
});

function initTasks() { renderTasks(); }

/* ═══════════════════════════════════════════════════
   QUICK LINKS
   ═══════════════════════════════════════════════════ */

const linkForm    = document.getElementById('link-form');
const linkLabelEl = document.getElementById('link-label');
const linkUrlEl   = document.getElementById('link-url');
const linkError   = document.getElementById('link-error');
const linksListEl = document.getElementById('links-list');
const linksBadge  = document.getElementById('links-count-badge');

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function updateLinksBadge() {
  const n = state.links.length;
  if (linksBadge) linksBadge.textContent = `${n} saved`;
}

function renderLinks() {
  linksListEl.innerHTML = '';
  updateLinksBadge();

  if (state.links.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';

    const icon = document.createElement('span');
    icon.className   = 'empty-state__icon';
    icon.textContent = '🔗';

    const msg = document.createElement('span');
    msg.textContent = 'No links saved yet.';

    li.appendChild(icon);
    li.appendChild(msg);
    linksListEl.appendChild(li);
    return;
  }

  state.links.forEach((link) => linksListEl.appendChild(createLinkEl(link)));
}

function createLinkEl(link) {
  const li = document.createElement('li');
  li.className = 'link-item';

  const img = document.createElement('img');
  img.className = 'link-item__favicon';
  img.src = getFaviconUrl(link.url);
  img.alt = '';
  img.onerror = () => { img.style.display = 'none'; };

  const a = document.createElement('a');
  a.className = 'link-item__label';
  a.href      = link.url;
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.textContent = link.label;
  a.title     = link.url;

  const hostSpan = document.createElement('span');
  hostSpan.className = 'link-item__host';
  try {
    hostSpan.textContent = new URL(link.url).hostname;
  } catch {
    hostSpan.textContent = link.url;
  }

  const delBtn = document.createElement('button');
  delBtn.className = 'btn--danger-text';
  delBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  delBtn.setAttribute('aria-label', `Remove link: ${link.label}`);
  delBtn.title = 'Remove link';
  delBtn.addEventListener('click', () => deleteLink(link.id));

  li.appendChild(img);
  li.appendChild(a);
  li.appendChild(hostSpan);
  li.appendChild(delBtn);

  return li;
}

function addLink(label, url) {
  const trimLabel = label.trim();
  const trimUrl   = url.trim();

  if (!trimLabel) {
    linkError.textContent = 'Please enter a label for the link.';
    linkLabelEl.focus();
    return;
  }
  if (!trimUrl) {
    linkError.textContent = 'Please enter a URL.';
    linkUrlEl.focus();
    return;
  }
  if (!isValidUrl(trimUrl)) {
    linkError.textContent = 'Enter a valid URL starting with https://';
    linkUrlEl.focus();
    return;
  }

  linkError.textContent = '';
  const link = { id: uid(), label: trimLabel, url: trimUrl };
  state.links.push(link);
  saveState();
  renderLinks();
  showToast(`Link "${trimLabel}" saved!`, 'success');
}

function deleteLink(id) {
  const link = state.links.find((l) => l.id === id);
  state.links = state.links.filter((l) => l.id !== id);
  saveState();
  renderLinks();
  if (link) showToast(`Link "${link.label}" removed.`);
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addLink(linkLabelEl.value, linkUrlEl.value);
  linkLabelEl.value = '';
  linkUrlEl.value   = '';
  linkLabelEl.focus();
});

[linkLabelEl, linkUrlEl].forEach((el) => {
  el.addEventListener('input', () => {
    if (linkError.textContent) linkError.textContent = '';
  });
});

function initLinks() { renderLinks(); }

/* ═══════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════ */

function init() {
  loadState();
  initTheme();
  initClock();
  initName();
  initTimer();
  initTasks();
  initLinks();
}

document.addEventListener('DOMContentLoaded', init);
