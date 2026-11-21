"use strict";

/* Assignment 3: saved state, combined project rules, a GitHub API,
   contact checks, a clock-based study timer, and two browser demos. */
const Core = globalThis.PortfolioCore;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* ---------- 1. Safe storage (works even if storage is blocked) ---------- */
const memoryStore = new Map();
const store = {
  get(key) {
    if (memoryStore.has(key)) return memoryStore.get(key);
    try { return localStorage.getItem(key); } catch { showStorageNote(); return null; }
  },
  set(key, value) {
    memoryStore.set(key, String(value));
    try { localStorage.setItem(key, value); } catch { showStorageNote(); }
  },
  remove(key) {
    memoryStore.delete(key);
    try { localStorage.removeItem(key); } catch { showStorageNote(); }
  }
};

function showStorageNote() {
  $("#storage-note").hidden = false;
}

function readJSON(key, fallback) {
  try { return JSON.parse(store.get(key)) ?? fallback; } catch { return fallback; }
}

function debounce(callback, delay = 150) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}

/* ---------- 2. Theme ---------- */
const page = document.documentElement;
const themeButton = $("#theme-toggle");

function applyTheme(theme) {
  page.dataset.theme = theme;
  themeButton.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  themeButton.textContent = theme === "dark" ? "☀" : "☾";
}

function initTheme() {
  const saved = store.get("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved === "light" || saved === "dark" ? saved : (prefersDark ? "dark" : "light"));

  themeButton.addEventListener("click", () => {
    const next = page.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    store.set("theme", next);
  });
}

/* ---------- 3. Greeting + visitor name ---------- */
const greeting = $("#greeting");
const nameForm = $("#name-form");
const nameInput = $("#visitor-name");
const nameError = $("#name-error");
const forgetButton = $("#forget-name");

function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function renderGreeting() {
  const saved = store.get("visitorName");
  const name = typeof saved === "string" && saved.trim().length > 0
    && saved.trim().length <= 30 ? saved.trim() : "";
  if (saved && !name) store.remove("visitorName");
  greeting.textContent = name
    ? `${getTimeOfDay()}, ${name}! Welcome to my portfolio.`
    : `${getTimeOfDay()}! Welcome to my portfolio.`;
  forgetButton.hidden = !name;
}

function initGreeting() {
  renderGreeting();

  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (!name || name.length > 30) {
      nameError.textContent = "Please enter a name between 1 and 30 characters.";
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return;
    }

    nameError.textContent = "";
    nameInput.removeAttribute("aria-invalid");
    store.set("visitorName", name);
    nameInput.value = "";
    renderGreeting();
  });

  forgetButton.addEventListener("click", () => {
    store.remove("visitorName");
    renderGreeting();
  });
}

/* ---------- 4. One pipeline: search + technology + level + sort ---------- */
const projectState = Core.normalizePreferences(readJSON("a3-project-controls", null));
const projects = $$("[data-project]").map((element) => ({
  element,
  title: $("h3", element).textContent,
  tags: element.dataset.tags.split(" "),
  level: element.dataset.level,
  searchText: element.textContent.toLowerCase()
}));

