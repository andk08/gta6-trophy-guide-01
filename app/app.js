// Leonida Trophy Guide — checklist, filters, spoiler mode and progress saving.
// Loads app/data/trophies.json (a local file) and nothing else; no network calls.
import { ROADMAP, KIND_LABELS } from "./roadmap.js";

const STORAGE_KEY = "leonida-trophy-guide-v1";
const cardsEl = document.getElementById("cards");
const searchEl = document.getElementById("search");
const gradeEl = document.getElementById("gradeFilter");
const spoilerEl = document.getElementById("spoilerToggle");
const earnedOnlyEl = document.getElementById("earnedOnly");
const resultCountEl = document.getElementById("resultCount");
const emptyNoteEl = document.getElementById("emptyNote");

let trophies = [];
let earned = new Set();
let openGuides = new Set();
let activeKind = "all";

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw) return;
    if (Array.isArray(raw.earned)) earned = new Set(raw.earned);
    if (typeof raw.spoiler === "boolean") spoilerEl.checked = raw.spoiler;
    if (typeof raw.earnedOnly === "boolean") earnedOnlyEl.checked = raw.earnedOnly;
  } catch {
    earned = new Set();
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ earned: [...earned], spoiler: spoilerEl.checked, earnedOnly: earnedOnlyEl.checked }),
  );
}

function isSpoilerMasked(trophy) {
  return spoilerEl.checked && trophy.kind.includes("story") && !earned.has(trophy.name);
}

function updateProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressText").textContent = `${done} of ${total} earned`;
  document.getElementById("progressPct").textContent = `${pct}%`;
  const fill = document.getElementById("progressFill");
  fill.style.width = `${pct}%`;
  document.getElementById("progressWrap").querySelector(".progress-bar").setAttribute("aria-valuenow", String(done));
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] ??= [0, 0];
    byGrade[t.grade][1] += 1;
    if (earned.has(t.name)) byGrade[t.grade][0] += 1;
  }
  document.getElementById("progressGrades").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => `${byGrade[g][0]}/${byGrade[g][1]} ${g}`)
    .join(" · ");
  document.getElementById("trackerProgress").textContent =
    `${done} of ${total} earned (${pct}%) — tick a trophy to mark it earned; progress saves in this browser.`;
}

function trophyMatches(trophy) {
  if (activeKind === "story" && !trophy.kind.includes("story")) return false;
  if (activeKind === "missable" && !trophy.missable) return false;
  if (activeKind === "collectibles" && !trophy.kind.includes("collectibles")) return false;
  if (activeKind === "activities" && !trophy.kind.includes("activities")) return false;
  if (activeKind === "side" && !trophy.kind.includes("side")) return false;
  if (gradeEl.value !== "all" && trophy.grade !== gradeEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(trophy.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(trophy.name.toLowerCase().includes(q) || trophy.description.toLowerCase().includes(q))) return false;
  return true;
}

function makeTag(text, cls) {
  const s = document.createElement("span");
  s.className = `tag${cls ? ` ${cls}` : ""}`;
  s.textContent = text;
  return s;
}

function buildCard(trophy) {
  const card = document.createElement("article");
  card.className = "card";
  card.id = `trophy-${trophy.id}`;
  card.dataset.name = trophy.name;
  if (earned.has(trophy.name)) card.classList.add("earned");

  const masked = isSpoilerMasked(trophy);

  const head = document.createElement("div");
  head.className = "card-head";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned.has(trophy.name);
  box.setAttribute("aria-label", `Mark ${trophy.name} as earned`);
  box.addEventListener("change", () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveState();
    renderCards();
  });
  const titleWrap = document.createElement("div");
  titleWrap.className = "card-title";
  const title = document.createElement("h3");
  title.textContent = masked ? "Hidden story trophy" : trophy.name;
  if (trophy.count != null && !masked) {
    const count = document.createElement("span");
    count.className = "trophy-count";
    count.textContent = ` · ${trophy.count.toLocaleString("en-US")} needed`;
    title.append(count);
  }
  titleWrap.append(title);
  const badge = document.createElement("span");
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  head.append(box, titleWrap, badge);
  card.append(head);

  if (masked) {
    const mask = document.createElement("p");
    mask.className = "spoiler-mask";
    mask.textContent = "Story trophy — its name and description stay hidden until you earn it (or turn off “Hide story spoilers”).";
    card.append(mask);
    return card;
  }

  const desc = document.createElement("p");
  desc.className = "card-desc";
  desc.textContent = trophy.description;
  card.append(desc);

  const tags = document.createElement("p");
  tags.className = "card-tags";
  for (const kind of trophy.kind) tags.append(makeTag(KIND_LABELS[kind] ?? kind));
  if (trophy.hidden) tags.append(makeTag("Hidden on PS5", "tag-hidden"));
  if (trophy.missable) tags.append(makeTag("⚠ Missable", "tag-missable"));
  tags.append(makeTag(`Roadmap stage ${trophy.stage}`, "tag-stage"));
  card.append(tags);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "guide-toggle";
  const isOpen = openGuides.has(trophy.id);
  toggle.textContent = isOpen ? "Hide guide ▲" : "Show guide ▼";
  toggle.setAttribute("aria-expanded", String(isOpen));
  const guideBox = document.createElement("div");
  guideBox.className = "guide";
  guideBox.hidden = !isOpen;
  const guideText = document.createElement("p");
  guideText.textContent = trophy.guide;
  guideBox.append(guideText);
  if (trophy.sources?.length) {
    const srcList = document.createElement("ul");
    srcList.className = "sources";
    for (const src of trophy.sources) {
      const li = document.createElement("li");
      li.textContent = "Source: ";
      const a = document.createElement("a");
      a.href = src.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = src.name;
      li.append(a);
      srcList.append(li);
    }
    guideBox.append(srcList);
  }
  toggle.addEventListener("click", () => {
    if (openGuides.has(trophy.id)) openGuides.delete(trophy.id);
    else openGuides.add(trophy.id);
    renderCards();
  });
  card.append(toggle, guideBox);
  return card;
}

