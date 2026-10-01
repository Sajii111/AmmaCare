// Who the advice is for, and the pregnancy count. Stored in this browser only.
const KEY = 'ammacare.profile';
const DAY = 86400000;

export const TRIMESTER_FOCUS = {
  1: 'folate (folic acid) and easing nausea',
  2: 'iron and calcium',
  3: 'protein, omega-3 and steady energy'
};

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { who: 'mother' }; }
  catch { return { who: 'mother' }; }
}

export function setProfile(profile) {
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('profilechange', { detail: profile }));
}

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Days pregnant today, moving the saved count forward each day
export function currentDays(p = getProfile()) {
  if (!p.days || !p.savedOn) return null;
  const since = Math.round((startOfDay(new Date()) - startOfDay(new Date(p.savedOn))) / DAY);
  return p.days + Math.max(0, since);
}

export function pregnancyInfo(days) {
  const d = Math.max(1, Math.min(300, Math.round(days)));
  const weeks = Math.floor(d / 7);
  const extra = d % 7;
  const week = Math.min(42, weeks + 1);          // "week 15" = 14 weeks done
  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const due = new Date(startOfDay(new Date()).getTime() + (280 - d) * DAY);
  return { days: d, weeks, extra, week, trimester, progress: Math.min(100, (d / 280) * 100), daysLeft: 280 - d, due };
}

export const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][n] || 'th'}`;

export function ageText(months) {
  const m = Number(months) || 0;
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const y = Math.floor(m / 12), r = m % 12;
  return `${y} years${r ? ` ${r} months` : ''}`;
}

// Everything the other sections need to personalise advice
export function stageInfo() {
  const p = getProfile();
  if (p.who === 'child') {
    const m = Number.isFinite(Number(p.childAgeMonths)) ? Number(p.childAgeMonths) : 24;
    return {
      who: 'child',
      label: `Child, ${ageText(m)}`,
      focus: 'iron, protein and energy for growth',
      profile: { who: 'child', childAgeMonths: m }
    };
  }
  const d = currentDays(p);
  if (!d) return { who: 'mother', label: 'Pregnant: set your week', focus: null, profile: { who: 'mother' } };
  const info = pregnancyInfo(d);
  return {
    who: 'mother',
    info,
    label: `Week ${info.week}, ${ordinal(info.trimester)} trimester`,
    focus: TRIMESTER_FOCUS[info.trimester],
    profile: { who: 'mother', week: info.week }
  };
}
