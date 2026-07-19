// Cache offline básico. Estratégia: network-first com fallback pro cache.
// Sempre tenta buscar a versão mais nova primeiro; só usa o cache quando
// está offline. Evita servir para sempre uma versão antiga de um arquivo
// (ícones, manifest, etc.) que tenha sido atualizada no servidor.
// Chamadas ao Google (auth/Drive) nunca passam por aqui.
const CACHE = "flashdeck-v3";
const ASSETS = [
  "./", "./index.html",
  "./assets/styles/tokens.css", "./assets/styles/app.css",
  "./src/main.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Google APIs passam direto
  e.respondWith(
    fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(e.request))
  );
});

