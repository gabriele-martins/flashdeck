import { state } from "../../core/state.js";
import { topbarHtml, infoBtn } from "../components.js";

export function renderConfig() {
  document.getElementById("topbar").innerHTML = topbarHtml("Configurações");
  const s = state.data.settings;
  let html = '<div class="fd-card"><label class="fd-label">Aparência</label>' +
    '<div class="fd-seg">' +
    ["light|Claro", "system|Sistema", "dark|Escuro"].map((o) => {
      const [v, l] = o.split("|");
      return '<button class="' + (s.theme === v ? "on" : "") + '" onclick="FD.setTheme(\'' + v + '\')">' + l + "</button>";
    }).join("") + "</div></div>";

  html += '<div class="fd-card" style="margin-top:14px">' +
    '<div class="fd-labelrow"><label class="fd-label">Novos cards por dia</label>' + infoBtn("info-newday") + "</div>" +
    '<div class="fd-infobox" id="info-newday">Limita quantos cards inéditos entram nas sessões a cada dia. Sem limite, importar 100 cards de uma vez criaria sessões enormes e uma avalanche de revisões nos dias seguintes. As revisões de cards já vistos nunca são limitadas.</div>' +
    '<input class="fd-input" type="number" min="0" max="500" style="margin-top:8px;max-width:140px" value="' +
    s.newPerDay + '" onchange="FD.setNewPerDay(this.value)"></div>';

  html += '<div class="fd-card" style="margin-top:14px"><label class="fd-label">Conta e sincronização</label>' +
    '<p class="fd-hint" style="margin:2px 0 0">' +
    (state.loggedIn ? "Conectada ao Google Drive. Os dados sincronizam automaticamente."
      : "Sem conta conectada. Os dados estão salvos apenas neste dispositivo.") + "</p>" +
    '<div class="fd-row-btns">' +
    (state.loggedIn
      ? '<button class="fd-btn ghost" onclick="FD.syncNow()">Sincronizar agora</button>' +
        '<button class="fd-btn ghost" onclick="FD.logout()">Sair da conta Google</button>'
      : '<button class="fd-btn" onclick="FD.login()">Entrar com Google</button>') +
    "</div></div>";

  html += '<div class="fd-card" style="margin-top:14px"><label class="fd-label">Dados</label>' +
    '<div class="fd-row-btns">' +
    '<button class="fd-btn ghost" onclick="FD.downloadBackup()">Backup</button>' +
    '<button class="fd-btn danger" onclick="FD.resetAll()">Apagar tudo</button>' +
    "</div></div>";
  return html;
}
