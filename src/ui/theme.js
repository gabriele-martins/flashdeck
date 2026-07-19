// Tema claro/escuro/sistema.
import { state, commit } from "../core/state.js";

export function applyTheme() {
  const pref = state.data.settings.theme || "system";
  const dark = pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0F1219" : "#EEF1F6";
}

export function setTheme(pref) {
  commit({ ...state.data, settings: { ...state.data.settings, theme: pref } });
  applyTheme();
}

export function watchSystemTheme() {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
}
