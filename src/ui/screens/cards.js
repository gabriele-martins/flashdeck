import { state } from "../../core/state.js";
import { esc } from "../../utils/helpers.js";
import { topbarHtml, infoBtn } from "../components.js";
import { navigate } from "../router.js";

export function renderCardsScreen(deckId) {
  const decks = state.data.decks;
  if (!decks.length) { navigate("#/decks"); return ""; }
  const deck = decks.find((d) => d.id === deckId) || decks[0];
  const editing = state.editingCardId
    ? state.data.cards.find((c) => c.id === state.editingCardId) : null;
  document.getElementById("topbar").innerHTML =
    topbarHtml(editing ? "Editar card" : "Cadastro de cards", "#/deck/" + deck.id);

  let html = '<div class="fd-card"><div class="fd-formgrid">' +
    '<div class="span2"><label class="fd-label">Deck</label>' +
    '<select class="fd-input" id="card-deck">' +
    decks.map((d) => '<option value="' + d.id + '"' +
      (d.id === (editing ? editing.deckId : deck.id) ? " selected" : "") + ">" +
      esc(d.name) + "</option>").join("") + "</select></div>" +
    '<div><label class="fd-label">Frente</label>' +
    '<textarea class="fd-textarea" id="card-front" placeholder="Pergunta ou conceito">' +
    (editing ? esc(editing.front) : "") + "</textarea></div>" +
    '<div><label class="fd-label">Verso</label>' +
    '<textarea class="fd-textarea" id="card-back" placeholder="Resposta">' +
    (editing ? esc(editing.back) : "") + "</textarea></div>" +
    '<div class="span2"><label class="fd-label">Tags</label>' +
    '<input class="fd-input" id="card-tags" placeholder="Ex.: entrevista, básico (separe por vírgula)" value="' +
    (editing ? esc((editing.tags || []).join(", ")) : "") + '"></div>';
  if (!editing) {
    html += '<div class="span2" style="display:flex;align-items:center">' +
      '<label class="fd-check" style="flex:1"><input type="checkbox" id="card-reversed"> Criar card reverso</label>' +
      infoBtn("info-reverso") + "</div>" +
      '<div class="fd-infobox span2" id="info-reverso">Cria dois cards de uma vez: um pergunta → resposta e outro resposta → pergunta. Útil para vocabulário e traduções. Para conceitos técnicos, normalmente não é necessário.</div>';
  }
  html += "</div>";
  html += '<div class="fd-row-btns">' +
    '<button class="fd-btn" onclick="FD.saveCardForm()">' + (editing ? "Salvar alterações" : "Adicionar card") + "</button>" +
    (editing ? '<button class="fd-btn ghost" onclick="FD.cancelEditCard()">Cancelar edição</button>' : "") +
    "</div></div>";
  html += '<p class="fd-hint" style="margin-top:12px">Os cards ficam listados na tela do deck. Para importar em lote, use Importar no menu.</p>';
  return html;
}
