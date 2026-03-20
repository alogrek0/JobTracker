// ===== APP STATE =====
// Central mutable state shared across modules.

import { loadTasks, saveTasks, loadExtraWeekends, saveExtraWeekends } from './storage.js';

export let tasks = [];
export let extraWeekends = [];
export let currentTaskId = null;
export let stepEditMode = false;

// Form state
export let formPri = 'low';
export let formCat = '';
export let formWeekendId = null;
export let editId = null;
export let formSubs = [];

// Setters (needed since ES module exports are live bindings but not directly assignable from outside)
export function setTasks(t) { tasks = t; }
export function setExtraWeekends(w) { extraWeekends = w; }
export function setCurrentTaskId(id) { currentTaskId = id; }
export function setStepEditMode(v) { stepEditMode = v; }
export function setFormPri(v) { formPri = v; }
export function setFormCat(v) { formCat = v; }
export function setFormWeekendId(v) { formWeekendId = v; }
export function setEditId(v) { editId = v; }
export function setFormSubs(v) { formSubs = v; }

export function save() {
  saveTasks(tasks);
}

export function load() {
  tasks = loadTasks();
  extraWeekends = loadExtraWeekends();
}

export function saveWeekends() {
  saveExtraWeekends(extraWeekends);
}

// ===== SUBTASK / PARENT SYNC (Change #1) =====
// Centralized rule: if a task has subtasks, done is derived from subtask state.
export function syncTaskDoneFromSubtasks(task) {
  if (!task.subtasks || task.subtasks.length === 0) return;
  task.done = task.subtasks.every(s => s.done);
}
