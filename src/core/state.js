// Estado central compartilhado + commit (única via de mutação persistida).
// Mantido como singleton mutável para simplicidade; telas leem daqui e
// chamam commit() para gravar + agendar sincronização.
import { loadLocal, saveLocal, DEFAULT_SETTINGS } from "./storage.js";

export const state = {
  data: { decks: [], cards: [], reviews: [], settings: { ...DEFAULT_SETTINGS }, updatedAt: 0 },
  loggedIn: false,
  sync: "local",
  session: null,
  editingCardId: null,
  cardSearch: "",
  drawerOpen: false,
};

// Callbacks injetados por outros módulos para evitar dependência circular.
const hooks = { render: () => {}, scheduleDriveSync: () => {} };
export function setHooks(h) { Object.assign(hooks, h); }

export function commit(next, skipRender) {
  next.updatedAt = Date.now();
  state.data = next;
  saveLocal(next);
  hooks.scheduleDriveSync();
  if (!skipRender) hooks.render();
}

export function initState() { state.data = loadLocal(); }
