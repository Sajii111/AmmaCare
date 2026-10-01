// lib/auth.js — Accounts and sign-in for AmmaCare, backed by Firestore.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db } = require('./firebase');

const SECRET_FILE = path.join(__dirname, '..', 'data', '.session-secret');
const COOKIE = 'ammacare_session';
const MAX_AGE_DAYS = 30;

// ---------- Firestore storage ----------
async function findUserById(id) {
  const doc = await db.collection('users').doc(id).get();
  return doc.exists ? { ...doc.data(), id: doc.id } : null;
}

async function findUserByEmail(email) {
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...doc.data(), id: doc.id };
}

async function saveUser(user) {
  const { id, ...data } = user;
  await db.collection('users').doc(id).set(data, { merge: true });
}

// ---------- Session secret ----------
function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try { return fs.readFileSync(SECRET_FILE, 'utf8').trim(); } catch { /* create below */ }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
  fs.writeFileSync(SECRET_FILE, secret);
  return secret;
}
const SECRET = getSecret();

// ---------- Passwords ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function checkPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

// ---------- Session cookie ----------
const sign = value => crypto.createHmac('sha256', SECRET).update(value).digest('base64url');

function makeToken(userId) {
  const expires = Date.now() + MAX_AGE_DAYS * 86400000;
  const value = `${userId}.${expires}`;
  return `${value}.${sign(value)}`;
}

function readToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [userId, expires, sig] = parts;
  const expected = sign(`${userId}.${expires}`);
  if (sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(req, res, userId) {
  const parts = [
    `${COOKIE}=${makeToken(userId)}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax',
    `Max-Age=${MAX_AGE_DAYS * 86400}`
  ];
  if (req.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// ---------- Helpers ----------
const publicUser = u => ({
  id: u.id, name: u.name, email: u.email,
  tracker: u.tracker || null, createdAt: u.createdAt
});
const normaliseEmail = e => String(e || '').trim().toLowerCase();
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter(t => now - t < 15 * 60000);
  list.push(now);
  attempts.set(ip, list);
  return list.length > 10;
}

// ---------- Middleware ----------
async function loadUser(req, res, next) {
  try {
    const userId = readToken(parseCookies(req.headers.cookie)[COOKIE]);
    req.user = userId ? await findUserById(userId) : null;
  } catch (err) {
    console.error('loadUser error:', err.message);
    req.user = null;
  }
  next();
}

function requireLogin(req, res, next) {
  if (req.user) return next();
  res.status(401).json({ error: 'Please sign in to use this feature.', needLogin: true });
}

// ---------- Routes ----------
function mountAuthRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const name = String(req.body.name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const email = normaliseEmail(req.body.email);
      const password = String(req.body.password || '');

      if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
      if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
      if (password.length < 8) return res.status(400).json({ error: 'Your password needs at least 8 characters.' });

      if (await findUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
      }
      const user = {
        id: crypto.randomUUID(),
        name, email,
        passwordHash: hashPassword(password),
        tracker: null,
        createdAt: new Date().toISOString()
      };
      await saveUser(user);
      setSessionCookie(req, res, user.id);
      res.status(201).json({ user: publicUser(user) });
    } catch (err) {
      console.error('register error:', err);
      res.status(500).json({ error: 'Could not create the account: ' + err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      if (tooManyAttempts(req.ip)) {
        return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
      }
      const email = normaliseEmail(req.body.email);
      const password = String(req.body.password || '');
      const user = await findUserByEmail(email);
      if (!user || !checkPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'The email or password is not correct.' });
      }
      setSessionCookie(req, res, user.id);
      res.json({ user: publicUser(user) });
    } catch (err) {
      console.error('login error:', err);
      res.status(500).json({ error: 'Could not sign in: ' + err.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null });
  });

  app.put('/api/me/tracker', requireLogin, async (req, res) => {
    try {
      const days = Math.round(Number(req.body.days));
      if (!(days >= 1 && days <= 300)) return res.status(400).json({ error: 'Days must be between 1 and 300.' });
      const savedOn = new Date(req.body.savedOn || Date.now());
      if (Number.isNaN(savedOn.getTime())) return res.status(400).json({ error: 'Invalid date.' });

      const user = await findUserById(req.user.id);
      user.tracker = { days, savedOn: savedOn.toISOString() };
      await saveUser(user);
      res.json({ user: publicUser(user) });
    } catch (err) {
      console.error('tracker error:', err);
      res.status(500).json({ error: 'Could not save the tracker: ' + err.message });
    }
  });
}

module.exports = { loadUser, requireLogin, mountAuthRoutes };