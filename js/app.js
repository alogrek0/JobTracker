// ===== MAIN APP: view switching, actions, event wiring =====

import * as state from './state.js';
import { CATEGORIES, saveExtraWeekends, exportBackup, validateBackup, importBackup } from './storage.js';
import { getNextWeekendSat, toDateStr, parseSat } from './weekends.js';
import { renderMiniCals, renderTaskList } from './render-list.js';
import { renderDetail } from './render-detail.js';
import { renderFormCats, renderFormPri, renderFormWeekend, renderFormEstimate, renderFormBudget, renderFormSubs, getWeekendOptionById } from './render-form.js';

// ===== VIEW SWITCHING =====

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function render() {
  renderMiniCals();
  renderTaskList();
  const active = state.tasks.filter(t => !t.done).length;
  document.getElementById('taskCount').innerHTML = `<span>${active}</span> / ${state.tasks.length}`;
}

function showList() {
  state.setStepEditMode(false);
  showView('viewList');
  render();
}

function showDetail(id) {
  state.setCurrentTaskId(id);
  showView('viewDetail');
  if (!renderDetail()) showList();
}

function showForm(id) {
  state.setEditId(id || null);
  state.setFormPri('low');
  state.setFormCat('');
  state.setFormWeekendId(null);
  state.setFormEstimate(null);
  state.setFormSubs([]);
  document.getElementById('fTitle').value = '';
  document.getElementById('fNotes').value = '';

  const isEdit = !!state.editId;

  if (isEdit) {
    const t = state.tasks.find(t => t.id === state.editId);
    if (t) {
      document.getElementById('fTitle').value = t.title;
      state.setFormPri(t.priority);
      state.setFormCat(t.category);
      state.setFormWeekendId(t.weekendId || null);
      state.setFormEstimate(t.estimateMin || null);
      state.setFormSubs((t.subtasks || []).map(s => ({ ...s })));
      document.getElementById('fNotes').value = t.notes || '';
    }
    document.getElementById('formTitle').textContent = 'Edit Task';
  } else {
    document.getElementById('formTitle').textContent = 'New Task';
  }

  document.getElementById('fSubtasksGroup').style.display = isEdit ? 'block' : 'none';
  document.getElementById('fNotesGroup').style.display = isEdit ? 'block' : 'none';
  document.getElementById('fDeleteBtn').style.display = isEdit ? 'block' : 'none';

  renderFormCats();
  renderFormPri();
  renderFormWeekend();
  renderFormEstimate();
  renderFormBudget();
  if (isEdit) renderFormSubs();
  showView('viewForm');
  setTimeout(() => { if (!state.editId) document.getElementById('fTitle').focus(); }, 100);
}

function cancelForm() {
  if (state.editId) {
    showDetail(state.editId);
  } else {
    showList();
  }
}

// ===== ACTIONS =====

function toggleDone(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  // Change #1: if task has subtasks, done is derived — don't allow manual toggle
  if (t.subtasks && t.subtasks.length > 0) return;
  t.done = !t.done;
  state.save();
  render();
}

function addDetailSub(tid) {
  const input = document.getElementById('detailSubInput');
  const text = input.value.trim();
  if (!text) return;
  const t = state.tasks.find(t => t.id === tid);
  if (t) {
    if (!t.subtasks) t.subtasks = [];
    t.subtasks.push({ text, done: false });
    // Change #1: sync parent done from subtasks
    state.syncTaskDoneFromSubtasks(t);
    state.save();
    renderDetail();
    setTimeout(() => document.getElementById('detailSubInput').focus(), 50);
  }
}

function toggleSub(tid, idx) {
  const t = state.tasks.find(t => t.id === tid);
  if (t && t.subtasks[idx]) {
    t.subtasks[idx].done = !t.subtasks[idx].done;
    // Change #1: sync parent done from subtasks
    state.syncTaskDoneFromSubtasks(t);
    state.save();
    renderDetail();
  }
}

function toggleStepEdit() {
  state.setStepEditMode(!state.stepEditMode);
  renderDetail();
}

