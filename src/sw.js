/* eslint-env serviceworker */
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
self.addEventListener('fetch', (event) => {
  // Polyfill FetchEvent type for compatibility
  const fetchEvent = event;
  // @ts-ignore
  fetchEvent.respondWith(
    // @ts-ignore
    caches.match(fetchEvent.request).then((response) => {
      // @ts-ignore
      return response || fetch(fetchEvent.request);
    })
  );
});
