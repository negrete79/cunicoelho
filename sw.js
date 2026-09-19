/* CuniCoelho 2.0 — service worker cache-first, 100% offline */
const VERSAO = 'cunicoelho-v2.0.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(cache => Promise.allSettled(ASSETS.map(a => cache.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const hit = await cache.match(req);
    if (hit) return hit; // cache first
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        // guarda fontes do Google e assets da própria origem para visitas futuras offline
        if (req.url.startsWith(self.location.origin) || req.url.includes('fonts.g')) {
          cache.put(req, res.clone());
        }
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const fb = (await cache.match('./index.html')) || (await cache.match('./'));
        if (fb) return fb; // fallback para index.html
      }
      return new Response('Offline', { status: 503 });
    }
  })());
});
