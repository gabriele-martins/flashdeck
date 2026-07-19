// Cálculos de estatística (derivados do estado, sem efeitos colaterais).
import { state } from "./state.js";
import { DAY } from "../config.js";
import { isNew, isMature } from "./srs.js";
import { dayKey } from "../utils/helpers.js";

export const deckCards = (deckId) => state.data.cards.filter((c) => c.deckId === deckId);

export function deckStats(deckId) {
  const cards = deckId ? deckCards(deckId) : state.data.cards;
  const revs = state.data.reviews.filter((r) => (!deckId || r.deckId === deckId) && !r.cram);
  const ok = revs.filter((r) => r.r > 0).length;
  const active = cards.filter((c) => !c.suspended);
  const isDueLocal = (c) => !c.due || c.due <= Date.now();
  return {
    total: cards.length,
    news: active.filter(isNew).length,
    learn: active.filter((c) => !isNew(c) && !isMature(c)).length,
    mature: active.filter(isMature).length,
    susp: cards.filter((c) => c.suspended).length,
    due: active.filter((c) => !isNew(c) && isDueLocal(c)).length,
    retention: revs.length ? Math.round((ok / revs.length) * 100) : null,
    ease: active.length
      ? (active.reduce((s, c) => s + (c.ease || 2.5), 0) / active.length).toFixed(2) : "—",
  };
}

export function forecast(deckId, days) {
  const cards = (deckId ? deckCards(deckId) : state.data.cards)
    .filter((c) => !c.suspended && !isNew(c));
  const out = [];
  const start = new Date(); start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const a = start.getTime() + i * DAY, b = a + DAY;
    out.push(cards.filter((c) => (i === 0 ? c.due < b : c.due >= a && c.due < b)).length);
  }
  return out;
}

export function reviewsByDay(days) {
  const map = {};
  for (const r of state.data.reviews) map[dayKey(r.t)] = (map[dayKey(r.t)] || 0) + 1;
  const out = [];
  const start = new Date(); start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(start.getTime() - i * DAY);
    out.push({ key: k, count: map[k] || 0 });
  }
  return out;
}

export function streak() {
  const set = new Set(state.data.reviews.map((r) => dayKey(r.t)));
  let s = 0;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  let t = start.getTime();
  if (!set.has(dayKey(t))) t -= DAY;
  while (set.has(dayKey(t))) { s++; t -= DAY; }
  return s;
}