function renderCards() {
  updateProgress();
  const visible = trophies.filter(trophyMatches);
  cardsEl.replaceChildren(...visible.map(buildCard));
  resultCountEl.textContent = `Showing ${visible.length} of ${trophies.length} trophies.`;
  emptyNoteEl.hidden = visible.length !== 0;
}

function renderRoadmap() {
  const list = document.getElementById("roadmap");
  for (const stage of ROADMAP) {
    const li = document.createElement("li");
    li.className = "stage";
    const num = document.createElement("span");
    num.className = "stage-num";
    num.textContent = String(stage.stage);
    const title = document.createElement("h3");
    title.textContent = stage.title;
    const time = document.createElement("p");
    time.className = "stage-time";
    time.textContent = stage.time;
    const summary = document.createElement("p");
    summary.textContent = stage.summary;
    const steps = document.createElement("ul");
    for (const step of stage.steps) {
      const item = document.createElement("li");
      item.textContent = step;
      steps.append(item);
    }
    const count = document.createElement("p");
    count.className = "stage-count";
    const earnedInStage = stage.trophies.filter((id) => earned.has(trophies.find((t) => t.id === id)?.name)).length;
    count.textContent = `${stage.trophies.length} trophies · ${earnedInStage} earned`;
    li.append(num, title, time, summary, steps, count);
    list.append(li);
  }
}

function openFromHash() {
  const match = window.location.hash.match(/^#trophy-(\d+)$/);
  if (!match) return;
  const id = Number(match[1]);
  if (!trophies.some((t) => t.id === id)) return;
  openGuides.add(id);
  renderCards();
  document.getElementById(`trophy-${id}`)?.scrollIntoView({ block: "start" });
}

function exportProgress() {
  const blob = new Blob(
    [JSON.stringify({ app: "leonida-trophy-guide", version: 1, exportedAt: new Date().toISOString(), earned: [...earned] }, null, 2)],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leonida-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error("not a progress file");
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    saveState();
    renderCards();
  } catch {
    alert("That file is not a Leonida Trophy Guide progress export.");
  }
}

document.getElementById("kindFilters").addEventListener("click", (event) => {
  const btn = event.target.closest(".kind-btn");
  if (!btn) return;
  activeKind = btn.dataset.kind;
  for (const b of document.querySelectorAll(".kind-btn")) b.classList.toggle("active", b === btn);
  renderCards();
});
gradeEl.addEventListener("change", renderCards);
searchEl.addEventListener("input", renderCards);
spoilerEl.addEventListener("change", () => {
  saveState();
  renderCards();
});
earnedOnlyEl.addEventListener("change", () => {
  saveState();
  renderCards();
});
document.getElementById("expandAll").addEventListener("click", () => {
  openGuides = new Set(trophies.filter(trophyMatches).map((t) => t.id));
  renderCards();
});
document.getElementById("collapseAll").addEventListener("click", () => {
  openGuides = new Set();
  renderCards();
});
document.getElementById("exportBtn").addEventListener("click", exportProgress);
document.getElementById("importFile").addEventListener("change", (e) => importProgress(e.target.files[0]));
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
  earned = new Set();
  saveState();
  renderCards();
});

const doc = await (await fetch("data/trophies.json")).json();
trophies = doc.trophies;
loadState();
renderRoadmap();
renderCards();
openFromHash();
window.addEventListener("hashchange", openFromHash);
