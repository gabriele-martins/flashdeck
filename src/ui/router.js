// Roteamento por hash. render() é injetado no boot.
import { state } from "../core/state.js";

let renderRef = () => {};
export function setRouterRender(fn) { renderRef = fn; }

export function navigate(hash) {
  if (location.hash === hash) renderRef();
  else location.hash = hash;
}

export function parseRoute() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  return { name: parts[0] || "", param: parts[1] ? decodeURIComponent(parts[1]) : null };
}

export function initRouter() {
  window.addEventListener("hashchange", () => {
    state.drawerOpen = false;
    state.editingCardId = null;
    state.cardSearch = "";
    renderRef();
  });
}
