// ===== GENERIC HELPERS =====

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}

const INSULATION_ICON = '<svg viewBox="0 0 24 24" width="20" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle"><rect x="3" y="4" width="18" height="3.5" rx="1.5" fill="#E8A4B8" opacity="0.9"/><rect x="3" y="10.25" width="18" height="3.5" rx="1.5" fill="#E8A4B8" opacity="0.55"/><rect x="3" y="16.5" width="18" height="3.5" rx="1.5" fill="#E8A4B8" opacity="0.25"/></svg>';

export function formatMinutes(m) {
  if (m == null || m <= 0) return '';
  if (m < 60) return m + 'm';
  var h = Math.floor(m / 60);
  var r = m % 60;
  return r > 0 ? h + 'h ' + r + 'm' : h + 'h';
}

export const ESTIMATE_OPTIONS = [
  { min: 15, label: '15 min' },
  { min: 30, label: '30 min' },
  { min: 45, label: '45 min' },
  { min: 60, label: '60 min' },
  { min: 90, label: '90 min' },
  { min: 120, label: '2 hr' },
  { min: 150, label: '2.5 hr' },
  { min: 180, label: '3 hr' },
  { min: 240, label: '4 hr' }
];

export const BUDGET_OPTIONS = [
  { min: 120, label: '2 hr' },
  { min: 180, label: '3 hr' },
  { min: 240, label: '4 hr' },
  { min: 300, label: '5 hr' },
  { min: 360, label: '6 hr' },
  { min: 480, label: '8 hr' },
  { min: 600, label: '10 hr' },
  { min: 720, label: '12 hr' }
];

export function catLabel(c, mode) {
  if (c !== 'Insulation') return mode === 'form' ? c : esc(c);
  return mode === 'form' ? INSULATION_ICON + ' Insulation' : INSULATION_ICON + ' <span style="font-size:0.9em">Ins.</span>';
}
