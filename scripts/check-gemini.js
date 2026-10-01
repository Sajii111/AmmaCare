// Run with:  npm run check-gemini
// Tests your Gemini key against each model and prints exactly what Google says.
require('dotenv').config();
const { modelsToTry, discoverModels } = require('../lib/gemini');

(async () => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key || key === 'your_gemini_api_key_here') {
    console.log('No key found. Open .env and set GEMINI_API_KEY=your key');
    process.exit(1);
  }
  console.log(`Key found: ${key.slice(0, 6)}...${key.slice(-4)} (${key.length} characters)`);
  if (/\s|"|'/.test(process.env.GEMINI_API_KEY)) console.log('Warning: the key has spaces or quotes around it. Remove them.');

  const available = await discoverModels(key);
  if (available.length) console.log(`Flash models your key can use: ${available.join(', ')}`);

  for (const model of modelsToTry().slice(0, 5)) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the single word OK' }] }] })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        console.log(`OK      ${model}: "${text}"`);
      } else {
        console.log(`FAILED  ${model}: ${res.status} ${data?.error?.status || ''} - ${data?.error?.message || 'no message'}`);
      }
    } catch (err) {
      console.log(`FAILED  ${model}: could not connect (${err.message}). Check your internet connection.`);
    }
  }
})();
