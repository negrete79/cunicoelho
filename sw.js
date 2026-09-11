const CACHE='cunicoelho-v1';
const CORE=['./','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  if(['style','script','image','font'].includes(req.destination)){
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{
      const rede=fetch(req).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res}).catch(()=>hit);
      return hit||rede}));
    return}
  e.respondWith(fetch(req).then(res=>{
    if(res&&res.status===200&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}
    return res}).catch(()=>caches.match(req,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))));
});
