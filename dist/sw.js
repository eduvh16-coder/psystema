// Psystema — service worker: makes the app open fast and install on the home screen.
// It only caches the app's own files (and the fonts/libraries it loads). Patient data is never cached here:
// requests to Supabase and to the AI server always go to the network.
const VERSION = "psystema-202611100537";
const SHELL = ["./", "index.html", "app.css?v=202611100537", "vendor.js?v=202611100537", "app.js?v=202611100537", "config.js?v=202611100537", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const libre = /fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$/.test(url.hostname);
  if (!propio && !libre) return; // Supabase, AI, Google: always network
  if (req.mode === "navigate") {
    // pages: network first so updates arrive; cache as fallback when offline
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && (propio || libre)) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
    return r;
  })));
});
