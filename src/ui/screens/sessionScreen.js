import { state } from "../../core/state.js";
import { esc, fmtTime } from "../../utils/helpers.js";
import { previewInterval } from "../../core/srs.js";
import { topbarHtml } from "../components.js";
import { currentCard } from "../session.js";
import { navigate } from "../router.js";

export function renderSession() {
  const s = state.session;
  if (!s) { navigate("#/estudar"); return ""; }
  document.getElementById("topbar").innerHTML = topbarHtml(s.cram ? "Cram" : "Estudando");
  const card = currentCard();
  if (!card) {
    const pct = s.done ? Math.round((s.correct / s.done) * 100) : 0;
    return '<div class="fd-empty" style="padding-top:60px">' +
      "<h2 class='fd-display' style='margin:10px 0 6px'>" +
      (s.timeUp ? "Tempo esgotado" : "Sessão concluída") + "</h2>" +
      "<p>" + s.done + " cards revisados · " + pct + "% de acerto</p>" +
      (s.timeUp ? '<p class="fd-hint" style="margin-top:8px">Os cards não vistos continuam pendentes e serão priorizados na próxima sessão.</p>' : "") +
      "</div>" +
      '<div class="fd-row-btns"><button class="fd-btn primary-solo" onclick="FD.endSession()">Voltar</button></div>';
  }
  const total = s.queue.length + s.done;
  const pct = Math.round((s.done / total) * 100);
  let html = '<div class="fd-progresswrap"><div class="fd-progressbar"><div style="width:' + pct + '%"></div></div>' +
    '<div class="fd-progress">' + (s.done + 1) + " de " + total +
    '<span id="session-timer">' + (s.endsAt ? " · " + fmtTime(s.endsAt - Date.now()) : "") + "</span></div></div>";
  html += '<div class="fd-study-card" id="study-card" onclick="FD.flip()">' +
    (s.cram ? '<span class="fd-cram-badge">CRAM</span>' : "") +
    '<div class="fd-study-text">' + esc(card.front) + "</div>" +
    (s.flipped
      ? '<div class="fd-divider"></div><div class="fd-study-answer">' + esc(card.back) + "</div>"
      : '<div class="fd-hint">Toque para revelar</div>') +
    "</div>";
  if (s.flipped) {
    const ratings = [
      [0, "De novo", "var(--again)", "left"], [1, "Difícil", "var(--hard)", "down"],
      [2, "Bom", "var(--good)", "right"], [3, "Fácil", "var(--easy)", "up"],
    ];
    html += '<div class="fd-ratings">' + ratings.map(([r, label, color, dir]) =>
      '<button class="fd-rating" style="background:' + color + '" onclick="FD.rateAnimated(' + r + ",'" + dir + "')\">" +
      "<b>" + label + "</b><span>" + (s.cram ? "Livre" : previewInterval(card, r)) + "</span></button>"
    ).join("") + "</div>";
    if ("ontouchstart" in window)
      html += '<div class="fd-swipehint"><span>← De novo</span><span>↓ Difícil</span><span>→ Bom</span><span>↑ Fácil</span></div>';
  }
  html += '<div class="fd-row-btns"><button class="fd-btn ghost primary-solo" onclick="FD.endSession()">Encerrar sessão</button></div>';
  return html;
}
