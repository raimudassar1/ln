const CACHE_NAME = 'tocfl-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/playground.js',
  './js/drawing-board.js',
  './js/chapters.js',
  './js/scenarios.js',
  './js/vocabulary.js',
  './js/srs.js',
  './js/onboarding.js',
  './js/learn.js',
  './js/dialogue.js',
  './js/flashcards.js',
  './js/quiz.js',
  './js/reader.js',
  './js/mock-test.js',
  './logo.png',
  './data/characters_all.json',
  './data/vocabulary.json',
  './data/levels.json',
  './data/playground_content.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
