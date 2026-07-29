const CACHE = 'ferramentaria-v6';
const STATIC = [
  '/Ferramentaria/manifest.json',
  '/Ferramentaria/bg-login.jpg',
  '/Ferramentaria/logo_nova_mills-removebg-preview.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // index.html — sempre da rede (nunca do cache)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/Ferramentaria/') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
    return;
  }

  // Firebase / CDN — sempre da rede
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('cdn.')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Demais estáticos — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
