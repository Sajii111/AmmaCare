import { $, $$, api, esc, loading, showError } from './api.js';
import { getProfile } from './state.js';

let symptoms = [];
let selected = new Set();
let group = 'pregnancy';
let initialised = false;

export async function initSymptoms() {
  if (initialised) return;
  initialised = true;
  group = getProfile().who === 'child' ? 'child' : 'pregnancy';

  const grid = $('#symptomGrid');
  loading(grid, 'Loading symptoms...');
  try {
    symptoms = (await api('/api/symptoms')).symptoms;
  } catch (err) {
    showError(grid, err);
    initialised = false;
    return;
  }

  $$('#symGroup .pill').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.group === group) return;
    group = btn.dataset.group;
    selected.clear();
    $('#symResult').innerHTML = '';
    render();
  }));

  $('#symSearch').addEventListener('input', renderGrid);

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.sym');
    if (!btn) return;
    const id = btn.dataset.id;
    selected.has(id) ? selected.delete(id) : selected.add(id);
    btn.classList.toggle('on', selected.has(id));
    btn.setAttribute('aria-pressed', selected.has(id));
    updateCount();
  });

  $('#symClear').addEventListener('click', () => {
    selected.clear();
    $('#symResult').innerHTML = '';
    render();
  });

  $('#symAnalyse').addEventListener('click', analyse);
  render();
}

function render() {
  $$('#symGroup .pill').forEach(b => b.classList.toggle('active', b.dataset.group === group));
  renderGrid();
  updateCount();
}

function renderGrid() {
  const q = $('#symSearch').value.trim().toLowerCase();
  const visible = symptoms.filter(s => (s.group === group || s.group === 'both') && s.label.toLowerCase().includes(q));
  $('#symptomGrid').innerHTML = visible.length
    ? visible.map(s => `<button type="button" class="sym${selected.has(s.id) ? ' on' : ''}" data-id="${esc(s.id)}" aria-pressed="${selected.has(s.id)}">${esc(s.label)}</button>`).join('')
    : '<p class="muted">No symptom matches that search. Try a simpler word, for example "pain" or "fever".</p>';
}

function updateCount() {
  const n = selected.size;
  $('#symCount').textContent = n ? `${n} symptom${n > 1 ? 's' : ''} selected` : 'No symptoms selected';
  $('#symAnalyse').disabled = n === 0;
}

const URGENCY = {
  routine: 'Can wait for a routine visit',
  soon: 'See a doctor within 1 to 2 days',
  urgent: 'Get care today'
};

const initials = name => name.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(w => w && w[0] === w[0].toUpperCase()).slice(0, 2).map(w => w[0]).join('') || 'H';

async function analyse() {
  const out = $('#symResult');
  loading(out, 'Checking the knowledge base...');
  try {
    const data = await api('/api/diagnose', { symptoms: [...selected], group });
    const byId = Object.fromEntries(symptoms.map(s => [s.id, s.label]));
    const rec = data.recommended;

    out.innerHTML = `
      ${data.emergency.length ? `
        <div class="alert alert-danger">
          <h3>Get medical help now</h3>
          <ul>${data.emergency.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
          <p style="margin:0">Call <a href="tel:1990"><strong>1990</strong></a> for a Suwa Seriya ambulance or go to your nearest hospital.</p>
        </div>` : ''}

      ${data.results.length ? `
        <div class="card">
          ${data.results.map((r, i) => `
            <article class="cond">
              <div class="cond-num">${i + 1}</div>
              <div>
                <h3>Possible: ${esc(r.name)}</h3>
                <p class="match-line">${r.matched} of ${r.total} typical symptoms match (${r.score}%)</p>
                <p>${esc(r.advice)}</p>
                <span class="mono-label">Matched from</span>
                <div class="tag-list">${r.matchedSymptoms.map(id => `<span class="tag mono">${esc(byId[id] || id)}</span>`).join('')}</div>
              </div>
            </article>`).join('')}
        </div>

        ${rec ? `
          <div class="recommend">
            <span class="mono-label">Recommended</span>
            <h3>${esc(rec.title)}</h3>
            <span class="urgency ${esc(rec.urgency)}">${URGENCY[rec.urgency] || URGENCY.soon}</span>
            <p>${esc(rec.doctor)}</p>
            ${rec.places.length ? `<span class="mono-label">Where to go</span>
            <div class="place-list">
              ${rec.places.map(p => `
                <div class="place">
                  <span class="avatar" aria-hidden="true">${esc(initials(p.name))}</span>
                  <div><strong>${esc(p.name)}</strong><span>${esc(p.detail)} &middot; ${esc(p.place)}</span></div>
                </div>`).join('')}
            </div>` : ''}
          </div>` : ''}` : `
        <div class="empty">
          <h3>No close match</h3>
          <p>Your symptoms (${[...selected].map(id => esc(byId[id] || id)).join(', ')}) do not clearly match a condition in our list. Please see your PHM, MOH clinic or family doctor.</p>
        </div>`}`;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showError(out, err);
  }
}