function renderProjects() {
  const selected = Core.selectProjects(projects, projectState);
  const shown = new Set(selected);
  projects.forEach((project) => { project.element.hidden = !shown.has(project); });
  // Moving existing nodes keeps dialog listeners and keyboard controls intact.
  selected.forEach((project) => $("#project-grid").append(project.element));
  $("#project-empty").hidden = selected.length > 0;
  $("#project-count").textContent = `Showing ${selected.length} of ${projects.length} projects`;
  const messages = {
    all: "All levels are shown. Each card explains what you can try.",
    beginner: "Start with task lists: add an item, change its state, and save it.",
    intermediate: "Try the workout tracker to see validation, calculations, and saved lists.",
    advanced: "Explore the live API, combined filters, cache handling, and timer in this portfolio."
  };
  $("#level-message").textContent = messages[projectState.level];
  $$("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === projectState.technology;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  store.set("a3-project-controls", JSON.stringify(projectState));
}

function resetProjectControls() {
  Object.assign(projectState, Core.normalizePreferences(null));
  $("#project-search").value = "";
  $("#project-level").value = "all";
  $("#project-sort").value = "title-asc";
  renderProjects();
}

function initProjects() {
  $("#project-search").value = projectState.query;
  $("#project-level").value = projectState.level;
  $("#project-sort").value = projectState.sort;
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    projectState.technology = button.dataset.filter;
    // Read the current search too, including keystrokes still waiting for debounce.
    projectState.query = $("#project-search").value;
    renderProjects();
  }));
  $("#project-search").addEventListener("input", debounce(() => {
    projectState.query = $("#project-search").value;
    renderProjects();
  }));
  $("#project-level").addEventListener("change", (event) => {
    projectState.level = event.target.value;
    projectState.query = $("#project-search").value;
    renderProjects();
  });
  $("#project-sort").addEventListener("change", (event) => {
    projectState.sort = event.target.value;
    projectState.query = $("#project-search").value;
    renderProjects();
  });
  $("#reset-filters").addEventListener("click", resetProjectControls);
  $("#clear-project-options").addEventListener("click", resetProjectControls);
  renderProjects();
}

/* ---------- 5. GitHub: async data, timeout, validation, and labelled cache ---------- */
const CACHE_KEY = "a3-github-cache";
const FRESH_FOR = 15 * 60 * 1000;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;
const githubState = {
  repositories: [], hasData: false, loading: false, fetchedAt: 0,
  savedCopy: false, query: "", language: "all", sort: "updated"
};

function readRepositoryCache() {
  try {
    const cache = readJSON(CACHE_KEY, null);
    if (!cache || !Number.isFinite(cache.fetchedAt)) return null;
    const age = Date.now() - cache.fetchedAt;
    if (!Number.isFinite(age) || age < -60000 || age > MAX_CACHE_AGE) return null;
    return { repositories: Core.normalizeRepositories(cache.repositories), fetchedAt: cache.fetchedAt };
  } catch { return null; }
}

function setRepositories(repositories, fetchedAt, savedCopy) {
  Object.assign(githubState, { repositories, fetchedAt, savedCopy, hasData: true });
  const languages = [...new Set(repositories.map((repo) => repo.language))].sort();
  const select = $("#github-language");
  select.replaceChildren(new Option("All languages", "all"));
  languages.forEach((language) => select.add(new Option(language, language)));
  if (!languages.includes(githubState.language)) githubState.language = "all";
  select.value = githubState.language;
  renderRepositories();
}

