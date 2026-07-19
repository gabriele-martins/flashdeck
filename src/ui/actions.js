// Handlers de ação chamados pela UI (via namespace FD).
import { state, commit } from "../core/state.js";
import { migrate } from "../core/storage.js";
import { newCardObj } from "../core/srs.js";
import { parseGroups, applyGroups } from "../core/importer.js";
import { uid } from "../utils/helpers.js";
import { toast, showModal } from "./components.js";
import { navigate, parseRoute } from "./router.js";
import { cardListHtml } from "./screens/deckDetail.js";

/* ---- decks ---- */
export function addDeck() {
  const el = document.getElementById("new-deck");
  const name = el.value.trim();
  if (!name) return;
  commit({ ...state.data, decks: [...state.data.decks, { id: uid(), name, createdAt: Date.now() }] });
  toast('Deck "' + name + '" criado');
}
export function renameDeck(id) {
  const deck = state.data.decks.find((d) => d.id === id);
  showModal({ title: "Renomear deck", input: true, value: deck.name, okLabel: "Salvar",
    onOk: (name) => {
      if (!name || !name.trim()) return;
      commit({ ...state.data, decks: state.data.decks.map((d) =>
        d.id === id ? { ...d, name: name.trim() } : d) });
    } });
}
export function deleteDeck(id) {
  const deck = state.data.decks.find((d) => d.id === id);
  const n = state.data.cards.filter((c) => c.deckId === id).length;
  showModal({ title: "Excluir deck", danger: true, okLabel: "Excluir",
    message: 'O deck "' + deck.name + '" e seus ' + n + " cards serão excluídos. Essa ação não pode ser desfeita.",
    onOk: () => {
      commit({ ...state.data,
        decks: state.data.decks.filter((d) => d.id !== id),
        cards: state.data.cards.filter((c) => c.deckId !== id) });
      navigate("#/decks");
    } });
}

/* ---- cards ---- */
const parseTags = (s) => (s || "").split(",").map((t) => t.trim()).filter(Boolean);

export function saveCardForm() {
  const deckId = document.getElementById("card-deck").value;
  const front = document.getElementById("card-front").value.trim();
  const back = document.getElementById("card-back").value.trim();
  const tags = parseTags(document.getElementById("card-tags").value);
  const reversed = document.getElementById("card-reversed");
  if (!deckId) { toast("Escolha um deck."); return; }
  if (!front || !back) { toast("Preencha frente e verso."); return; }
  if (state.editingCardId) {
    commit({ ...state.data, cards: state.data.cards.map((c) =>
      c.id === state.editingCardId ? { ...c, deckId, front, back, tags } : c) });
    state.editingCardId = null;
    toast("Card atualizado");
  } else {
    const newCards = [newCardObj(deckId, front, back, tags)];
    if (reversed && reversed.checked) newCards.push(newCardObj(deckId, back, front, tags));
    commit({ ...state.data, cards: [...state.data.cards, ...newCards] });
    toast(newCards.length === 2 ? "2 cards criados (normal e reverso)" : "Card adicionado");
  }
  const f = document.getElementById("card-front"), b = document.getElementById("card-back");
  if (f) { f.value = ""; b.value = ""; f.focus(); }
}
export function editCard(id) {
  const c = state.data.cards.find((x) => x.id === id);
  state.editingCardId = id;
  navigate("#/cards/" + c.deckId);
}
export function cancelEditCard() { state.editingCardId = null; window.FD.render(); }
export function deleteCard(id) {
  showModal({ title: "Excluir card", danger: true, okLabel: "Excluir",
    message: "Este card será excluído permanentemente.",
    onOk: () => {
      if (state.editingCardId === id) state.editingCardId = null;
      commit({ ...state.data, cards: state.data.cards.filter((c) => c.id !== id) });
      toast("Card excluído");
    } });
}
export function resetCard(id) {
  showModal({ title: "Resetar aprendizado", okLabel: "Resetar",
    message: "O card volta ao estado de novo e entra na fila de novos cards outra vez. O histórico de revisões é mantido.",
    onOk: () => {
      commit({ ...state.data, cards: state.data.cards.map((c) => c.id === id
        ? { ...c, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now(),
            lastReview: null, suspended: false } : c) });
      toast("Card resetado");
    } });
}
export function toggleSuspend(id) {
  commit({ ...state.data, cards: state.data.cards.map((c) =>
    c.id === id ? { ...c, suspended: !c.suspended } : c) });
}
export function filterCards(v) {
  state.cardSearch = v;
  const holder = document.getElementById("card-list");
  if (holder) holder.innerHTML = cardListHtml(parseRoute().param);
}

/* ---- import / export ---- */
export function doImport(fallbackDeckId) {
  const txt = document.getElementById("import-json").value;
  let parsed;
  try { parsed = JSON.parse(txt); }
  catch { toast("JSON inválido. Baixe o template para ver o formato."); return; }
  const groups = parseGroups(parsed, fallbackDeckId);
  if (!groups.length) { toast("Formato não reconhecido. Baixe o template."); return; }
  const snapshot = { ...state.data, decks: [...state.data.decks], cards: [...state.data.cards] };
  state.data = snapshot;
  const added = applyGroups(groups);
  if (!added) { toast("Nenhum card válido encontrado no JSON."); return; }
  commit(state.data);
  toast(added + " cards importados");
  const ta = document.getElementById("import-json");
  if (ta) ta.value = "";
}
export function downloadTemplate() {
  const tpl = { deck: "Nome do deck", cards: [
    { front: "Pergunta 1", back: "Resposta 1", tags: ["opcional"] },
    { front: "Pergunta 2", back: "Resposta 2" },
  ] };
  downloadJson(tpl, "flashdeck-template.json");
}
export function downloadBackup(deckId) {
  let payload;
  if (deckId) {
    const deck = state.data.decks.find((d) => d.id === deckId);
    payload = { deck: deck.name, exportedAt: new Date().toISOString(),
      cards: state.data.cards.filter((c) => c.deckId === deckId) };
  } else payload = { exportedAt: new Date().toISOString(), ...state.data };
  downloadJson(payload, deckId ? "flashdeck-deck.json" : "flashdeck-backup.json");
  toast("Backup baixado");
}
function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
export function resetAll() {
  showModal({ title: "Apagar tudo", danger: true, okLabel: "Apagar tudo",
    message: "Todos os decks, cards e o histórico serão apagados, inclusive no Drive. Essa ação não pode ser desfeita.",
    onOk: () => { commit(migrate({ settings: state.data.settings })); navigate("#/decks"); } });
}
export function setNewPerDay(v) {
  const n = Math.max(0, Math.min(500, parseInt(v || "0", 10) || 0));
  commit({ ...state.data, settings: { ...state.data.settings, newPerDay: n } }, true);
}
export function skipLogin() { localStorage.setItem("flashdeck-skiplogin", "1"); navigate("#/decks"); }
