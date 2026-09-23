// Minimal service worker: exists only to satisfy PWA installability
// requirements (a registered SW with a fetch handler). Deliberately does NOT
// cache API responses or app bundles - this is a raffle app where ticket
// balances, raffle state, and auth all need to stay live/fresh, so we always
// go to the network and only fall back to cache if the network is down.
const CACHE_NAME = 'winwai-shell-v1';
const SHELL_ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
