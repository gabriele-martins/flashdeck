import { state } from "../../core/state.js";
import { esc } from "../../utils/helpers.js";
import { topbarHtml } from "../components.js";

export function renderImport(deckId) {
  const decks = state.data.decks;
  document.getElementById("topbar").innerHTML = topbarHtml("Importar");
  if (!decks.length)
    return '<div class="fd-empty">Crie um deck primeiro.</div>' +
      '<div class="fd-row-btns"><button class="fd-btn primary-solo" onclick="FD.navigate(\'#/decks\')">Ir para Decks</button></div>';
  const sel = decks.find((d) => d.id === deckId) || decks[0];
  let html = '<div class="fd-card">' +
    '<label class="fd-label">Deck de destino</label>' +
    '<select class="fd-input" id="import-deck">' +
    decks.map((d) => '<option value="' + d.id + '"' + (d.id === sel.id ? " selected" : "") + ">" +
      esc(d.name) + "</option>").join("") + "</select>" +
    '<p class="fd-hint">Usado quando o JSON é só uma lista de cards. Decks completos e backups criam os decks automaticamente.</p>' +
    '<label class="fd-label">JSON</label>' +
    '<textarea class="fd-textarea" id="import-json" style="min-height:150px" placeholder="Cole o JSON aqui"></textarea>' +
    '<div class="fd-row-btns">' +
    '<button class="fd-btn" onclick="FD.doImport(document.getElementById(\'import-deck\').value)">Importar</button>' +
    '<button class="fd-btn ghost" onclick="FD.downloadTemplate()">Baixar template</button></div>' +
    '<p class="fd-hint">Também aceita o arquivo de backup do app, restaurando todos os decks. Arquivos flashdeck-import-*.json no seu Google Drive são importados automaticamente ao sincronizar.</p></div>';
  return html;
}
