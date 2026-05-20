const CACHE_NAME = 'tocfl-cache-v134';
const ASSETS = [
  './',
  './index.html',
  './js/icons.js',
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
  './js/study-plan.js',
  './js/sentence-builder.js',
  './js/mixed-recall.js',
  './js/weakness-engine.js',
  './js/dialogue.js',
  './js/flashcards.js',
  './js/quiz.js',
  './js/reader.js',
  './js/mock-test.js',
  './js/tocfl.js',
  './js/tocfl-content.js',
  './js/b1-coach.js',
  './js/beginner-launchpad.js',
  './logo.png',
  './data/characters_all.json',
  './data/vocabulary.json',
  './data/levels.json',
  './data/playground_content.json',
  './data/sentence_builder_levels.json',
  './data/book1_dialogues.json',
  './data/book1_exercises.json',
  './data/tocfl_native_bank.json',
  './data/pinyin_human_manifest.json',
  './data/pinyin_mastery_drills.json',
  './data/beginner_launchpad.json',
  './data/beginner_launchpad_level2.json',
  './data/beginner_launchpad_level3.json',
  './data/grammar_academy.json',
  './assets/beginner-launchpad/level3/01-meeting.jpg',
  './assets/beginner-launchpad/level3/02-classroom.jpg',
  './assets/beginner-launchpad/level3/03-city.jpg',
  './assets/beginner-launchpad/level3/04-cafe.jpg',
  './assets/beginner-launchpad/level3/05-tea.jpg',
  './assets/beginner-launchpad/level3/06-food.jpg',
  './assets/beginner-launchpad/level3/07-shopping.jpg',
  './assets/beginner-launchpad/level3/08-numbers.jpg',
  './assets/beginner-launchpad/level3/09-family.jpg',
  './assets/beginner-launchpad/level3/10-calendar.jpg',
  './assets/beginner-launchpad/level3/11-library.jpg',
  './assets/beginner-launchpad/level3/12-desk.jpg',
  './assets/beginner-launchpad/level3/13-writing.jpg',
  './assets/beginner-launchpad/level3/14-study.jpg',
  './assets/beginner-launchpad/level3/15-weather.jpg',
  './assets/beginner-launchpad/level3/16-station.jpg',
  './assets/beginner-launchpad/level3/17-market.jpg',
  './assets/beginner-launchpad/level3/18-question.jpg',
  './assets/beginner-launchpad/level3/19-feelings.jpg',
  './assets/beginner-launchpad/level3/20-conversation.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isFreshAsset = /\/(js|css|data)\//.test(url.pathname) || url.pathname.endsWith('/index.html');

  if (event.request.method !== 'GET') return;

  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});














