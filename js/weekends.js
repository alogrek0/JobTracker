// ===== WEEKEND / DATE HELPERS =====

export function toDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function parseSat(s) {
  return new Date(s + 'T00:00:00');
}

export function getThisWeekendSat() {
  var d = new Date();
  var day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 1);
  else if (day !== 6) d.setDate(d.getDate() + (6 - day));
  return toDateStr(d);
}

export function getNextWeekendSat() {
  var d = parseSat(getThisWeekendSat());
  d.setDate(d.getDate() + 7);
  return toDateStr(d);
}

export function formatWeekendRange(satStr) {
  var sat = parseSat(satStr);
  var sun = new Date(sat); sun.setDate(sun.getDate() + 1);
  var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (sat.getMonth() === sun.getMonth()) return m[sat.getMonth()] + ' ' + sat.getDate() + '\u2013' + sun.getDate();
  return m[sat.getMonth()] + ' ' + sat.getDate() + '\u2013' + m[sun.getMonth()] + ' ' + sun.getDate();
}

export function getWeekendLabel(satStr, short) {
  if (satStr === getThisWeekendSat()) return short ? 'This Weekend' : '\u26A1 This Weekend';
  if (satStr === getNextWeekendSat()) return short ? 'Next Weekend' : '\uD83D\uDCC5 Next Weekend';
  return formatWeekendRange(satStr);
}
