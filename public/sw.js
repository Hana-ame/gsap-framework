const CACHE = 'sim-v3';
const PRECACHE = ['/', '/favicon.ico', '/manifest.webmanifest', '/index.html'];
const ASSET_CACHE = 'sim-v3-assets';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)),
      );
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', cache: CACHE }));
    })(),
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_CACHES') {
    e.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      })(),
    );
  }
});

const isNavigation = (req) =>
  req.mode === 'navigate' || (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html'));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  if (isNavigation(e.request)) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200 && res.type === 'basic') {
      const clone = res.clone();
      caches.open(ASSET_CACHE).then((c) => c.put(request, clone)).catch(() => {});
    }
    return res;
  } catch {
    return cached || new Response('', { status: 504 });
  }
}