function renderRepositories() {
  const results = $("#github-results");
  const selected = Core.selectRepositories(githubState.repositories,
    githubState.query, githubState.language, githubState.sort);
  const fragment = document.createDocumentFragment();
  selected.forEach((repo) => {
    const article = document.createElement("article");
    article.className = "repository-card";
    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;
    title.append(link);
    const description = document.createElement("p");
    description.textContent = repo.description;
    const meta = document.createElement("p");
    meta.className = "repository-meta";
    meta.textContent = `${repo.language} · ${repo.stargazers_count} star${repo.stargazers_count === 1 ? "" : "s"}`;
    const updated = document.createElement("p");
    updated.className = "helper-text";
    updated.textContent = repo.updated_at
      ? `Updated ${new Date(repo.updated_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}`
      : "Update date unavailable";
    article.append(title, description, meta, updated);
    fragment.append(article);
  });
  results.replaceChildren(fragment);
  $("#github-controls").hidden = !githubState.hasData;
  $("#github-empty").hidden = !githubState.hasData || selected.length > 0;
  $("#github-empty").textContent = githubState.repositories.length
    ? "No repositories match. Clear the search or choose all languages."
    : "There are no public repositories to show yet.";
  $("#github-count").textContent = githubState.hasData
    ? `Showing ${selected.length} of ${githubState.repositories.length} repositories` : "";
  if (githubState.hasData) {
    const time = new Date(githubState.fetchedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
    $("#github-source").textContent = `${githubState.savedCopy ? "Saved GitHub copy" : "Live GitHub response"} · Retrieved ${time}`;
  }
}

async function loadGithub(allowFreshCache = false) {
  if (githubState.loading) return;
  const cache = readRepositoryCache();
  if (allowFreshCache && cache && Date.now() - cache.fetchedAt < FRESH_FOR) {
    setRepositories(cache.repositories, cache.fetchedAt, true);
    $("#github-message").textContent = "Using a saved copy to reduce requests. Refresh to check GitHub now.";
    return;
  }
  githubState.loading = true;
  $("#github-results").setAttribute("aria-busy", "true");
  $("#github-refresh").disabled = true;
  $("#github-retry").hidden = true;
  const message = $("#github-message");
  message.classList.remove("is-error");
  message.textContent = "Loading public repositories…";
  try {
    const repositories = await Core.fetchRepositories();
    const fetchedAt = Date.now();
    setRepositories(repositories, fetchedAt, false);
    store.set(CACHE_KEY, JSON.stringify({ repositories, fetchedAt }));
    message.textContent = "Repositories loaded from GitHub.";
  } catch (error) {
    let text = error.name === "AbortError"
      ? "GitHub took too long to respond. Please try again."
      : error.status === 403 || error.status === 429
        ? "GitHub is busy or its request limit was reached. Try again later."
        : "We could not load GitHub. Check your connection and try again.";
    if (cache) {
      setRepositories(cache.repositories, cache.fetchedAt, true);
      text += " Showing the saved copy below.";
    } else if (githubState.hasData) {
      githubState.savedCopy = true;
      renderRepositories();
      text += " Keeping the previously loaded results below.";
    } else {
      $("#github-source").textContent = "GitHub data is currently unavailable.";
    }
    message.classList.add("is-error");
    message.textContent = text;
    $("#github-retry").hidden = false;
  } finally {
    githubState.loading = false;
    $("#github-results").setAttribute("aria-busy", "false");
    $("#github-refresh").disabled = false;
  }
}

function initGithub() {
  $("#github-refresh").addEventListener("click", () => loadGithub());
  $("#github-retry").addEventListener("click", () => loadGithub());
  $("#github-search").addEventListener("input", debounce((event) => {
    githubState.query = event.target.value;
    renderRepositories();
  }));
  $("#github-language").addEventListener("change", (event) => {
    githubState.language = event.target.value;
    githubState.query = $("#github-search").value;
    renderRepositories();
  });
  $("#github-sort").addEventListener("change", (event) => {
    githubState.sort = event.target.value;
    githubState.query = $("#github-search").value;
    renderRepositories();
  });
  loadGithub(true);
}

/* ---------- 6. Contact validation: check every rule before success ---------- */
const contactForm = $("#contact-form");
const formStatus = $("#form-status");
const contactFields = $$("input, textarea", contactForm);

function getContactErrors() {
  return Core.validateContact({
    name: $("#name").value, email: $("#email").value,
    message: $("#message").value, consent: $("#contact-consent").checked
  });
}

function showContactError(field, error) {
  $(`#${field.name}-msg`).textContent = error;
  if (error) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

function initContactForm() {
  contactFields.forEach((field) => {
    field.addEventListener("blur", () => showContactError(field, getContactErrors()[field.name]));
    field.addEventListener(field.type === "checkbox" ? "change" : "input", () => {
      if (field.hasAttribute("aria-invalid")) showContactError(field, getContactErrors()[field.name]);
      formStatus.textContent = "";
      formStatus.className = "form-status";
    });
  });
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = getContactErrors();
    contactFields.forEach((field) => showContactError(field, errors[field.name]));
    const firstInvalid = contactFields.find((field) => errors[field.name]);
    if (firstInvalid) {
      formStatus.className = "form-status error";
      formStatus.textContent = "Please fix the highlighted fields and check again.";
      firstInvalid.focus();
      return;
    }
    const name = $("#name").value.trim();
    formStatus.className = "form-status success";
    formStatus.textContent = `Thanks, ${name}! Your message passed all checks. This demo did not send or save it.`;
    contactForm.reset();
  });
}

/* ---------- Study timer: store a deadline, rather than counting ticks ---------- */
let timer = Core.normalizeTimer(readJSON("a3-focus-timer", null));
let timerInterval = null;
const saveTimer = () => store.set("a3-focus-timer", JSON.stringify(timer));

