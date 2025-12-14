var CACHE_VERSION = 'v4';
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
  // network first when opening PWA app (to force possible updates when new version of one of those files will be available)
  if (event.request && event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
