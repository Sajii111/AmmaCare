import { $, $$, api, esc, list, loading, showError, fmtNum } from './api.js';
import { stageInfo } from './state.js';
import { icons } from './icons.js';

const VERDICTS = {
  healthy: { badge: 'Healthy', icon: icons.check },
  moderate: { badge: 'In moderation', icon: icons.caution },
  avoid: { badge: 'Best avoided', icon: icons.cross },
  unknown: { badge: 'Not sure', icon: icons.question }
};
const BAR_COLOURS = ['var(--terracotta)', 'var(--forest)', 'var(--mustard)', 'var(--bark)'];

let initialised = false;

export function initFood() {
  if (initialised) return;
  initialised = true;

  // ----- Is it healthy? -----
  const checkForm = $('#foodCheckForm');
  $('#foodCheckChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $('#foodCheckInput').value = chip.textContent.trim();
    checkForm.requestSubmit();
  });

  checkForm.addEventListener('submit', async e => {
    e.preventDefault();
    const food = $('#foodCheckInput').value.trim();
    if (!food) return;
    const out = $('#foodCheckResult');
    loading(out, `Checking ${food}...`);
    try {
      renderCheck(out, await api('/api/food/check', { food, profile: stageInfo().profile }));
    } catch (err) {
      showError(out, err);
    }
  });

  // ----- Nutrition, day by day -----
  const nutForm = $('#nutritionForm');
  const days = $('#nutDays');
  const syncDays = () => {
    $('#nutDaysLabel').textContent = `Eaten daily for ${days.value} day${days.value === '1' ? '' : 's'}`;
  };
  days.addEventListener('input', syncDays);

  $('#nutritionChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $('#nutFood').value = chip.dataset.food;
    $('#nutGrams').value = chip.dataset.grams;
    days.value = chip.dataset.days;
    syncDays();
    nutForm.requestSubmit();
  });

  nutForm.addEventListener('submit', async e => {
    e.preventDefault();
    const food = $('#nutFood').value.trim();
    const grams = Number($('#nutGrams').value);
    const n = Number(days.value);
    if (!food || !(grams > 0)) return;
    const out = $('#nutritionResult');
    loading(out, `Working out ${grams} g of ${food} over ${n} day${n > 1 ? 's' : ''}...`);
    try {
      renderNutrition(out, await api('/api/food/nutrition', { food, grams, days: n, profile: stageInfo().profile }), grams, n);
    } catch (err) {
      showError(out, err);
    }
  });
}

const barRow = (name, valueText, pct, colour, small = '') => `
  <div class="bar-row">
    <div class="bar-top"><span>${esc(name)}</span><span>${valueText}</span></div>
    <div class="bar"><i style="width:${Math.max(2, Math.min(100, pct))}%;--c:${colour}"></i></div>
    ${small ? `<small>${small}</small>` : ''}
  </div>`;

const demoTag = d => (d.demo ? '<p class="ai-note"><strong>Sample result.</strong> Demo mode is on, so this is not a live Gemini answer.</p>' : '');