function renderTimer() {
  $("#timer-display").textContent = Core.formatTime(Core.remainingSeconds(timer));
  $("#focus-minutes").value = timer.minutes;
  $("#focus-minutes").disabled = timer.running;
  $("#timer-toggle").textContent = timer.running ? "Pause session"
    : timer.remaining > 0 && timer.remaining < timer.minutes * 60 ? "Resume session" : "Start session";
  $("#session-count").textContent = timer.completed;
}

function stopTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function finishTimer() {
  stopTimerInterval();
  Object.assign(timer, { running: false, remaining: 0, deadline: null, completed: timer.completed + 1 });
  saveTimer();
  renderTimer();
  $("#timer-status").textContent = "Session finished. Nice work! Take a short break.";
}

function tickTimer() {
  if (timer.running && Core.remainingSeconds(timer) === 0) finishTimer();
  else renderTimer();
}

function startTimerInterval() {
  stopTimerInterval();
  tickTimer();
  if (timer.running) timerInterval = setInterval(tickTimer, 1000);
}

function validateMinutes() {
  const input = $("#focus-minutes");
  const minutes = Number(input.value);
  const valid = input.value.trim() !== "" && Number.isInteger(minutes) && minutes >= 1 && minutes <= 60;
  $("#timer-error").textContent = valid ? "" : "Choose a whole number from 1 to 60 minutes.";
  if (valid) input.removeAttribute("aria-invalid");
  else input.setAttribute("aria-invalid", "true");
  return valid ? minutes : null;
}

function initTimer() {
  renderTimer();
  if (timer.running) {
    $("#timer-status").textContent = "Your saved session is running.";
    startTimerInterval();
  } else if (timer.remaining === 0) {
    $("#timer-status").textContent = "Your last session is complete. Start again when you are ready.";
  } else if (timer.remaining < timer.minutes * 60) {
    $("#timer-status").textContent = "Your saved session is paused.";
  }
  $("#focus-minutes").addEventListener("change", () => {
    const minutes = validateMinutes();
    if (minutes === null) return;
    Object.assign(timer, { minutes, remaining: minutes * 60, running: false, deadline: null });
    stopTimerInterval();
    saveTimer();
    renderTimer();
    $("#timer-status").textContent = "Session length updated. Ready when you are.";
  });
  $("#timer-toggle").addEventListener("click", () => {
    if (timer.running) {
      const remaining = Core.remainingSeconds(timer);
      if (remaining === 0) { finishTimer(); return; }
      Object.assign(timer, { remaining, running: false, deadline: null });
      stopTimerInterval();
      $("#timer-status").textContent = "Session paused. Resume whenever you are ready.";
    } else {
      const minutes = validateMinutes();
      if (minutes === null) { $("#focus-minutes").focus(); return; }
      if (minutes !== timer.minutes || timer.remaining === 0) timer.remaining = minutes * 60;
      timer.minutes = minutes;
      timer.deadline = Date.now() + timer.remaining * 1000;
      timer.running = true;
      $("#timer-status").textContent = "Session running. Focus on one thing.";
      startTimerInterval();
    }
    saveTimer();
    renderTimer();
  });
  $("#timer-reset").addEventListener("click", () => {
    stopTimerInterval();
    Object.assign(timer, { remaining: timer.minutes * 60, running: false, deadline: null });
    $("#timer-error").textContent = "";
    $("#focus-minutes").removeAttribute("aria-invalid");
    saveTimer();
    renderTimer();
    $("#timer-status").textContent = "Timer reset. Ready when you are.";
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && timer.running) tickTimer();
  });
}

/* ---------- 7. IronLog – gym tracker ---------- */
const workoutForm = $("#workout-form");
const workoutList = $("#workout-list");
const workoutEmpty = $("#workout-empty");
const workoutError = $("#workout-error");
const exerciseInput = $("#exercise");
let workouts = loadList("ironlog-workouts", isWorkout);

