import { state } from "../../core/state.js";
import { DAY } from "../../config.js";
import { esc } from "../../utils/helpers.js";
import { deckStats, deckCards, forecast } from "../../core/stats.js";
import { isNew, isDue } from "../../core/srs.js";
import { topbarHtml, stat, chipHtml } from "../components.js";
import { renderDecks } from "./decks.js";

export function cardListHtml(deckId) {
  const q = state.cardSearch.toLowerCase();
  let cards = deckId ? deckCards(deckId) : state.data.cards;
  if (q) cards = cards.filter((c) =>
    c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q) ||
    (c.tags || []).some((t) => t.toLowerCase().includes(q)));
  if (!cards.length) return '<div class="fd-empty">Nenhum card' + (q ? " encontrado" : " ainda") + ".</div>";
  return cards.map((c) => {
    const nextTxt = c.suspended || isNew(c) ? "" :
      isDue(c) ? " · Pendente" : " · Em " + Math.max(1, Math.round((c.due - Date.now()) / DAY)) + "d";
    return '<div class="fd-item"><div style="flex:1;min-width:0">' +
      '<div class="fd-item-front">' + esc(c.front) + "</div>" +
      '<div class="fd-item-back">' + esc(c.back) + "</div>" +
      '<div class="fd-item-meta">' + chipHtml(c) +
      (c.tags || []).map((t) => '<span class="fd-chip tag">' + esc(t) + "</span>").join("") +
      '<span style="font-size:11px;color:var(--muted)" class="fd-display">Ease ' +
      (c.ease || 2.5).toFixed(2) + nextTxt + "</span></div></div>" +
      '<div class="fd-item-actions">' +
      '<button class="fd-mini" onclick="FD.editCard(\'' + c.id + '\')">Editar</button>' +
      '<button class="fd-mini mut" onclick="FD.resetCard(\'' + c.id + '\')">Resetar</button>' +
      '<button class="fd-mini mut" onclick="FD.toggleSuspend(\'' + c.id + '\')">' +
      (c.suspended ? "Reativar" : "Suspender") + "</button>" +
      '<button class="fd-mini del" onclick="FD.deleteCard(\'' + c.id + '\')">Excluir</button></div></div>';
  }).join("");
}

export function renderDeckDetail(deckId) {
  const deck = state.data.decks.find((d) => d.id === deckId);
  if (!deck) return renderDecks();
  document.getElementById("topbar").innerHTML = topbarHtml(deck.name, "#/decks");
  const st = deckStats(deckId);
  const fc = forecast(deckId, 14);
  const max = Math.max(1, ...fc);

  let html = '<div class="fd-statgrid">' +
    stat(st.due, "Pendentes hoje") + stat(st.news, "Novos") + stat(st.learn, "Aprendendo") +
    stat(st.mature, "Maduros") + stat(st.retention === null ? "—" : st.retention + "%", "Retenção") +
    stat(st.ease, "Ease médio") + "</div>";

  html += '<div class="fd-card"><label class="fd-label">Previsão para os próximos 14 dias</label>' +
    '<div class="fd-bars">' + fc.map((v, i) => {
      const d = new Date(Date.now() + i * DAY);
      return '<div class="fd-barcol"><div class="fd-bar" style="height:' +
        Math.round((v / max) * 100) + '%"></div><span class="fd-barlbl">' +
        (i === 0 ? "Hoje" : d.getDate()) + "</span></div>";
    }).join("") + "</div></div>";

  html += '<div class="fd-row-btns">' +
    '<button class="fd-btn" onclick="FD.navigate(\'#/cards/' + deckId + '\')">Adicionar cards</button>' +
    '<button class="fd-btn ghost" onclick="FD.navigate(\'#/importar/' + deckId + '\')">Importar cards</button>' +
    '<button class="fd-btn ghost" onclick="FD.renameDeck(\'' + deckId + '\')">Renomear</button>' +
    '<button class="fd-btn ghost" onclick="FD.downloadBackup(\'' + deckId + '\')">Exportar</button>' +
    '<button class="fd-btn danger" onclick="FD.deleteDeck(\'' + deckId + '\')">Excluir deck</button></div>';

  html += '<div class="fd-card" style="margin-top:16px">' +
    '<label class="fd-label">Cards (' + st.total + ")</label>" +
    '<input class="fd-input" placeholder="Buscar por texto ou tag" value="' + esc(state.cardSearch) +
    '" oninput="FD.filterCards(this.value)">' +
    '<div id="card-list">' + cardListHtml(deckId) + "</div></div>";
  return html;
}
