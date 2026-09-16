/* ============================================================
   CuniCoelho — Service Worker (v2)
   HTML: NETWORK-FIRST (app sempre atualiza com internet)
   Estáticos: CACHE-FIRST (100% offline)
   ============================================================ */

const CACHE_NAME = 'cunicoelho-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE_URLS.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { console.warn('[SW] Pré-cache falhou:', url, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const ehNavegacao =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (ehNavegacao) {
    event.respondWith((async () => {
      try {
        const rede = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', rede.clone());
        return rede;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match('./index.html')) ||
          new Response(
            '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<body style="background:#0a1526;color:#e9eefc;font-family:sans-serif;' +
            'display:grid;place-items:center;height:100vh;text-align:center">' +
            '<div><h1>🐰 CuniCoelho</h1><p>Você está offline.<br>' +
            'Abra o app uma vez com internet para habilitar o modo offline.</p></div>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cacheado = await cache.match(req);
    if (cacheado) return cacheado;
    try {
      const rede = await fetch(req);
      if (rede && (rede.ok || rede.type === 'opaque')) cache.put(req, rede.clone());
      return rede;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
