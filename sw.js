/* Harrquivo service worker — mude VERSAO a cada publicação */
const VERSAO = "2026.11.16-1";
const CACHE = "harrquivo-" + VERSAO;
const IMG = "harrquivo-img";
const ARQUIVOS = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest", "data/catalogo.json", "data/harr.enc.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
  "fonts/cinzel-latin-600-normal.woff2", "fonts/cinzel-latin-700-normal.woff2", "fonts/spectral-latin-400-normal.woff2",
  "fonts/spectral-latin-400-italic.woff2", "fonts/spectral-latin-600-normal.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARQUIVOS.map(a => c.add(new Request(a, { cache: "reload" })).catch(() => {})))));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== IMG) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message", e => { if (e.data === "ativar") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const ehImg = /\/img\//.test(req.url);
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && !ehImg) (await caches.open(CACHE)).put(req, r.clone());
      return r;
    } catch {
      if (req.mode === "navigate") return caches.match("index.html");
      return new Response("", { status: 504 });
    }
  })());
});
