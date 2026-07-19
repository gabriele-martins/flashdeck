import { state } from "../../core/state.js";
import { esc } from "../../utils/helpers.js";
import { deckStats } from "../../core/stats.js";
import { topbarHtml, infoBtn } from "../components.js";

export function renderStudySetup() {
  document.getElementById("topbar").innerHTML = topbarHtml("Estudar");
  const decks = state.data.decks;
  if (!decks.length)
    return '<div class="fd-empty">Crie um deck primeiro.</div>' +
      '<div class="fd-row-btns"><button class="fd-btn primary-solo" onclick="FD.navigate(\'#/decks\')">Ir para Decks</button></div>';
  let html = '<div class="fd-card"><label class="fd-label">Decks</label>' +
    '<label class="fd-check"><input type="checkbox" onchange="document.querySelectorAll(\'.deck-pick\').forEach(b=>b.checked=this.checked)"> <b>Todos</b></label>' +
    decks.map((d) => {
      const st = deckStats(d.id);
      return '<label class="fd-check"><input type="checkbox" class="deck-pick" value="' + d.id + '"> ' +
        esc(d.name) + ' <span style="color:var(--muted);font-size:13px;margin-left:auto" class="fd-display">' +
        st.due + " + " + st.news + " novos</span></label>";
    }).join("") + "</div>";
  html += '<div class="fd-card" style="margin-top:14px">' +
    '<div class="fd-labelrow"><label class="fd-label">Modo</label>' + infoBtn("info-modo") + "</div>" +
    '<div class="fd-infobox" id="info-modo"><b>Revisão normal</b>: mostra os cards pendentes de hoje e os novos do dia; suas respostas definem quando cada card volta (repetição espaçada). <b>Cram</b>: passa por todos os cards selecionados sem mexer nas datas de revisão. Bom para véspera de prova ou entrevista.</div>' +
    '<label class="fd-check"><input type="radio" name="mode" checked> Revisão normal</label>' +
    '<label class="fd-check"><input type="radio" name="mode" id="mode-cram"> Cram</label></div>';
  html += '<div class="fd-card" style="margin-top:14px">' +
    '<label class="fd-label">Tempo de estudo</label>' +
    '<input class="fd-input" type="number" min="1" max="180" id="study-minutes" placeholder="Sem limite" style="max-width:160px">' +
    '<p class="fd-hint">Em minutos. Ao acabar o tempo, a sessão encerra e os cards não vistos continuam pendentes, priorizados na próxima sessão.</p></div>';
  html += '<div class="fd-row-btns"><button class="fd-btn primary-solo" onclick="FD.startSession()">Começar sessão</button></div>';
  return html;
}
