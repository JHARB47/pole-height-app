/// <reference lib="webworker" />
// Minimal custom service worker (no-op offline support); keep lint clean
// Notes:
// - We intentionally avoid using unused parameters in event listeners.
// - If a bundler injects Workbox or other SW tools, this SW remains compatible.
self.addEventListener('install', () => {
  // @ts-ignore
  if (typeof self.skipWaiting === 'function') self.skipWaiting();
});

self.addEventListener('activate', () => {
  // @ts-ignore
  if (self.clients && typeof self.clients.claim === 'function') self.clients.claim();
});

// Basic fetch event for offline fallback
/** @param {FetchEvent} e */
self.addEventListener('fetch', (e) => {
  // Polyfill FetchEvent type for compatibility
  const req = e.request;
  // @ts-ignore
  e.respondWith(
    // @ts-ignore
    caches.match(req).then((response) => {
      // @ts-ignore
      return response || fetch(req);
    })
  );
});
