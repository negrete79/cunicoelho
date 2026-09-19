/* ============================================================
   LEPUS — Service Worker
   Ao atualizar o app no servidor, mude a versão abaixo
   (ex.: lepus-v4) para o celular baixar a nova versão.
   ============================================================ */
const CACHE = 'lepus-v3';

/* Mesma URL exata das fontes usada no index.html */
const FONTE_CSS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,650;1,9..144,500&family=Outfit:wght@400;500;600;700&display=swap';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-16.png',
  './icon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  FONTE_CSS
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Navegação (abrir o app): cache primeiro = abre instantâneo offline;
     quando há internet, atualiza o cache em segundo plano. */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(hit => {
        const rede = fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then(c => c.put('./index.html', copia));
            }
            return res;
          })
          .catch(() => hit || caches.match('./'));
        return hit || rede;
      })
    );
    return;
  }

  /* Demais recursos (ícones, fontes, manifest): cache primeiro,
     revalida em segundo plano quando online. */
  e.respondWith(
    caches.match(req).then(hit => {
      const rede = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            caches.open(CACHE).then(c => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => hit);
      return hit || rede;
    })
  );
});
