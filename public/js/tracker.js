import { $, $$, api, esc, list, loading, showError } from './api.js';
import { getProfile, setProfile, currentDays, pregnancyInfo, ordinal } from './state.js';
import { isMember, saveTracker } from './auth.js';

// Baby's approximate length, compared with foods familiar in Sri Lanka
export const SIZES = [
  [4, 'a sesame seed (thala)', '0.2 cm'],
  [6, 'a mung bean (mun eta)', '0.6 cm'],
  [8, 'a veralu (Ceylon olive)', '1.6 cm'],
  [10, 'a small lime (dehi)', '3 cm'],
  [12, 'a passion fruit', '5.4 cm'],
  [14, 'a guava (pera)', '8.7 cm'],
  [16, 'an avocado', '11.6 cm'],
  [18, 'a sweet potato (bathala)', '14 cm'],
  [20, 'a banana (kesel)', '16 cm crown to rump, 25 cm head to heel'],
  [22, 'a small papaya', '28 cm'],
  [24, 'an ear of corn (bada iringu)', '30 cm'],
  [26, 'a large cucumber (pipinna)', '35 cm'],
  [28, 'a long brinjal (wambatu)', '37.5 cm'],
  [30, 'a cabbage (gowa)', '40 cm'],
  [32, 'a pineapple (annasi)', '42 cm'],
  [34, 'a king coconut (thambili)', '45 cm'],
  [36, 'a large papaya (gasleta)', '47 cm'],
  [38, 'a pumpkin (wattakka)', '49 cm'],
  [40, 'a small jackfruit (kos)', '51 cm']
];

export function sizeFor(week) {
  let found = null;
  for (const s of SIZES) if (week >= s[0]) found = s;
  return found;
}

const TIPS = {
  1: {
    title: 'First trimester (weeks 1 to 13)',
    eat: ['Green leaves: gotukola, mukunuwenna, kankun', 'Dhal, chickpeas (kadala) and eggs', 'Small, frequent meals if you feel sick', 'Take your folic acid tablet every day'],
    avoid: ['Unripe or semi-ripe papaya', 'Raw or undercooked eggs, meat and fish', 'Alcohol and smoking (including smoke from others)', 'Too much caffeine: stay under about 200 mg a day'],
    doList: ['Register with your PHM and attend the MOH clinic', 'Rest when tired, sleep is part of the work', 'Gentle walks if you feel well']
  },
  2: {
    title: 'Second trimester (weeks 14 to 27)',
    eat: ['Iron: green leaves, dhal, fish, lean meat', 'Calcium: milk, curd, sprats (haal masso)', 'Vitamin C fruit with meals (guava, lime, orange)', 'One extra small, healthy meal a day'],
    avoid: ['Tea or coffee with meals (it blocks iron)', 'Taking iron and calcium tablets together', 'Deep-fried snacks and sugary drinks every day', 'Lying flat on your back for long periods'],
    doList: ['30 minutes of walking or prenatal yoga most days', 'Start pelvic floor exercises', 'Sleep on your side with a pillow between your knees']
  },
  3: {
    title: 'Third trimester (weeks 28 to 40)',
    eat: ['Protein at every meal: fish, eggs, dhal, soya', 'Small fish such as salaya and hurulla', 'Fibre: red rice, vegetables, fruit', 'Plenty of water and king coconut'],
    avoid: ['Large portions that cause heartburn', 'Too much salt (dried fish, pickles, instant noodles)', 'Very sweet foods such as kavum and sweet biscuits', 'Heavy lifting'],
    doList: ['Learn your baby\'s movement pattern and report any change', 'Pack your hospital bag by week 36', 'Keep your pregnancy record with you']
  }
};

let initialised = false;

export function initTracker() {
  if (initialised) return;
  initialised = true;
  let mode = 'days';

  $$('#trackerForm [data-mode]').forEach(btn => btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    $$('#trackerForm [data-mode]').forEach(b => b.classList.toggle('active', b === btn));
    $$('#trackerForm [data-for]').forEach(f => f.classList.toggle('hidden', f.dataset.for !== mode));
  }));

  $('#lmpInput').max = new Date().toISOString().slice(0, 10);

  const weekSelect = $('#activityWeek');
  for (let w = 1; w <= 40; w++) weekSelect.add(new Option(`Week ${w}`, w));

  $('#trackerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const errorBox = $('#trackerError');
    errorBox.innerHTML = '';
    let days;
    if (mode === 'days') {
      days = parseInt($('#daysInput').value, 10);
    } else {
      const value = $('#lmpInput').value;
      if (value) {
        const [y, m, d] = value.split('-').map(Number);
        const lmp = new Date(y, m - 1, d);
        const today = new Date();
        days = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - lmp) / 86400000);
      }
    }
    if (!(days >= 1 && days <= 300)) {
      errorBox.innerHTML = '<div class="alert alert-error" style="margin:1rem 0 0">Enter a number of days between 1 and 300, or a date within the last 300 days.</div>';
      return;
    }
    const savedOn = new Date().toISOString();
    try {
      await saveTracker(days, savedOn);
    } catch (err) {
      errorBox.innerHTML = `<div class="alert alert-error" style="margin:1rem 0 0">${esc(err.message)}</div>`;
      return;
    }
    setProfile({ ...getProfile(), who: 'mother', days, savedOn });
  });

  $('#activityForm').addEventListener('submit', async e => {
    e.preventDefault();
    const out = $('#activityResult');
    const week = Number(weekSelect.value);
    loading(out, `Planning week ${week} for you...`);
    try {
      renderPlan(out, await api('/api/activities', { week }));
    } catch (err) {
      showError(out, err);
    }
  });

  window.addEventListener('profilechange', render);
  window.addEventListener('authchange', render);
  render();
}

