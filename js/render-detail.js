// ===== RENDERING: DETAIL VIEW =====

import { tasks, currentTaskId, stepEditMode } from './state.js';
import { esc, catLabel, formatMinutes } from './utils.js';
import { getWeekendLabel } from './weekends.js';

export function renderDetail() {
  const t = tasks.find(t => t.id === currentTaskId);
  if (!t) return false;

  const priBadgeClass = t.priority === 'high' ? 'badge-priority-high' : t.priority === 'med' ? 'badge-priority-med' : 'badge-priority-low';

  document.getElementById('detailNav').innerHTML = `
    <button class="back-btn" data-action="back-to-list" type="button">\u2190 Back</button>
    <div class="detail-badges">
      <span class="badge badge-cat">${catLabel(t.category || 'Uncategorized', 'badge')}</span>
      <span class="badge ${priBadgeClass}">${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
      ${t.weekendId ? '<span class="badge badge-weekend">' + getWeekendLabel(t.weekendId) + '</span>' : ''}
      ${t.estimateMin ? '<span class="badge badge-estimate">' + formatMinutes(t.estimateMin) + '</span>' : ''}
    </div>
    <div style="display:flex;gap:6px;align-items:center">
      <button class="step-edit-btn ${stepEditMode ? 'active' : ''}" data-action="toggle-step-edit" type="button">Edit</button>
      <button class="edit-btn" data-action="show-form" data-id="${t.id}" aria-label="Settings" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
    </div>
  `;

  const hasSubtasks = (t.subtasks || []).length > 0;
  const hasNotes = t.notes && t.notes.trim().length > 0;

  // Change #1: if task has subtasks, show derived status instead of manual toggle
  const hasSubtasksDerived = hasSubtasks;
  const doneLabel = hasSubtasksDerived
    ? (t.done ? '\u2713 All Steps Complete' : 'Complete all steps to finish')
    : (t.done ? '\u21A9 Mark Active' : '\u2713 Mark Done');

  document.getElementById('detailContent').innerHTML = `
    <div class="job-title">${esc(t.title)}</div>

    <div class="detail-section">
      <div class="detail-section-label">Steps</div>
      ${hasSubtasks ? `
        <div class="subtask-list" role="list">
          ${(t.subtasks || []).map((s, i) => `
            <button class="subtask-item ${s.done ? 'done' : ''} ${stepEditMode ? 'edit-mode' : ''}" data-task-id="${t.id}" data-sub-idx="${i}" type="button" role="listitem" aria-label="${esc(s.text)}, ${s.done ? 'done' : 'not done'}">
              <span class="subtask-check ${s.done ? 'checked' : ''}" aria-hidden="true"></span>
              <span class="subtask-text">${esc(s.text)}</span>
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div class="add-subtask-row">
        <input id="detailSubInput" placeholder="Add a step\u2026" data-task-id="${t.id}">
        <button class="add-subtask-btn" data-action="add-detail-sub" data-task-id="${t.id}" type="button">+</button>
      </div>
    </div>

    ${hasNotes ? `
      <div class="detail-section">
        <div class="detail-section-label">Notes</div>
        <div class="notes-readonly">${esc(t.notes)}</div>
      </div>
    ` : ''}

    <button class="mark-done-btn" data-action="mark-done" data-id="${t.id}" type="button" ${hasSubtasksDerived ? 'disabled style="opacity:0.5;cursor:default"' : ''}>
      ${doneLabel}
    </button>
  `;

  return true;
}
