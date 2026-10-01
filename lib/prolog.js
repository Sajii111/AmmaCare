// Runs the Prolog knowledge base (prolog/diagnosis.pl) with Tau-Prolog,
// a pure-JavaScript Prolog engine, so nothing extra has to be installed.

const fs = require('fs');
const path = require('path');
const pl = require('tau-prolog');

const PROGRAM = fs.readFileSync(path.join(__dirname, '..', 'prolog', 'diagnosis.pl'), 'utf8');

// Turn a Tau-Prolog term into a plain JS value (atom -> string, number -> number)
function value(term) {
  if (!term) return null;
  if (typeof term.value !== 'undefined') return Number(term.value);
  return term.id;
}

function query(goal, limit = 500) {
  return new Promise((resolve, reject) => {
    const session = pl.create(200000);
    const fail = err => reject(new Error('Prolog error: ' + (session.format_answer ? session.format_answer(err) : String(err))));

    session.consult(PROGRAM, {
      success() {
        session.query(goal, {
          success() {
            const answers = [];
            const next = () => session.answer({
              success(answer) {
                answers.push(answer.links);
                if (answers.length >= limit) resolve(answers); else next();
              },
              fail() { resolve(answers); },
              error: fail,
              limit() { reject(new Error('Prolog step limit reached')); }
            });
            next();
          },
          error: fail
        });
      },
      error: fail
    });
  });
}

let symptomCache = null;

async function listSymptoms() {
  if (!symptomCache) {
    const rows = await query('symptom(Id, Label, Group).');
    symptomCache = rows.map(r => ({ id: value(r.Id), label: value(r.Label), group: value(r.Group) }));
  }
  return symptomCache;
}

let condSymptoms = null;

async function conditionSymptoms() {
  if (!condSymptoms) {
    const rows = await query('cond_symptom(Id, S).', 2000);
    condSymptoms = {};
    for (const r of rows) (condSymptoms[value(r.Id)] ||= []).push(value(r.S));
  }
  return condSymptoms;
}

async function diagnose(symptomIds, group) {
  const known = new Set((await listSymptoms()).map(s => s.id));
  // Only pass known atoms into the query (prevents Prolog injection)
  const ids = [...new Set(symptomIds)].filter(id => known.has(id));
  if (!ids.length) return { results: [], emergency: [] };

  const g = group === 'child' ? 'child' : 'pregnancy';
  const list = `[${ids.join(',')}]`;
  const bySymptoms = await conditionSymptoms();

  const rows = await query(
    `suggest(${list}, ${g}, Id, Name, Doctor, Advice, Matched, Total, Score), final_urgency(${list}, Id, Urgency), specialty(Id, Specialty).`
  );
  const results = rows
    .map(r => {
      const id = value(r.Id);
      return {
        id,
        name: value(r.Name),
        doctor: value(r.Doctor),
        advice: value(r.Advice),
        matched: value(r.Matched),
        total: value(r.Total),
        score: value(r.Score),
        urgency: value(r.Urgency),
        specialty: value(r.Specialty),
        matchedSymptoms: (bySymptoms[id] || []).filter(s => ids.includes(s))
      };
    })
    .sort((a, b) => b.score - a.score || b.matched - a.matched)
    .slice(0, 4);

  const flags = await query(`emergency(${list}, Reason).`);
  const emergency = [...new Set(flags.map(f => value(f.Reason)))];

  return { results, emergency };
}

module.exports = { listSymptoms, diagnose };
