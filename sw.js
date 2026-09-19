/* ============================================================
   LEPUS — Service Worker
   Ao ATUALIZAR o app no servidor, mude a versão abaixo
   (ex.: lepus-v2) para o celular baixar a nova versão.
   ============================================================ */
const CACHE = 'lepus-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Instalação: guarda o "shell" do app (falha de um item não trava o resto) */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

/* Ativação: limpa caches de versões antigas */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Estratégia de rede */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Navegação (abrir o app): rede primeiro, cache como reserva */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  /* Demais recursos (ícones, manifest): cache primeiro, atualiza em segundo plano */
  e.respondWith(
    caches.match(req).then(hit => {
      const rede = fetch(req)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || rede;
    })
  );
});
