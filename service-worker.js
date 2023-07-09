self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('fox-store').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/index.js',
      'localforage.min.js',
      '/style.css',
      '/images/004.jpg',
      '/images/4dots.svg',
      '/images/arrow-up.svg',
      '/images/cross.svg',
      '/images/dropdown.svg',
      '/images/plus.svg'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