function render() {
  // Members only: guests see the sign-in card instead
  $('[data-gate="tracker"]').classList.toggle('hidden', isMember());
  $('[data-members="tracker"]').classList.toggle('hidden', !isMember());
  if (!isMember()) { $('#activityResult').innerHTML = ''; return; }

  const d = currentDays();
  const result = $('#trackerResult');
  const tips = $('#trimesterTips');

  if (!d) {
    result.innerHTML = `
      <h3>Your pregnancy at a glance</h3>
      <p class="muted">Enter how many days pregnant you are to see your week, trimester, due date and your baby's size. The food checker will then tailor its advice to your stage.</p>`;
    tips.innerHTML = '';
    return;
  }

  const i = pregnancyInfo(d);
  $('#daysInput').value = i.days;
  $('#activityWeek').value = String(Math.min(40, i.week));

  const C = 2 * Math.PI * 80;
  const size = sizeFor(i.week);
  const trimesterFill = [
    Math.min(100, (i.days / 91) * 100),
    Math.max(0, Math.min(100, ((i.days - 91) / 98) * 100)),
    Math.max(0, Math.min(100, ((i.days - 189) / 91) * 100))
  ];
  const dueText = i.due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  result.innerHTML = `
    <div class="tracker-grid">
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 190 190" aria-hidden="true">
          <circle class="ring-bg" cx="95" cy="95" r="80"/>
          <circle class="ring-fg" cx="95" cy="95" r="80" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
        </svg>
        <div class="ring-label"><strong>Week ${i.week}</strong><span>${i.weeks} weeks ${i.extra} days</span></div>
      </div>
      <div>
        <div class="stats">
          <div class="stat"><span class="mono-label">Trimester</span><strong>${ordinal(i.trimester)}</strong></div>
          <div class="stat"><span class="mono-label">Due date</span><strong>${dueText}</strong></div>
          <div class="stat"><span class="mono-label">${i.daysLeft >= 0 ? 'Days to go' : 'Days past due'}</span><strong>${Math.abs(i.daysLeft)}</strong></div>
        </div>
        <p class="size-line">${size
          ? `Your baby is about the size of <strong>${esc(size[1])}</strong>, around ${esc(size[2])} long.`
          : 'Your baby is still too tiny to compare, but a lot is already happening.'}</p>
      </div>
    </div>
    <div class="vine" aria-label="Pregnancy progress ${Math.round(i.progress)} percent">
      <div class="vine-track">${trimesterFill.map(p => `<div><i style="width:${p}%"></i></div>`).join('')}</div>
      <span class="vine-bud" style="left:${Math.min(100, i.progress)}%"></span>
      <div class="vine-labels"><span>First</span><span>Second</span><span>Third</span></div>
    </div>
    ${i.daysLeft < 0 ? '<p class="fine-print">You are past your estimated due date. Stay in close touch with your VOG and clinic.</p>' : ''}`;

  // animate the ring once it is on the page
  requestAnimationFrame(() => {
    const fg = result.querySelector('.ring-fg');
    if (fg) fg.style.strokeDashoffset = C * (1 - i.progress / 100);
  });

  const t = TIPS[i.trimester];
  tips.innerHTML = `
    <div class="card">
      <span class="mono-label accent">This trimester</span>
      <h3 class="card-title">${t.title}</h3>
      <p class="muted" style="margin:0">These tips also shape the advice in <a href="#food">Food check</a> and <a href="#nutrition">Nutrition</a>.</p>
      <div class="tri-tips">
        <div><h4>Eat more</h4><ul class="dot-list green">${t.eat.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>Avoid or limit</h4><ul class="dot-list">${t.avoid.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h4>To do</h4><ul class="dot-list gold">${t.doList.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div>`;
}

function renderPlan(out, d) {
  out.innerHTML = `
    <article class="card">
      <div class="card-top">
        <h3>Week ${esc(d.week)} plan</h3>
        <span class="mono-label">Trimester ${esc(d.trimester)}</span>
      </div>
      <div class="plan-intro">
        <div><span class="mono-label">Your baby</span><p>${esc(d.babyDevelopment)}</p></div>
        <div><span class="mono-label">Your body</span><p>${esc(d.bodyChanges)}</p></div>
      </div>
      <div class="activity-list">
        ${list(d.activities).map(a => `
          <div class="activity">
            <span class="mono-label accent">${esc(a.duration)}</span>
            <h4>${esc(a.name)}</h4>
            <p>${esc(a.benefit)}</p>
          </div>`).join('')}
      </div>
      <hr>
      <div class="pc-grid">
        <div><span class="mono-label">Avoid this week</span><ul class="dot-list" style="margin-top:.7rem">${list(d.avoid).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><span class="mono-label">Food focus</span><ul class="dot-list green" style="margin-top:.7rem">${list(d.nutritionFocus).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      ${d.selfCare ? `<hr><p class="tip-line"><strong>Self-care:</strong> ${esc(d.selfCare)}</p>` : ''}
      ${d.clinicReminder ? `<hr><p class="tip-line"><strong>Clinic reminder:</strong> ${esc(d.clinicReminder)}</p>` : ''}
      ${d.demo ? '<p class="ai-note"><strong>Sample result.</strong> Demo mode is on, so this is not a live Gemini answer.</p>' : ''}
    </article>
    <div class="alert alert-danger">
      <h3>Stop and contact your doctor if you have</h3>
      <ul>${list(d.warningSigns).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p style="margin:0;font-size:.9rem">Generated by AI for an uncomplicated pregnancy. Check with your PHM or VOG before starting new exercise.</p>
    </div>`;
}
