// Ponto de entrada: monta o namespace FD (usado por handlers inline),
// injeta hooks entre módulos e faz o boot.
import { state, commit, setHooks, initState } from "./core/state.js";
import { applyTheme, setTheme, watchSystemTheme } from "./ui/theme.js";
import { navigate, parseRoute, setRouterRender, initRouter } from "./ui/router.js";
import { renderDrawer, toggleDrawer, closeDrawer, toggleInfo, confirmModal, closeModal } from "./ui/components.js";
import { scheduleDriveSync, setDriveRender, syncNow } from "./platform/drive.js";
import { gisLoaded, login, logout, setAuthRender } from "./platform/auth.js";
import * as actions from "./ui/actions.js";
import * as session from "./ui/session.js";

import { renderLogin } from "./ui/screens/login.js";
import { renderDecks } from "./ui/screens/decks.js";
import { renderDeckDetail } from "./ui/screens/deckDetail.js";
import { renderCardsScreen } from "./ui/screens/cards.js";
import { renderImport } from "./ui/screens/import.js";
import { renderStudySetup } from "./ui/screens/study.js";
import { renderSession } from "./ui/screens/sessionScreen.js";
import { renderStats } from "./ui/screens/stats.js";
import { renderConfig } from "./ui/screens/config.js";

function render() {
  const route = parseRoute();
  const app = document.getElementById("app");
  let html = "";
  switch (route.name) {
    case "login": html = renderLogin(); break;
    case "deck": html = renderDeckDetail(route.param); break;
    case "cards": html = renderCardsScreen(route.param); break;
    case "importar": html = renderImport(route.param); break;
    case "config": html = renderConfig(); break;
    case "estudar": html = renderStudySetup(); break;
    case "sessao": html = renderSession(); break;
    case "stats": html = renderStats(); break;
    default: html = renderDecks();
  }
  app.innerHTML = html;
  renderDrawer();
  if (route.name === "sessao") session.bindSwipe();
}

// Namespace exposto para os onclick inline do HTML gerado.
window.FD = {
  render, navigate, toggleDrawer, closeDrawer, toggleInfo, confirmModal, closeModal,
  login, logout, syncNow, setTheme,
  ...actions, ...session,
};
window.gisLoaded = gisLoaded;

// Injeta os hooks que quebram dependências circulares.
setHooks({ render, scheduleDriveSync });
setRouterRender(render);
setDriveRender(render);
setAuthRender(render);
session.setSessionRender(render);

// Boot
initState();
applyTheme();
watchSystemTheme();
initRouter();
session.initKeyboard();
if (!location.hash) {
  const skip = localStorage.getItem("flashdeck-skiplogin") === "1";
  const logged = localStorage.getItem("flashdeck-logged") === "1";
  location.hash = (skip || logged) ? "#/decks" : "#/login";
}
render();
