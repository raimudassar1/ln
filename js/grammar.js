
'use strict';

const GrammarModule = (() => {
  const STORAGE_KEY = 'grammarAcademyState';
  let data = null;
  let state = { level: 'beginner', unit: null, tab: 'learn', exampleFilter: 'all', showPinyin: false, showEnglish: true, answered: {} };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function speak(text) {
    const value = String(text || '').trim();
    if (!value) return;
    if (typeof TTS !== 'undefined' && TTS?.speak) { TTS.speak(value, 'zh-TW', 0.78); return; }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
  }

  function loadState() {
    try { state = { ...state, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) }; } catch {}
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  async function init() {
    if (data) return data;
    const res = await fetch('data/grammar_academy.json', { cache: 'no-store' });
    data = await res.json();
    if (!state.unit) state.unit = data.levels[0]?.units[0]?.id || null;
    return data;
  }

  async function render(container) {
    loadState();
    try { await init(); } catch (err) {
      container.innerHTML = '<div class="empty-state"><h3>Grammar Academy could not load</h3><p>Please refresh the page.</p></div>';
      return;
    }
    const level = getLevel(state.level);
    if (!level.units.some(unit => unit.id === state.unit)) state.unit = level.units[0]?.id;
    saveState();
    const unit = getUnit(state.unit) || level.units[0];
    container.innerHTML = `
      <div class="grammar-academy">
        <section class="ga-hero">
          <div>
            <span class="ga-kicker">Grammar Academy</span>
            <h2>Build Chinese Sentences on Purpose</h2>
            <p>Three levels from beginner sentence order to B1 bridge grammar. Each unit includes deep explanation, structured examples, sentence-building drills, reading, and writing prompts.</p>
          </div>
          <div class="ga-stats">
            <strong>${data.totals.examples}</strong><span>structured examples</span>
            <strong>${data.totals.exercises}</strong><span>practice tasks</span>
          </div>
        </section>

        <section class="ga-layout">
          <aside class="ga-sidebar">
            ${renderLevelSelector()}
            ${renderUnitList(level)}
          </aside>
          <main class="ga-main">
            ${renderUnit(unit)}
          </main>
        </section>
      </div>`;
    bind(container);
  }

  function getLevel(id) { return data.levels.find(level => level.id === id) || data.levels[0]; }
  function getUnit(id) { return data.levels.flatMap(level => level.units).find(unit => unit.id === id); }

  function renderLevelSelector() {
    return `<div class="ga-levels">
      ${data.levels.map(level => `
        <button type="button" class="ga-level ${level.id === state.level ? 'active' : ''}" data-ga-action="level" data-level="${level.id}">
          <span>${esc(level.label)}</span>
          <small>${esc(level.goal)}</small>
        </button>`).join('')}
    </div>`;
  }

  function renderUnitList(level) {
    return `<div class="ga-unit-list">
      <div class="ga-side-title">Units</div>
      ${level.units.map((unit, index) => `
        <button type="button" class="ga-unit-link ${unit.id === state.unit ? 'active' : ''}" data-ga-action="unit" data-unit="${unit.id}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <strong>${esc(unit.title)}</strong>
          <small>${esc(unit.structure)}</small>
        </button>`).join('')}
    </div>`;
  }

  function renderUnit(unit) {
    return `<article class="ga-unit-page">
      <header class="ga-unit-head">
        <div>
          <span class="ga-kicker">${esc(getLevel(unit.level).label)}</span>
          <h3>${esc(unit.title)}</h3>
          <p>${esc(unit.meaning)}</p>
        </div>
        <button type="button" class="btn btn-ghost" data-ga-action="speak" data-text="${esc(unit.examples[0]?.zh || unit.structure)}">Hear Example</button>
      </header>

      <div class="ga-structure">
        <span>Core Pattern</span>
        <strong>${esc(unit.structure)}</strong>
        <p>${esc(unit.coreExplanation)}</p>
      </div>

      <div class="ga-toolbar">
        ${['learn','examples','practice','reading','writing'].map(tab => `<button type="button" class="${state.tab === tab ? 'active' : ''}" data-ga-action="tab" data-tab="${tab}">${tab}</button>`).join('')}
        <div class="ga-display">
          <button type="button" class="${state.showPinyin ? 'active' : ''}" data-ga-action="toggle" data-key="showPinyin">Pinyin</button>
          <button type="button" class="${state.showEnglish ? 'active' : ''}" data-ga-action="toggle" data-key="showEnglish">English</button>
        </div>
      </div>

      <section class="ga-panel">
        ${renderPanel(unit)}
      </section>
    </article>`;
  }

  function renderPanel(unit) {
    if (state.tab === 'examples') return renderExamples(unit);
    if (state.tab === 'practice') return renderPractice(unit);
    if (state.tab === 'reading') return renderReading(unit);
    if (state.tab === 'writing') return renderWriting(unit);
    return renderLearn(unit);
  }

  function renderLearn(unit) {
    return `<div class="ga-learn-grid">
      <section class="ga-card-large">
        <h4>How it works</h4>
        <p>${esc(unit.coreExplanation)}</p>
        <p>${esc(unit.whyItMatters)}</p>
      </section>
      <section class="ga-card-large">
        <h4>Common mistakes</h4>
        ${unit.commonMistakes.map(item => `<div class="ga-mistake">${esc(item)}</div>`).join('')}
      </section>
      <section class="ga-card-large ga-wide">
        <h4>First five examples</h4>
        ${unit.examples.slice(0,5).map(renderExample).join('')}
      </section>
    </div>`;
  }

  function renderExamples(unit) {
    const types = ['all', ...Array.from(new Set(unit.examples.map(ex => ex.type)))];
    const examples = state.exampleFilter === 'all' ? unit.examples : unit.examples.filter(ex => ex.type === state.exampleFilter);
    return `<div class="ga-examples-wrap">
      <div class="ga-example-filters">
        ${types.map(type => `<button type="button" class="${state.exampleFilter === type ? 'active' : ''}" data-ga-action="filter" data-filter="${esc(type)}">${esc(type)}</button>`).join('')}
      </div>
      <div class="ga-example-count">${examples.length} examples shown</div>
      <div class="ga-examples-list">${examples.map(renderExample).join('')}</div>
    </div>`;
  }

  function renderExample(ex) {
    return `<div class="ga-example">
      <div class="ga-example-top"><span>${esc(ex.type)}</span><button type="button" data-ga-action="speak" data-text="${esc(ex.zh)}">Play</button></div>
      <button type="button" class="ga-zh" data-ga-action="speak" data-text="${esc(ex.zh)}">${esc(ex.zh)}</button>
      ${state.showPinyin && ex.pinyin ? `<div class="ga-pinyin">${esc(ex.pinyin)}</div>` : ''}
      ${state.showEnglish ? `<div class="ga-english">${esc(ex.english)}</div>` : ''}
      <small>${esc(ex.note)}</small>
    </div>`;
  }

  function renderPractice(unit) {
    return `<div class="ga-practice-list">
      ${unit.exercises.map((ex, index) => renderExercise(ex, index)).join('')}
    </div>`;
  }

  function renderExercise(ex, index) {
    const answered = state.answered?.[ex.id];
    return `<section class="ga-exercise">
      <div class="ga-ex-head"><span>${String(index + 1).padStart(2, '0')}</span><strong>${esc(ex.type)}</strong></div>
      <p>${esc(ex.prompt)}</p>
      ${ex.tiles?.length ? `<div class="ga-tiles">${ex.tiles.map(tile => `<button type="button">${esc(tile)}</button>`).join('')}</div>` : ''}
      <div class="ga-answer-row">
        <button type="button" class="btn btn-ghost btn-sm" data-ga-action="speak" data-text="${esc(ex.answer)}">Play Answer</button>
        <button type="button" class="btn btn-primary btn-sm" data-ga-action="answer" data-exercise="${esc(ex.id)}">Show Answer</button>
      </div>
      <div class="ga-answer ${answered ? '' : 'hidden'}">
        <strong>${esc(ex.answer)}</strong>
        ${state.showEnglish ? `<small>${esc(ex.english)}</small>` : ''}
        <em>${esc(ex.hint)}</em>
      </div>
    </section>`;
  }

  function renderReading(unit) {
    return `<div class="ga-reading">
      <section class="ga-card-large">
        <h4>${esc(unit.readingTask.title)}</h4>
        <p>${esc(unit.readingTask.instructions)}</p>
      </section>
      <section class="ga-reading-strip">
        ${unit.examples.slice(0,10).map(ex => `<button type="button" data-ga-action="speak" data-text="${esc(ex.zh)}">${esc(ex.zh)}</button>`).join('')}
      </section>
    </div>`;
  }

  function renderWriting(unit) {
    return `<div class="ga-writing">
      ${unit.writingPrompts.map((prompt, index) => `<section class="ga-writing-card"><span>Prompt ${index + 1}</span><p>${esc(prompt)}</p><textarea placeholder="Type your Chinese answer here..."></textarea></section>`).join('')}
    </div>`;
  }

  function bind(container) {
    container.querySelector('.grammar-academy')?.addEventListener('click', event => {
      const btn = event.target.closest('[data-ga-action]');
      if (!btn) return;
      const action = btn.dataset.gaAction;
      if (action === 'level') {
        state.level = btn.dataset.level || 'beginner';
        state.unit = getLevel(state.level).units[0]?.id;
        state.tab = 'learn';
        saveState(); render(container);
      }
      if (action === 'unit') { state.unit = btn.dataset.unit; state.tab = 'learn'; saveState(); render(container); }
      if (action === 'tab') { state.tab = btn.dataset.tab || 'learn'; saveState(); render(container); }
      if (action === 'toggle') { state[btn.dataset.key] = !state[btn.dataset.key]; saveState(); render(container); }
      if (action === 'filter') { state.exampleFilter = btn.dataset.filter || 'all'; saveState(); render(container); }
      if (action === 'answer') { state.answered = { ...(state.answered || {}), [btn.dataset.exercise]: true }; saveState(); render(container); }
      if (action === 'speak') speak(btn.dataset.text || btn.textContent.trim());
    });
  }

  return { render };
})();
