import { state } from "../../core/state.js";
import { esc } from "../../utils/helpers.js";
import { deckStats } from "../../core/stats.js";
import { topbarHtml } from "../components.js";

export function renderDecks() {
  document.getElementById("topbar").innerHTML = topbarHtml("Decks");
  const d = state.data;
  let html = "";
  if (!d.decks.length)
    html += '<div class="fd-empty">Nenhum deck ainda. Crie o primeiro abaixo.</div>';
  for (const deck of d.decks) {
    const st = deckStats(deck.id);
    html +=
      '<div class="fd-deck-row" onclick="FD.navigate(\'#/deck/' + deck.id + '\')"><div>' +
      '<div class="fd-deck-name">' + esc(deck.name) + "</div>" +
      '<div class="fd-counts" style="margin-top:4px">' +
      '<span class="fd-count-due">' + st.due + " para revisar</span>" +
      '<span class="fd-count-new">' + st.news + " novos</span>" +
      '<span class="fd-count-total">' + st.total + " no total</span>" +
      "</div></div><span class='fd-display' style='color:var(--muted);font-size:20px'>›</span></div>";
  }
  html +=
    '<div class="fd-card" style="margin-top:16px">' +
    '<label class="fd-label">Novo deck</label>' +
    '<div style="display:flex;gap:8px">' +
    '<input class="fd-input" id="new-deck" placeholder="Nome do deck" ' +
    'onkeydown="if(event.key===\'Enter\')FD.addDeck()">' +
    '<button class="fd-btn" onclick="FD.addDeck()" style="flex-shrink:0">Criar</button></div></div>';
  return html;
}
