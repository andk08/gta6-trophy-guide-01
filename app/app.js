// GTA VI trophy tracker: checklist, filters, spoiler setting, roadmap hooks, export/import.
// All progress lives in this browser (localStorage); the guide data comes from data/trophies.json.
const KEY = 'gta6-trophy-checklist-v1';
const SPOILER_KEY = 'gta6-trophy-spoilers-v1';
const listEl = document.getElementById('trophy-list');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const missableOnlyEl = document.getElementById('missable-only');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilersEl = document.getElementById('spoilers');
const kindsEl = document.getElementById('kinds');
const metaEl = document.getElementById('list-meta');
const savedNote = document.getElementById('saved-note');

const KIND_LABELS = {
  story: 'Story',
  quests: 'Side quests',
  collectibles: 'Collectibles',
  activities: 'Activities',
  misc: 'Misc',
};

let trophies = [];
let earned = new Set(readStoredEarned());
let kind = 'all';
let openGuideId = null;
let demoView = null;

function readStoredEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  savedNote.textContent = 'Progress saved in this browser.';
}

function readStoredSpoilers() {
  const raw = localStorage.getItem(SPOILER_KEY);
  return raw === null ? true : raw === '1';
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, spoilersEl.checked ? '1' : '0');
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function isStorySpoiler(t) {
  return spoilersEl.checked && t.kind === 'story' && !earned.has(t.name);
}

function trophyMatches(t) {
  if (kind !== 'all' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (missableOnlyEl.checked && !t.missable) return false;
  if (hideEarnedEl.checked && earned.has(t.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABELS[t.kind] ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function makeSourceLinks(t) {
  const wrap = document.createElement('p');
  wrap.className = 'sources';
  wrap.textContent = 'Sources: ';
  (t.sources ?? []).forEach((s, i) => {
    if (i > 0) wrap.append(', ');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    wrap.append(a);
  });
  return wrap;
}

function makeCard(t) {
  const card = document.createElement('article');
  card.className = 'trophy-card';
  card.id = `trophy-${t.id}`;
  if (earned.has(t.name)) card.classList.add('earned');
  if (t.missable) card.classList.add('missable-card');
  if (openGuideId === t.id) card.classList.add('highlighted');

  const head = document.createElement('div');
  head.className = 'card-head';

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    saveEarned();
    render();
  });
  head.append(box);

  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${t.grade}`;
  badge.textContent = t.grade === 'platinum' ? 'P' : t.grade.charAt(0).toUpperCase();
  badge.title = gradeLabel(t);
  head.append(badge);

  const titles = document.createElement('div');
  titles.className = 'titles';
  const name = document.createElement('h3');
  name.textContent = isStorySpoiler(t) ? 'Hidden story trophy' : t.name;
  titles.append(name);
  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = isStorySpoiler(t)
    ? 'Hidden on PlayStation until earned — tick it off (or turn spoilers off) to reveal it.'
    : t.description;
  titles.append(desc);
  head.append(titles);
  card.append(head);

  const tags = document.createElement('p');
  tags.className = 'tags';
  const tagTexts = [`${gradeLabel(t)}`, KIND_LABELS[t.kind] ?? t.kind];
  if (t.hidden) tagTexts.push('Hidden on PS5');
  if (typeof t.count === 'number') tagTexts.push(`Target: ${t.count.toLocaleString('en-US')}`);
  for (const text of tagTexts) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text;
    tags.append(tag);
  }
  if (t.missable) {
    const flag = document.createElement('span');
    flag.className = 'tag missable-tag';
    flag.textContent = '⚠ Possibly missable';
    tags.append(flag);
  }
  card.append(tags);

  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = isStorySpoiler(t) ? '' : t.guide;
  if (isStorySpoiler(t)) guide.hidden = true;
  card.append(guide);
  if (!isStorySpoiler(t)) card.append(makeSourceLinks(t));
  return card;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  document.getElementById('earned-count').textContent = String(done);
  document.getElementById('earned-pct').textContent = total ? `${Math.round((done / total) * 100)}%` : '0%';
  document.getElementById('progress-fill').style.width = total ? `${(done / total) * 100}%` : '0%';
  const counts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => {
      const gTotal = trophies.filter((t) => t.grade === g).length;
      const gDone = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
      return `${gDone}/${gTotal} ${g}`;
    })
    .join(' · ');
  document.getElementById('grade-counts').textContent = counts;
}

function render() {
  renderProgress();
  listEl.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  for (const t of shown) listEl.append(makeCard(t));
  const total = trophies.length;
  metaEl.textContent = shown.length === total
    ? `Showing all ${total} trophies.`
    : `Showing ${shown.length} of ${total} trophies.`;
}

function applyDemoParams() {
  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  if (seed) {
    const ids = new Set(seed.split(',').map((s) => Number(s.trim())).filter(Number.isFinite));
    for (const t of trophies) if (ids.has(t.id)) earned.add(t.name);
    saveEarned();
  }
  const spoilers = params.get('spoilers');
  if (spoilers === 'on' || spoilers === 'off') {
    spoilersEl.checked = spoilers === 'on';
    saveSpoilers();
  }
  const kindParam = params.get('kind');
  if (kindParam && (kindParam === 'all' || KIND_LABELS[kindParam])) kind = kindParam;
  const guideParam = params.get('guide');
  if (guideParam) {
    const id = Number(guideParam);
    if (Number.isFinite(id) && trophies.some((t) => t.id === id)) openGuideId = id;
  }
  // Remembered for after render, when the list exists and layout is final.
  demoView = params.get('view');
}

function syncKindButtons() {
  for (const btn of kindsEl.querySelectorAll('.kind-btn')) {
    btn.classList.toggle('active', btn.dataset.kind === kind);
  }
}

async function init() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;

  spoilersEl.checked = readStoredSpoilers();
  spoilersEl.addEventListener('change', () => { saveSpoilers(); render(); });
  searchEl.addEventListener('input', render);
  gradeEl.addEventListener('change', render);
  missableOnlyEl.addEventListener('change', render);
  hideEarnedEl.addEventListener('change', render);
  kindsEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.kind-btn');
    if (!btn) return;
    kind = btn.dataset.kind;
    syncKindButtons();
    render();
  });

  document.getElementById('export').addEventListener('click', () => {
    const payload = JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(names)) throw new Error('bad file');
      const known = new Set(trophies.map((t) => t.name));
      earned = new Set(names.filter((n) => known.has(n)));
      saveEarned();
      savedNote.textContent = `Imported ${earned.size} earned trophies.`;
    } catch {
      savedNote.textContent = 'That file could not be imported — expected the exported JSON.';
    }
    event.target.value = '';
    render();
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!earned.size) return;
    earned = new Set();
    saveEarned();
    render();
  });

  applyDemoParams();
  syncKindButtons();
  render();
  if (demoView === 'roadmap') {
    document.getElementById('roadmap')?.scrollIntoView();
  } else if (demoView === 'list') {
    document.querySelector('.controls')?.scrollIntoView();
  } else if (openGuideId !== null) {
    document.getElementById(`trophy-${openGuideId}`)?.scrollIntoView({ block: 'center' });
  }
}

init();
