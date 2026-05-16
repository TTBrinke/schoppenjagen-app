/**
 * Service Worker voor Schoppenjagen Offline Functionaliteit
 * Versie: 1.0.1
 */

const CACHE_NAME = 'schoppenjagen-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
'/index.html',
'/manifest.json',
'/boo.mp3',
'/applaus.mp3'
];

// Installatie van de Service Worker en het cachen van de bestanden
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Afhandelen van aanvragen (eerst kijken of het in de cache staat)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Opschonen van oude caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
