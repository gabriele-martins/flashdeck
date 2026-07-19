// Algoritmo de repetição espaçada (SM-2) e classificação de estado do card.
import { DAY, MATURE_DAYS } from "../config.js";
import { uid } from "../utils/helpers.js";

export function scheduleCard(card, rating) {
  let ease = card.ease || 2.5, interval = card.interval || 0, reps = card.reps || 0;
  let lapses = card.lapses || 0;
  if (rating === 0) {
    if (interval >= 1) lapses += 1;
    reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2);
  } else if (rating === 1) {
    interval = Math.max(1, Math.round(interval * 1.2)) || 1;
    ease = Math.max(1.3, ease - 0.15); reps += 1;
  } else if (rating === 2) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
  } else {
    if (reps === 0) interval = 4;
    else interval = Math.round((interval || 1) * ease * 1.3);
    ease += 0.15; reps += 1;
  }
  const due = interval === 0 ? Date.now() : Date.now() + interval * DAY;
  return { ...card, ease, interval, reps, lapses, due, lastReview: Date.now() };
}

export function previewInterval(card, rating) {
  const s = scheduleCard(card, rating);
  if (s.interval === 0) return "agora";
  if (s.interval === 1) return "1 dia";
  if (s.interval < 30) return s.interval + " dias";
  if (s.interval < 365) return (s.interval / 30).toFixed(1) + " meses";
  return (s.interval / 365).toFixed(1) + " anos";
}

export const isDue = (c) => !c.due || c.due <= Date.now();
export const isNew = (c) => (c.reps || 0) === 0 && !c.lastReview;
export const isMature = (c) => (c.interval || 0) >= MATURE_DAYS;
export const cardState = (c) =>
  c.suspended ? "susp" : isNew(c) ? "new" : isMature(c) ? "mature" : "learn";
export const STATE_LABEL = { new: "Novo", learn: "Aprendendo", mature: "Maduro", susp: "Suspenso" };

export function newCardObj(deckId, front, back, tags) {
  return { id: uid(), deckId, front, back, tags: tags || [],
    ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now(),
    lastReview: null, suspended: false, createdAt: Date.now() };
}
