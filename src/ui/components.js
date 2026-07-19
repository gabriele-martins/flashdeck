// Componentes de UI compartilhados: toast, modal, topbar, drawer, helpers.
import { state } from "../core/state.js";
import { esc } from "../utils/helpers.js";
import { cardState, STATE_LABEL } from "../core/srs.js";
import { syncIndicatorHtml } from "../platform/drive.js";
import { navigate, parseRoute } from "./router.js";

/* ---- toast ---- */
export function toast(msg) {
  const slot = document.getElementById("toast-slot");
  if (!slot) return;
  slot.innerHTML = '<div class="fd-toast">' + esc(msg) + "</div>";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (slot.innerHTML = ""), 2600);
}

/* ---- modal (substitui confirm/prompt nativos) ---- */
let modalOk = null;
export function showModal(o) {
  modalOk = o.onOk || null;
  const slot = document.getElementById("modal-slot");
  slot.innerHTML =
    '<div class="fd-modal-ov" onclick="if(event.target===this)FD.closeModal()"><div class="fd-modal">' +
    "<h3>" + esc(o.title) + "</h3>" +
    (o.message ? "<p>" + esc(o.message) + "</p>" : "") +
    (o.input ? '<input class="fd-input" id="modal-input" style="margin-top:10px" value="' + esc(o.value || "") + '">' : "") +
    '<div class="fd-row-btns">' +
    '<button class="fd-btn ghost" onclick="FD.closeModal()">Cancelar</button>' +
    '<button class="fd-btn' + (o.danger ? " danger" : "") + '" onclick="FD.confirmModal()">' +
    esc(o.okLabel || "Confirmar") + "</button></div></div></div>";
  const inp = document.getElementById("modal-input");
  if (inp) { inp.focus(); inp.select();
    inp.onkeydown = (e) => { if (e.key === "Enter") confirmModal(); }; }
}
export function closeModal() { document.getElementById("modal-slot").innerHTML = ""; modalOk = null; }
export function confirmModal() {
  const inp = document.getElementById("modal-input");
  const v = inp ? inp.value : null;
  const fn = modalOk;
  closeModal();
  if (fn) fn(v);
}

/* ---- helpers visuais ---- */
export function toggleInfo(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("show");
}
export function infoBtn(boxId) {
  return '<button class="fd-info-btn" onclick="FD.toggleInfo(\'' + boxId + '\')" aria-label="Mais informações">i</button>';
}
export function chipHtml(c) {
  const st = cardState(c);
  return '<span class="fd-chip ' + st + '">' + STATE_LABEL[st] + "</span>";
}
export function stat(v, label) {
  return '<div class="fd-stat"><b class="fd-display">' + v + "</b><span>" + label + "</span></div>";
}

/* ---- topbar + drawer ---- */
export function topbarHtml(title, backHash) {
  return (
    '<button class="fd-burger" onclick="FD.toggleDrawer()" aria-label="Menu"><span></span><span></span><span></span></button>' +
    (backHash ? '<button class="fd-back" onclick="FD.navigate(\'' + backHash + '\')">‹</button>' : "") +
    "<h1>" + esc(title) + "</h1>" + syncIndicatorHtml()
  );
}
export function toggleDrawer() { state.drawerOpen = !state.drawerOpen; renderDrawer(); }
export function closeDrawer() { state.drawerOpen = false; renderDrawer(); }
export function renderDrawer() {
  const route = parseRoute().name || "decks";
  const nav = (hash, label, match) =>
    '<button class="fd-navitem' + (route === match ? " active" : "") +
    '" onclick="FD.navigate(\'' + hash + '\')">' + label + "</button>";
  let html = "<h2>Flash<span style='color:var(--accent-ink)'>Deck</span></h2>";
  html += nav("#/decks", "Decks", "decks");
  html += nav("#/estudar", "Estudar", "estudar");
  html += nav("#/stats", "Estatísticas", "stats");
  html += nav("#/importar", "Importar", "importar");
  html += nav("#/config", "Configurações", "config");
  const drawer = document.getElementById("drawer");
  drawer.innerHTML = html;
  drawer.classList.toggle("open", state.drawerOpen);
  document.getElementById("overlay").classList.toggle("show", state.drawerOpen);
}
