// Minimal service worker: exists only to satisfy PWA installability
// requirements (a registered SW with a fetch handler). Deliberately does NOT
// cache API responses, images, fonts, or JS bundles - this is a raffle app
// where ticket balances, raffle state, and auth all need to stay live/fresh.
//
// IMPORTANT: only ever call respondWith() for the exact precached shell
// assets. For every other request (API calls, images, fonts, JS chunks),
// don't touch the fetch event at all - falling back to caches.match() for a
// URL that was never cached resolves to undefined, and handing undefined to
// respondWith() throws a NetworkError instead of just letting the request
// through, which broke real API calls the first time this shipped.
const CACHE_NAME = 'winwai-shell-v2';
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
  const url = new URL(event.request.url);
  const isShellAsset =
    event.request.method === 'GET' &&
    url.origin === self.location.origin &&
    SHELL_ASSETS.includes(url.pathname);

  if (!isShellAsset) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || Response.error()))
  );
});
