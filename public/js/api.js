// Shared helpers used by every section
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const list = x => (Array.isArray(x) ? x : []);

export async function api(path, body, method = 'POST') {
  const opts = body
    ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' }
    : { credentials: 'same-origin' };
  let res;
  try {
    res = await fetch(path, opts);
  } catch {
    throw new Error('Could not reach the AmmaCare server. Check that it is running (npm start).');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.needLogin) window.dispatchEvent(new CustomEvent('needlogin'));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function loading(el, message) {
  el.innerHTML = `<div class="loader"><div class="dots"><i></i><i></i><i></i></div><p>${esc(message)}</p></div>`;
}

export function showError(el, err) {
  const msg = err.message || String(err);
  const aiProblem = /gemini|api key|quota/i.test(msg);
  el.innerHTML = `<div class="alert alert-error">
    <strong>${aiProblem ? 'The AI could not answer' : 'Something went wrong'}</strong>
    ${esc(msg)}
    ${aiProblem ? '<br><small>To preview the layout without a working key, set DEMO_MODE=true in your .env file and restart the server.</small>' : ''}
  </div>`;
}

export function fmtNum(n, small = false) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (small) {
    if (v === 0) return '0';
    if (Math.abs(v) >= 1) return v.toFixed(2);
    if (Math.abs(v) >= 0.01) return v.toFixed(3);
    return v.toFixed(4);
  }
  return Math.abs(v) >= 10 ? Math.round(v).toLocaleString() : String(Math.round(v * 10) / 10);
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso)) / 1000));
  const steps = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [sec, name] of steps) {
    const n = Math.floor(s / sec);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}
