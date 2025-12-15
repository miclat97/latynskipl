const CACHE_NAME = 'cat-game-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './face.jpeg',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(e.request).catch((error) => {
            console.error('Fetch failed:', error);
            // If offline and it's a navigation request, try serving index.html
            if (e.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
            throw error;
        });
      })
  );
});
