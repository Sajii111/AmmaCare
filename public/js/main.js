import { $, $$, esc, api } from './api.js';
import { getProfile, setProfile, stageInfo, ordinal } from './state.js';
import { initTracker, sizeFor } from './tracker.js';
import { initFood, renderStageNotes } from './food.js';
import { initSymptoms } from './symptoms.js';
import { initArticles } from './articles.js';
import { initCommunity } from './community.js';
import { initAuth, loadSession, isMember } from './auth.js';

const PAGES = {
  home: null,
  tracker: initTracker,
  food: initFood,
  nutrition: initFood,
  symptoms: initSymptoms,
  articles: initArticles,
  community: initCommunity
};

function route() {
  const name = location.hash.slice(1);
  const page = name in PAGES ? name : 'home';
  $$('.page').forEach(s => s.classList.toggle('active', s.dataset.page === page));
  $$('.nav a').forEach(a => {
    const on = a.dataset.page === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  PAGES[page]?.();
  document.body.classList.remove('nav-open');
  $('.nav-toggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0 });
}

function renderProfileBar() {
  const p = getProfile();
  const s = stageInfo();
  $$('[data-role=who] button').forEach(b => b.classList.toggle('active', b.dataset.who === (p.who || 'mother')));
  $('.child-age').classList.toggle('hidden', p.who !== 'child');
  if (p.who === 'child') $('#childAge').value = p.childAgeMonths ?? 24;
  const chip = $('#contextChip');
  chip.textContent = s.who === 'mother' && !isMember() ? 'Guest' : s.label;
  chip.href = s.who === 'child' ? '#food' : '#tracker';
  renderStageNotes();
  renderHomeGlance(s);
}

function renderHomeGlance(s) {
  const box = $('#homeGlance');
  if (s.who === 'mother' && !isMember()) {
    const C = 2 * Math.PI * 92;
    box.innerHTML = `
      <div class="stage3d" aria-hidden="true">
        <div class="stage3d-inner">
          <div class="layer layer-back"></div>
          <svg class="layer layer-ring" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="92" class="r-bg"/>
            <circle cx="110" cy="110" r="92" class="r-fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * 0.5}"/>
          </svg>
          <svg class="layer layer-lotus" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="pA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3A58F"/><stop offset="1" stop-color="#A8432A"/></linearGradient>
              <linearGradient id="pB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3CDBF"/><stop offset="1" stop-color="#D98A72"/></linearGradient>
              <radialGradient id="pGlow"><stop offset="0" stop-color="#FFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFF" stop-opacity="0"/></radialGradient>
            </defs>
            <circle cx="100" cy="112" r="70" fill="url(#pGlow)"/>
            ${[-64, 64, -34, 34, 0].map((r, i) => `<path d="M100 140 C72 100 80 52 100 26 C120 52 128 100 100 140Z" fill="url(#${i < 2 ? 'pB' : 'pA'})" transform="rotate(${r} 100 140)"/>`).join('')}
            <path d="M52 150 Q100 176 148 150" stroke="#4F6B44" stroke-width="7" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="layer leaf leaf-1"></span>
          <span class="layer leaf leaf-2"></span>
          <span class="layer leaf leaf-3"></span>
          <div class="layer layer-badge">
            <strong>Week 20</strong>
            <span>about the size of a banana</span>
          </div>
        </div>
      </div>
      <span class="mono-label accent">Members preview</span>
      <h3 class="glance-title">Watch your baby grow, week by week</h3>
      <ul class="perk-list">
        <li><b>1</b>Your week, due date and baby's size</li>
        <li><b>2</b>An AI activity plan for every week</li>
        <li><b>3</b>Saved safely, on any phone or computer</li>
      </ul>
      <div class="gate-actions center">
        <button type="button" class="btn btn-primary" data-auth="register" data-reason="Create a free account to use the trimester tracker.">Create free account</button>
        <button type="button" class="btn btn-outline" data-auth="login">Sign in</button>
      </div>
      <p class="fine-print">Food check, Nutrition, Symptoms and Articles stay free for guests.</p>`;
    enableTilt(box.querySelector('.stage3d'));
  } else if (s.who === 'mother' && s.info) {
    const i = s.info;
    const size = sizeFor(i.week);
    const C = 2 * Math.PI * 80;
    box.innerHTML = `
      <span class="mono-label">Today you are in</span>
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 190 190" aria-hidden="true">
          <circle class="ring-bg" cx="95" cy="95" r="80"/>
          <circle class="ring-fg" cx="95" cy="95" r="80" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - i.progress / 100)}"/>
        </svg>
        <div class="ring-label"><strong>Week ${i.week}</strong><span>${ordinal(i.trimester)} trimester</span></div>
      </div>
      <p class="glance-size">${size ? `About the size of ${esc(size[1])}` : 'Your journey has just begun'}</p>
      <p class="muted">${i.daysLeft >= 0 ? `${i.daysLeft} days to your due date` : 'Past your due date'}</p>
      <a class="btn btn-outline btn-small" href="#tracker">Open my tracker</a>`;
  } else if (s.who === 'child') {
    box.innerHTML = `
      <span class="mono-label">Caring for your little one</span>
      <p class="glance-size">${esc(s.label.replace('Child, ', ''))}</p>
      <p class="muted">Food checks and nutrition advice are now tailored to your child's age.</p>
      <a class="btn btn-outline btn-small" href="#food">Check a food</a>`;
  } else {
    box.innerHTML = `
      <span class="mono-label">How far along are you?</span>
      <p class="glance-size">Add your days to see your week, due date and baby's size.</p>
      <a class="btn btn-primary btn-small" href="#tracker">Set up my tracker</a>`;
  }
}

// Gentle 3D tilt that follows the mouse (or stays still for reduced motion)
function enableTilt(stage) {
  if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const inner = stage.querySelector('.stage3d-inner');
  requestAnimationFrame(() => stage.classList.add('ready'));
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
  });
  stage.addEventListener('pointerleave', () => { inner.style.transform = ''; });
}

// ----- events -----
$$('[data-role=who] button').forEach(btn => btn.addEventListener('click', () => {
  setProfile({ ...getProfile(), who: btn.dataset.who });
}));

$('#childAge').addEventListener('change', e => {
  const m = Math.max(0, Math.min(72, parseInt(e.target.value, 10) || 0));
  setProfile({ ...getProfile(), childAgeMonths: m });
});

$('.nav-toggle').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  $('.nav-toggle').setAttribute('aria-expanded', String(open));
});

window.addEventListener('profilechange', renderProfileBar);
window.addEventListener('authchange', renderProfileBar);
window.addEventListener('hashchange', route);

// Intro animation: remember it was shown, allow skipping, then remove it
const intro = document.getElementById('intro');
if (intro) {
  document.body.classList.add('intro-on');
  try { sessionStorage.setItem('ammacare.introSeen', '1'); } catch { /* ignore */ }
  const finish = () => { document.body.classList.remove('intro-on'); intro.remove(); };
  const skip = () => { intro.classList.add('leaving'); setTimeout(finish, 500); };
  $('#introSkip').addEventListener('click', skip);
  intro.addEventListener('click', e => { if (e.target === intro) skip(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.contains(intro)) skip(); }, { once: true });
  intro.addEventListener('animationend', e => { if (e.target === intro) finish(); });
}

initAuth();
renderProfileBar();
route();
loadSession();

// Show a banner when the server runs in demo mode
api('/api/health').then(h => $('#demoBanner').classList.toggle('hidden', !h.demoMode)).catch(() => {});
