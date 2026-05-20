/* ═══════════════════════════════════════════════════════════════
   vocabulary_books.js — Vocabulary organized by Course Books (1-3)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.VocabularyBooksModule = (() => {
  let state = {
    book: 1,
    chapter: '01',
    data: null,
    dialogues: null,
    exercises: null,
    loading: false
  };

  let exerciseViews = { 1: 'listening', 2: 'listening' };

  function injectStyles() {
    if (document.getElementById('vocabulary-books-styles')) return;
    const style = document.createElement('style');
    style.id = 'vocabulary-books-styles';
    style.textContent = `
      .vocab-row:hover { background-color: var(--off-white); cursor: pointer; }
      .vocab-table th { position: sticky; top: 0; z-index: 10; background: var(--off-white); box-shadow: 0 1px 0 var(--border); color: var(--text-3); }
      .chapter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-bottom: 24px; }
      .chapter-btn { 
        padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); 
        text-align: center; cursor: pointer; transition: all 0.2s; font-weight: 600; font-size: 0.9rem;
        color: var(--text);
      }
      .chapter-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--off-white); }
      .chapter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
      .vocab-hanzi-large { font-size: 1.4rem; font-weight: 700; color: var(--text); }
      .play-btn-circle {
        width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        background: var(--off-white); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
        color: var(--text);
      }
      .play-btn-circle:hover { background: var(--accent); color: white; border-color: var(--accent); }
      .book-dialogue-panel { display: grid; gap: 14px; margin-bottom: 24px; }
      .book-dialogue-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; }
      .book-dialogue-title h3 { margin:0; font-size:1.1rem; color:var(--text); }
      .book-dialogue-title p { margin:4px 0 0; color:var(--text-3); font-size:0.9rem; }
      .book-dialogue-grid { display:grid; gap:12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .book-dialogue-card { border:1px solid var(--border); border-radius:12px; background:var(--card-bg); overflow:hidden; }
      .book-dialogue-card-head { padding:14px 16px; border-bottom:1px solid var(--border); background:var(--off-white); display:flex; justify-content:space-between; gap:10px; align-items:center; }
      .book-dialogue-card-head strong { color:var(--text); }
      .book-dialogue-audio { color:var(--text-3); font-size:0.78rem; font-weight:700; }
      .book-dialogue-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .book-voice-badge { display:inline-flex; align-items:center; min-height:22px; padding:2px 7px; border-radius:999px; border:1px solid var(--border); color:var(--text-3); background:var(--off-white); font-size:.7rem; font-weight:800; text-transform:uppercase; }
      .book-tts-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .book-dialogue-lines { display:grid; gap:0; }
      .book-dialogue-line { display:grid; grid-template-columns:minmax(72px, 0.28fr) minmax(0, 1fr) auto; gap:12px; align-items:start; padding:12px 14px; border-bottom:1px solid var(--border); }
      .book-dialogue-line:last-child { border-bottom:0; }
      .book-dialogue-speaker { color:var(--accent); font-weight:800; font-size:0.9rem; }
      .book-dialogue-zh { color:var(--text); font-size:1.08rem; line-height:1.45; font-family:var(--font-zh); font-weight:700; }
      .book-dialogue-pinyin { margin-top:3px; font-size:0.88rem; line-height:1.4; }
      .book-dialogue-en { margin-top:4px; color:var(--text-2); font-size:0.9rem; line-height:1.4; }
      @media (max-width: 900px) { .book-dialogue-grid { grid-template-columns:1fr; } }
      @media (max-width: 560px) { .book-dialogue-line { grid-template-columns:1fr auto; } .book-dialogue-speaker { grid-column:1 / -1; } }
      .book-exercise-panel { display:grid; gap:14px; margin-bottom:24px; border:1px solid var(--border); border-radius:14px; background:var(--card-bg); padding:16px; }
      .book-exercise-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; }
      .book-exercise-header h3 { margin:0; font-size:1.15rem; color:var(--text); }
      .book-exercise-header p { margin:4px 0 0; color:var(--text-3); line-height:1.4; }
      .book-exercise-tabs { display:flex; flex-wrap:wrap; gap:8px; }
      .book-exercise-tab { border:1px solid var(--border); background:var(--off-white); color:var(--text); border-radius:999px; padding:8px 12px; font-weight:800; cursor:pointer; }
      .book-exercise-tab.active, .book-exercise-tab:hover { background:var(--accent); border-color:var(--accent); color:white; }
      .book-exercise-story { white-space:pre-line; border:1px solid var(--border); border-radius:12px; background:var(--off-white); padding:14px; color:var(--text); line-height:1.7; max-height:280px; overflow:auto; }
      .book-exercise-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
      .book-exercise-card { border:1px solid var(--border); border-radius:12px; background:var(--card-bg); padding:14px; display:grid; gap:10px; }
      .book-exercise-kicker { color:var(--text-3); font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0; }
      .book-exercise-prompt { color:var(--text); font-weight:800; line-height:1.35; }
      .book-exercise-options { display:grid; gap:8px; }
      .book-exercise-option { border:1px solid var(--border); background:var(--off-white); color:var(--text); border-radius:10px; padding:9px 10px; text-align:left; cursor:pointer; font-weight:650; line-height:1.35; }
      .book-exercise-option.correct { border-color:rgba(39,174,96,.55); background:rgba(39,174,96,.14); }
      .book-exercise-option.wrong { border-color:rgba(192,57,43,.55); background:rgba(192,57,43,.14); }
      .book-writing-row { display:grid; gap:8px; }
      .book-writing-row input { width:100%; min-height:42px; border:1px solid var(--border); border-radius:10px; background:var(--card-bg); color:var(--text); padding:8px 10px; font:inherit; }
      .book-exercise-feedback { min-height:22px; color:var(--text-3); font-weight:700; font-size:.88rem; }
      .book-exercise-feedback.correct { color:var(--tone2); }
      .book-exercise-feedback.wrong { color:var(--tone4); }
    `;
    document.head.appendChild(style);
  }

  function updateTabs() {
    const tabs = document.querySelectorAll('.book-tab');
    tabs.forEach((tab, i) => {
      const bookNum = i + 1;
      if (state.book === bookNum) {
        tab.classList.remove('btn-ghost');
        tab.classList.add('btn-primary');
      } else {
        tab.classList.remove('btn-primary');
        tab.classList.add('btn-ghost');
      }
    });
  }

  async function loadBook(bookNum) {
    state.loading = true;
    injectStyles();
    updateTabs();
    const content = document.getElementById('vocabulary-books-content');
    if (content) content.innerHTML = '<div class="spinner"></div>';

    try {
      const resp = await fetch(`books/book${bookNum}/vocabulary_b${bookNum}.json`);
      if (!resp.ok) throw new Error(`Failed to load Book ${bookNum} data`);
      state.data = await resp.json();
      state.book = bookNum;
      state.dialogues = null;
      state.exercises = null;
      if (bookNum === 1) {
        try {
          const dialogueResp = await fetch('data/book1_dialogues.json?v=1');
          if (dialogueResp.ok) state.dialogues = await dialogueResp.json();
          const exerciseResp = await fetch('data/book1_exercises.json?v=1');
          if (exerciseResp.ok) state.exercises = await exerciseResp.json();
        } catch (dialogueErr) {
          console.warn('Book 1 dialogues unavailable', dialogueErr);
        }
      }

      const chapters = [...new Set(state.data.map(item => {
        const match = item.vocab_id.match(/L(\d+)/);
        return match ? match[1] : null;
      }))].filter(Boolean).sort();

      if (!chapters.includes(state.chapter)) {
        state.chapter = chapters[0];
      }

      state.loading = false;
      updateTabs();
      renderContent();
    } catch (err) {
      console.error(err);
      if (content) content.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
      state.loading = false;
    }
  }

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div style="font-size: 0.75rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px;">Course Curriculum</div>
        <h2>Course Vocabulary Library</h2>
        <p>Comprehensive vocabulary from Books 1-3 with authentic audio and writing practice.</p>
      </div>

      <div class="library-controls mb-24" style="justify-content: flex-start; gap: 12px;">
        <div class="flex gap-8">
          <button class="btn ${state.book === 1 ? 'btn-primary' : 'btn-ghost'} book-tab" onclick="VocabularyBooksModule.switchBook(1)">Book 1</button>
          <button class="btn ${state.book === 2 ? 'btn-primary' : 'btn-ghost'} book-tab" onclick="VocabularyBooksModule.switchBook(2)">Book 2</button>
          <button class="btn ${state.book === 3 ? 'btn-primary' : 'btn-ghost'} book-tab" onclick="VocabularyBooksModule.switchBook(3)">Book 3</button>
        </div>
      </div>

      <div id="vocabulary-books-content">
        <div class="spinner"></div>
      </div>
    `;

    loadBook(state.book);
  }

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  const SPEAKER_GENDER = {
    '明華': 'male', '開文': 'male', '安同': 'male', '田中': 'male', '醫生': 'male',
    '月美': 'female', '怡君': 'female', '如玉': 'female', '白如玉': 'female', '明華的媽媽': 'female', '媽媽': 'female'
  };

  function speakerGender(speaker = '') {
    if (SPEAKER_GENDER[speaker]) return SPEAKER_GENDER[speaker];
    if (/媽|姐|妹|太太|小姐|如玉|月美|怡君/.test(speaker)) return 'female';
    if (/先生|爸爸|哥哥|弟弟|醫生|明華|開文|安同|田中/.test(speaker)) return 'male';
    return 'female';
  }

  function speakChinese(text, speakerOrGender = 'female', rate = 0.82) {
    const tts = window.TTS || (typeof TTS !== 'undefined' ? TTS : null);
    if (!text || !tts) return;
    const gender = speakerOrGender === 'male' || speakerOrGender === 'female' ? speakerOrGender : speakerGender(speakerOrGender);
    tts.speak(text, 'zh-TW', rate, { gender });
  }

  function currentLessonDialogues() {
    if (state.book !== 1 || !state.dialogues || !Array.isArray(state.dialogues.lessons)) return null;
    const lessonNum = parseInt(state.chapter, 10);
    return state.dialogues.lessons.find(lesson => Number(lesson.lesson) === lessonNum) || null;
  }

  function renderDialogueSection(lesson) {
    if (!lesson || !Array.isArray(lesson.dialogues) || !lesson.dialogues.length) return '';
    return `
      <div class="book-dialogue-panel">
        <div class="book-dialogue-header">
          <div class="book-dialogue-title">
            <h3>Lesson ${Number(lesson.lesson)} Dialogues</h3>
            <p>${esc(lesson.english_title)}${lesson.chinese_title ? ' · ' + esc(lesson.chinese_title) : ''}</p>
          </div>
          <span class="text-small text-muted">${lesson.dialogues.length} dialogues · ${lesson.dialogues.reduce((sum, d) => sum + (d.lines || []).length, 0)} lines</span>
        </div>
        <div class="book-dialogue-grid">
          ${lesson.dialogues.map((dialogue, dIndex) => `
            <section class="book-dialogue-card">
              <div class="book-dialogue-card-head">
                <strong>Dialogue ${Number(dialogue.dialogue)}</strong>
                <span class="book-dialogue-audio">Audio ${esc(dialogue.audio_ref || '')}</span>
                <button class="btn btn-ghost btn-sm" onclick="VocabularyBooksModule.playDialogue(${dIndex})">Play dialogue</button>
              </div>
              <div class="book-dialogue-lines">
                ${(dialogue.lines || []).map((line, lineIndex) => renderDialogueLine(line, dIndex, lineIndex)).join('')}
              </div>
            </section>
          `).join('')}
        </div>
      </div>`;
  }

  function renderDialogueLine(line, dIndex, lineIndex) {
    return `
      <div class="book-dialogue-line">
        <div class="book-dialogue-speaker">${esc(line.speaker)}<br><span class="book-voice-badge">${speakerGender(line.speaker)}</span></div>
        <div>
          <div class="book-dialogue-zh">${esc(line.chinese)}</div>
          <div class="book-dialogue-pinyin tone-colors">${Pinyin.colorize(esc(line.pinyin))}</div>
          <div class="book-dialogue-en">${esc(line.english)}</div>
        </div>
        <button class="play-btn-circle" title="Play line" onclick="VocabularyBooksModule.playDialogueLine(${dIndex}, ${lineIndex})">${window.IconSystem ? window.IconSystem.svg('volume') : '🔊'}</button>
      </div>`;
  }

  function currentLessonExercises() {
    if (state.book !== 1 || !state.exercises || !Array.isArray(state.exercises.lessons)) return null;
    const lessonNum = parseInt(state.chapter, 10);
    return state.exercises.lessons.find(lesson => Number(lesson.lesson) === lessonNum) || null;
  }

  function exerciseCounts(ex, dialogueNum) {
    if (!ex) return 0;
    return ['listening', 'reading', 'pinyin', 'writing'].reduce((sum, key) => {
        const filtered = (ex[key] || []).filter(q => q.dialogue === dialogueNum);
        return sum + filtered.length;
    }, 0);
  }

  function renderExerciseSection(ex, dialogueNum) {
    if (!ex) return '';
    const tabs = [
      ['listening', 'Listening'],
      ['reading', 'Reading'],
      ['pinyin', 'Pinyin'],
      ['writing', 'Writing']
    ];
    const currentView = exerciseViews[dialogueNum] || 'listening';

    return `
      <section class="book-exercise-panel" style="margin-bottom:32px; border-left: 4px solid var(--accent)">
        <div class="book-exercise-header">
          <div>
            <div class="book-voice-badge" style="margin-bottom:8px; background:var(--accent); color:#fff; border:none">Part ${dialogueNum}</div>
            <h3>Dialogue ${dialogueNum} Practice</h3>
            <p>${exerciseCounts(ex, dialogueNum)} activities for this part of the lesson.</p>
          </div>
        </div>
        <div class="book-exercise-tabs">
          ${tabs.map(([key, label]) => `<button class="book-exercise-tab ${currentView === key ? 'active' : ''}" onclick="VocabularyBooksModule.setExerciseView(${dialogueNum}, '${key}')">${label}</button>`).join('')}
        </div>
        ${renderExerciseBody(ex, dialogueNum)}
      </section>`;
  }

  function renderExerciseBody(ex, dialogueNum) {
    const currentView = exerciseViews[dialogueNum] || 'listening';
    const filteredList = (ex[currentView] || []).filter(q => q.dialogue === dialogueNum);

    if (currentView === 'reading') {
      return `
        <div class="book-exercise-story">${esc(ex.story.chinese)}</div>
        <div class="book-exercise-grid">${filteredList.map((q, i) => renderMCExercise('reading', q, i, dialogueNum)).join('')}</div>`;
    }
    if (currentView === 'pinyin') return `<div class="book-exercise-grid">${filteredList.map((q, i) => renderMCExercise('pinyin', q, i, dialogueNum)).join('')}</div>`;
    if (currentView === 'writing') return `<div class="book-exercise-grid">${filteredList.map((q, i) => renderWritingExercise(q, i, dialogueNum)).join('')}</div>`;
    return `<div class="book-exercise-grid">${filteredList.map((q, i) => renderMCExercise('listening', q, i, dialogueNum)).join('')}</div>`;
  }

  function renderMCExercise(kind, q, index, dialogueNum) {
    const qIndexInFull = currentLessonExercises()[kind].indexOf(q);
    return `
      <div class="book-exercise-card">
        <div class="book-exercise-kicker">${esc(kind)} ${index + 1}</div>
        <div class="book-exercise-prompt">${esc(q.prompt)}</div>
        <div class="book-tts-row">
          ${q.chinese ? `<button class="btn btn-ghost btn-sm" onclick="VocabularyBooksModule.playExercisePrompt('${kind}', ${qIndexInFull})">Play prompt</button>` : ''}
          ${q.speaker ? `<span class="book-voice-badge">${speakerGender(q.speaker)}</span>` : ''}
        </div>
        ${q.chinese && kind !== 'listening' ? `<div class="book-dialogue-zh" style="font-size:0.95rem">${esc(q.chinese)}</div>` : ''}
        ${q.pinyin && kind === 'reading' ? `<div class="book-dialogue-pinyin tone-colors">${Pinyin.colorize(esc(q.pinyin))}</div>` : ''}
        <div class="book-exercise-options">
          ${(q.options || []).map((option, oi) => `<button id="book-ex-${kind}-${qIndexInFull}-${oi}" class="book-exercise-option" onclick="VocabularyBooksModule.answerExercise('${kind}', ${qIndexInFull}, ${oi})">${esc(option)}</button>`).join('')}
        </div>
        <div id="book-ex-feedback-${kind}-${qIndexInFull}" class="book-exercise-feedback"></div>
      </div>`;
  }

  function renderWritingExercise(q, index, dialogueNum) {
    const qIndexInFull = currentLessonExercises().writing.indexOf(q);
    return `
      <div class="book-exercise-card">
        <div class="book-exercise-kicker">Writing ${index + 1}</div>
        <div class="book-exercise-prompt">${esc(q.prompt)}</div>
        <div class="book-tts-row">
          <div class="text-small text-muted">${esc(q.hint)}</div>
          <button class="btn btn-ghost btn-sm" onclick="VocabularyBooksModule.playWritingAnswer(${qIndexInFull})">Play answer</button>
        </div>
        <div class="book-writing-row">
          <input id="book-write-${qIndexInFull}" lang="zh-Hant" autocomplete="off" placeholder="Type Chinese here" />
          <button class="btn btn-primary btn-sm" onclick="VocabularyBooksModule.checkWriting(${qIndexInFull})">Check</button>
        </div>
        <div id="book-write-feedback-${qIndexInFull}" class="book-exercise-feedback"></div>
      </div>`;
  }

  function renderContent() {
    const container = document.getElementById('vocabulary-books-content');
    if (!container || !state.data) return;

    const chapters = [...new Set(state.data.map(item => {
      const match = item.vocab_id.match(/L(\d+)/);
      return match ? match[1] : null;
    }))].filter(Boolean).sort();

    const filtered = state.data.filter(item => item.vocab_id.includes(`L${state.chapter}`));
    const lessonDialogues = currentLessonDialogues();
    const lessonExercises = currentLessonExercises();

    container.innerHTML = `
      <div class="section-title">Select Lesson</div>
      <div class="chapter-grid">
        ${chapters.map(ch => `
          <div class="chapter-btn ${state.chapter === ch ? 'active' : ''}" onclick="VocabularyBooksModule.switchChapter('${ch}')">
            Lesson ${parseInt(ch)}
          </div>
        `).join('')}
      </div>

      ${renderDialogueSection(lessonDialogues)}

      <div class="section-title" style="margin-top:40px">Practice & Comprehension</div>
      ${renderExerciseSection(lessonExercises, 1)}
      ${renderExerciseSection(lessonExercises, 2)}

      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border);">
        <div style="padding: 16px 20px; background: var(--off-white); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1rem; margin: 0;">Lesson ${parseInt(state.chapter)} Vocabulary</h3>
          <span class="text-small text-muted">${filtered.length} words</span>
        </div>
        <table class="vocab-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; font-size: 0.8rem; text-transform: uppercase; color: var(--text-3);">
              <th style="padding: 12px 20px; width: 60px;">Audio</th>
              <th style="padding: 12px 20px; width: 160px;">Word</th>
              <th style="padding: 12px 20px; width: 160px;">Pinyin</th>
              <th style="padding: 12px 20px; width: 100px;">Part</th>
              <th style="padding: 12px 20px;">Definition</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(item => `
              <tr class="vocab-row" onclick="VocabularyBooksModule.showDetail('${item.vocab_id}')">
                <td style="padding: 12px 20px;" onclick="event.stopPropagation()">
                  <button class="play-btn-circle" onclick="VocabularyBooksModule.play('${item.audio_file}', this)">🔊</button>
                </td>
                <td style="padding: 12px 20px;">
                  <div class="vocab-hanzi-large">${item.traditional}</div>
                  ${item.simplified !== item.traditional ? `<div style="font-size: 0.8rem; color: var(--text-3);">${item.simplified}</div>` : ''}
                </td>
                <td style="padding: 12px 20px;">
                  <div class="tone-colors" style="font-weight: 500;">${Pinyin.colorize(item.pinyin)}</div>
                </td>
                <td style="padding: 12px 20px;">
                  <span class="badge badge-gray" style="font-size: 0.7rem;">${item.part_of_speech || '-'}</span>
                </td>
                <td style="padding: 12px 20px; color: var(--text-2); line-height: 1.4;">${item.english}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  let currentWordChars = [];
  let currentCharIndex = 0;

  function showDetail(vocabId) {
    const vocab = state.data.find(v => v.vocab_id === vocabId);
    if (!vocab) return;

    currentWordChars = Array.from(vocab.traditional).filter(c => /[\u4e00-\u9fa5]/.test(c));
    currentCharIndex = 0;

    const modalContent = `
      <div class="vocab-detail-modal">
        <button class="modal-close" onclick="Modal.hide()">✖</button>
        
        <div class="vd-layout">
          <div class="vd-left" style="text-align:left">
            <div class="vd-word-header" onclick="VocabularyBooksModule.play('${vocab.audio_file}')" style="cursor:pointer; display:inline-block; margin-bottom:16px">
              <div class="vd-hanzi" style="text-align:left; line-height:1; font-size: 3.5rem; color: var(--text);">${vocab.traditional}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:12px">
                <span class="vd-pinyin tone-colors" style="margin-top:0; font-size: 1.2rem;">${Pinyin.colorize(vocab.pinyin)}</span>
                <span class="vd-audio-icon" style="font-size: 1.2rem; color: var(--accent);">🔊</span>
              </div>
            </div>

            <div class="vd-section">
              <h4 style="color: var(--text-3); font-size: 0.8rem; text-transform: uppercase;">Meaning</h4>
              <p style="font-size: 1.1rem; color: var(--text); font-weight: 500;">${vocab.english}</p>
            </div>

            <div class="vd-section">
              <h4 style="color: var(--text-3); font-size: 0.8rem; text-transform: uppercase;">Details</h4>
              <div style="display:flex; gap:12px; margin-top:8px;">
                <span class="badge badge-gray">Part: ${vocab.part_of_speech || 'N/A'}</span>
                <span class="badge badge-gray">ID: ${vocab.vocab_id}</span>
              </div>
            </div>

            <div class="vd-section" style="margin-top: 24px;">
              <p style="font-size: 0.85rem; color: var(--text-3);">Authentic audio from Book ${state.book} Lesson ${parseInt(state.chapter)}.</p>
            </div>
          </div>

          <div class="vd-right" style="display:flex; flex-direction:column;">
            <div class="vd-section" style="flex:1; display:flex; flex-direction:column; margin-bottom:0">
              
              ${currentWordChars.length > 1 ? `
              <div style="display:flex; gap:8px; margin-bottom:12px; justify-content:center">
                ${currentWordChars.map((c, i) => `
                  <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-outline'} char-select-btn" onclick="VocabularyBooksModule.selectCanvasChar(${i}, this)">${c}</button>
                `).join('')}
              </div>
              ` : ''}

              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px">
                <div class="flex items-center gap-8">
                  <select class="input input-sm" style="width:auto; padding:2px 8px; height:28px; font-size:0.75rem; background: var(--card-bg); color: var(--text); border-color: var(--border);" onchange="DrawingBoard.setMode(this.value)">
                    <option value="guided">Guided</option>
                    <option value="freehand">Freehand</option>
                  </select>
                </div>
                <div class="flex gap-8">
                  <button class="btn btn-ghost btn-sm" onclick="VocabularyBooksModule.animateStrokes()">Animate</button>
                  <button class="btn btn-ghost btn-sm" onclick="VocabularyBooksModule.clearCanvas()">Reset 🔄</button>
                </div>
              </div>
              <div class="canvas-container" style="flex:1; min-height:350px; background:var(--off-white); border:2px dashed var(--border); border-radius:var(--radius); position:relative; overflow:hidden; touch-action:none; display:flex; align-items:center; justify-content:center;">
                <div id="book-hanzi-writer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"></div>
                <canvas id="book-freehand-canvas" style="position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; display:none"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const mc = document.getElementById('modal-content');
    if (mc) mc.style.maxWidth = '850px';
    Modal.show(modalContent);

    setTimeout(() => {
        const char = currentWordChars[currentCharIndex];
        DrawingBoard.init('book-hanzi-writer', 'book-freehand-canvas', char);
    }, 100);
  }

  return {
    render,
    switchBook(n) {
      if (state.loading) return;
      state.book = n;
      loadBook(n);
    },
    switchChapter(ch) {
      state.chapter = ch;
      renderContent();
    },
    setExerciseView(dialogueNum, view) {
      exerciseViews[dialogueNum] = view;
      renderContent();
    },
    playExercisePrompt(kind, index) {
      const ex = currentLessonExercises();
      const q = ex?.[kind]?.[index];
      if (q?.chinese) speakChinese(q.chinese, q.speaker || 'female');
    },
    playWritingAnswer(index) {
      const ex = currentLessonExercises();
      const q = ex?.writing?.[index];
      if (q?.answer) speakChinese(q.answer, 'female', 0.78);
    },
    answerExercise(kind, index, optionIndex) {
      const ex = currentLessonExercises();
      const q = ex?.[kind]?.[index];
      if (!q) return;
      (q.options || []).forEach((_, oi) => {
        const btn = document.getElementById(`book-ex-${kind}-${index}-${oi}`);
        if (!btn) return;
        btn.classList.remove('correct', 'wrong');
        if (oi === q.correctIndex) btn.classList.add('correct');
        else if (oi === optionIndex) btn.classList.add('wrong');
      });
      const fb = document.getElementById(`book-ex-feedback-${kind}-${index}`);
      const ok = optionIndex === q.correctIndex;
      if (fb) {
        fb.className = `book-exercise-feedback ${ok ? 'correct' : 'wrong'}`;
        fb.textContent = ok ? 'Correct.' : `Review: ${q.answer}`;
      }
      if (!ok && window.WeaknessEngine) WeaknessEngine.record(kind === 'pinyin' ? 'pinyin' : 'listening', { item: q.chinese || q.prompt, label: q.answer, type: `book1-${kind}` });
    },
    checkWriting(index) {
      const ex = currentLessonExercises();
      const q = ex?.writing?.[index];
      const input = document.getElementById(`book-write-${index}`);
      const fb = document.getElementById(`book-write-feedback-${index}`);
      if (!q || !input || !fb) return;
      const actual = input.value.replace(/[\s，。！？,.!?]/g, '');
      const accepted = (q.accepted || [q.answer]).map(x => String(x).replace(/[\s，。！？,.!?]/g, ''));
      const ok = accepted.includes(actual);
      fb.className = `book-exercise-feedback ${ok ? 'correct' : 'wrong'}`;
      fb.textContent = ok ? 'Correct.' : `Answer: ${q.answer}`;
      if (!ok && window.WeaknessEngine) WeaknessEngine.record('grammar', { item: q.answer, label: q.prompt, type: 'book1-writing' });
    },
    playDialogueLine(dialogueIndex, lineIndex) {
      const lesson = currentLessonDialogues();
      const line = lesson?.dialogues?.[dialogueIndex]?.lines?.[lineIndex];
      if (line?.chinese) speakChinese(line.chinese, line.speaker);
    },
    playDialogue(dialogueIndex) {
      const lesson = currentLessonDialogues();
      const lines = lesson?.dialogues?.[dialogueIndex]?.lines || [];
      this.playLineSequence(lines, 0);
    },
    playLessonDialogues() {
      const lesson = currentLessonDialogues();
      const lines = (lesson?.dialogues || []).flatMap(d => d.lines || []);
      this.playLineSequence(lines, 0);
    },
    playLineSequence(lines, index = 0) {
      const line = lines[index];
      const tts = window.TTS || (typeof TTS !== 'undefined' ? TTS : null);
      if (!line?.chinese || !tts) return;
      const utt = tts.speak(line.chinese, 'zh-TW', 0.82, { gender: speakerGender(line.speaker) });
      if (utt) utt.onend = () => setTimeout(() => this.playLineSequence(lines, index + 1), 220);
    },
    play(filename, btn) {
      if (!filename) return;
      const path = `books/book${state.book}/audio_b${state.book}/${filename}`;
      const audio = new Audio(path);
      
      if (btn) btn.innerHTML = '⌛';
      
      audio.play().then(() => {
        if (btn) btn.innerHTML = '🔊';
      }).catch(err => {
        console.error("Audio failed:", err);
        if (btn) btn.innerHTML = '❌';
        setTimeout(() => { if (btn) btn.innerHTML = '🔊'; }, 2000);
      });
    },
    showDetail,
    selectCanvasChar(idx, btn) {
      document.querySelectorAll('.char-select-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
      currentCharIndex = idx;
      DrawingBoard.init('book-hanzi-writer', 'book-freehand-canvas', currentWordChars[currentCharIndex]);
    },
    animateStrokes: () => DrawingBoard.animate(),
    clearCanvas: () => DrawingBoard.reset(),
    closeModal() {
      Modal.hide();
      const mc = document.getElementById('modal-content');
      if (mc) mc.style.maxWidth = '';
    }
  };
})();
