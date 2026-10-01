// Gemini REST wrapper. The API key stays on the server.
// - Tries several models, so a quota or "model not found" error on one model
//   automatically falls back to the next.
// - Turns Google's error codes into plain-English messages.
// - DEMO_MODE=true in .env returns sample answers so you can see the layout
//   without a working key.

const { demoAnswer } = require('./demo');

const SYSTEM_PROMPT = `You are the AI assistant inside "AmmaCare", a website for pregnant mothers and parents of young children in Sri Lanka.
- Use Sri Lankan foods, dishes and portion sizes (give Sinhala/Tamil names where helpful, e.g. kiribath, pol sambol, gotukola, kurakkan).
- Be evidence-based and consistent with WHO and Sri Lanka Family Health Bureau guidance.
- Never diagnose. When something could be risky, tell the user to speak to their PHM (Public Health Midwife), MOH clinic or doctor.
- Be realistic and calm: do not exaggerate risks, but do not hide real ones.
- Use simple, warm English. Never use emojis.
- Respond ONLY with valid JSON that matches the schema you are given. No markdown, no extra text.`;

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
let discovered = []; // models learned from Google's own error messages or model list

function modelsToTry() {
  const list = [process.env.GEMINI_MODEL, ...discovered, ...DEFAULT_MODELS];
  return [...new Set(list.filter(Boolean).map(m => m.trim().replace(/^models\//, '')))];
}

// Google's 404 messages say which model to use instead: "use models/gemini-3.6-flash"
function learnFromMessage(message = '') {
  const m = message.match(/use models\/([\w.-]+)/i);
  if (m && !discovered.includes(m[1])) discovered.push(m[1]);
  return m ? m[1] : null;
}

// Ask Google which "flash" models this key can use
async function discoverModels(key) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
      headers: { 'x-goog-api-key': key }
    });
    const data = await res.json();
    const names = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''))
      .filter(n => /flash/i.test(n) && !/image|tts|audio|live|embedding|preview-tts/i.test(n))
      .sort()
      .reverse();
    for (const n of names) if (!discovered.includes(n)) discovered.push(n);
    return names;
  } catch {
    return [];
  }
}

function explain(status, message = '') {
  const m = message.toLowerCase();
  if (m.includes('api key not valid') || m.includes('api_key_invalid')) {
    return 'Google rejected the API key. Copy it again from https://aistudio.google.com/app/apikey (no spaces or quotes) into .env, then restart the server.';
  }
  if (status === 403 && m.includes('location')) {
    return 'Gemini is not available from this network or location. Try another internet connection.';
  }
  if (status === 403) return 'The API key does not have permission to use Gemini. Create a new key in Google AI Studio.';
  if (status === 429) return 'The free Gemini quota is used up for now. Wait a minute (or until tomorrow for the daily limit) and try again.';
  if (status === 404) return 'This Gemini model name is not available for your key.';
  if (status >= 500) return 'Gemini is busy right now. Try again in a moment.';
  return message || `Gemini returned error ${status}.`;
}

async function callModel(model, key, prompt, temperature) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature }
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(explain(res.status, data?.error?.message));
    err.status = res.status;
    err.raw = data?.error?.message;
    throw err;
  }

  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  if (!text) {
    const err = new Error('Gemini returned an empty answer. Try rephrasing the food name.');
    err.status = 200;
    throw err;
  }
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    const err = new Error('Gemini sent an answer that was not valid JSON. Please try again.');
    err.status = 200;
    throw err;
  }
}

async function askGeminiJSON(prompt, { temperature = 0.4, kind } = {}) {
  if (String(process.env.DEMO_MODE).toLowerCase() === 'true') {
    return { ...demoAnswer(kind), demo: true };
  }

  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file and restart the server, or set DEMO_MODE=true to see sample results.');
  }

  let lastError;
  const tried = new Set();
  let listed = false;

  for (let round = 0; round < 3; round++) {
    for (const model of modelsToTry()) {
      if (tried.has(model)) continue;
      tried.add(model);
      try {
        const answer = await callModel(model, key, prompt, temperature);
        if (process.env.GEMINI_MODEL !== model) {
          console.log(`[gemini] using ${model}. Tip: put GEMINI_MODEL=${model} in .env`);
          process.env.GEMINI_MODEL = model; // remember for next requests
        }
        return answer;
      } catch (err) {
        lastError = err;
        console.warn(`[gemini] ${model} failed (${err.status}): ${err.raw || err.message}`);
        if (err.status === 404) learnFromMessage(err.raw);
        if (![404, 429, 500, 503].includes(err.status)) throw err;
      }
    }
    // Every known model failed: ask Google for the current list once
    if (!listed) { listed = true; await discoverModels(key); } else break;
  }
  throw lastError;
}

module.exports = { askGeminiJSON, modelsToTry, discoverModels };
