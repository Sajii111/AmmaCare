// Illustrated article covers drawn in SVG, so articles look good with no photos.
// To use a real photo instead, save it as public/images/articles/<article id>.jpg
// (for example public/images/articles/iron-rich-foods.jpg) and it is used automatically.

const PALETTES = {
  Pregnancy: { bg: '#F1DCD2', a: '#A8432A', b: '#E3A58F', c: '#4F6B44', d: '#FAF5EB' },
  Toddlers: { bg: '#DCE4CF', a: '#4F6B44', b: '#A3B18A', c: '#C9982F', d: '#FAF5EB' },
  Nutrition: { bg: '#F3E4C4', a: '#C9982F', b: '#A8432A', c: '#4F6B44', d: '#FAF5EB' },
  Wellbeing: { bg: '#E8DDD0', a: '#8B6A4A', b: '#A3B18A', c: '#E3A58F', d: '#FAF5EB' }
};

function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
}

const leaf = (x, y, s, r, fill, vein) => `
  <g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M0 -50 C30 -25 30 25 0 50 C-30 25 -30 -25 0 -50Z" fill="${fill}"/>
    <path d="M0 -44 V44" stroke="${vein}" stroke-width="2" opacity=".55"/>
  </g>`;

// One simple centre motif per category
const MOTIFS = {
  Pregnancy: p => {
    // A lotus (nelum) flower
    const petal = (r, fill) => `<path d="M400 300 C370 250 380 190 400 160 C420 190 430 250 400 300Z" fill="${fill}" transform="rotate(${r} 400 300)"/>`;
    return `
    <circle cx="400" cy="260" r="125" fill="${p.d}"/>
    ${petal(-62, p.b)}${petal(62, p.b)}${petal(-32, p.a)}${petal(32, p.a)}${petal(0, p.a)}
    <path d="M320 318 Q400 346 480 318" stroke="${p.c}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  },
  Toddlers: p => `
    <circle cx="400" cy="265" r="120" fill="${p.d}"/>
    <path d="M320 250h160a80 80 0 0 1-160 0Z" fill="${p.a}"/>
    <circle cx="370" cy="238" r="16" fill="${p.c}"/><circle cx="405" cy="232" r="13" fill="${p.b}"/><circle cx="435" cy="240" r="15" fill="${p.c}"/>
    <path d="M470 200l60-60" stroke="${p.b}" stroke-width="10" stroke-linecap="round"/>`,
  Nutrition: p => `
    <circle cx="400" cy="265" r="120" fill="${p.d}"/>
    <circle cx="400" cy="265" r="82" fill="none" stroke="${p.a}" stroke-width="10"/>
    <path d="M400 205c28 16 32 56 0 80-32-24-28-64 0-80Z" fill="${p.c}"/>
    <circle cx="362" cy="300" r="18" fill="${p.b}"/><circle cx="440" cy="302" r="14" fill="${p.a}"/>`,
  Wellbeing: p => `
    <circle cx="400" cy="265" r="120" fill="${p.d}"/>
    <path d="M400 330c-60-40-80-80-50-110 20-20 40-10 50 10 10-20 30-30 50-10 30 30 10 70-50 110Z" fill="${p.c}"/>
    <path d="M300 360h200" stroke="${p.a}" stroke-width="8" stroke-linecap="round"/>`
};

export function coverSVG(article) {
  const p = PALETTES[article.category] || PALETTES.Wellbeing;
  const rnd = seeded(article.id);
  const colours = [p.a, p.b, p.c];
  let leaves = '';
  for (let i = 0; i < 7; i++) {
    const left = i % 2 === 0;
    const x = left ? 40 + rnd() * 200 : 560 + rnd() * 200;
    const y = 40 + rnd() * 420;
    leaves += leaf(x, y, 0.8 + rnd() * 1.4, Math.round(rnd() * 360), colours[i % 3], p.d);
  }
  const motif = (MOTIFS[article.category] || MOTIFS.Wellbeing)(p);
  return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${article.category} illustration">
    <rect width="800" height="500" fill="${p.bg}"/>
    <circle cx="${120 + rnd() * 560}" cy="${rnd() * 120}" r="${120 + rnd() * 80}" fill="${p.d}" opacity=".45"/>
    ${leaves}
    ${motif}
  </svg>`;
}

// Put either the photo (if it exists) or the illustration into a container
export function fillCover(el, article) {
  el.innerHTML = coverSVG(article);
  const img = new Image();
  img.alt = '';
  img.onload = () => { el.innerHTML = ''; el.appendChild(img); };
  img.src = article.image || `images/articles/${article.id}.jpg`;
}
