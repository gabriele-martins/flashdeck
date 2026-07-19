import { topbarHtml } from "../components.js";

export function renderLogin() {
  document.getElementById("topbar").innerHTML = topbarHtml("FlashDeck");
  return (
    '<div class="fd-login">' +
    '<div class="fd-logo">Flash<em>Deck</em></div>' +
    "<p>Repetição espaçada com seus dados no seu Google Drive. Estude em qualquer dispositivo.</p>" +
    '<button class="fd-btn" onclick="FD.login()">Entrar com Google</button>' +
    '<button class="fd-btn ghost" onclick="FD.skipLogin()">Continuar sem conta</button>' +
    '<p class="fd-hint">Sem conta, os dados ficam salvos apenas neste dispositivo.</p>' +
    "</div>"
  );
}
