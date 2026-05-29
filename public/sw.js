const CACHE_NAME = 'aresfit-v1';

const CORE_ASSETS = [
  '/',
  '/home',
  '/fichas',
  '/evolucao',
  '/perfil',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação: Cacheia os assets principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estratégia híbrida
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requisições não-GET e extensões do Chrome
  if (event.request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Cache First para imagens e assets estáticos locais
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|css|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Network First para APIs do Supabase e navegação (Next.js App Router)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Salva a resposta nova no cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Se a rede falhar, busca do cache
        return caches.match(event.request);
      })
  );
});