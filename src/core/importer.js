// Lógica de importação (usada pela tela de Importar e pela sync do Drive).
import { state } from "./state.js";
import { newCardObj } from "./srs.js";
import { uid } from "../utils/helpers.js";

export function resolveDeckByName(name) {
  const n = (name + "").trim();
  let deck = state.data.decks.find((d) => d.name.toLowerCase() === n.toLowerCase());
  if (!deck) {
    deck = { id: uid(), name: n, createdAt: Date.now() };
    state.data.decks.push(deck);
  }
  return deck;
}

export function normalizeCards(arr) {
  return (arr || []).map((c) => ({
    front: (c.front || c.frente || "").trim(),
    back: (c.back || c.verso || "").trim(),
    tags: Array.isArray(c.tags) ? c.tags.map((t) => (t + "").trim()).filter(Boolean) : [],
    sched: (typeof c.ease === "number" || typeof c.interval === "number")
      ? { ease: c.ease, interval: c.interval, reps: c.reps, lapses: c.lapses,
          due: c.due, lastReview: c.lastReview, suspended: c.suspended } : null,
  })).filter((c) => c.front && c.back);
}

// Interpreta os formatos aceitos e devolve grupos {deckId|name, cards}.
export function parseGroups(parsed, fallbackDeckId) {
  const groups = [];
  if (Array.isArray(parsed)) {
    groups.push({ deckId: fallbackDeckId, cards: parsed });
  } else if (Array.isArray(parsed.decks) && Array.isArray(parsed.cards) &&
             parsed.decks[0] && parsed.decks[0].id) {
    const idMap = {};
    for (const d of parsed.decks) idMap[d.id] = resolveDeckByName(d.name || "Deck importado").id;
    for (const d of parsed.decks)
      groups.push({ deckId: idMap[d.id], cards: parsed.cards.filter((c) => c.deckId === d.id) });
  } else if (Array.isArray(parsed.decks)) {
    for (const g of parsed.decks)
      groups.push({ name: g.deck || g.name || "Deck importado", cards: g.cards });
  } else if (Array.isArray(parsed.cards)) {
    if (parsed.deck) groups.push({ name: parsed.deck, cards: parsed.cards });
    else groups.push({ deckId: fallbackDeckId, cards: parsed.cards });
  }
  return groups;
}

// Aplica os grupos ao estado (sem persistir — quem chama decide o commit).
export function applyGroups(groups) {
  let added = 0;
  const newCards = [];
  for (const g of groups) {
    const deckId = g.deckId || resolveDeckByName(g.name).id;
    for (const c of normalizeCards(g.cards)) {
      const card = newCardObj(deckId, c.front, c.back, c.tags);
      if (c.sched) Object.assign(card, {
        ease: c.sched.ease ?? 2.5, interval: c.sched.interval ?? 0,
        reps: c.sched.reps ?? 0, lapses: c.sched.lapses ?? 0,
        due: c.sched.due ?? Date.now(), lastReview: c.sched.lastReview ?? null,
        suspended: !!c.sched.suspended,
      });
      newCards.push(card); added++;
    }
  }
  state.data.cards.push(...newCards);
  return added;
}

// Usado pela sync do Drive: aceita array puro como "Caixa de entrada".
export function ingestImport(parsed) {
  const groups = Array.isArray(parsed)
    ? [{ name: "Caixa de entrada", cards: parsed }]
    : parseGroups(parsed, null);
  return applyGroups(groups);
}
