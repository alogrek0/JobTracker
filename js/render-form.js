// ===== RENDERING: ADD/EDIT FORM =====

import * as state from './state.js';
import { catLabel, ESTIMATE_OPTIONS, BUDGET_OPTIONS, formatMinutes } from './utils.js';
import { CATEGORIES } from './storage.js';
import { getThisWeekendSat, getNextWeekendSat, formatWeekendRange } from './weekends.js';

var _weekendOptions = [];

export function renderFormCats() {
  document.getElementById('fCatGrid').innerHTML = CATEGORIES.map((c, i) =>
    `<button class="cat-option ${state.formCat === c ? 'selected' : ''}" data-cat-idx="${i}" type="button">${catLabel(c, 'form')}</button>`
  ).join('');
}

export function renderFormPri() {
  document.querySelectorAll('.pri-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.p === state.formPri);
  });
}

function getWeekendOptions() {
  var thisSat = getThisWeekendSat();
  var nextSat = getNextWeekendSat();
  var options = [
    { id: null, label: 'None' },
    { id: thisSat, label: 'This Weekend' },
    { id: nextSat, label: 'Next Weekend' }
  ];
  var seen = new Set([thisSat, nextSat]);
  state.extraWeekends.slice().sort().forEach(function (w) {
    if (!seen.has(w)) { options.push({ id: w, label: formatWeekendRange(w) }); seen.add(w); }
  });
  state.tasks.forEach(function (t) {
    if (t.weekendId && !seen.has(t.weekendId)) {
      options.push({ id: t.weekendId, label: formatWeekendRange(t.weekendId) });
      seen.add(t.weekendId);
    }
  });
  return options;
}

export function renderFormWeekend() {
  _weekendOptions = getWeekendOptions();
  document.getElementById('fWeekendGrid').innerHTML = _weekendOptions.map(function (o, i) {
    return '<button class="cat-option' + (state.formWeekendId === o.id ? ' selected' : '') + '" data-weekend-idx="' + i + '" type="button">' + o.label + '</button>';
  }).join('') + '<button class="cat-option" data-action="add-weekend" type="button">+ Add</button>';
}

export function getWeekendOptionById(idx) {
  return _weekendOptions[idx];
}

export function renderFormEstimate() {
  var group = document.getElementById('fEstimateGroup');
  // Only show estimate picker when a weekend is selected
  if (!state.formWeekendId) {
    group.style.display = 'none';
    return;
  }
  group.style.display = 'block';
  var grid = document.getElementById('fEstimateGrid');
  grid.innerHTML = '<button class="cat-option' + (state.formEstimate == null ? ' selected' : '') + '" data-est-min="0" type="button">None</button>' +
    ESTIMATE_OPTIONS.map(function (o) {
      return '<button class="cat-option' + (state.formEstimate === o.min ? ' selected' : '') + '" data-est-min="' + o.min + '" type="button">' + o.label + '</button>';
    }).join('');
}

export function renderFormBudget() {
  var group = document.getElementById('fBudgetGroup');
  if (!state.formWeekendId) {
    group.style.display = 'none';
    return;
  }
  group.style.display = 'block';
  var currentBudget = state.getWeekendBudget(state.formWeekendId);
  var grid = document.getElementById('fBudgetGrid');
  grid.innerHTML = '<button class="cat-option' + (currentBudget == null ? ' selected' : '') + '" data-budget-min="0" type="button">No limit</button>' +
    BUDGET_OPTIONS.map(function (o) {
      return '<button class="cat-option' + (currentBudget === o.min ? ' selected' : '') + '" data-budget-min="' + o.min + '" type="button">' + o.label + '</button>';
    }).join('');

  // Show current planned summary
  var planned = state.getWeekendPlanned(state.formWeekendId);
  var summaryEl = document.getElementById('fBudgetSummary');
  if (currentBudget && planned > 0) {
    var remaining = currentBudget - planned;
    var cls = remaining < 0 ? 'budget-over' : 'budget-ok';
    summaryEl.innerHTML = '<span class="' + cls + '">Planned: ' + formatMinutes(planned) + ' / ' + formatMinutes(currentBudget) + '</span>';
    summaryEl.style.display = 'block';
  } else {
    summaryEl.style.display = 'none';
  }
}

export function renderFormSubs() {
  const container = document.getElementById('fSubtaskList');
  container.innerHTML = '';
  state.formSubs.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'subtask-item';
    row.style.cssText = 'background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:4px;padding:10px 14px;';

    const input = document.createElement('input');
    input.className = 'subtask-edit';
    input.value = s.text;
    input.style.cssText = 'flex:1;background:transparent;border:none;color:var(--text);font-size:14px;outline:none;';
    input.addEventListener('change', function () { state.formSubs[i].text = this.value; });

    const del = document.createElement('button');
    del.className = 'subtask-del';
    del.textContent = '\u2715';
    del.type = 'button';
    del.setAttribute('aria-label', 'Remove step');
    del.addEventListener('click', function () {
      state.formSubs.splice(i, 1);
      renderFormSubs();
    });

    row.appendChild(input);
    row.appendChild(del);
    container.appendChild(row);
  });
}