function startInlineEdit(tid, idx, el) {
  if (el.querySelector('.subtask-inline-input')) return;
  const t = state.tasks.find(t => t.id === tid);
  if (!t || !t.subtasks[idx]) return;
  const span = el.querySelector('.subtask-text');
  const original = t.subtasks[idx].text;
  const input = document.createElement('input');
  input.className = 'subtask-inline-input';
  input.value = original;
  span.replaceWith(input);
  el.classList.remove('edit-mode');
  el.classList.add('editing');
  input.focus();

  let committed = false;
  function commitEdit() {
    if (committed) return;
    committed = true;
    const val = input.value.trim();
    if (val && val !== original) {
      t.subtasks[idx].text = val;
      state.save();
    }
    state.setStepEditMode(false);
    renderDetail();
  }
  function cancelEditInline() {
    if (committed) return;
    committed = true;
    state.setStepEditMode(false);
    renderDetail();
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEditInline(); }
  });
  input.addEventListener('blur', commitEdit);
}

function confirmDelete() {
  document.getElementById('deleteOverlay').classList.add('show');
}
function closeDelete() {
  document.getElementById('deleteOverlay').classList.remove('show');
}
function doDelete() {
  state.setTasks(state.tasks.filter(t => t.id !== state.editId));
  state.save();
  closeDelete();
  showList();
}

// ===== FORM ACTIONS =====

function addFormSub() {
  const input = document.getElementById('fSubInput');
  const text = input.value.trim();
  if (!text) return;
  state.formSubs.push({ text, done: false });
  input.value = '';
  renderFormSubs();
}

function saveTask() {
  const title = document.getElementById('fTitle').value.trim();
  if (!title) { document.getElementById('fTitle').focus(); return; }

  if (state.editId) {
    const t = state.tasks.find(t => t.id === state.editId);
    if (t) {
      t.title = title;
      t.category = state.formCat || 'General Repair';
      t.priority = state.formPri;
      t.weekendId = state.formWeekendId;
      t.estimateMin = state.formEstimate;
      t.subtasks = state.formSubs;
      t.notes = document.getElementById('fNotes').value;
      // Change #1: sync parent done after form save (subtasks may have changed)
      state.syncTaskDoneFromSubtasks(t);
    }
    state.save();
    showDetail(state.editId);
  } else {
    const newId = crypto.randomUUID();
    state.tasks.unshift({
      id: newId,
      title,
      category: state.formCat || 'General Repair',
      priority: state.formPri,
      weekendId: state.formWeekendId,
      estimateMin: state.formEstimate,
      done: false,
      subtasks: [],
      notes: '',
      created: Date.now()
    });
    state.save();
    showList();
  }
}

function addWeekend() {
  var options = [];
  // Rebuild options to find next available
  var existing = new Set();
  state.tasks.forEach(t => { if (t.weekendId) existing.add(t.weekendId); });
  state.extraWeekends.forEach(w => existing.add(w));
  var d = parseSat(getNextWeekendSat());
  d.setDate(d.getDate() + 7);
  while (existing.has(toDateStr(d))) d.setDate(d.getDate() + 7);
  var newId = toDateStr(d);
  state.extraWeekends.push(newId);
  state.saveWeekends();
  state.setFormWeekendId(newId);
  renderFormWeekend();
}

// ===== IMPORT / EXPORT (Change #5) =====

function doExport() {
  const data = exportBackup(state.tasks, state.extraWeekends, state.weekendBudgets);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'home-tasks-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function doImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', function () {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch {
        alert('Could not parse file. Make sure it is valid JSON.');
        return;
      }
      const err = validateBackup(data);
      if (err) {
        alert('Invalid backup file: ' + err);
        return;
      }
      if (!confirm('This will replace all current tasks and weekends. Continue?')) return;
      const result = importBackup(data);
      state.setTasks(result.tasks);
      state.setExtraWeekends(result.extraWeekends);
      state.setWeekendBudgets(result.weekendBudgets);
      showList();
    };
    reader.readAsText(file);
  });
  input.click();
}

// ===== EVENT WIRING =====

