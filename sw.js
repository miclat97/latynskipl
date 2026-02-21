var CACHE_VERSION = 'v82';
var CACHE_PREFIX = 'latynskipl-cache-';
var CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

var ASSETS = [
  "/",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon.ico",
  "/index.html",
  "/profile.jpg",
  "/script.js",
  "/site.webmanifest",
  "/style.css",
  "/koci_bananiarz/index.html",
  "/koci_bananiarz/style.css",
  "/koci_bananiarz/game.js",
  "/koci_bananiarz/face.jpeg",
  "/koci_bananiarz/manifest.json"
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      var deletions = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME) {
          deletions.push(caches.delete(k));
        }
      }
      return Promise.all(deletions);
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  // Ignorujemy zapytania do innych serwerów (np. API GitHuba)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Uniwersalna strategia "Stale-While-Revalidate" dla WSZYSTKICH plików na Twojej domenie
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      // Pobieranie z sieci w tle
      var fetchPromise = fetch(event.request).then(function (networkResponse) {
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(function() {
        // Ignorujemy błędy sieci (np. tryb samolotowy)
      });

      // Zwracamy OD RAZU plik z cache (nawet HTML!). Jeśli go nie ma - czekamy na sieć.
      return cachedResponse || fetchPromise;
    })
  );
});