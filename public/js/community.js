import { $, api, esc, loading, showError, timeAgo } from './api.js';
import { icons } from './icons.js';
import { getUser, openAuth } from './auth.js';

let category = 'All';
let initialised = false;

// Show the post form to members and the sign-in card to guests
function renderGate() {
  const user = getUser();
  $('[data-gate="community"]').classList.toggle('hidden', Boolean(user));
  $('#postForm').classList.toggle('hidden', !user);
  if (user) $('#postingAs').textContent = $('#postAnon').checked ? 'Anonymous mother' : user.name;
}

export async function initCommunity() {
  if (initialised) return;
  initialised = true;

  renderGate();
  $('#postAnon').addEventListener('change', renderGate);
  window.addEventListener('authchange', () => { renderGate(); load(); });

  const catRow = $('#postCats');
  const listEl = $('#postList');

  catRow.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    category = chip.dataset.cat;
    [...catRow.children].forEach(c => c.classList.toggle('active', c === chip));
    load();
  });

  let timer;
  $('#postSearch').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });

  $('#postForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#postMsg');
    msg.innerHTML = '';
    try {
      await api('/api/posts', {
        anonymous: $('#postAnon').checked,
        category: $('#postCategory').value,
        title: $('#postTitle').value,
        body: $('#postBody').value
      });
      $('#postTitle').value = '';
      $('#postBody').value = '';
      msg.innerHTML = '<p class="ok-msg">Posted. Thank you for sharing.</p>';
      load();
    } catch (err) {
      showError(msg, err);
    }
  });

  listEl.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like-btn');
    const toggle = e.target.closest('.reply-toggle');
    if ((likeBtn || toggle) && !getUser()) {
      openAuth('login', likeBtn ? 'Sign in to like posts.' : 'Sign in to reply to other mothers.');
      return;
    }
    if (likeBtn) {
      try {
        const { likes, likedByMe } = await api(`/api/posts/${encodeURIComponent(likeBtn.dataset.id)}/like`, {});
        likeBtn.classList.toggle('liked', likedByMe);
        likeBtn.innerHTML = `${icons.heart} ${likes}`;
      } catch (err) { alert(err.message); }
    }
    if (toggle) {
      const form = toggle.closest('.post').querySelector('.reply-form');
      form.classList.toggle('hidden');
      if (!form.classList.contains('hidden')) form.querySelector('[name=body]').focus();
    }
  });

  listEl.addEventListener('submit', async e => {
    const form = e.target.closest('.reply-form');
    if (!form) return;
    e.preventDefault();
    try {
      await api(`/api/posts/${encodeURIComponent(form.dataset.id)}/replies`, {
        anonymous: form.elements.anonymous.checked,
        body: form.elements.body.value
      });
      load();
    } catch (err) { alert(err.message); }
  });

  loading(listEl, 'Loading conversations...');
  await load(true);
}

async function load(first = false) {
  const listEl = $('#postList');
  const q = $('#postSearch').value.trim();
  try {
    const data = await api(`/api/posts?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`);
    if (first) {
      $('#postCategory').innerHTML = data.categories.map(c => `<option>${esc(c)}</option>`).join('');
      $('#postCats').innerHTML = ['All', ...data.categories]
        .map(c => `<button type="button" class="chip${c === 'All' ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    }
    render(data.posts, q);
  } catch (err) {
    showError(listEl, err);
  }
}

function render(posts, q) {
  $('#postList').innerHTML = posts.length ? posts.map(p => `
    <article class="post">
      <div class="post-meta">
        <span class="author">${esc(p.name)}</span>
        <span>${timeAgo(p.createdAt)}</span>
        <span class="tag mono">${esc(p.category)}</span>
      </div>
      <h3>${esc(p.title)}${p.mine ? ' <span class="tag mono">Your post</span>' : ''}</h3>
      <p class="post-body">${esc(p.body)}</p>
      <div class="post-actions">
        <button type="button" class="icon-btn like-btn${p.likedByMe ? ' liked' : ''}" data-id="${esc(p.id)}" aria-label="Like this post">${icons.heart} ${p.likes}</button>
        <button type="button" class="icon-btn reply-toggle">${icons.reply} Reply${p.replies.length ? ` (${p.replies.length})` : ''}</button>
      </div>
      ${p.replies.length ? `<div class="replies">${p.replies.map(r => `
        <div class="reply">
          <div class="post-meta"><span class="author">${esc(r.name)}</span><span>${timeAgo(r.createdAt)}</span></div>
          <p>${esc(r.body)}</p>
        </div>`).join('')}</div>` : ''}
      <form class="reply-form hidden" data-id="${esc(p.id)}">
        <input name="body" maxlength="1500" placeholder="Write a kind reply" aria-label="Reply" required>
        <button class="btn btn-primary btn-small" type="submit">Reply</button>
        <label class="check"><input type="checkbox" name="anonymous"> Reply without my name</label>
      </form>
    </article>`).join('')
    : `<div class="empty"><h3>${q ? 'No posts match your search' : 'No posts in this topic yet'}</h3><p>Be the first to start the conversation.</p></div>`;
}
