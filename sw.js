/* ============================================================
   CuniCoelho — Service Worker (v1)
   Estratégias:
   - HTML (navegação): NETWORK-FIRST → app sempre atualiza ao
     abrir com internet; se offline, cai para o cache.
   - Estáticos (CSS/JS/imagens): CACHE-FIRST → velocidade e
     funcionamento 100% offline.
   - skipWaiting + clients.claim → nova versão assume na hora.
   ============================================================ */

const CACHE_NAME = 'cunicoelho-v1';

/* Pré-cache do shell do app */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ---------- INSTALL: pré-cache + assume a ativação ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // add individual com try/catch: um arquivo faltando não trava o install
    await Promise.all(PRECACHE_URLS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[SW] Pré-cache falhou para:', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

/* ---------- ACTIVATE: limpa caches antigos + claim ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(
      nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

/* ---------- FETCH: roteamento por tipo de requisição ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só intercepta GET (POST/PUT vão direto para a rede)
  if (req.method !== 'GET') return;

  const ehNavegacao =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  /* ===== HTML → NETWORK-FIRST ===== */
  if (ehNavegacao) {
    event.respondWith((async () => {
      try {
        const rede = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        // guarda a versão mais nova do HTML para o próximo offline
        cache.put('./index.html', rede.clone());
        return rede;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match('./index.html')) ||
          (await cache.match('index.html')) ||
          new Response(
            '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<body style="background:#0a1830;color:#e7eefc;font-family:sans-serif;' +
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

  /* ===== Estáticos → CACHE-FIRST ===== */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cacheado = await cache.match(req);
    if (cacheado) return cacheado;

    try {
      const rede = await fetch(req);
      // Cacha em runtime: same-origin ok e cross-origin opaco (ex.: CDN jsPDF)
      if (rede && (rede.ok || rede.type === 'opaque')) {
        cache.put(req, rede.clone());
      }
      return rede;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
