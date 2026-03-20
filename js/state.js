// ===== APP STATE =====
// Central mutable state shared across modules.

import { loadTasks, saveTasks, loadExtraWeekends, saveExtraWeekends, loadWeekendBudgets, saveWeekendBudgets } from './storage.js';

export let tasks = [];
export let extraWeekends = [];
export let weekendBudgets = {};
export let currentTaskId = null;
export let stepEditMode = false;

// Form state
export let formPri = 'low';
export let formCat = '';
export let formWeekendId = null;
export let formEstimate = null;
export let formStretch = false;
export let editId = null;
export let formSubs = [];

// Setters
export function setTasks(t) { tasks = t; }
export function setExtraWeekends(w) { extraWeekends = w; }
export function setWeekendBudgets(b) { weekendBudgets = b; }
export function setCurrentTaskId(id) { currentTaskId = id; }
export function setStepEditMode(v) { stepEditMode = v; }
export function setFormPri(v) { formPri = v; }
export function setFormCat(v) { formCat = v; }
export function setFormWeekendId(v) { formWeekendId = v; }
export function setFormEstimate(v) { formEstimate = v; }
export function setFormStretch(v) { formStretch = v; }
export function setEditId(v) { editId = v; }
export function setFormSubs(v) { formSubs = v; }

export function save() {
  saveTasks(tasks);
}

export function load() {
  tasks = loadTasks();
  extraWeekends = loadExtraWeekends();
  weekendBudgets = loadWeekendBudgets();
}

export function saveWeekends() {
  saveExtraWeekends(extraWeekends);
}

export function saveBudgets() {
  saveWeekendBudgets(weekendBudgets);
}

export function getWeekendBudget(wid) {
  return weekendBudgets[wid] || null;
}

export function setWeekendBudget(wid, minutes) {
  if (minutes == null) {
    delete weekendBudgets[wid];
  } else {
    weekendBudgets[wid] = minutes;
  }
  saveBudgets();
}

export function getWeekendPlanned(wid) {
  var committed = 0, stretch = 0;
  tasks.forEach(function (t) {
    if (t.weekendId === wid && !t.done && t.estimateMin) {
      if (t.stretch) stretch += t.estimateMin;
      else committed += t.estimateMin;
    }
  });
  return { committed, stretch, total: committed + stretch };
}

// ===== SUBTASK / PARENT SYNC (Change #1) =====
// Centralized rule: if a task has subtasks, done is derived from subtask state.
export function syncTaskDoneFromSubtasks(task) {
  if (!task.subtasks || task.subtasks.length === 0) return;
  task.done = task.subtasks.every(s => s.done);
}
