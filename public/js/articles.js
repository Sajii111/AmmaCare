import { $, esc, loading, showError } from './api.js';
import { fillCover } from './covers.js';

let articles = [];
let category = 'All';
let initialised = false;

export async function initArticles() {
  if (initialised) return;
  initialised = true;
  const grid = $('#articleGrid');
  loading(grid, 'Loading articles...');
  try {
    const res = await fetch('data/articles.json');
    if (!res.ok) throw new Error('Could not load articles.');
    articles = await res.json();
  } catch (err) {
    showError(grid, err);
    initialised = false;
    return;
  }

  const cats = ['All', ...new Set(articles.map(a => a.category))];
  $('#articleCats').innerHTML = cats.map(c => `<button type="button" class="chip${c === 'All' ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $('#articleCats').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    category = chip.dataset.cat;
    [...$('#articleCats').children].forEach(c => c.classList.toggle('active', c === chip));
    render();
  });

  let timer;
  $('#articleSearch').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 150); });

  grid.addEventListener('click', e => {
    const card = e.target.closest('.article-card');
    if (card) openArticle(card.dataset.id);
  });

  const dialog = $('#articleDialog');
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  render();
}

const highlight = (text, q) => {
  const safe = esc(text);
  if (!q || q.length < 2) return safe;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return safe.replace(re, '<mark>$1</mark>');
};

function render() {
  const q = $('#articleSearch').value.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const found = articles.filter(a => {
    if (category !== 'All' && a.category !== category) return false;
    const hay = `${a.title} ${a.summary} ${a.tags.join(' ')} ${a.body.join(' ')}`.toLowerCase();
    return words.every(w => hay.includes(w));
  });

  $('#articleCount').textContent = `${found.length} article${found.length === 1 ? '' : 's'}${q || category !== 'All' ? ' found' : ''}`;

  const grid = $('#articleGrid');
  grid.innerHTML = found.length
    ? found.map(a => `
      <button type="button" class="article-card" data-id="${esc(a.id)}">
        <div class="cover" data-cover="${esc(a.id)}"></div>
        <div class="article-card-body">
          <span class="mono-label cat-${esc(a.category)}">${esc(a.category)}</span>
          <h3>${highlight(a.title, words[0])}</h3>
          <p>${highlight(a.summary, words[0])}</p>
          <div class="article-foot">
            <span class="mono-label">${a.readMins} min read</span>
            <span class="read-btn">Read</span>
          </div>
        </div>
      </button>`).join('')
    : `<div class="empty"><h3>No articles match "${esc(q)}"</h3><p>Try a shorter word, or ask the question in the <a href="#community">community</a>.</p></div>`;

  grid.querySelectorAll('[data-cover]').forEach(el => fillCover(el, articles.find(a => a.id === el.dataset.cover)));
}

function openArticle(id) {
  const a = articles.find(x => x.id === id);
  if (!a) return;
  const [first, ...rest] = a.body;
  $('#articleBody').innerHTML = `
    <div class="article-cover" id="articleCover"></div>
    <div class="article-inner">
      <span class="mono-label cat-${esc(a.category)}">${esc(a.category)} &middot; ${a.readMins} min read</span>
      <h2 id="articleTitle">${esc(a.title)}</h2>
      <p class="lead-para">${esc(first)}</p>
      ${rest.map(p => `<p>${esc(p)}</p>`).join('')}
      <hr>
      <p class="fine-print">General information only. Your PHM, clinic or doctor knows your situation best.</p>
    </div>`;
  fillCover($('#articleCover'), a);
  const dialog = $('#articleDialog');
  dialog.showModal();
  dialog.scrollTop = 0;
}