document.getElementById('fabAdd').addEventListener('click', function () { showForm(); });
document.getElementById('formBackBtn').addEventListener('click', cancelForm);
document.getElementById('fSubInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addFormSub();
});
document.getElementById('formAddSubBtn').addEventListener('click', addFormSub);
document.getElementById('saveBtn').addEventListener('click', saveTask);
document.getElementById('fDeleteBtn').addEventListener('click', confirmDelete);
document.getElementById('dialogCancelBtn').addEventListener('click', closeDelete);
document.getElementById('dialogConfirmBtn').addEventListener('click', doDelete);

// Priority options delegation
document.getElementById('priOptions').addEventListener('click', function (e) {
  var btn = e.target.closest('.pri-option');
  if (btn && btn.dataset.p) {
    state.setFormPri(btn.dataset.p);
    renderFormPri();
  }
});

// Category grid delegation
document.getElementById('fCatGrid').addEventListener('click', function (e) {
  var btn = e.target.closest('[data-cat-idx]');
  if (btn) {
    state.setFormCat(CATEGORIES[parseInt(btn.dataset.catIdx)]);
    renderFormCats();
  }
});

// Weekend grid delegation
document.getElementById('fWeekendGrid').addEventListener('click', function (e) {
  var btn = e.target.closest('[data-weekend-idx]');
  if (btn) {
    var opt = getWeekendOptionById(parseInt(btn.dataset.weekendIdx));
    if (opt) {
      state.setFormWeekendId(opt.id);
      renderFormWeekend();
      renderFormEstimate();
      renderFormBudget();
    }
    return;
  }
  if (e.target.closest('[data-action="add-weekend"]')) { addWeekend(); renderFormEstimate(); renderFormBudget(); return; }
});

// Estimate grid delegation
document.getElementById('fEstimateGrid').addEventListener('click', function (e) {
  var btn = e.target.closest('[data-est-min]');
  if (btn) {
    var val = parseInt(btn.dataset.estMin);
    state.setFormEstimate(val > 0 ? val : null);
    renderFormEstimate();
  }
});

// Budget grid delegation
document.getElementById('fBudgetGrid').addEventListener('click', function (e) {
  var btn = e.target.closest('[data-budget-min]');
  if (btn) {
    var val = parseInt(btn.dataset.budgetMin);
    state.setWeekendBudget(state.formWeekendId, val > 0 ? val : null);
    renderFormBudget();
  }
});

// Main list view delegation
document.getElementById('viewList').addEventListener('click', function (e) {
  var check = e.target.closest('[data-action="toggle-done"]');
  if (check) { e.stopPropagation(); toggleDone(check.dataset.id); return; }
  var info = e.target.closest('[data-action="show-detail"]');
  if (info) { showDetail(info.dataset.id); return; }
});

// Detail view delegation
document.getElementById('viewDetail').addEventListener('click', function (e) {
  if (e.target.closest('[data-action="back-to-list"]')) { showList(); return; }
  if (e.target.closest('[data-action="toggle-step-edit"]')) { toggleStepEdit(); return; }
  var formBtn = e.target.closest('[data-action="show-form"]');
  if (formBtn) { showForm(formBtn.dataset.id); return; }
  var sub = e.target.closest('.subtask-item[data-sub-idx]');
  if (sub) {
    var tid = sub.dataset.taskId;
    var idx = parseInt(sub.dataset.subIdx);
    if (state.stepEditMode) startInlineEdit(tid, idx, sub);
    else toggleSub(tid, idx);
    return;
  }
  var addSub = e.target.closest('[data-action="add-detail-sub"]');
  if (addSub) { addDetailSub(addSub.dataset.taskId); return; }
  var markDone = e.target.closest('[data-action="mark-done"]');
  if (markDone) { toggleDone(markDone.dataset.id); renderDetail(); return; }
});
document.getElementById('viewDetail').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.id === 'detailSubInput') {
    addDetailSub(e.target.dataset.taskId);
  }
});

// Backup buttons
document.getElementById('exportBtn').addEventListener('click', doExport);
document.getElementById('importBtn').addEventListener('click', doImport);

// ===== INIT =====
state.load();
render();
