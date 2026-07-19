// Login Google (GIS). Isolado aqui para que o wrapper nativo possa
// substituir por seu próprio fluxo de auth sem tocar no resto do app.
import { GOOGLE_CLIENT_ID, DRIVE_SCOPE, SCOPE_VERSION, isConfigured } from "../config.js";
import { state } from "../core/state.js";
import { toast } from "../ui/components.js";
import { navigate } from "../ui/router.js";
import { pullFromDrive, setSync, handleSyncError, resetDriveCache } from "./drive.js";

let accessToken = null, tokenExpiry = 0, tokenClient = null;
let renderRef = () => {};
export function setAuthRender(fn) { renderRef = fn; }

// Inicialização preguiçosa: o script do Google (async) e este módulo
// carregam sem ordem garantida entre si. Em vez de depender só do
// callback onload="gisLoaded()", criamos o tokenClient também na hora
// do clique em Entrar, se ainda não existir. Idempotente.
function ensureTokenClient() {
  if (tokenClient) return true;
  if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) return false;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE, callback: () => {},
  });
  return true;
}

export function gisLoaded() {
  if (!isConfigured()) return;
  if (!ensureTokenClient()) return;
  if (localStorage.getItem("flashdeck-logged") === "1" &&
      localStorage.getItem("flashdeck-scopev") === SCOPE_VERSION) {
    requestToken("").then(onLoggedIn).catch(() => {});
  }
}

function requestToken(prompt) {
  return new Promise((resolve, reject) => {
    if (!ensureTokenClient())
      return reject(new Error("GIS ainda carregando. Aguarde um instante e tente de novo."));
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(resp);
      if (!google.accounts.oauth2.hasGrantedAllScopes(resp, DRIVE_SCOPE))
        return reject(new Error("noscope"));
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (resp.expires_in - 60) * 1000;
      resolve(accessToken);
    };
    tokenClient.error_callback = (err) => reject(err);
    tokenClient.requestAccessToken({ prompt });
  });
}

export async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  return requestToken("");
}

export async function login() {
  if (!isConfigured()) { toast("Configure o GOOGLE_CLIENT_ID em src/config.js."); return; }
  try {
    await requestToken("consent");
    localStorage.setItem("flashdeck-logged", "1");
    localStorage.setItem("flashdeck-scopev", SCOPE_VERSION);
    await onLoggedIn();
  } catch (e) {
    if (e && e.message === "noscope")
      toast("Marque a caixa de acesso ao Google Drive na tela de permissão e tente de novo.");
    else if (e && /ainda carregando/.test(e.message || ""))
      toast(e.message);
    else toast("Login cancelado ou bloqueado.");
  }
}

export async function onLoggedIn() {
  state.loggedIn = true;
  if (location.hash === "#/login" || !location.hash) navigate("#/decks");
  setSync("syncing");
  try { await pullFromDrive(); setSync("synced"); toast("Conectado ao Google Drive"); }
  catch (e) { console.error(e); handleSyncError(e); }
  renderRef();
}

export function logout() {
  if (accessToken) { try { google.accounts.oauth2.revoke(accessToken, () => {}); } catch (e) {} }
  accessToken = null;
  resetDriveCache();
  state.loggedIn = false;
  localStorage.removeItem("flashdeck-logged");
  setSync("local");
  toast("Desconectado. Os dados continuam salvos neste dispositivo.");
  renderRef();
}
