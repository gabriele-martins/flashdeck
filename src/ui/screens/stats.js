import { state } from "../../core/state.js";
import { DAY } from "../../config.js";
import { deckStats, forecast, reviewsByDay, streak } from "../../core/stats.js";
import { topbarHtml, stat } from "../components.js";

export function renderStats() {
  document.getElementById("topbar").innerHTML = topbarHtml("Estatísticas");
  const st = deckStats(null);
  const sk = streak();
  const days = reviewsByDay(91);
  const maxHeat = Math.max(1, ...days.map((d) => d.count));
  const last14 = days.slice(-14);
  const max14 = Math.max(1, ...last14.map((d) => d.count));
  const totalRevs = state.data.reviews.length;
  const okRevs = state.data.reviews.filter((r) => r.r > 0).length;

  let html = '<div class="fd-statgrid">' +
    stat(sk + (sk === 1 ? " dia" : " dias"), "Streak") +
    stat(st.due, "Pendentes hoje") +
    stat(totalRevs, "Revisões totais") +
    stat(totalRevs ? Math.round((okRevs / totalRevs) * 100) + "%" : "—", "Acerto geral") +
    stat(st.total, "Cards") + stat(st.susp, "Suspensos") + "</div>";

  html += '<div class="fd-card"><label class="fd-label">Atividade nos últimos 3 meses</label>' +
    '<div class="fd-heatmap">' + days.map((d) => {
      const lvl = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / maxHeat) * 4));
      return '<div class="fd-heat' + (lvl ? " h" + lvl : "") + '" title="' + d.key + ": " + d.count + '"></div>';
    }).join("") + "</div></div>";

  html += '<div class="fd-card" style="margin-top:14px"><label class="fd-label">Revisões nos últimos 14 dias</label>' +
    '<div class="fd-bars">' + last14.map((d, i) =>
      '<div class="fd-barcol"><div class="fd-bar" style="height:' +
      Math.round((d.count / max14) * 100) + '%"></div><span class="fd-barlbl">' +
      (i === 13 ? "Hoje" : d.key.slice(8)) + "</span></div>"
    ).join("") + "</div></div>";

  html += '<div class="fd-card" style="margin-top:14px"><label class="fd-label">Cards por estado</label>' +
    '<div class="fd-statgrid" style="margin-bottom:0">' +
    stat(st.news, "Novos") + stat(st.learn, "Aprendendo") + stat(st.mature, "Maduros") + "</div></div>";

  const fc = forecast(null, 14), maxF = Math.max(1, ...fc);
  html += '<div class="fd-card" style="margin-top:14px"><label class="fd-label">Previsão para os próximos 14 dias</label>' +
    '<div class="fd-bars">' + fc.map((v, i) => {
      const d = new Date(Date.now() + i * DAY);
      return '<div class="fd-barcol"><div class="fd-bar" style="height:' +
        Math.round((v / maxF) * 100) + '%"></div><span class="fd-barlbl">' +
        (i === 0 ? "Hoje" : d.getDate()) + "</span></div>";
    }).join("") + "</div></div>";
  return html;
}
