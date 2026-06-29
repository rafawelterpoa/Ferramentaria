const CACHE = 'ferramentaria-v4';
const STATIC = [
  '/Ferramentaria/',
  '/Ferramentaria/index.html',
  '/Ferramentaria/manifest.json',
  '/Ferramentaria/bg-login.jpg',
  '/Ferramentaria/logo_nova_mills-removebg-preview.png'
];

// Instala e cacheia os arquivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Firebase = network-first | estáticos = cache-first
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase e SheetJS — sempre tenta a rede
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('sheetjs') || url.hostname.includes('cdn.')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Arquivos locais — cache-first, fallback para index.html
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/Ferramentaria/index.html'));
    })
  );
});

// Escuta mensagem para forçar atualização
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
