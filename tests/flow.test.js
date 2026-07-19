// Teste funcional do app modular, carregado via ESM real no jsdom.
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replace(/<script src="https:\/\/accounts[^<]*<\/script>/, "")
  .replace(/<script type="module"[^<]*<\/script>/, "")
  .replace(/<script>\s*if \("serviceWorker[\s\S]*?<\/script>/, "");

const dom = new JSDOM(html, {
  url: "https://gabriele-martins.github.io/flashdeck/",
  runScripts: "outside-only", pretendToBeVisual: true,
});
const w = dom.window;
global.window = w; global.document = w.document; global.location = w.location;
global.localStorage = w.localStorage;
w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });

// Carrega o main.js como módulo ES no contexto Node, apontando o DOM global.
await import(pathToFileURL(path.join(root, "src/main.js")).href);

const d = w.document, FD = w.FD, state = (await import(pathToFileURL(path.join(root, "src/core/state.js")).href)).state;
const tick = () => new Promise((r) => setTimeout(r, 10));
async function go(h) { w.location.hash = h; await tick(); }
let fails = 0;
const ok = (c, n) => { console.log((c ? "  ✓ " : "  ✗ FALHOU: ") + n); if (!c) fails++; };
const modalOk = () => FD.confirmModal();

console.log("== Boot ==");
ok(w.location.hash === "#/login", "abre no login");
FD.skipLogin(); await tick();
ok(w.location.hash === "#/decks", "sem conta vai para decks");

console.log("== Decks e cards ==");
d.getElementById("new-deck").value = "Angular"; FD.addDeck();
ok(state.data.decks.length === 1, "deck criado");
const deckId = state.data.decks[0].id;
await go("#/cards/" + deckId);
d.getElementById("card-front").value = "OnPush?";
d.getElementById("card-back").value = "Change detection";
d.getElementById("card-tags").value = "a, b";
d.getElementById("card-reversed").checked = true;
FD.saveCardForm();
ok(state.data.cards.length === 2, "card + reverso");
ok(state.data.cards[0].tags.length === 2, "tags");

console.log("== Exclusão (modal) ==");
FD.deleteCard(state.data.cards[0].id);
ok(d.querySelector(".fd-modal"), "modal abriu");
modalOk();
ok(state.data.cards.length === 1, "card excluído");

console.log("== Sessão ==");
await go("#/estudar");
d.querySelector(".deck-pick").checked = true;
FD.startSession(); await tick();
ok(w.location.hash === "#/sessao", "sessão iniciada");
FD.flip();
FD.rate(2);
ok(state.data.reviews.length === 1, "revisão registrada");
ok(d.body.textContent.includes("Sessão concluída"), "conclusão");

console.log("== Importar deck completo ==");
await go("#/importar");
d.getElementById("import-json").value = JSON.stringify({ deck: "Docker", cards: [{ front: "X", back: "Y" }] });
FD.doImport(deckId);
ok(state.data.decks.some((k) => k.name === "Docker"), "deck criado no import");

console.log("== Backup restore ==");
d.getElementById("import-json").value = JSON.stringify({ decks: [{ id: "o1", name: "RxJS" }], cards: [{ deckId: "o1", front: "M", back: "N", ease: 2.8, interval: 12 }] });
FD.doImport(deckId);
const rx = state.data.decks.find((k) => k.name === "RxJS");
ok(rx && state.data.cards.find((c) => c.deckId === rx.id).interval === 12, "agendamento preservado");

console.log("== Stats ==");
await go("#/stats");
ok(d.querySelectorAll(".fd-heat").length === 91, "heatmap 91 dias");

console.log("== Config ==");
await go("#/config");
FD.setTheme("dark");
ok(d.documentElement.dataset.theme === "dark", "tema dark");
FD.setNewPerDay("35");
ok(state.data.settings.newPerDay === 35, "novos/dia salvo");

console.log("== Excluir deck ==");
await go("#/deck/" + deckId);
FD.deleteDeck(deckId); modalOk(); await tick();
ok(!state.data.decks.some((k) => k.id === deckId), "deck excluído");

console.log(fails === 0 ? "\nTODOS OS TESTES PASSARAM ✅" : "\n" + fails + " FALHA(S) ❌");
process.exit(fails ? 1 : 0);
