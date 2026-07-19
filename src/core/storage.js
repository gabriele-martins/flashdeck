// Persistência local (localStorage) + migração de esquema.
import { LOCAL_KEY } from "../config.js";

const DEFAULT_SETTINGS = { theme: "system", newPerDay: 20, leechThreshold: 8 };

export function migrate(d) {
  d = d || {};
  d.decks = d.decks || [];
  d.cards = (d.cards || []).map((c) => ({
    tags: [], suspended: false, lapses: 0, createdAt: c.createdAt || Date.now(), ...c,
  }));
  d.reviews = d.reviews || [];
  d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
  d.updatedAt = d.updatedAt || 0;
  return d;
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* dados corrompidos: recomeça limpo */ }
  return migrate({});
}

export function saveLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (e) {}
}

export { DEFAULT_SETTINGS };
