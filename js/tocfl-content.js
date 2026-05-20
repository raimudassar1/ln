/* ═══════════════════════════════════════════════════════════════
   tocfl-content.js — Native TOCFL official content browser
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const TOCFLContentModule = (() => {
  const state = { data: null, level: 'novice', sectionId: '', questionIndex: 0, mode: 'browse', answers: {}, finished: false, keepQuestionInView: false };

  async function render(container) {
    container.innerHTML = '<div class="spinner"></div>';
    state.container = container;
    state.data = await API.get('tocfl_native_bank');
    state.level = state.data.levels[0]?.key || 'novice';
    state.sectionId = state.data.levels[0]?.sections[0]?.id || '';
    state.questionIndex = 0;
    state.mode = 'browse';
    draw(container);
  }

  function draw(container) {
    const level = getLevel();
    const section = getSection();
    const q = section?.questions?.[state.questionIndex];
    container.innerHTML = `
      <div class="tocfl-native-shell">
        <section class="tocfl-native-hero">
          <div>
            <div class="tocfl-kicker">Native TOCFL Content</div>
            <h2>Official content browser</h2>
            <p>Browse local TOCFL PDFs, extracted images, audio, scripts, and answer sheets as native study/test content. Chinese text is selectable whenever the source PDF exposes text.</p>
          </div>
          <div class="tocfl-native-stats">
            <span>${state.data.stats.questions} questions</span>
            <span>${state.data.stats.images} visual panels</span>
            <span>${state.data.stats.textOrScriptQuestions} text/script items</span>
          </div>
        </section>

        <div class="tocfl-native-tabs">
          ${state.data.levels.map(l => `<button class="${l.key === state.level ? 'active' : ''}" data-level="${l.key}" onclick="TOCFLContentModule.selectLevel('${l.key}')">${l.title}</button>`).join('')}
        </div>

        <label class="tocfl-native-section-select-wrap">
          <span>Section</span>
          <select class="tocfl-native-section-select" data-section-select>
            ${level.sections.map(s => `<option value="${s.id}" ${s.id === state.sectionId ? 'selected' : ''}>${labelSection(s)} - ${s.questionCount} questions</option>`).join('')}
          </select>
        </label>

        <div class="tocfl-native-layout">
          <aside class="tocfl-native-sidebar">
            <div class="tocfl-native-side-title">Sections</div>
            ${level.sections.map(s => `
              <button class="tocfl-native-section ${s.id === state.sectionId ? 'active' : ''}" data-section="${s.id}" onclick="TOCFLContentModule.selectSection('${s.id}')">
                <strong>${labelSection(s)}</strong>
                <span>${s.questionCount} questions · ${s.skill}</span>
                <small>${s.audioCount ? `${s.audioCount} audio` : 'reading'} · ${s.scriptCount || s.textCount} text/script</small>
              </button>`).join('')}
          </aside>
          <main class="tocfl-native-main">
            ${section ? topBar(level, section) : ''}
            ${q ? (state.mode === 'test' ? testQuestion(section, q) : browseQuestion(section, q)) : '<div class="empty-state"><h3>No questions found</h3></div>'}
          </main>
        </div>
      </div>`;
    bind(container);
    restoreQuestionView();
  }


  function restoreQuestionView() {
    if (!state.keepQuestionInView) return;
    const question = document.querySelector('.tocfl-native-question');
    if (!question) return;
    requestAnimationFrame(() => {
      const topbar = document.getElementById('topbar');
      const offset = (topbar?.offsetHeight || 0) + 8;
      const y = question.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
      state.keepQuestionInView = false;
    });
  }

  function topBar(level, section) {
    return `
      <div class="tocfl-native-toolbar">
        <div><strong>${labelSection(section)}</strong><span>${level.title}</span></div>
        <div class="tocfl-native-actions">
          <button class="btn btn-outline btn-sm" data-mode="browse">Browse</button>
          <button class="btn btn-primary btn-sm" data-mode="test">Test this section</button>
        </div>
      </div>
      <div class="tocfl-native-progress"><span style="width:${((state.questionIndex + 1) / section.questions.length) * 100}%"></span></div>`;
  }

  function browseQuestion(section, q) {
    return `
      <article class="tocfl-native-question tocfl-native-browse">
        <header>
          <div><span>Question ${state.questionIndex + 1} / ${section.questions.length}</span><h3>${q.id}</h3></div>
          <div class="tocfl-native-nav"><button class="btn btn-ghost btn-sm" data-step="-1" ${state.questionIndex === 0 ? 'disabled' : ''}>Previous</button><button class="btn btn-ghost btn-sm" data-step="1" ${state.questionIndex >= section.questions.length - 1 ? 'disabled' : ''}>Next</button></div>
        </header>
        ${audioBlock(q)}
        <div class="tocfl-native-study-card">
          <div class="tocfl-native-visual">${q.questionImage ? `<img src="${enc(q.questionImage)}" alt="${q.id} question visual">` : '<div class="empty-state"><h3>No visual extracted</h3></div>'}</div>
          ${answerPicker(section, q, true)}
          <div class="tocfl-native-details">
            ${detailBlock('Question text', q.questionText)}
            ${detailBlock('Listening script', q.scriptText)}
            <details class="tocfl-native-source-links">
              <summary>Source files and official answer</summary>
              <div class="tocfl-native-answer"><button class="btn btn-outline btn-sm" data-reveal-answer>Show answer</button><strong hidden>${q.answer || 'No answer key'}</strong></div>
              <div class="tocfl-native-file-links">
                ${q.questionPdf ? `<a href="${enc(q.questionPdf)}" target="_blank">Original PDF</a>` : ''}
                ${q.scriptPdf ? `<a href="${enc(q.scriptPdf)}" target="_blank">Script PDF</a>` : ''}
                ${section.answerSheet ? `<a href="${enc(section.answerSheet)}" target="_blank">Answer sheet</a>` : ''}
              </div>
            </details>
          </div>
        </div>
      </article>`;
  }

  function testQuestion(section, q) {
    const options = extractOptions(q.questionText, q.answer, section);
    const given = state.answers[q.id] || '';
    return `
      <article class="tocfl-native-question tocfl-native-test">
        <header><div><span>${section.skill} test mode</span><h3>${state.questionIndex + 1} / ${section.questions.length}</h3></div><button class="btn btn-outline btn-sm" data-finish-test>Finish</button></header>
        ${audioBlock(q)}
        <div class="tocfl-native-test-grid">
          <div class="tocfl-native-visual">${q.questionImage ? `<img src="${enc(q.questionImage)}" alt="${q.id} question visual">` : textBlock('Question text', q.questionText)}</div>
          <div class="tocfl-native-options">
            ${options.map(o => optionButton(o, given, q.answer)).join('')}
            ${answerFeedback(q, given)}
            <div class="tocfl-native-nav"><button class="btn btn-ghost btn-sm" data-step="-1" ${state.questionIndex === 0 ? 'disabled' : ''}>Previous</button><button class="btn btn-primary btn-sm" data-step="1">${state.questionIndex >= section.questions.length - 1 ? 'Review' : 'Next'}</button></div>
          </div>
        </div>
        ${state.finished ? reviewPanel(section) : ''}
      </article>`;
  }

  function reviewPanel(section) {
    const correct = section.questions.filter(q => (state.answers[q.id] || '') === q.answer).length;
    return `<div class="tocfl-native-review"><h3>${correct} / ${section.questions.length}</h3><p>Correct answers are checked from the official answer sheet.</p>${section.questions.map((q,i)=>`<span class="${(state.answers[q.id]||'')===q.answer?'ok':'miss'}">${i+1}. ${state.answers[q.id]||'-'} / ${q.answer||'?'}</span>`).join('')}</div>`;
  }

  function answerPicker(section, q, compact = false) {
    const options = extractOptions(q.questionText, q.answer, section);
    const given = state.answers[q.id] || '';
    return `<section class="tocfl-native-answer-picker ${compact ? 'compact' : ''}">
      <div><strong>Answer</strong><span>${given ? 'Checked' : 'Select one'}</span></div>
      <div class="tocfl-native-options">${options.map(o => optionButton(o, given, q.answer)).join('')}</div>
      ${answerFeedback(q, given)}
    </section>`;
  }

  function optionButton(option, given, correct) {
    const checked = !!given;
    const isSelected = given === option.id;
    const isCorrect = checked && option.id === correct;
    const isWrong = checked && isSelected && option.id !== correct;
    const isPlaceholder = new RegExp(`^(Choice|Option|Picture) ${option.id}$`, 'i').test(option.text || '');
    const classes = ['tocfl-native-option'];
    if (isPlaceholder) classes.push('letter-only');
    if (isSelected) classes.push('selected');
    if (isCorrect) classes.push('correct');
    if (isWrong) classes.push('wrong');
    return `<button class="${classes.join(' ')}" data-answer="${option.id}"><span>${option.id}</span>${isPlaceholder ? '' : `<strong>${escapeHtml(option.text)}</strong>`}</button>`;
  }

  function answerFeedback(q, given) {
    if (!given) return '';
    const ok = given === q.answer;
    return `<div class="tocfl-native-feedback ${ok ? 'ok' : 'miss'}"><strong>${ok ? 'Correct' : 'Not quite'}</strong><span>Your answer: ${given}. Official answer: ${q.answer || '?'}</span></div>`;
  }

  function textBlock(title, text) {
    if (!text) return '';
    return `<section class="tocfl-native-copy"><div><strong>${title}</strong><button class="btn btn-ghost btn-sm" data-copy="${escapeAttr(text)}">Copy</button></div><pre>${escapeHtml(text)}</pre></section>`;
  }


  function detailBlock(title, text) {
    if (!text) return '';
    const open = title === 'Question text' ? ' open' : '';
    return `<details class="tocfl-native-copy tocfl-native-detail"${open}><summary><strong>${title}</strong><button class="btn btn-ghost btn-sm" data-copy="${escapeAttr(text)}">Copy</button></summary><pre>${escapeHtml(text)}</pre></details>`;
  }

  function audioBlock(q) {
    return q.audio ? `<audio class="tocfl-native-audio" controls src="${enc(q.audio)}"></audio>` : '';
  }

  function extractOptions(text, answer, section) {
    const labels = section.title.includes('Dialogue') || section.id.includes('Dialogue') || answer === 'D' ? ['A','B','C','D'] : ['A','B','C'];
    if (text) {
      const normalized = String(text).replace(/\r/g, '\n');
      const matches = [...normalized.matchAll(/[（(]([A-D])[）)]\s*([\s\S]*?)(?=\n?\s*[（(][A-D][）)]|$)/g)]
        .map(m => ({ id: m[1], text: m[2].replace(/\s+/g, ' ').trim() }))
        .filter(o => o.text);
      if (matches.length) return matches;
      const emptyLabels = [...normalized.matchAll(/[（(]([A-D])[）)]/g)].map(m => m[1]);
      if (emptyLabels.length >= 2) return emptyLabels.map(id => ({ id, text: `Picture ${id}` }));
    }
    return labels.map(id => ({ id, text: `Choice ${id}` }));
  }

  function bind(container) {
    container.onchange = e => {
      const select = e.target.closest('[data-section-select]');
      if (!select) return;
      state.sectionId = select.value;
      state.questionIndex = 0;
      state.answers = {};
      state.finished = false;
      state.keepQuestionInView = false;
      draw(container);
    };

    container.onclick = e => {
      const levelBtn = e.target.closest('[data-level]');
      if (levelBtn) {
        state.level = levelBtn.dataset.level;
        state.sectionId = getLevel().sections[0]?.id || '';
        state.questionIndex = 0;
        state.answers = {};
        state.finished = false;
        state.keepQuestionInView = false;
        draw(container);
        return;
      }

      const sectionBtn = e.target.closest('[data-section]');
      if (sectionBtn) {
        state.sectionId = sectionBtn.dataset.section;
        state.questionIndex = 0;
        state.answers = {};
        state.finished = false;
        state.keepQuestionInView = false;
        draw(container);
        return;
      }

      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) {
        state.mode = modeBtn.dataset.mode;
        state.answers = {};
        state.finished = false;
        state.keepQuestionInView = false;
        draw(container);
        return;
      }

      const stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        const section = getSection();
        const next = state.questionIndex + Number(stepBtn.dataset.step);
        if (next >= section.questions.length) state.finished = true;
        else state.questionIndex = Math.max(0, Math.min(section.questions.length - 1, next));
        state.keepQuestionInView = true;
        draw(container);
        return;
      }

      const answerBtn = e.target.closest('[data-answer]');
      if (answerBtn) {
        const q = getSection().questions[state.questionIndex];
        state.answers[q.id] = answerBtn.dataset.answer;
        state.keepQuestionInView = true;
        draw(container);
        return;
      }

      if (e.target.closest('[data-finish-test]')) {
        state.finished = true;
        state.keepQuestionInView = true;
        draw(container);
        return;
      }

      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        e.preventDefault();
        navigator.clipboard?.writeText(copyBtn.dataset.copy || '');
        return;
      }

      const revealBtn = e.target.closest('[data-reveal-answer]');
      if (revealBtn) {
        const strong = revealBtn.nextElementSibling;
        if (strong) strong.hidden = !strong.hidden;
      }
    };
  }


  function redraw() {
    if (state.container) draw(state.container);
  }

  function selectLevel(key) {
    state.level = key;
    state.sectionId = getLevel().sections[0]?.id || '';
    state.questionIndex = 0;
    state.answers = {};
    state.finished = false;
    redraw();
  }

  function selectSection(id) {
    state.sectionId = id;
    state.questionIndex = 0;
    state.answers = {};
    state.finished = false;
    redraw();
  }

  function getLevel() { return state.data.levels.find(l => l.key === state.level) || state.data.levels[0]; }
  function getSection() { const level = getLevel(); return level.sections.find(s => s.id === state.sectionId) || level.sections[0]; }
  function labelSection(s) {
    return s.title
      .replace(/^L\s+/, 'Listening ')
      .replace(/^R\s+/, 'Reading ')
      .replace(/\s+L\s+/g, ' Listening ')
      .replace(/\s+R\s+/g, ' Reading ');
  }
  function enc(path) { return encodeURI(path); }
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, '&#10;'); }
  return { render, selectLevel, selectSection };
})();


window.TOCFLContentModule = TOCFLContentModule;

