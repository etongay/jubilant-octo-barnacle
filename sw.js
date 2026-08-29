// Offline support: cache the app shell so Hearth & Hook opens with no
// signal (barcode lookups and Ravelry still need a connection).

const CACHE = 'hearth-and-hook-v1';
const SHELL = [
  '.',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/db.js',
  'js/projects.js',
  'js/yarn.js',
  'js/scanner.js',
  'js/charts.js',
  'js/patterns.js',
  'js/ravelry.js',
  'manifest.webmanifest',
  'icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // never cache API lookups
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
