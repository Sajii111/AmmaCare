// public/js/theme.js — light/dark theme with circular reveal.
const STORAGE_KEY = 'ammacare.theme';
const currentTheme = () => document.documentElement.dataset.theme || 'light';

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

function toggleTheme(evt) {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  const x = evt?.clientX ?? window.innerWidth - 60;
  const y = evt?.clientY ?? 60;
  document.documentElement.style.setProperty('--theme-x', x + 'px');
  document.documentElement.style.setProperty('--theme-y', y + 'px');

  if (typeof document.startViewTransition === 'function') {
    document.startViewTransition(() => setTheme(next));
  } else {
    setTheme(next);
  }
}

export function initTheme() {
  // The inline <head> script already set the initial theme — avoid flash.
  window.matchMedia?.('(prefers-color-scheme: dark)')
    .addEventListener?.('change', e => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    });
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
}