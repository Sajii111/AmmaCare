// Small line icons used instead of emojis
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${d}</svg>`;

export const icons = {
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  caution: svg('<path d="M12 7v6"/><path d="M12 17h.01"/>'),
  cross: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  question: svg('<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>'),
  plus: svg('<path d="M12 6v12M6 12h12"/>'),
  minus: svg('<path d="M6 12h12"/>'),
  dot: svg('<circle cx="12" cy="12" r="3"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>'),
  reply: svg('<path d="M4 5h16v11H9l-5 4Z"/>')
};
