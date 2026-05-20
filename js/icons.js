(function () {
  'use strict';

  const paths = {
    dashboard: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
    play: '<path d="M8 5v14l11-7-11-7z"/>',
    exam: '<path d="M8 2h8l4 4v16H4V2h4z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    puzzle: '<path d="M8 3h5v4a2 2 0 1 0 0 4v4H8v-3a2 2 0 1 0-4 0v3H2V9h3a2 2 0 1 0 0-4H2V3h6z"/><path d="M13 15h4v-3a2 2 0 1 1 4 0v3h1v6h-9v-6z"/>',
    scenarios: '<path d="M7 8h10"/><path d="M7 12h6"/><path d="M21 12a8 8 0 1 1-3-6.2L21 3v9z"/>',
    library: '<path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h7"/><path d="M8 11h7"/>',
    vocabulary: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h5"/><path d="M7 13h10"/><path d="M15 9h2"/>',
    notebook: '<path d="M7 3h12v18H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/><path d="M8 7h7"/><path d="M8 11h7"/><path d="M8 15h5"/>',
    grammar: '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8.5 8.5l2 6"/><path d="M15.5 8.5l-2 6"/><path d="M9 6h6"/>',
    flashcards: '<rect x="4" y="6" width="14" height="14" rx="2"/><path d="M8 10h6"/><path d="M8 14h4"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/>',
    dialogue: '<path d="M21 12a8 8 0 0 1-8 8H5l-4 3 1.5-5A8 8 0 1 1 21 12z"/><path d="M8 10h8"/><path d="M8 14h5"/>',
    letters: '<path d="M4 19l5-14h2l5 14"/><path d="M7 13h7"/><path d="M18 5v14"/><path d="M15 8h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    reading: '<path d="M3 5h7a4 4 0 0 1 4 4v12H7a4 4 0 0 0-4-4V5z"/><path d="M21 5h-7a4 4 0 0 0-4 4v12h7a4 4 0 0 1 4-4V5z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    headphones: '<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v5a2 2 0 0 0 2 2h2v-7H4z"/><path d="M20 13v5a2 2 0 0 1-2 2h-2v-7h4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 14.5a7.7 7.7 0 0 0 .1-1.2 7.7 7.7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2-1.2L14.3 4h-4.6l-.4 2.9a7.7 7.7 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0-.1 1.2c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1c.6.5 1.3.9 2 1.2l.4 2.9h4.6l.4-2.9c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.5-2-1.5z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-3-1.6-5.3-4.2-7.4.1 2.3-1 3.5-2.2 4.4.2-3.6-1.6-6.4-4.6-8C8 7.5 5 9.8 5 15c0 4 3 7 7 7z"/>',
    moon: '<path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>',
    volume: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19 6a9 9 0 0 1 0 12"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    warning: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 18h.01"/>',
    x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3z"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5h1"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5h-1"/><path d="M9 4v16"/><path d="M15 4v16"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
    route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M8.5 17C12 14 12 10 15.5 7"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3"/><path d="M17 6h3a3 3 0 0 1-3 3"/>'
  };

  const routeIcons = {
    dashboard: 'dashboard', onboarding: 'music', learn: 'map', chapters: 'book', playground: 'play', exams: 'exam',
    'char-playground': 'puzzle', scenarios: 'scenarios', library: 'library', vocabulary: 'vocabulary',
    'vocabulary-books': 'notebook', grammar: 'grammar', flashcards: 'flashcards', dialogue: 'dialogue',
    'quiz-pronunciation': 'letters', 'quiz-vocabulary': 'target', 'quiz-tones': 'music', reading: 'reading',
    'mock-reading': 'file', 'mock-listening': 'headphones', settings: 'settings'
  };

  const emojiMap = new Map([
    ['📊','dashboard'], ['🎵','music'], ['🗺️','map'], ['🗺','map'], ['📖','book'], ['🎠','play'], ['🎓','exam'],
    ['🧩','puzzle'], ['🎭','scenarios'], ['📚','library'], ['🖼️','vocabulary'], ['🖼','vocabulary'], ['📒','notebook'],
    ['🧬','grammar'], ['🃏','flashcards'], ['💬','dialogue'], ['🔤','letters'], ['🎯','target'], ['📝','file'],
    ['🎧','headphones'], ['⚙️','settings'], ['⚙','settings'], ['🔥','flame'], ['🌙','moon'], ['☀️','sun'], ['☀','sun'],
    ['🔊','volume'], ['☰','menu'], ['✓','check'], ['✅','check'], ['⚠️','warning'], ['⚠','warning'], ['💡','lightbulb'],
    ['🏠','home'], ['🧠','brain'], ['🌱','layers'], ['🌿','route'], ['🌳','route'], ['🏆','trophy'], ['🔔','warning'],
    ['▶','play'], ['✕','x'], ['×','x']
  ]);

  function svg(name) {
    const icon = paths[name] ? name : 'dashboard';
    return '<span class="app-icon app-icon-' + icon + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + paths[icon] + '</svg></span>';
  }

  function iconNameFromText(text, fallback) {
    const clean = String(text || '').trim();
    for (const [emoji, icon] of emojiMap) if (clean.includes(emoji)) return icon;
    return fallback || 'dashboard';
  }

  function replaceIconOnly(el, fallback) {
    if (!el) return;
    const wanted = el.dataset.icon || iconNameFromText(el.textContent, fallback);
    if (el.dataset.iconized === wanted) return;
    el.innerHTML = svg(wanted);
    el.dataset.iconized = wanted;
  }

  function replaceLeadingEmoji(el) {
    if (!el || el.dataset.buttonIconized === 'true' || el.querySelector('.app-icon')) return;
    const text = el.textContent.trim();
    for (const [emoji, icon] of emojiMap) {
      if (text.startsWith(emoji)) {
        const label = text.slice(emoji.length).trim();
        el.innerHTML = svg(icon) + (label ? '<span>' + label + '</span>' : '');
        el.dataset.buttonIconized = 'true';
        return;
      }
    }
  }

  function enhance(root) {
    const scope = root || document;
    scope.querySelectorAll('.nav-item').forEach((item) => replaceIconOnly(item.querySelector('.nav-icon'), routeIcons[item.dataset.route] || 'dashboard'));
    scope.querySelectorAll('.bottom-nav-item').forEach((item) => replaceIconOnly(item.querySelector('.bn-icon'), routeIcons[item.dataset.route] || 'home'));
    scope.querySelectorAll('.stat-icon').forEach((el, i) => replaceIconOnly(el, ['layers', 'brain', 'flame'][i] || iconNameFromText(el.textContent, 'dashboard')));
    scope.querySelectorAll('.tile-icon').forEach((el) => replaceIconOnly(el, iconNameFromText(el.textContent, 'dashboard')));
    scope.querySelectorAll('.activity-icon,.es-icon,.streak-flame').forEach((el) => replaceIconOnly(el, iconNameFromText(el.textContent, 'check')));
    const menu = document.getElementById('mobile-menu-toggle');
    if (menu) replaceIconOnly(menu, 'menu');
    const theme = document.getElementById('dark-mode-toggle');
    if (theme) replaceIconOnly(theme, theme.textContent.includes('☀') ? 'sun' : 'moon');
    const tts = document.getElementById('tts-test-btn');
    if (tts) replaceIconOnly(tts, 'volume');
    scope.querySelectorAll('button,.btn,.ch-tab').forEach(replaceLeadingEmoji);
    scope.querySelectorAll('.modal-close').forEach((el) => replaceIconOnly(el, 'x'));
    scope.querySelectorAll('.pg-card-icon').forEach((el) => replaceIconOnly(el, iconNameFromText(el.textContent, 'book')));
    scope.querySelectorAll('.ch-vocab-audio,.vd-audio-icon').forEach((el) => replaceIconOnly(el, 'volume'));
  }

  let queued = false;
  function queueEnhance() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enhance(document);
    });
  }

  window.IconSystem = { svg, enhance };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueEnhance);
  else queueEnhance();
  new MutationObserver(queueEnhance).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
