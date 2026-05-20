/* Weakness Engine */
'use strict';

window.WeaknessEngine = (() => {
  const MAX_EVENTS = 250;
  const AREA_LABELS = {
    srs: 'memory cards',
    tone: 'tones',
    pinyin: 'pinyin',
    vocabulary: 'vocabulary',
    dialogue: 'dialogue vocab',
    listening: 'listening',
    grammar: 'grammar',
    slow: 'slow recall',
    repeated: 'repeated mistakes'
  };

  function ensure() {
    if (!window.App || !App.state || !App.state.progress) return null;
    const p = App.state.progress;
    if (!p.weaknessEngine) p.weaknessEngine = { events: [], items: {}, areas: {}, updatedAt: null };
    if (!p.weaknessEngine.events) p.weaknessEngine.events = [];
    if (!p.weaknessEngine.items) p.weaknessEngine.items = {};
    if (!p.weaknessEngine.areas) p.weaknessEngine.areas = {};
    return p.weaknessEngine;
  }

  function normalizeArea(area) {
    return AREA_LABELS[area] ? area : 'vocabulary';
  }

  function keyFor(payload) {
    return String(payload.key || payload.hanzi || payload.item || payload.label || payload.area || 'unknown').slice(0, 80);
  }

  function record(area, payload = {}) {
    const store = ensure();
    if (!store) return;
    const normalized = normalizeArea(area);
    const key = keyFor({ ...payload, area: normalized });
    const now = new Date().toISOString();
    const event = {
      area: normalized,
      key,
      label: payload.label || payload.hanzi || payload.item || key,
      type: payload.type || 'miss',
      route: location.hash || '#/',
      ms: payload.ms || null,
      at: now
    };

    store.events.unshift(event);
    store.events = store.events.slice(0, MAX_EVENTS);
    store.areas[normalized] = (store.areas[normalized] || 0) + 1;
    store.items[key] = store.items[key] || { key, label: event.label, area: normalized, count: 0, last: null };
    store.items[key].count += 1;
    store.items[key].last = now;
    store.updatedAt = now;

    if (store.items[key].count >= 2) store.areas.repeated = (store.areas.repeated || 0) + 1;
    if (payload.hanzi && App.markWeak) App.markWeak(payload.hanzi);
    else App.saveProgress();
  }

  function clear() {
    const p = App.state.progress;
    p.weaknessEngine = { events: [], items: {}, areas: {}, updatedAt: null };
    App.saveProgress();
  }

  function getTopAreas(limit = 3) {
    const store = ensure();
    if (!store) return [];
    return Object.entries(store.areas)
      .filter(([area, count]) => count > 0 && AREA_LABELS[area])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([area, count]) => ({ area, label: AREA_LABELS[area], count }));
  }

  function getTopItems(limit = 8) {
    const store = ensure();
    if (!store) return [];
    return Object.values(store.items)
      .sort((a, b) => b.count - a.count || String(b.last).localeCompare(String(a.last)))
      .slice(0, limit);
  }

  function summarySentence() {
    const areas = getTopAreas(3);
    if (!areas.length) return 'No weak areas yet. Take a quiz or review session and this will adapt.';
    return 'Your weak areas today: ' + areas.map(a => a.label).join(', ') + '.';
  }

  function renderSummaryCard() {
    const areas = getTopAreas(4);
    const items = getTopItems(5);
    return `
      <section class="weakness-card">
        <div>
          <div class="study-plan-kicker">Weakness Engine</div>
          <h3>${summarySentence()}</h3>
          <p>The app now learns from missed tones, failed SRS cards, wrong quiz answers, slow answers, and marked dialogue words.</p>
        </div>
        <div class="weakness-pill-row">
          ${areas.length ? areas.map(a => `<span>${a.label}<strong>${a.count}</strong></span>`).join('') : '<span>Ready<strong>0</strong></span>'}
        </div>
        ${items.length ? `<div class="weakness-items">${items.map(i => `<span>${i.label}<small>${i.count}x</small></span>`).join('')}</div>` : ''}
      </section>`;
  }

  return { record, clear, getTopAreas, getTopItems, summarySentence, renderSummaryCard };
})();