function renderCheck(out, d) {
  const key = VERDICTS[d.verdict] ? d.verdict : 'unknown';
  const v = VERDICTS[key];
  const score = Number(d.score);

  out.innerHTML = `
    <article class="card v-${key}">
      <span class="mono-label">Verdict</span>
      <div class="result-head" style="margin-top:.9rem">
        <div class="verdict-icon">${v.icon}</div>
        <div>
          <h3>${esc(d.food)}</h3>
          ${d.description ? `<p class="sub">${esc(d.description)}</p>` : ''}
        </div>
        <span class="badge ${key}">${v.badge}${Number.isFinite(score) && key !== 'unknown' ? `, ${score}/10` : ''}</span>
      </div>

      ${list(d.highlights).length ? `<div class="bars">
        ${list(d.highlights).map((h, i) => barRow(h.name, `${fmtNum(h.dvPercent)}% DV`, Number(h.dvPercent) || 0, BAR_COLOURS[i % 3])).join('')}
      </div>` : ''}

      <hr>
      <p class="result-text">${esc(d.summary)}</p>
      ${list(d.cautions).length ? `<ul class="dot-list">${list(d.cautions).map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}

      ${(d.portion || list(d.betterChoices).length) ? `<hr><div class="result-foot">
        ${d.portion ? `<div><h4>Sensible portion</h4><p class="tip-line">${esc(d.portion)}</p></div>` : ''}
        ${list(d.betterChoices).length ? `<div><h4>Better choices</h4><div class="tag-list">${list(d.betterChoices).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div></div>` : ''}
      </div>` : ''}
      ${d.stageTip ? `<hr><p class="tip-line"><strong>For your stage:</strong> ${esc(d.stageTip)}</p>` : ''}
      ${demoTag(d)}
      <p class="ai-note">AI guidance. Always follow advice from your PHM, clinic or doctor.</p>
    </article>`;
}

function renderNutrition(out, d, grams, days) {
  const nutrients = list(d.nutrients);
  const outlook = list(d.outlook);
  const markFor = tone => (tone === 'negative' ? icons.minus : tone === 'neutral' ? icons.dot : icons.plus);

  out.innerHTML = `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${esc(d.food)}</h3>
          ${d.description ? `<p class="muted" style="margin:.2rem 0 0">${esc(d.description)}</p>` : ''}
        </div>
        <span class="mono-label">per ${fmtNum(grams)} g</span>
      </div>
      <div class="bars two">
        ${nutrients.map((n, i) => barRow(
          n.name,
          `${fmtNum(n.amount)} ${esc(n.unit)}`,
          Number(n.dailyNeedPercent) || 0,
          BAR_COLOURS[i % BAR_COLOURS.length],
          `${fmtNum(n.perGram, true)} ${esc(n.unit)} per g${Number(n.dailyNeedPercent) ? `, ${fmtNum(n.dailyNeedPercent)}% of daily need` : ''}`
        )).join('')}
      </div>
    </article>

    <article class="card">
      <span class="mono-label">1-${days} day outlook</span>
      <ul class="outlook">
        ${outlook.map(o => {
          const tone = ['positive', 'neutral', 'negative'].includes(o.tone) ? o.tone : 'neutral';
          return `<li class="${tone}">
            <span class="mark">${markFor(tone)}</span>
            <h4>${esc(o.label)}${o.title ? ` <span>${esc(o.title)}</span>` : ''}</h4>
            <p>${esc(o.text)}</p>
          </li>`;
        }).join('')}
      </ul>
      <hr>
      <div class="pc-grid">
        <div><span class="mono-label">Pros</span><ul class="dot-list green" style="margin-top:.7rem">${list(d.pros).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><span class="mono-label">Cons</span><ul class="dot-list" style="margin-top:.7rem">${list(d.cons).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      ${d.safeAmount ? `<hr><p class="tip-line"><strong>Safer amount:</strong> ${esc(d.safeAmount)}</p>` : ''}
      ${d.tip ? `<hr><p class="tip-line"><strong>Tip:</strong> ${esc(d.tip)}</p>` : ''}
      ${demoTag(d)}
      <p class="ai-note">Nutrient values are AI estimates and vary by recipe. Predictions describe typical effects, not certainties.</p>
    </article>`;
}

// Short line under the food forms showing what the advice is tailored to
export function renderStageNotes() {
  const s = stageInfo();
  let html;
  if (s.who === 'child') {
    html = `<p>Tailored to your child, <strong>${esc(s.label.replace('Child, ', ''))}</strong>. Focus on ${esc(s.focus)}.</p>`;
  } else if (s.info) {
    html = `<p>Tailored to <strong>week ${s.info.week}</strong>. This trimester, focus on ${esc(s.focus)}.</p>`;
  } else {
    html = `<p>Add your days in the <a href="#tracker">tracker</a> to get advice for your exact week.</p>`;
  }
  $$('[data-stage-note]').forEach(el => { el.innerHTML = html; });
}
