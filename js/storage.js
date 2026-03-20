// ===== STORAGE: load, save, normalize, migration =====

import { isValidUUID } from './utils.js';
import { getThisWeekendSat, getNextWeekendSat } from './weekends.js';

export const STORE_KEY = 'home-tasks-v1';
export const WEEKENDS_KEY = 'home-tasks-weekends-v1';
export const BUDGETS_KEY = 'home-tasks-budgets-v1';
export const CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Yard / Landscaping',
  'Painting / Drywall', 'Flooring', 'General Repair', 'Cleaning / Organization', 'Insulation'
];

const VALID_PRIORITIES = ['high', 'med', 'low'];

export function normalizeTask(raw) {
  var weekendId = null;
  if (typeof raw.weekendId === 'string' && raw.weekendId) {
    weekendId = raw.weekendId;
  } else if (raw.weekend) {
    weekendId = getThisWeekendSat();
  } else if (raw.nextWeekend) {
    weekendId = getNextWeekendSat();
  }
  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : '',
    category: typeof raw.category === 'string' && raw.category ? raw.category : 'General Repair',
    priority: VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'low',
    done: !!raw.done,
    weekendId: weekendId,
    subtasks: Array.isArray(raw.subtasks)
      ? raw.subtasks.filter(s => s && typeof s.text === 'string').map(s => ({ text: s.text, done: !!s.done }))
      : [],
    estimateMin: typeof raw.estimateMin === 'number' && raw.estimateMin > 0 ? raw.estimateMin : null,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    created: typeof raw.created === 'number' && raw.created > 0 ? raw.created : Date.now()
  };
}

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(t => t && isValidUUID(t.id)).map(normalizeTask);
    }
  } catch { /* ignore */ }
  return [];
}

export function saveTasks(tasks) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); } catch (e) { console.error(e); }
}

export function loadExtraWeekends() {
  try {
    var raw = localStorage.getItem(WEEKENDS_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        var thisSat = getThisWeekendSat();
        return parsed.filter(function (w) { return typeof w === 'string' && w >= thisSat; });
      }
    }
  } catch { /* ignore */ }
  return [];
}

export function saveExtraWeekends(weekends) {
  try { localStorage.setItem(WEEKENDS_KEY, JSON.stringify(weekends)); } catch (e) { console.error(e); }
}

// ===== WEEKEND BUDGETS =====

export function loadWeekendBudgets() {
  try {
    var raw = localStorage.getItem(BUDGETS_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return {};
}

export function saveWeekendBudgets(budgets) {
  try { localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)); } catch (e) { console.error(e); }
}

// ===== IMPORT / EXPORT BACKUP =====

export function exportBackup(tasks, extraWeekends, weekendBudgets) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks,
    extraWeekends: extraWeekends,
    weekendBudgets: weekendBudgets
  };
}

export function validateBackup(data) {
  if (!data || typeof data !== 'object') return 'File does not contain valid JSON.';
  if (typeof data.version !== 'number') return 'Missing or invalid version field.';
  if (!Array.isArray(data.tasks)) return 'Missing or invalid tasks array.';
  for (var i = 0; i < data.tasks.length; i++) {
    var t = data.tasks[i];
    if (!t || typeof t !== 'object') return 'Task at index ' + i + ' is not a valid object.';
    if (!isValidUUID(t.id)) return 'Task at index ' + i + ' has an invalid or missing id.';
  }
  if (data.extraWeekends !== undefined && !Array.isArray(data.extraWeekends)) {
    return 'extraWeekends must be an array if present.';
  }
  return null;
}

export function importBackup(data) {
  var tasks = data.tasks.map(normalizeTask);
  var weekends = Array.isArray(data.extraWeekends) ? data.extraWeekends.filter(w => typeof w === 'string') : [];
  var budgets = (data.weekendBudgets && typeof data.weekendBudgets === 'object' && !Array.isArray(data.weekendBudgets)) ? data.weekendBudgets : {};
  saveTasks(tasks);
  saveExtraWeekends(weekends);
  saveWeekendBudgets(budgets);
  return { tasks, extraWeekends: weekends, weekendBudgets: budgets };
}
