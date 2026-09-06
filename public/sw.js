const CACHE = 'scope-ledger-shell-__RELEASE_VERSION__';
const SHELL = __PRECACHE_URLS__;
const cached = (request) => caches.match(request, { ignoreVary: true });

self.addEventListener('install', (event) => {
  // Bypass the browser HTTP cache while building the offline cache. A
  // conditional 304 response makes Cache.addAll reject and leaves no worker,
  // which is most likely on a repeat visit or update.
  const requests = SHELL.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
    }).catch(async () => (await cached(event.request)) || (await cached('/')) || cached('/offline.html')));
    return;
  }
  event.respondWith(cached(event.request).then((response) => response || fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
    return response;
  })));
});