function loadList(key, isValid) {
  try {
    const parsed = JSON.parse(store.get(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch { return []; }
}
const saveList = (key, list) => store.set(key, JSON.stringify(list));

function createId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasValidId(item) {
  return typeof item.id === "string" ? item.id.length > 0 : Number.isFinite(item.id);
}

function isWorkout(item) {
  return item !== null && typeof item === "object" && hasValidId(item)
    && typeof item.exercise === "string" && item.exercise.trim().length > 0 && item.exercise.length <= 40
    && Number.isInteger(item.sets) && item.sets >= 1 && item.sets <= 20
    && Number.isInteger(item.reps) && item.reps >= 1 && item.reps <= 100
    && Number.isFinite(item.weight) && item.weight >= 0 && item.weight <= 1000
    && Number.isInteger(item.weight * 2);
}

function renderWorkouts() {
  workoutList.replaceChildren();
  workoutEmpty.hidden = workouts.length > 0;

  workouts.forEach((w) => {
    const item = document.createElement("article");
    item.className = "item";

    const details = document.createElement("div");
    const title = document.createElement("h4");
    const numbers = document.createElement("p");
    title.textContent = w.exercise;
    numbers.textContent = `${w.sets} sets × ${w.reps} reps at ${w.weight} kg`;
    details.append(title, numbers);

    const volume = document.createElement("span");
    volume.className = "item-value";
    volume.textContent = `${(w.sets * w.reps * w.weight).toLocaleString()} kg`;

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${w.exercise}`);
    remove.addEventListener("click", () => {
      workouts = workouts.filter((e) => e.id !== w.id);
      saveList("ironlog-workouts", workouts);
      renderWorkouts();
    });

    item.append(details, volume, remove);
    workoutList.append(item);
  });

  $("#workout-count").textContent = workouts.length;
  $("#set-count").textContent = workouts.reduce((t, w) => t + w.sets, 0);
  $("#volume-count").textContent = workouts
    .reduce((t, w) => t + w.sets * w.reps * w.weight, 0)
    .toLocaleString();
}

function initWorkouts() {
  workoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(workoutForm);
    const exercise = String(data.get("exercise")).trim();
    const sets = Number(data.get("sets"));
    const reps = Number(data.get("reps"));
    const weight = Number(data.get("weight"));

    $$("input", workoutForm).forEach((input) => input.removeAttribute("aria-invalid"));

    if (!exercise || exercise.length > 40) {
      workoutError.textContent = "Please enter an exercise name between 1 and 40 characters.";
      exerciseInput.setAttribute("aria-invalid", "true");
      exerciseInput.focus();
      return;
    }
    const numberRules = [
      { input: $("#sets"), valid: Number.isInteger(sets) && sets >= 1 && sets <= 20,
        message: "Sets must be a whole number from 1 to 20." },
      { input: $("#reps"), valid: Number.isInteger(reps) && reps >= 1 && reps <= 100,
        message: "Reps must be a whole number from 1 to 100." },
      { input: $("#weight"), valid: Number.isFinite(weight) && weight >= 0 && weight <= 1000 && Number.isInteger(weight * 2),
        message: "Enter a weight from 0 to 1000 kg in steps of 0.5 kg (use 0 for bodyweight)." }
    ];
    for (const rule of numberRules) {
      if (!rule.input.value.trim() || !rule.valid) {
        workoutError.textContent = rule.message;
        rule.input.setAttribute("aria-invalid", "true");
        rule.input.focus();
        return;
      }
    }

    workoutError.textContent = "";
    exerciseInput.removeAttribute("aria-invalid");
    workouts.unshift({ id: createId(), exercise, sets, reps, weight });
    saveList("ironlog-workouts", workouts);
    renderWorkouts();
    workoutForm.reset();
    exerciseInput.focus();
  });

  $$("[data-exercise]").forEach((button) => {
    button.addEventListener("click", () => {
      exerciseInput.value = button.dataset.exercise;
      exerciseInput.focus();
    });
  });

  $("#clear-workouts").addEventListener("click", () => {
    workouts = [];
    saveList("ironlog-workouts", workouts);
    renderWorkouts();
  });

  const fallbackTips = [
    "Control every repetition and prioritize good form.",
    "Record each workout and improve one small detail next time.",
    "Recovery, hydration, and sleep support your training.",
    "Warm up gradually before your hardest working sets."
  ];
  let tipIndex = 0;
  $("#new-tip").addEventListener("click", () => {
    $("#coach-tip").textContent = fallbackTips[tipIndex];
    tipIndex = (tipIndex + 1) % fallbackTips.length;
  });

  renderWorkouts();
}

/* ---------- 8. FocusList – to-do app ---------- */
const taskForm = $("#task-form");
const taskInput = $("#task-input");
const taskList = $("#task-list");
const taskEmpty = $("#task-empty");
const taskError = $("#task-error");
let tasks = loadList("focuslist-tasks", isTask);
let taskFilter = "all";

function isTask(item) {
  return item !== null && typeof item === "object" && hasValidId(item)
    && typeof item.text === "string" && item.text.trim().length > 0 && item.text.length <= 80
    && ["Personal", "Study", "Work", "Health"].includes(item.category)
    && typeof item.done === "boolean";
}

function renderTasks() {
  taskList.replaceChildren();
  const shown = tasks.filter((t) =>
    taskFilter === "open" ? !t.done : taskFilter === "done" ? t.done : true
  );
  taskEmpty.hidden = shown.length > 0;
  taskEmpty.textContent = tasks.length === 0
    ? "Your list is clear. Add a task above when you’re ready."
    : taskFilter === "done" ? "No completed tasks yet. Finish a task or choose All."
      : "No open tasks. Choose All to see your completed tasks.";

  shown.forEach((task) => {
    const item = document.createElement("article");
    item.className = `item task-item${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark ${task.text} ${task.done ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveList("focuslist-tasks", tasks);
      renderTasks();
    });

    const copy = document.createElement("div");
    const title = document.createElement("h4");
    const category = document.createElement("p");
    title.textContent = task.text;
    category.textContent = task.category;
    copy.append(title, category);

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.text}`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter((e) => e.id !== task.id);
      saveList("focuslist-tasks", tasks);
      renderTasks();
    });

    item.append(checkbox, copy, remove);
    taskList.append(item);
  });

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  $("#progress-label").textContent = `${pct}% complete`;
  $("#progress-bar").style.width = `${pct}%`;
  $("#progress-message").textContent = tasks.length
    ? `${done} of ${tasks.length} tasks finished.`
    : "Add a task to begin your day.";
}

function setTaskFilter(value) {
  taskFilter = value;
  $$("[data-task-filter]").forEach((button) => {
    const active = button.dataset.taskFilter === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderTasks();
}

function initTasks() {
  $("#today").textContent = new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric"
  }).format(new Date());

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(taskForm);
    const text = String(data.get("task")).trim();
    if (!text || text.length > 80) {
      taskError.textContent = "Please enter a task between 1 and 80 characters.";
      taskInput.setAttribute("aria-invalid", "true");
      taskInput.focus();
      return;
    }
    taskError.textContent = "";
    taskInput.removeAttribute("aria-invalid");
    tasks.unshift({ id: createId(), text, category: data.get("category"), done: false });
    saveList("focuslist-tasks", tasks);
    taskForm.reset();
    setTaskFilter("all");
    taskInput.focus();
  });

  $$("[data-task-filter]").forEach((button) => {
    button.addEventListener("click", () => setTaskFilter(button.dataset.taskFilter));
  });

  $("#clear-completed").addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    saveList("focuslist-tasks", tasks);
    renderTasks();
  });

  renderTasks();
}

/* ---------- 9. Accessible project dialogs ---------- */
function initDialogs() {
  $$("[data-open]").forEach((card) => {
    const dialog = $("#" + card.dataset.open);
    const open = () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      document.body.classList.add("dialog-open");
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      card.focus();
    });
  });
  $$(".app-dialog").forEach((dialog) => {
    const close = () => {
      if (typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        document.body.classList.remove("dialog-open");
      }
    };
    $("[data-close]", dialog).addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom)) close();
    });
  });
}

/* Start independently of the asynchronous API request. */
initTheme();
initGreeting();
initProjects();
initGithub();
initContactForm();
initTimer();
initWorkouts();
initTasks();
initDialogs();
