// Sessão de estudo: fila, avaliação, swipe, teclado e cronômetro.
import { state, commit } from "../core/state.js";
import { scheduleCard, isNew, isDue } from "../core/srs.js";
import { shuffle, dayKey } from "../utils/helpers.js";
import { toast } from "./components.js";
import { navigate, parseRoute } from "./router.js";

let sessionTimerInt = null;
let renderRef = () => {};
export function setSessionRender(fn) { renderRef = fn; }

function newIntroducedToday() {
  const today = dayKey(Date.now());
  return state.data.reviews.filter((r) => r.n && !r.cram && dayKey(r.t) === today).length;
}

export function startTimer() {
  clearInterval(sessionTimerInt);
  if (!state.session || !state.session.endsAt) return;
  sessionTimerInt = setInterval(() => {
    const s = state.session;
    if (!s || !s.endsAt) { clearInterval(sessionTimerInt); return; }
    const left = s.endsAt - Date.now();
    if (left <= 0) {
      clearInterval(sessionTimerInt);
      s.timeUp = true; s.queue = []; s.flipped = false;
      renderRef();
      return;
    }
    const el = document.getElementById("session-timer");
    if (el) el.textContent = " · " + fmtTimeLocal(left);
  }, 1000);
}
function fmtTimeLocal(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}

export function startSession() {
  const boxes = [...document.querySelectorAll(".deck-pick:checked")];
  const deckIds = boxes.map((b) => b.value);
  const cram = document.getElementById("mode-cram").checked;
  const minutes = parseInt((document.getElementById("study-minutes") || {}).value || "0", 10) || 0;
  if (!deckIds.length) { toast("Selecione ao menos um deck."); return; }
  const pool = state.data.cards.filter((c) => deckIds.includes(c.deckId) && !c.suspended);
  let queue;
  if (cram) {
    queue = shuffle(pool).map((c) => c.id);
  } else {
    let due = pool.filter((c) => !isNew(c) && isDue(c));
    due = minutes > 0 ? due.sort((a, b) => (a.due || 0) - (b.due || 0)) : shuffle(due);
    const allowed = Math.max(0, (state.data.settings.newPerDay || 0) - newIntroducedToday());
    const news = pool.filter(isNew)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(0, allowed);
    queue = [...due, ...news].map((c) => c.id);
  }
  if (!queue.length) { toast(cram ? "Nenhum card nesses decks." : "Nada pendente nesses decks hoje."); return; }
  state.session = { deckIds, cram, queue, done: 0, correct: 0, flipped: false,
    endsAt: minutes > 0 ? Date.now() + minutes * 60000 : null, timeUp: false };
  startTimer();
  navigate("#/sessao");
}
export function currentCard() {
  const s = state.session;
  if (!s) return null;
  return state.data.cards.find((c) => c.id === s.queue[0]) || null;
}
export function flip() {
  if (!state.session || state.session.flipped) return;
  state.session.flipped = true;
  renderRef();
}
export function rate(rating) {
  const s = state.session;
  const card = currentCard();
  if (!s || !card) return;
  const entry = { t: Date.now(), cardId: card.id, deckId: card.deckId,
    r: rating, n: isNew(card) ? 1 : 0, cram: s.cram ? 1 : 0 };
  let cards = state.data.cards;
  if (!s.cram) {
    let updated = scheduleCard(card, rating);
    if ((updated.lapses || 0) >= (state.data.settings.leechThreshold || 8) && !updated.suspended) {
      updated = { ...updated, suspended: true,
        tags: updated.tags.includes("leech") ? updated.tags : [...updated.tags, "leech"] };
      toast('Card marcado como leech e suspenso (muitos erros).');
    }
    cards = cards.map((c) => (c.id === card.id ? updated : c));
  }
  let reviews = [...state.data.reviews, entry];
  if (reviews.length > 20000) reviews = reviews.slice(reviews.length - 20000);
  const rest = s.queue.slice(1);
  s.queue = rating === 0 ? [...rest, card.id] : rest;
  if (rating !== 0) { s.done += 1; s.correct += 1; }
  s.flipped = false;
  commit({ ...state.data, cards, reviews });
}
export function rateAnimated(rating, dir) {
  const el = document.getElementById("study-card");
  if (el) { el.classList.add("out-" + dir); setTimeout(() => rate(rating), 170); }
  else rate(rating);
}
export function endSession() { clearInterval(sessionTimerInt); state.session = null; navigate("#/estudar"); }

/* ---- swipe (mobile) ---- */
let touchStart = null;
export function bindSwipe() {
  const el = document.getElementById("study-card");
  if (!el) return;
  el.addEventListener("touchstart", (e) => {
    touchStart = [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart[0];
    const dy = e.changedTouches[0].clientY - touchStart[1];
    touchStart = null;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 60) return;
    if (!state.session || !state.session.flipped) { flip(); return; }
    if (ax > ay) rateAnimated(dx > 0 ? 2 : 0, dx > 0 ? "right" : "left");
    else rateAnimated(dy < 0 ? 3 : 1, dy < 0 ? "up" : "down");
  }, { passive: true });
}

/* ---- teclado (desktop) ---- */
export function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (parseRoute().name !== "sessao" || !state.session) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); flip(); return; }
    if (state.session.flipped && ["1", "2", "3", "4"].includes(e.key)) {
      const map = { "1": 0, "2": 1, "3": 2, "4": 3 };
      const dirs = { 0: "left", 1: "down", 2: "right", 3: "up" };
      rateAnimated(map[e.key], dirs[map[e.key]]);
    }
  });
}
