// server.js — AmmaCare Express server, backed by Firestore.
require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { askGeminiJSON } = require('./lib/gemini');
const { listSymptoms, diagnose } = require('./lib/prolog');
const { loadUser, requireLogin, mountAuthRoutes } = require('./lib/auth');
const { db } = require('./lib/firebase');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = process.env.PORT || process.env.SUGA_PUBLIC_TARGET_PORT || 80;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(loadUser);
mountAuthRoutes(app);

// ---------- helpers ----------
const clean = (s, max = 120) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const clamp = (n, min, max, fallback) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};
const trimesterOf = week => (week <= 13 ? 1 : week <= 27 ? 2 : 3);

function describePerson(profile = {}) {
  if (profile.who === 'child') {
    const m = Math.round(clamp(profile.childAgeMonths, 0, 72, 24));
    return `a young Sri Lankan child aged ${m} months`;
  }
  const week = Math.round(clamp(profile.week, 0, 42, 0));
  if (week >= 1) {
    return `a pregnant Sri Lankan mother in week ${week} of pregnancy (trimester ${trimesterOf(week)})`;
  }
  return 'a pregnant Sri Lankan mother (week of pregnancy not given)';
}

async function respond(res, work) {
  try {
    res.json(await work());
  } catch (err) {
    console.error('API error:', err);
    res.status(502).json({ error: err.message });
  }
}

// ---------- Gemini: food check ----------
app.post('/api/food/check', (req, res) => {
  const food = clean(req.body.food, 80);
  const note = clean(req.body.note, 120);
  if (!food) return res.status(400).json({ error: 'Type a food to check.' });
  const person = describePerson(req.body.profile);

  const prompt = `Food: "${food}"${note ? ` (details: ${note})` : ''}.
Person: ${person}.
Decide whether this food is a healthy choice for this person right now.
If the text is not a food or drink, use verdict "unknown" and explain briefly.

Return JSON exactly in this shape:
{
  "food": string,
  "description": string,
  "verdict": "healthy" | "moderate" | "avoid" | "unknown",
  "score": integer 1-10,
  "highlights": [{"name": string, "dvPercent": number}],
  "summary": string,
  "cautions": [string],
  "betterChoices": [string],
  "stageTip": string,
  "portion": string
}`;
  respond(res, () => askGeminiJSON(prompt, { kind: 'check' }));
});

// ---------- Gemini: nutrition ----------
app.post('/api/food/nutrition', (req, res) => {
  const food = clean(req.body.food, 80);
  if (!food) return res.status(400).json({ error: 'Type a food to analyse.' });
  const grams = Math.round(clamp(req.body.grams, 1, 2000, 100));
  const days = Math.round(clamp(req.body.days, 1, 7, 3));
  const person = describePerson(req.body.profile);

  const prompt = `Food: "${food}". Amount: ${grams} g per day, eaten every day for ${days} day(s).
Person: ${person}.

1. Estimate the nutrients in ${grams} g (assume a typical Sri Lankan preparation if it is a dish).
   Always include Energy (kcal), Protein, Carbohydrate, Fat and Fibre, plus the 3-5 vitamins/minerals most relevant to this person (for example iron, folate, calcium, sugar, sodium, caffeine).
   perGram = amount / ${grams}. dailyNeedPercent = share of this person's daily need in ${grams} g (0-100+).
2. Predict what eating this amount every day for ${days} day(s) does to this person
   (energy, blood sugar, weight trend, digestion, nutrient build-up, effects on the baby or the child's growth).
   Group consecutive days that have the same effect, e.g. "Days 1-2" then "Day 3". The groups must cover all ${days} day(s).
   tone: "positive" = good effect, "neutral" = mixed, "negative" = something to watch. Be realistic and calm.
3. Give pros and cons of eating this amount for ${days} day(s).

Return JSON exactly in this shape:
{
  "food": string,
  "description": string (max 8 words),
  "portionGrams": ${grams},
  "nutrients": [{"name": string, "amount": number, "unit": string, "perGram": number, "dailyNeedPercent": number}],
  "outlook": [{"label": string (e.g. "Days 1-2"), "tone": "positive" | "neutral" | "negative", "title": string (3-6 words), "text": string (1-2 sentences)}],
  "pros": [2-4 strings],
  "cons": [2-4 strings],
  "safeAmount": string (a safer daily amount for this person, in grams and household measures),
  "tip": string (one practical tip, e.g. what to pair it with)
}`;
  respond(res, () => askGeminiJSON(prompt, { kind: 'nutrition' }));
});

// ---------- Gemini: activities ----------
app.post('/api/activities', requireLogin, (req, res) => {
  const week = Math.round(clamp(req.body.week, 1, 42, 12));
  const trimester = trimesterOf(week);

  const prompt = `Create a pregnancy activity and wellbeing guide for week ${week} (trimester ${trimester}) for a Sri Lankan mother with an uncomplicated pregnancy.
Suggest safe activities suited to Sri Lankan homes and climate (heat, humidity), such as walking, prenatal yoga, breathing, pelvic floor exercises and light household tasks.

Return JSON exactly in this shape:
{
  "week": ${week},
  "trimester": ${trimester},
  "babyDevelopment": string (2 sentences),
  "bodyChanges": string (2 sentences),
  "activities": [{"name": string, "duration": string, "benefit": string}] (4-6 items),
  "avoid": [3-5 strings],
  "nutritionFocus": [3 strings naming Sri Lankan foods],
  "selfCare": string,
  "warningSigns": [3-4 strings: signs to stop and contact a doctor],
  "clinicReminder": string (a general reminder about antenatal clinic care at this stage)
}`;
  respond(res, () => askGeminiJSON(prompt, { temperature: 0.5, kind: 'activities' }));
});

