// Alilox service worker: offline shell + cache-first for static assets, network-first for pages/API.
const V = 'alilox-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(['/offline.html', '/icons/icon-192.png']))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/icons/')) { e.respondWith(caches.open(V).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; }))); return; }
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
});
