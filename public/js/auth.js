// Sign in / create account, and who is signed in right now.
import { $, $$, api, esc } from './api.js';
import { getProfile, setProfile } from './state.js';

let user = null;
let mode = 'login';

export const getUser = () => user;
export const isMember = () => Boolean(user);

function announce() {
  window.dispatchEvent(new CustomEvent('authchange', { detail: user }));
}

// Keep the browser's copy of the tracker in step with the account
async function syncTracker() {
  const p = getProfile();
  if (!user) {
    // Guests do not get a tracker, and nothing personal is left on a shared device
    if (p.days || p.savedOn) {
      const { days, savedOn, ...rest } = p;
      setProfile(rest);
    }
    return;
  }
  if (user.tracker) {
    setProfile({ ...p, days: user.tracker.days, savedOn: user.tracker.savedOn });
  } else if (p.days && p.savedOn) {
    // First sign-in on a device that already had a tracker: keep it in the account
    try {
      user = (await api('/api/me/tracker', { days: p.days, savedOn: p.savedOn }, 'PUT')).user;
    } catch { /* not critical */ }
  } else {
    setProfile({ ...p });
  }
}

export async function loadSession() {
  try {
    user = (await api('/api/auth/me')).user;
  } catch {
    user = null;
  }
  await syncTracker();
  renderAccount();
  announce();
}

export async function saveTracker(days, savedOn) {
  user = (await api('/api/me/tracker', { days, savedOn }, 'PUT')).user;
}

async function signOut() {
  try { await api('/api/auth/logout', {}); } catch { /* ignore */ }
  user = null;
  await syncTracker();
  renderAccount();
  announce();
}

// ---------- header button ----------
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

function renderAccount() {
  const area = $('#accountArea');
  if (!user) {
    area.innerHTML = '<button type="button" class="btn btn-primary btn-small" data-auth="login">Sign in</button>';
    return;
  }
  area.innerHTML = `
    <button type="button" class="account-btn" aria-haspopup="true" aria-expanded="false" id="accountBtn">
      <span class="avatar small" aria-hidden="true">${esc(initials(user.name))}</span>
      <span class="account-name">${esc(user.name.split(' ')[0])}</span>
    </button>
    <div class="account-menu hidden" id="accountMenu" role="menu">
      <strong>${esc(user.name)}</strong>
      <span>${esc(user.email)}</span>
      <hr>
      <a href="#tracker" role="menuitem">My tracker</a>
      <button type="button" role="menuitem" id="signOutBtn">Sign out</button>
    </div>`;
}

// ---------- the sign-in window ----------
function setMode(next) {
  mode = next;
  const d = $('#authDialog');
  $$('[data-auth-tab]', d).forEach(b => b.classList.toggle('active', b.dataset.authTab === mode));
  $('#authTitle').textContent = mode === 'login' ? 'Welcome back' : 'Create your account';
  $('#authNameField').classList.toggle('hidden', mode === 'login');
  $('#authName').required = mode === 'register';
  $('#authPassword').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#authSubmit').textContent = mode === 'login' ? 'Sign in' : 'Create account';
  $('#authPasswordHint').classList.toggle('hidden', mode === 'login');
  $('#authError').innerHTML = '';
}

export function openAuth(nextMode = 'login', reason = '') {
  setMode(nextMode);
  $('#authReason').textContent = reason;
  $('#authReason').classList.toggle('hidden', !reason);
  const d = $('#authDialog');
  if (!d.open) d.showModal();
  (nextMode === 'register' ? $('#authName') : $('#authEmail')).focus();
}

export function initAuth() {
  const d = $('#authDialog');

  $$('[data-auth-tab]', d).forEach(b => b.addEventListener('click', () => setMode(b.dataset.authTab)));
  d.querySelector('.dialog-close').addEventListener('click', () => d.close());
  $('#authGuest').addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) d.close(); });

  $('#authShow').addEventListener('change', e => { $('#authPassword').type = e.target.checked ? 'text' : 'password'; });

  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#authSubmit');
    const errBox = $('#authError');
    errBox.innerHTML = '';
    btn.disabled = true;
    try {
      const body = { email: $('#authEmail').value, password: $('#authPassword').value };
      if (mode === 'register') body.name = $('#authName').value;
      user = (await api(mode === 'login' ? '/api/auth/login' : '/api/auth/register', body)).user;
      $('#authForm').reset();
      $('#authPassword').type = 'password';
      d.close();
      await syncTracker();
      renderAccount();
      announce();
    } catch (err) {
      errBox.innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  });

  // Any button or link with data-auth="login" or data-auth="register" opens the window
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-auth]');
    if (trigger) {
      e.preventDefault();
      openAuth(trigger.dataset.auth, trigger.dataset.reason || '');
      return;
    }
    const accountBtn = e.target.closest('#accountBtn');
    const menu = $('#accountMenu');
    if (accountBtn && menu) {
      const open = menu.classList.toggle('hidden') === false;
      accountBtn.setAttribute('aria-expanded', String(open));
      return;
    }
    if (e.target.closest('#signOutBtn')) { signOut(); return; }
    if (menu && !e.target.closest('#accountMenu')) menu.classList.add('hidden');
  });

  // The server says a feature needs an account (for example the session expired)
  window.addEventListener('needlogin', () => {
    user = null;
    renderAccount();
    announce();
    openAuth('login', 'Please sign in to continue.');
  });
}