// ---------- Prolog: symptoms ----------
async function loadPlaces() {
  const snap = await db.collection('places').get();
  const specialties = {};
  const places = {};
  snap.forEach(doc => {
    const d = doc.data();
    specialties[doc.id] = { title: d.title, detail: d.detail };
    places[doc.id] = d.places || [];
  });
  return { specialties, places };
}

app.get('/api/symptoms', (req, res) => respond(res, async () => ({ symptoms: await listSymptoms() })));

app.post('/api/diagnose', (req, res) => {
  const symptoms = Array.isArray(req.body.symptoms) ? req.body.symptoms.map(s => clean(s, 40)) : [];
  if (!symptoms.length) return res.status(400).json({ error: 'Select at least one symptom.' });
  respond(res, async () => {
    const result = await diagnose(symptoms, req.body.group);
    const directory = await loadPlaces();
    const top = result.results[0];
    if (top) {
      result.recommended = {
        specialty: top.specialty,
        ...(directory.specialties[top.specialty] || { title: top.doctor, detail: '' }),
        urgency: top.urgency,
        advice: top.advice,
        doctor: top.doctor,
        places: directory.places[top.specialty] || []
      };
    }
    return result;
  });
});

// ---------- Community (Firestore) ----------
const CATEGORIES = ['Pregnancy', 'Toddlers', 'Food & nutrition', 'My story', 'Question'];

const toPublicPost = (p, user) => {
  const { likedBy, authorId, replies, ...rest } = p;
  return {
    ...rest,
    likedByMe: Boolean(user && (likedBy || []).includes(user.id)),
    mine: Boolean(user && authorId === user.id),
    replies: (replies || []).map(({ authorId: _a, ...r }) => r)
  };
};

app.get('/api/posts', async (req, res) => {
  try {
    const q = clean(req.query.q, 80).toLowerCase();
    const category = clean(req.query.category, 40);
    let query = db.collection('posts');
    if (category && category !== 'All') query = query.where('category', '==', category);
    const snap = await query.get();
    let posts = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (q) posts = posts.filter(p => `${p.title} ${p.body}`.toLowerCase().includes(q));
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ posts: posts.map(p => toPublicPost(p, req.user)), categories: CATEGORIES });
  } catch (err) {
    console.error('GET /api/posts error:', err);
    res.status(500).json({ error: 'Could not load posts right now. Please try again.' });
  }
});

app.post('/api/posts', requireLogin, async (req, res) => {
  try {
    const title = clean(req.body.title, 120);
    const body = String(req.body.body ?? '').trim().slice(0, 3000);
    const category = CATEGORIES.includes(req.body.category) ? req.body.category : 'Question';
    const name = req.body.anonymous ? 'Anonymous mother' : req.user.name;
    if (title.length < 4 || body.length < 10) {
      return res.status(400).json({ error: 'Add a title (4+ characters) and a message (10+ characters).' });
    }
    const post = {
      id: crypto.randomUUID(), authorId: req.user.id,
      title, body, category, name, likes: 0, likedBy: [], replies: [],
      createdAt: new Date().toISOString()
    };
    const { id, ...data } = post;
    await db.collection('posts').doc(id).set(data);
    res.status(201).json(toPublicPost(post, req.user));
  } catch (err) {
    console.error('POST /api/posts error:', err);
    res.status(500).json({ error: 'Could not save your post right now. Please try again.' });
  }
});

app.post('/api/posts/:id/replies', requireLogin, async (req, res) => {
  try {
    const body = String(req.body.body ?? '').trim().slice(0, 1500);
    const name = req.body.anonymous ? 'Anonymous' : req.user.name;
    if (body.length < 2) return res.status(400).json({ error: 'Write a reply first.' });

    const ref = db.collection('posts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found.' });

    const reply = {
      id: crypto.randomUUID(), authorId: req.user.id, name, body,
      createdAt: new Date().toISOString()
    };
    const replies = doc.data().replies || [];
    replies.push(reply);
    await ref.update({ replies });

    const { authorId: _a, ...publicReply } = reply;
    res.status(201).json(publicReply);
  } catch (err) {
    console.error('reply error:', err);
    res.status(500).json({ error: 'Could not save your reply right now. Please try again.' });
  }
});

app.post('/api/posts/:id/like', requireLogin, async (req, res) => {
  try {
    const ref = db.collection('posts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found.' });

    const data = doc.data();
    const likedBy = data.likedBy || [];
    const i = likedBy.indexOf(req.user.id);
    let likes = data.likes || 0;
    if (i === -1) { likedBy.push(req.user.id); likes += 1; }
    else { likedBy.splice(i, 1); likes = Math.max(0, likes - 1); }
    await ref.update({ likedBy, likes });
    res.json({ likes, likedByMe: i === -1 });
  } catch (err) {
    console.error('like error:', err);
    res.status(500).json({ error: 'Could not update the like right now. Please try again.' });
  }
});

app.get('/api/health', (req, res) => res.json({
  ok: true,
  geminiKeySet: Boolean(process.env.GEMINI_API_KEY),
  demoMode: String(process.env.DEMO_MODE).toLowerCase() === 'true'
}));

app.listen(PORT, () => {
  console.log(`AmmaCare running at http://localhost:${PORT}`);
  if (String(process.env.DEMO_MODE).toLowerCase() === 'true') {
    console.log('DEMO_MODE is on: AI sections show sample results.');
  }
});