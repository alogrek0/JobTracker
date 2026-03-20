// ===== RENDERING: MAIN LIST VIEW =====

import * as state from './state.js';
import { esc, catLabel, formatMinutes } from './utils.js';
import { toDateStr, getWeekendLabel } from './weekends.js';

export function renderMiniCals() {
  var now = new Date();
  var todayStr = toDateStr(now);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var container = document.getElementById('miniCals');
  var html = '';

  for (var m = 0; m < 2; m++) {
    var d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    var firstDay = (d.getDay() + 6) % 7;
    var daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    html += '<div class="mini-cal"><div class="mini-cal-month">' + months[d.getMonth()].toUpperCase() + '</div>';
    html += '<table><thead><tr>';
    for (var i = 0; i < 7; i++) html += '<th>' + dow[i] + '</th>';
    html += '</tr></thead><tbody><tr>';

    for (var blank = 0; blank < firstDay; blank++) html += '<td></td>';

    for (var day = 1; day <= daysInMonth; day++) {
      var dd = new Date(d.getFullYear(), d.getMonth(), day);
      var dayOfWeek = dd.getDay();
      var col = (firstDay + day - 1) % 7;
      var isToday = toDateStr(dd) === todayStr;
      var isWknd = dayOfWeek === 0 || dayOfWeek === 6;
      var cls = isToday ? ' class="today"' : isWknd ? ' class="wknd"' : '';
      html += '<td' + cls + '>' + day + '</td>';
      if (col === 6 && day < daysInMonth) html += '</tr><tr>';
    }
    html += '</tr></tbody></table></div>';
  }

  container.innerHTML = html;
}

function cardHtml(t, budget) {
  const subDone = (t.subtasks || []).filter(s => s.done).length;
  const subTotal = (t.subtasks || []).length;
  const subStr = subTotal > 0 ? `<span class="task-subtask-count"><span>${subDone}</span>/${subTotal}</span>` : '';
  const estStr = t.estimateMin ? `<span class="task-estimate">${formatMinutes(t.estimateMin)}</span>` : '';

  // Large-task warning: task uses >50% of budget
  const isLarge = budget && t.estimateMin && (t.estimateMin / budget) > 0.5;
  const largeStr = isLarge ? '<span class="task-large-warn" title="This task uses over half the weekend budget">big task</span>' : '';

  const stretchClass = t.stretch ? ' stretch' : '';

  return `
    <div class="task-card ${t.done ? 'done' : ''}${stretchClass}" style="animation-delay:${Math.random() * 50}ms">
      <button class="task-check ${t.done ? 'checked' : ''}" data-action="toggle-done" data-id="${t.id}" aria-label="${t.done ? 'Mark active' : 'Mark done'}" type="button"></button>
      <button class="task-info" data-action="show-detail" data-id="${t.id}" type="button">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          <span class="task-cat-badge">${catLabel(t.category || 'Uncategorized', 'badge')}</span>
          ${subStr}
          ${estStr}
          ${largeStr}
        </div>
      </button>
      <div class="task-priority-bar ${t.priority}"></div>
    </div>
  `;
}

function weekendBudgetHtml(wid, taskGroup) {
  var budget = state.getWeekendBudget(wid);
  var planned = { committed: 0, stretch: 0, total: 0 };
  taskGroup.forEach(function (t) {
    if (t.estimateMin) {
      if (t.stretch) planned.stretch += t.estimateMin;
      else planned.committed += t.estimateMin;
      planned.total += t.estimateMin;
    }
  });
  if (!budget && !planned.total) return '';

  var html = '<div class="weekend-budget-summary">';

  if (budget) {
    var remaining = budget - planned.committed;
    var overClass = remaining < 0 ? ' budget-over' : '';

    // Main line: committed vs budget
    html += `<span class="budget-bar${overClass}">${planned.committed > 0 ? formatMinutes(planned.committed) : '0m'} / ${formatMinutes(budget)}</span>`;

    if (remaining < 0) {
      html += `<span class="budget-remaining budget-over">\u2212${formatMinutes(-remaining)} over</span>`;
    } else if (remaining > 0 && planned.committed > 0) {
      html += `<span class="budget-remaining">${formatMinutes(remaining)} left</span>`;
    }

    // Stretch add-on
    if (planned.stretch > 0) {
      html += `<span class="budget-stretch">+${formatMinutes(planned.stretch)} stretch</span>`;
    }

    // Overload warning
    if (remaining < 0) {
      html += '</div><div class="weekend-overload-warn">This weekend is overfilled \u2014 consider moving or trimming tasks</div>';
      return html;
    }
  } else if (planned.total > 0) {
    html += `<span class="budget-bar">${formatMinutes(planned.total)} planned</span>`;
  }

  html += '</div>';
  return html;
}

export function renderTaskList() {
  const priWeight = { high: 0, med: 1, low: 2 };
  const sortFn = (a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (priWeight[a.priority] !== priWeight[b.priority]) return priWeight[a.priority] - priWeight[b.priority];
    return b.created - a.created;
  };

  const weekendGroups = {};
  const otherTasks = [];
  state.tasks.forEach(function (t) {
    if (t.weekendId && !t.done) {
      if (!weekendGroups[t.weekendId]) weekendGroups[t.weekendId] = [];
      weekendGroups[t.weekendId].push(t);
    } else {
      otherTasks.push(t);
    }
  });

  const sortedWeekendIds = Object.keys(weekendGroups).sort();

  const ws = document.getElementById('weekendSection');
  let wsHtml = '';
  sortedWeekendIds.forEach(function (wid) {
    var group = weekendGroups[wid];
    var budget = state.getWeekendBudget(wid);

    // Split into committed and stretch
    var committed = group.filter(t => !t.stretch);
    var stretch = group.filter(t => t.stretch);
    committed.sort(sortFn);
    stretch.sort(sortFn);

    wsHtml += `
      <div class="section-label">${getWeekendLabel(wid)}</div>
      ${weekendBudgetHtml(wid, group)}
      <div class="task-list" style="margin-bottom:${stretch.length > 0 ? '8' : '20'}px">${committed.map(t => cardHtml(t, budget)).join('')}</div>
    `;

    if (stretch.length > 0) {
      wsHtml += `
        <div class="stretch-label">If time allows</div>
        <div class="task-list" style="margin-bottom:24px">${stretch.map(t => cardHtml(t, budget)).join('')}</div>
      `;
    }
  });
  ws.innerHTML = wsHtml;

  const hasWeekendSections = sortedWeekendIds.length > 0;
  otherTasks.sort(sortFn);
  const al = document.getElementById('allLabel');
  al.style.display = (hasWeekendSections && otherTasks.length > 0) ? 'flex' : 'none';
  al.innerHTML = 'Everything Else<span></span>';
  al.className = 'section-label';

  const tl = document.getElementById('taskList');
  if (otherTasks.length === 0 && sortedWeekendIds.length === 0) {
    tl.innerHTML = `<div class="empty"><div class="empty-icon">\uD83C\uDFE0</div><p>No tasks yet \u2014 tap + to add one</p></div>`;
  } else {
    tl.innerHTML = otherTasks.map(t => cardHtml(t, null)).join('');
  }
}
