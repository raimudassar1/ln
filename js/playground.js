/* ═══════════════════════════════════════════════════════════════
   playground.js — 3-Volume Contemporary Chinese Course
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.PlaygroundModule = (() => {

  let currentBookData = null;
  let currentCharData = null;
  let currentRadicalData = null;
  let currentPlaygroundData = null;
  let currentBookId = 1;
  let currentChapterId = null;
  let currentLesson = null;
  let currentStep = 0;

  async function init() {
    if (!currentCharData) {
      try {
        const res = await fetch('data/char_playground_content.json');
        currentCharData = await res.json();
      } catch (e) {
        console.error("Failed to load character playground data", e);
        currentCharData = [];
      }
    }
    if (!currentRadicalData) {
      try {
        const res = await fetch('data/radicals_set.json');
        const json = await res.json();
        currentRadicalData = json.radicals;
      } catch (e) {
        console.error("Failed to load radical learning set", e);
        currentRadicalData = [];
      }
    }
    if (!currentPlaygroundData) {
      try {
        const res = await fetch('data/playground_content.json');
        currentPlaygroundData = await res.json();
      } catch (e) {
        console.error("Failed to load playground content", e);
        currentPlaygroundData = [];
      }
    }
  }

  async function loadBook(bookId) {
    try {
      const res = await fetch(`data/book${bookId}_content.json`);
      currentBookData = await res.json();
      currentBookId = bookId;
    } catch (e) {
      console.error(`Failed to load Book ${bookId} data`, e);
      currentBookData = [];
    }
  }

  // ── Main Entry (Path & Books) ──────────────────────────────────────────

  async function render(container) {
    await init();
    
    // Check if user has selected a view (default to path)
    const view = App.state._pgView || 'path';

    if (view === 'books') {
      return renderBooksView(container);
    }

    // Group playground groups by stage
    const stages = [
      { id: 'start-here', title: '🟢 Start Here', color: '#27ae60', desc: 'Survival Mandarin for your first weeks in Taiwan.' },
      { id: 'daily-life', title: '🔵 Daily Life', color: '#2980b9', desc: 'Navigating transport, food, and errands.' },
      { id: 'people-places', title: '🟣 People & Places', color: '#8e44ad', desc: 'Talking about yourself and exploring Taiwan.' },
      { id: 'work-study', title: '🟠 Work & Study', color: '#f39c12', desc: 'Office etiquette and educational terms.' },
      { id: 'social', title: '🔴 Social Communication', color: '#c0392b', desc: 'Making friends and deeper conversations.' },
      { id: 'grammar-review', title: '⚪ Grammar & Review', color: '#7f8c8d', desc: 'Polishing your structure and foundations.' }
    ];

    container.innerHTML = `
      <div class="page-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
          <div>
            <h2>Beginner Learning Path</h2>
            <p>A structured journey from Absolute Beginner to Survival Mandarin.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.PlaygroundModule.switchView('books')">Switch to CCC Books →</button>
        </div>
      </div>
      
      <div class="pg-stages-container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        ${stages.map(stage => {
          const items = currentPlaygroundData.filter(pg => pg.stage === stage.id);
          if (!items.length) return '';
          return `
            <div class="pg-stage-section mb-60">
              <div class="mb-24" style="border-left: 6px solid ${stage.color}; padding-left: 20px;">
                <h3 class="stage-title" style="font-size: 1.8rem; margin-bottom: 4px;">${stage.title}</h3>
                <p class="text-muted" style="font-size: 1rem;">${stage.desc}</p>
              </div>
              <div class="pg-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
                ${items.map(pg => {
                  const isDone = App.state.progress.playground?.[pg.id];
                  return `
                    <div class="pg-card ${isDone ? 'done' : ''}" onclick="window.PlaygroundModule.openPlaygroundGroup('${pg.id}')" style="cursor: pointer; position: relative;">
                      <div class="pg-card-icon" style="background:${stage.color}15; color:${stage.color}; font-size: 2rem; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin-bottom: 20px;">📖</div>
                      <div class="pg-card-content">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <div class="pg-card-meta" style="font-size: 0.75rem; font-weight: 800; color: ${stage.color}; letter-spacing: 1px;">WEEK ${pg.recommended_week || '?'}</div>
                          ${isDone ? '<span style="color: #27ae60; font-weight: 900;">✓</span>' : ''}
                        </div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 8px;">${pg.title}</h3>
                        <p style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5; margin-bottom: 16px;">${pg.subtitle}</p>
                        <div class="pg-lesson-count" style="font-size: 0.8rem; font-weight: 700; color: var(--text-3); text-transform: uppercase;">${pg.lessons.length} Practice Sets</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function switchView(view) {
    App.state._pgView = view;
    render(document.getElementById('page-content'));
  }

  function renderBooksView(container) {
    container.innerHTML = `
      <div class="page-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
          <div>
            <h2>Comprehensive Curriculum</h2>
            <p>A full 3-volume series "A Course in Contemporary Chinese" for academic mastery.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.PlaygroundModule.switchView('path')">Switch to Learning Path →</button>
        </div>
      </div>
      
      <div class="pg-stages" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <div class="pg-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
          <div class="pg-card" onclick="window.PlaygroundModule.openBook(1)" style="cursor: pointer;">
            <div class="pg-card-icon" style="font-size: 3rem; margin-bottom: 20px;">📘</div>
            <div class="pg-card-content">
              <h3 style="font-size: 1.25rem; margin-bottom: 8px;">Book 1: Foundations</h3>
              <p style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5; margin-bottom: 16px;">Survival greetings, family, shopping, and arrival in Taiwan.</p>
              <div class="pg-lesson-count" style="font-size: 0.8rem; font-weight: 700; color: var(--text-3); text-transform: uppercase;">15 Chapters</div>
            </div>
          </div>
          <div class="pg-card" onclick="window.PlaygroundModule.openBook(2)" style="cursor: pointer;">
            <div class="pg-card-icon" style="font-size: 3rem; margin-bottom: 20px;">📗</div>
            <div class="pg-card-content">
              <h3 style="font-size: 1.25rem; margin-bottom: 8px;">Book 2: Daily Life</h3>
              <p style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5; margin-bottom: 16px;">Directions, transportation, work, and local customs.</p>
              <div class="pg-lesson-count" style="font-size: 0.8rem; font-weight: 700; color: var(--text-3); text-transform: uppercase;">15 Chapters</div>
            </div>
          </div>
          <div class="pg-card" onclick="window.PlaygroundModule.openBook(3)" style="cursor: pointer;">
            <div class="pg-card-icon" style="font-size: 3rem; margin-bottom: 20px;">📙</div>
            <div class="pg-card-content">
              <h3 style="font-size: 1.25rem; margin-bottom: 8px;">Book 3: Advanced Social</h3>
              <p style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5; margin-bottom: 16px;">Culture, trends, society, and professional fluency.</p>
              <div class="pg-lesson-count" style="font-size: 0.8rem; font-weight: 700; color: var(--text-3); text-transform: uppercase;">12 Chapters</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Playground Learning Path Actions ──────────────────────────────────

  function openPlaygroundGroup(id) {
    const pg = currentPlaygroundData.find(p => p.id === id);
    if (!pg) return;

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header">
        <button class="btn btn-ghost btn-sm mb-12" onclick="window.PlaygroundModule.render(document.getElementById('page-content'))">← Back to Path</button>
        <h2>${pg.title}</h2>
        <p>${pg.subtitle}</p>
      </div>
      
      <div class="pg-lessons-list" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; max-width: 1200px; margin: 0 auto; padding: 20px;">
        ${pg.lessons.map((lesson, idx) => {
          const isDone = App.state.progress.playground_lessons?.[lesson.id];
          return `
            <div class="pg-lesson-item ${isDone ? 'done' : ''}" style="height:auto; flex-direction:column; align-items:flex-start; padding:24px; cursor: pointer;" onclick="window.PlaygroundModule.startPlaygroundLesson('${pg.id}', '${lesson.id}')">
              <div style="display:flex; width:100%; justify-content:space-between; align-items:center; margin-bottom:16px">
                <div class="pg-lesson-num" style="background:${isDone?'var(--tone2)':'var(--accent)'}">${isDone ? '✓' : idx + 1}</div>
                <div class="pg-lesson-status" style="font-size:0.75rem; font-weight:800; letter-spacing:1px; color:${isDone?'var(--tone2)':'var(--text-3)'}">${isDone ? 'COMPLETED' : 'START →'}</div>
              </div>
              <div class="pg-lesson-info">
                <h4 style="font-size:1.2rem; margin-bottom:6px; font-weight:800">${lesson.title}</h4>
                <p style="font-size:0.9rem; line-height:1.5; color:var(--text-2)">Practice real-world dialogue and key vocabulary.</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    window.scrollTo(0,0);
  }

  function startPlaygroundLesson(pgId, lessonId) {
    const pg = currentPlaygroundData.find(p => p.id === pgId);
    if (!pg) return;
    const lesson = pg.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const container = document.getElementById('page-content');
    
    // Section 1: Dialogues (Fixed rendering for simplified array of lines)
    let dialoguesHTML = '';
    const dialogueData = lesson.dialogue;
    
    if (dialogueData && Array.isArray(dialogueData)) {
      // Check if it's a simple array of lines (like in recent updates)
      const isSimpleArray = dialogueData.length > 0 && dialogueData[0].speaker;
      const dialogueList = isSimpleArray ? [{ title: 'Main Dialogue', lines: dialogueData }] : dialogueData;

      dialoguesHTML = `
        <section class="lesson-section">
          <h3 class="section-title">Real-World Dialogues</h3>
          ${dialogueList.map((d, idx) => `
            <div class="dialogue-block-premium shadow-sm mb-32" style="background: var(--card-bg); border-radius: 12px; padding: 24px;">
              ${d.title ? `<h4 class="mb-16" style="color:var(--accent); font-size:1.2rem; font-weight:800; border-bottom: 2px solid var(--off-white); padding-bottom: 12px;">${d.title}</h4>` : ''}
              <div style="display:flex; flex-direction:column; gap:16px">
                ${(d.lines || []).map(line => `
                  <div class="dialogue-line-premium" onclick="TTS.speak('${line.zh}')" style="cursor:pointer; display: flex; gap: 16px; align-items: flex-start;">
                    <div class="line-speaker-badge" style="background: var(--charcoal); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; min-width: 80px; text-align: center;">${line.speaker}</div>
                    <div style="flex:1">
                      <div class="font-zh" style="font-size:1.4rem; font-weight:800; margin-bottom:4px; color: var(--text)">${line.zh}</div>
                      <div class="text-muted" style="font-size:1rem; font-weight:600; color:var(--accent)">${line.pinyin}</div>
                      <div style="font-size:0.95rem; margin-top:4px; color: var(--text-2); font-style: italic;">${line.en}</div>
                    </div>
                    <div style="font-size:1.2rem; opacity:0.3">🔊</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </section>
      `;
    }

    // Section 2: Listening Comprehension
    let listeningHTML = '';
    const listeningData = lesson.listening;
    if (listeningData) {
      listeningHTML = `
        <section class="lesson-section">
          <h3 class="section-title">Listening Challenge</h3>
          <div class="listening-card-premium shadow-lg mb-24" style="background:var(--charcoal); padding:40px; border-radius:var(--radius); text-align:center">
             <div style="font-size:4rem; margin-bottom:16px">🎙️</div>
             <button class="btn btn-white btn-lg" style="background:var(--card-bg); color:var(--charcoal)" onclick="TTS.speak(\`${listeningData.text.replace(/'/g, "\\'")}\`)">▶ Play Audio</button>
             <div class="mt-24">
                <button class="btn btn-outline btn-sm" style="color:white; border-color:white" onclick="this.nextElementSibling.classList.toggle('hidden')">Show Transcript</button>
                <div class="hidden mt-16 p-16 font-zh" style="background:rgba(255,255,255,0.1); color:white; border-radius:8px; text-align:left">
                   ${listeningData.text}
                </div>
             </div>
          </div>
          <div class="card p-24" style="background: var(--card-bg);">
             ${listeningData.questions.map((q, qIdx) => `
               <div class="mb-24">
                 <div style="font-weight:700; margin-bottom:12px; color: var(--text)">${qIdx+1}. ${q.q}</div>
                 <div class="options-grid" style="display:grid; grid-template-columns:1fr; gap:8px">
                   ${q.options.map(opt => `
                     <button class="btn btn-outline" style="text-align:left; justify-content:flex-start; color: var(--text)" onclick="window.PlaygroundModule.checkAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.answer.replace(/'/g, "\\'")}')">${opt}</button>
                   `).join('')}
                 </div>
               </div>
             `).join('')}
          </div>
        </section>
      `;
    }

    // Section 3: Reading Comprehension
    let readingHTML = '';
    const readingData = lesson.reading;
    if (readingData) {
      readingHTML = `
        <section class="lesson-section">
          <h3 class="section-title">Reading Mastery</h3>
          <div class="card p-32 mb-24 font-zh" style="font-size:1.3rem; line-height:1.8; background:var(--off-white); color: var(--text)">
             ${readingData.text}
          </div>
          <div class="card p-24" style="background: var(--card-bg);">
             ${readingData.questions.map((q, qIdx) => `
               <div class="mb-24">
                 <div style="font-weight:700; margin-bottom:12px; color: var(--text)">${qIdx+1}. ${q.q}</div>
                 <div class="options-grid" style="display:grid; grid-template-columns:1fr; gap:8px">
                   ${q.options.map(opt => `
                     <button class="btn btn-outline" style="text-align:left; justify-content:flex-start; color: var(--text)" onclick="window.PlaygroundModule.checkAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.answer.replace(/'/g, "\\'")}')">${opt}</button>
                   `).join('')}
                 </div>
               </div>
             `).join('')}
          </div>
        </section>
      `;
    }

    container.innerHTML = `
      <div class="lesson-page-header shadow-lg" style="background: linear-gradient(135deg, var(--charcoal), var(--charcoal-2)); color: white !important;">
        <button class="btn btn-ghost btn-sm" style="position:absolute; top:30px; left:30px; color:white !important; border-color:rgba(255,255,255,0.4);" onclick="window.PlaygroundModule.openPlaygroundGroup('${pgId}')">← BACK TO LESSONS</button>
        <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:4px; margin-bottom:12px; opacity:0.7; font-weight:700; color: white !important;">${pg.title.toUpperCase()}</div>
        <h2 style="font-size:2.5rem; color: white !important;">${lesson.title}</h2>
      </div>

      <div class="lesson-container" style="max-width:900px; margin:0 auto; padding: 40px 20px;">
        ${dialoguesHTML}
        ${listeningHTML}
        ${readingHTML}

        <div class="text-center mt-60 mb-100">
           <button class="btn btn-success btn-lg" style="padding: 24px 60px; font-size: 1.4rem; border-radius: 50px;" onclick="window.PlaygroundModule.markLessonComplete('${pgId}', '${lessonId}')">Finish Lesson ✓</button>
        </div>
      </div>
    `;
    window.scrollTo(0,0);
  }

  // ── CCC Academic Book Actions ────────────────────────────────────────

  async function openBook(bookId) {
    await init();
    await loadBook(bookId);
    
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header">
        <button class="btn btn-ghost btn-sm mb-12" onclick="window.PlaygroundModule.render(document.getElementById('page-content'))">← Back to Library</button>
        <h2>Book ${bookId}: ${currentBookId === 1 ? 'Foundations' : (currentBookId === 2 ? 'Daily Life' : 'Advanced')}</h2>
        <p>A Course in Contemporary Chinese — Official Curriculum.</p>
      </div>

      <div class="pg-lessons-list" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(350px,1fr)); gap:24px; max-width: 1200px; margin: 0 auto; padding: 20px;">
        ${currentBookData.map((ch, idx) => {
          const isDone = App.state.progress.ccc_course?.[ch.id];
          return `
            <div class="pg-lesson-item academic ${isDone ? 'done' : ''}" style="cursor: pointer; height: auto; padding: 32px;" onclick="window.PlaygroundModule.startChapter('${ch.id}')">
              <div style="display:flex; width:100%; justify-content:space-between; align-items:center; margin-bottom:20px">
                <div class="pg-lesson-num" style="width:40px; height:40px; background:var(--charcoal)">${idx + 1}</div>
                <div class="pg-lesson-status" style="font-size:0.75rem; font-weight:800; color:var(--text-3)">${isDone ? 'MASTERED ✓' : 'STUDY →'}</div>
              </div>
              <h3 class="font-zh" style="font-size:1.6rem; margin-bottom:12px; font-weight:900">${ch.title}</h3>
              <p style="font-size:0.95rem; color:var(--text-2); line-height:1.6">Master the specific grammar and vocabulary of this academic unit.</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
    window.scrollTo(0,0);
  }

  function startChapter(chapterId) {
    const ch = currentBookData.find(c => c.id === chapterId);
    if (!ch) return;
    currentChapterId = chapterId;

    const container = document.getElementById('page-content');

    // Section 1: Vocabulary
    let vocabHTML = ch.vocab && ch.vocab.length ? `
      <section class="lesson-section" id="ls-vocab">
        <h3 class="section-title">1. Essential Vocabulary</h3>
        <div class="vocab-grid-premium">
          ${ch.vocab.map(v => `
            <div class="vocab-card-premium" onclick="showWordDetail('${v.hanzi}')">
              <div class="v-hanzi">${v.hanzi}</div>
              <div class="v-pinyin">${v.pinyin || ''}</div>
              <div class="v-def">${v.definition}</div>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    // Section 2: Dialogues
    let dialoguesHTML = ch.dialogues && ch.dialogues.length ? `
      <section class="lesson-section" id="ls-dialogue">
        <h3 class="section-title">2. Contextual Dialogues</h3>
        ${ch.dialogues.map((d, idx) => `
          <div class="dialogue-block-premium shadow-sm mb-40" style="background: var(--card-bg); border-radius: 12px; padding: 24px;">
            <h4 class="mb-16" style="color:var(--accent); font-weight:800">Part ${idx+1}: ${d.title}</h4>
            <div style="display:flex; flex-direction:column; gap:12px">
              ${d.lines.map(line => `
                <div class="dialogue-line-premium" onclick="TTS.speak('${line.zh}')" style="cursor:pointer; display: flex; gap: 16px; align-items: flex-start;">
                  <div class="line-speaker-badge" style="background: var(--charcoal); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; min-width: 80px; text-align: center;">${line.speaker}</div>
                  <div style="flex:1">
                    <div class="font-zh" style="font-size:1.5rem; font-weight:800; margin-bottom:4px; color: var(--text)">${line.zh}</div>
                    <div class="text-muted" style="font-size:0.95rem; font-weight:600; color:var(--accent)">${line.py}</div>
                    <div class="color-text-2" style="font-size:0.9rem; margin-top:4px">${line.en}</div>
                  </div>
                  <div style="font-size:1.2rem; opacity:0.3">🔊</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>
    ` : '';

    // Section 3: Readings
    let readingsHTML = ch.readings && ch.readings.length ? `
      <section class="lesson-section" id="ls-reading">
        <h3 class="section-title">3. Reading Comprehension</h3>
        ${ch.readings.map((r, idx) => `
          <div class="card p-48 mb-40 shadow-sm" style="background:var(--warm-white); border-left:6px solid var(--accent)">
            <h4 class="mb-24" style="font-weight:800; color: var(--text)">Reading ${idx+1}: ${r.title}</h4>
            <div class="font-zh mb-40" style="font-size:1.6rem; line-height:2; color:var(--text)">${r.text}</div>
            <div class="mt-40 pt-40" style="border-top:1px solid var(--border)">
              ${r.questions.map((q, qIdx) => `
                <div class="q-item mb-32">
                  <div style="font-weight:800; margin-bottom:18px; font-size:1.2rem; color:var(--text)">${qIdx+1}. ${q.q}</div>
                  <div class="options-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                    ${q.options.map(opt => `
                      <button class="btn btn-outline" style="padding:16px; font-weight:700; color: var(--text)" onclick="window.PlaygroundModule.checkAnswer(this, '${opt}', '${q.answer}')">${opt}</button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>
    ` : '';

    // Section 4: Listening
    let listeningHTML = ch.listening && ch.listening.length ? `
      <section class="lesson-section" id="ls-listening">
        <h3 class="section-title">4. Listening Practice</h3>
        ${ch.listening.map((l, idx) => `
          <div class="card p-48 mb-40 shadow-sm" style="background:var(--charcoal); color:white; text-align:center">
             <div style="font-size:4rem; margin-bottom:24px">🎙️</div>
             <button class="btn btn-white btn-lg" style="background:var(--card-bg); color:var(--charcoal); font-weight:900" onclick="TTS.speak(\`${l.text}\`)">▶ PLAY AUDIO SEGMENT</button>
             <div class="mt-40 text-left" style="max-width:600px; margin:40px auto 0; padding-top:40px; border-top:1px solid rgba(255,255,255,0.1)">
                ${l.questions.map((q, qIdx) => `
                  <div class="q-item mb-32">
                    <div style="font-weight:700; margin-bottom:16px; color:rgba(255,255,255,0.9)">${qIdx+1}. ${q.q}</div>
                    <div class="options-grid" style="display:grid; grid-template-columns:1fr; gap:10px">
                      ${q.options.map(opt => `
                        <button class="btn btn-outline" style="background:rgba(255,255,255,0.05); color:white; border-color:rgba(255,255,255,0.2)" onclick="window.PlaygroundModule.checkAnswer(this, '${opt}', '${q.answer}')">${opt}</button>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
             </div>
          </div>
        `).join('')}
      </section>
    ` : '';

    let quizHTML = ch.quizzes && ch.quizzes.length ? `
      <section class="lesson-section" id="ls-quiz">
        <div class="card p-60" style="background:var(--warm-white); border:4px solid var(--accent); border-radius:var(--radius-lg); box-shadow:var(--shadow-xl)">
          <h3 class="section-title">5. Final Mastery Check</h3>
          <p class="text-muted mb-48" style="font-size:1.1rem">Complete these challenges to finish the chapter and save your progress.</p>
          <div class="quiz-list">
            ${ch.quizzes.map((q, qIdx) => `
              <div class="q-item mb-48">
                <div style="font-weight:900; margin-bottom:24px; font-size:1.3rem; color:var(--text)">${qIdx+1}. ${q.type === 'fill' ? 'Complete the sentence:' : q.question}</div>
                ${q.type === 'fill' ? `
                  <div class="mb-24 font-zh" style="font-size:2.2rem; line-height:2; color: var(--text)">${q.sentence.replace('___', `<input type="text" class="input inline-input" style="width:160px; font-size:2rem; border-bottom-width:4px" id="quiz-fill-${qIdx}">`)}</div>
                  <button class="btn btn-primary btn-lg" style="padding:16px 40px; font-size:1.1rem" onclick="window.PlaygroundModule.checkFill(this, 'quiz-fill-${qIdx}', '${q.answer}')">Check Answer</button>
                ` : `
                  <div class="options-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
                    ${q.options.map(opt => `
                      <button class="btn btn-outline" style="padding:24px; font-size:1.2rem; font-weight:700; color: var(--text)" onclick="window.PlaygroundModule.checkAnswer(this, '${opt}', '${q.answer}')">${opt}</button>
                    `).join('')}
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    ` : '';

    container.innerHTML = `
      <div class="lesson-page-header shadow-lg" style="background: var(--charcoal); background: linear-gradient(135deg, var(--charcoal), var(--charcoal-2)); color: white !important;">
        <button class="btn btn-ghost btn-sm" style="position:absolute; top:30px; left:30px; color:white !important; border-color:rgba(255,255,255,0.4); font-weight:800" onclick="window.PlaygroundModule.openBook(${ch.book})">← BACK TO CHAPTERS</button>
        <div style="font-size:0.9rem; text-transform:uppercase; letter-spacing:6px; margin-bottom:16px; opacity:0.8; font-weight:700; color: white !important;">VOLUME ${ch.book} • CHAPTER ${ch.chapter}</div>
        <h2 class="font-zh" style="font-size:4rem; margin-bottom:20px; font-weight:900; letter-spacing:-1px; color: white !important;">${ch.title}</h2>
        <p style="font-size:1.4rem; max-width:800px; margin:0 auto; opacity:0.95; line-height:1.5; font-weight:500; color: white !important;">${ch.intro}</p>
      </div>

      <nav class="lesson-nav-sticky">
        <button class="ln-btn active" onclick="window.PlaygroundModule.scrollToSection('ls-vocab', this)">Vocabulary</button>
        <button class="ln-btn" onclick="window.PlaygroundModule.scrollToSection('ls-dialogue', this)">Dialogues</button>
        <button class="ln-btn" onclick="window.PlaygroundModule.scrollToSection('ls-reading', this)">Reading</button>
        <button class="ln-btn" onclick="window.PlaygroundModule.scrollToSection('ls-listening', this)">Listening</button>
        <button class="ln-btn" onclick="window.PlaygroundModule.scrollToSection('ls-quiz', this)">Mastery Quiz</button>
      </nav>

      <div class="lesson-container" style="max-width:1100px; margin:0 auto">
        ${vocabHTML}
        ${dialoguesHTML}
        ${readingsHTML}
        ${listeningHTML}
        ${quizHTML}

        <div class="text-center mt-100 mb-100">
           <div class="card p-80" style="background:var(--off-white); border:6px dashed var(--tone2); border-radius:var(--radius-lg); box-shadow: var(--shadow-xl)">
             <div style="font-size:6rem; margin-bottom:32px">🏆</div>
             <h2 class="mb-24" style="font-size:2.5rem; font-weight:900; color: var(--text)">Chapter Mastered?</h2>
             <p class="mb-48 text-muted" style="font-size:1.2rem; max-width:600px; margin-left:auto; margin-right:auto">You have completed all sections of this chapter. Click below to permanently save your achievement.</p>
             <button class="btn btn-success btn-lg" style="width:100%; max-width:600px; padding:32px; font-size:2rem; font-weight:900; border-radius:60px; box-shadow:0 10px 20px rgba(39, 174, 96, 0.3)" onclick="window.PlaygroundModule.markChapterComplete()">FINISH CHAPTER ✓</button>
           </div>
        </div>
      </div>
    `;

    window.scrollTo(0,0);
  }

  function scrollToSection(id, btn) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      document.querySelectorAll('.ln-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  function checkAnswer(btn, selected, correct) {
    if (selected === correct) {
      btn.className = 'btn btn-success';
      App.logActivity('🎯', `Correct answer in CCC Course!`);
    } else {
      btn.className = 'btn btn-error';
      btn.style.animation = 'shake 0.4s';
    }
  }

  function checkFill(btn, inputId, correct) {
    const input = document.getElementById(inputId);
    if (input.value.trim() === correct) {
      input.style.borderColor = 'var(--tone2)';
      btn.className = 'btn btn-success';
    } else {
      input.style.borderColor = 'var(--red)';
      btn.style.animation = 'shake 0.4s';
    }
  }

  function markChapterComplete() {
    if (!App.state.progress.ccc_course) App.state.progress.ccc_course = {};
    App.state.progress.ccc_course[currentChapterId] = true;
    App.saveProgress();
    App.logActivity('🏆', `Completed CCC Chapter: ${currentChapterId}`);
    openBook(currentBookId);
  }

  // ── Character Playground ───────────────────────────────────────────────────
  
  async function renderCharPlayground(container) {
    await init();
    container.innerHTML = `
      <div class="page-header">
        <h2>Character Playground</h2>
        <p>Master characters through their radical building blocks.</p>
      </div>

      <div class="cp-tabs">
        <button class="cp-tab active" onclick="window.PlaygroundModule.switchCPTab('blocks')">Radical Blocks</button>
        <button class="cp-tab" onclick="window.PlaygroundModule.switchCPTab('decomp')">Explorer</button>
        <button class="cp-tab" onclick="window.PlaygroundModule.switchCPTab('game')">Game</button>
      </div>

      <div id="cp-tab-content">
        ${renderBlocksTab()}
      </div>
    `;
  }

  function renderBlocksTab() {
    if (!currentRadicalData || !currentRadicalData.length) return '<div class="spinner"></div>';
    
    const phases = [
      { id: 1, title: 'Phase 1: Novice (Essential 40)', color: '#3498db' },
      { id: 2, title: 'Phase 2: A1 Mastery (Intermediate 40)', color: '#2ecc71' },
      { id: 3, title: 'Phase 3: A2/B1 Bridge (Advanced 40)', color: '#e67e22' }
    ];

    return `
      <div class="cp-phases">
        ${phases.map(p => {
          const radicals = currentRadicalData.filter(r => r.phase === p.id);
          if (!radicals.length) return '';

          return `
            <div class="cp-phase-section mb-40">
              <h3 class="mb-20" style="border-left: 4px solid ${p.color}; padding-left: 12px; color: var(--text);">${p.title}</h3>
              <div class="cp-blocks-grid">
                ${radicals.map(rad => `
                  <div class="cp-block-card" style="background: var(--card-bg); border: 1px solid var(--border);" onclick="window.PlaygroundModule.openRadicalDetail('${rad.id}')">
                    <div class="cp-block-header" style="background:${p.color}">
                      <div class="cp-block-icon" style="font-size: 2.5rem; color: white !important;">${rad.component}</div>
                    </div>
                    <div class="cp-block-body">
                      <h3 style="margin-bottom:4px; font-weight:800; color: var(--text)">${rad.coreMeaning}</h3>
                      <div class="text-zh" style="color:var(--accent); font-weight:700; margin-bottom:12px">${rad.pinyin}</div>
                      <p style="font-size:0.85rem; line-height:1.4; color:var(--text-3); height: 3em; overflow: hidden;">${rad.learningRole}</p>
                    </div>
                    <div class="cp-block-footer" style="border-top: 1px solid var(--border)">
                      <span style="color: var(--text-2)">${rad.examples.length} Examples</span>
                      <span class="color-accent" style="font-weight:800">TEACH →</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function openBlockLessons(blockId) {
    const block = currentCharData.find(b => b.id === blockId);
    if (!block) return;

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="lesson-page-header" style="background: var(--charcoal); background: linear-gradient(135deg, var(--charcoal), var(--charcoal-2)); color: white !important;">
        <button class="btn btn-ghost btn-sm" style="position:absolute; top:30px; left:30px; color:white !important; border-color:rgba(255,255,255,0.4);" onclick="window.PlaygroundModule.renderCharPlayground(document.getElementById('page-content'))">← BACK TO PHASES</button>
        <div style="font-size:0.9rem; text-transform:uppercase; letter-spacing:4px; margin-bottom:16px; opacity:0.8; font-weight:700; color: white !important;">BLOCK ${block.id.replace('cpg', '')}</div>
        <h2 style="color:white !important; font-size: 2.5rem;">${block.title}</h2>
        <p style="font-size:1.2rem; max-width:800px; margin:20px auto 0; opacity:0.9; line-height:1.6; color: white !important;">${block.subtitle}</p>
      </div>

      <div class="lesson-container" style="max-width:1100px; margin: 0 auto; padding: 40px 20px;">
        <div class="cp-lessons-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
          ${block.lessons.map(l => `
            <div class="card p-24 shadow-hover" style="cursor: pointer; background: var(--card-bg);" onclick="window.PlaygroundModule.startRadicalLesson('${block.id}', '${l.id}')">
              <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 16px;">
                <div class="font-zh" style="font-size: 3rem; font-weight: 900; color: var(--text);">${l.radical}</div>
                <div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">${l.radical_pinyin}</div>
                  <div style="color: var(--text-2); font-weight: 600;">${l.radical_meaning}</div>
                </div>
              </div>
              <p style="font-size: 0.9rem; color: var(--text-3); margin-bottom: 16px;">${l.mnemonic.slice(0, 80)}...</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-3);">${l.compounds.length} COMPOUNDS</span>
                <span class="badge badge-primary">START</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    window.scrollTo(0,0);
  }

  function openRadicalDetail(id) {
    const rad = currentRadicalData.find(r => r.id === id);
    if (!rad) return;

    // Find corresponding lesson in currentCharData
    let lessonLink = null;
    if (currentCharData) {
      for (const block of currentCharData) {
        const lesson = block.lessons.find(l => 
          l.radical === rad.component || 
          (rad.altForms && rad.altForms.includes(l.radical))
        );
        if (lesson) {
          lessonLink = { blockId: block.id, lessonId: lesson.id };
          break;
        }
      }
    }

    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="lesson-page-header" style="background: var(--charcoal); background: linear-gradient(135deg, var(--charcoal), var(--charcoal-2)); color: white !important;">
        <button class="btn btn-ghost btn-sm" style="position:absolute; top:30px; left:30px; color:white !important; border-color:rgba(255,255,255,0.4);" onclick="window.PlaygroundModule.renderCharPlayground(document.getElementById('page-content'))">← BACK TO RADICALS</button>
        <div style="font-size:0.9rem; text-transform:uppercase; letter-spacing:4px; margin-bottom:16px; opacity:0.8; font-weight:700; color: white !important;">${rad.phaseName}</div>
        <div class="font-zh" style="font-size:6rem; margin-bottom:10px; font-weight:900; color:white !important;">${rad.component}</div>
        <h2 style="color:white !important; font-size: 2rem;">${rad.coreMeaning.toUpperCase()} [${rad.pinyin}]</h2>
        <p style="font-size:1.2rem; max-width:800px; margin:20px auto 0; opacity:0.9; line-height:1.6; color: white !important;">${rad.learningRole}</p>
      </div>

      <div class="lesson-container" style="max-width:900px; margin: 0 auto; padding-top: 40px;">
        <div class="card p-40 mb-40 shadow-sm" style="border-left: 6px solid var(--accent); background: var(--card-bg); color: var(--text);">
          <h3 class="mb-20" style="color: var(--text)">The Rule of Character Formation</h3>
          <p style="font-size: 1.1rem; line-height: 1.7; color: var(--text-2);">${rad.meaningChangeRule}</p>
          <div class="mt-24 p-20" style="background: var(--off-white); border-radius: 8px;">
            <strong style="color: var(--accent); display: block; margin-bottom: 8px;">TEACHING STEPS:</strong>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: var(--text-2)">
              ${rad.howToTeach.map(step => `<li style="color: var(--text-2)">${step}</li>`).join('')}
            </ul>
          </div>
        </div>

        <h3 class="section-title" style="color: var(--text)">Deep Dive: Meaning Merging</h3>
        <p class="text-muted mb-32">Observe how 「${rad.component}」 merges with other blocks to create new concepts.</p>
        
        <div class="cp-compounds-grid-detailed">
          ${rad.examples.map(ex => `
            <div class="card p-32 mb-24 shadow-hover" style="display: flex; gap: 32px; align-items: center; cursor: pointer; background: var(--card-bg);" onclick="showWordDetail('${ex.character}')">
              <div class="font-zh" style="font-size: 4rem; font-weight: 900; min-width: 100px; text-align: center; color: var(--text);">${ex.character}</div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  <span class="badge badge-primary" style="font-size: 1rem; padding: 4px 12px;">${ex.pinyin}</span>
                  <span style="font-size: 1.3rem; font-weight: 800; color: var(--text);">${ex.meaning}</span>
                </div>
                <div style="font-size: 1.1rem; color: var(--text-2); font-style: italic;">
                  Formation: ${ex.combinationAndSemanticShift}
                </div>
              </div>
              <div style="font-size: 1.5rem; opacity: 0.2;">👁️</div>
            </div>
          `).join('')}
        </div>

        <div class="text-center mt-60 mb-100">
           ${lessonLink ? `
             <button class="btn btn-primary btn-lg" style="padding: 24px 60px; font-size: 1.4rem; border-radius: 50px;" onclick="window.PlaygroundModule.startRadicalLesson('${lessonLink.blockId}', '${lessonLink.lessonId}')">Start Interactive Lesson →</button>
           ` : `
             <button class="btn btn-primary btn-lg" style="padding: 24px 60px; font-size: 1.4rem; border-radius: 50px;" onclick="window.PlaygroundModule.renderCharPlayground(document.getElementById('page-content'))">Mastered this Radical ✓</button>
           `}
        </div>
      </div>
    `;
    window.scrollTo(0,0);
  }

  function startRadicalLesson(blockId, lessonId) {
    const block = currentCharData.find(b => b.id === blockId);
    const lesson = block.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    currentLesson = lesson;
    currentStep = 0;
    renderRadicalStep();
  }

  function renderRadicalStep() {
    const lesson = currentLesson;
    const container = document.getElementById('page-content');
    
    if (currentStep === 0) {
      container.innerHTML = `
        <div class="cp-lesson-step">
          <div class="cp-radical-intro">
            <div class="cp-radical-big" style="color: var(--text)">${lesson.radical}</div>
            <div class="cp-radical-meta" style="color: var(--accent)">${lesson.radical_pinyin} • ${lesson.radical_meaning}</div>
            ${lesson.variant_forms.length ? `<div class="cp-variants" style="color: var(--text-2)">Variants: ${lesson.variant_forms.join(', ')}</div>` : ''}
            <div class="cp-mnemonic card mt-24" style="background: var(--card-bg); color: var(--text-2)">
              <strong style="color: var(--text)">Mnemonic:</strong> ${lesson.mnemonic}
            </div>
            <button class="btn btn-primary btn-lg mt-32" onclick="window.PlaygroundModule.nextRadicalStep()">Explore Compounds →</button>
          </div>
        </div>
      `;
    } else if (currentStep === 1) {
      container.innerHTML = `
        <div class="cp-lesson-step">
          <h3 style="color: var(--text)">Compounds containing 「${lesson.radical}」</h3>
          <p class="mb-24" style="color: var(--text-2)">See how the radical gives meaning to these characters.</p>
          <div class="cp-compounds-grid">
            ${lesson.compounds.map(c => `
              <div class="cp-compound-item card" onclick="showCharModal('${c.hanzi}')" style="background: var(--card-bg);">
                <div class="cp-c-hanzi" style="color: var(--text)">${c.hanzi}</div>
                <div class="cp-c-meta">
                  <div class="cp-c-py" style="color: var(--accent)">${c.pinyin}</div>
                  <div class="cp-c-def" style="color: var(--text-2)">${c.definition}</div>
                </div>
                <div class="cp-c-breakdown" style="color: var(--text-3); font-style: italic;">${c.breakdown}</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-lg mt-32" onclick="window.PlaygroundModule.nextRadicalStep()">Start Drills →</button>
        </div>
      `;
    } else if (currentStep <= lesson.drills.length + 1) {
      const drillIdx = currentStep - 2;
      if (drillIdx >= lesson.drills.length) {
        renderRadicalCompletion();
        return;
      }
      renderRadicalDrill(lesson.drills[drillIdx]);
    }
  }

  function renderRadicalDrill(drill) {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="pg-lesson-header">
        <div class="pg-step-meta" style="color: var(--text-3)">Drill ${currentStep - 1} / ${currentLesson.drills.length}</div>
      </div>
      <div class="cp-drill-container">
        <h3 class="mb-16" style="color: var(--text)">${drill.instruction || 'Identify the correct character'}</h3>
        ${renderDrillContent(drill)}
      </div>
    `;
  }

  function renderDrillContent(drill) {
    switch (drill.type) {
      case 'spot_radical':
        return `
          <div class="cp-spot-grid">
            ${drill.chars.map(c => `<button class="cp-block" style="color: var(--text); background: var(--card-bg);" onclick="window.PlaygroundModule.checkSpot('${c}', this)">${c}</button>`).join('')}
          </div>
          <button class="btn btn-primary mt-24" onclick="window.PlaygroundModule.verifySpot()">Check Answers</button>
        `;
      case 'meaning_match':
        return `
          <div class="pg-big-hanzi" style="color: var(--text)">${drill.hanzi}</div>
          <div class="pg-options-grid">
            ${drill.options.map(opt => `<button class="btn btn-outline pg-opt-btn" style="color: var(--text)" onclick="window.PlaygroundModule.checkRadicalAnswer('${opt}', '${drill.answer}', this)">${opt}</button>`).join('')}
          </div>
        `;
      case 'build_recognition':
        return `
          <div class="pg-quiz-q mb-24" style="color: var(--text)">${drill.prompt}</div>
          <div class="pg-options-grid">
            ${drill.options.map(opt => `<button class="btn btn-outline pg-opt-btn pg-hanzi-opt" style="color: var(--text)" onclick="window.PlaygroundModule.checkRadicalAnswer('${opt}', '${drill.answer}', this)">${opt}</button>`).join('')}
          </div>
        `;
      case 'sentence_fill':
        return `
          <div class="cp-sentence-q mb-24" style="color: var(--text)">${drill.sentence.replace('___', '<span class="blank">?</span>')}</div>
          <div class="pg-options-grid">
            ${drill.options.map(opt => `<button class="btn btn-outline pg-opt-btn" style="color: var(--text)" onclick="window.PlaygroundModule.checkRadicalAnswer('${opt}', '${drill.answer}', this)">${opt}</button>`).join('')}
          </div>
        `;
    }
  }

  window._cpSpotSelected = [];
  function checkSpot(char, btn) {
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      window._cpSpotSelected = window._cpSpotSelected.filter(c => c !== char);
    } else {
      btn.classList.add('selected');
      window._cpSpotSelected.push(char);
    }
  }

  function verifySpot() {
    const drill = currentLesson.drills[currentStep - 2];
    const correct = drill.answers.sort().join(',');
    const selected = window._cpSpotSelected.sort().join(',');
    if (correct === selected) nextRadicalStep();
    else alert('Keep looking! Find all characters with the radical.');
  }

  function checkRadicalAnswer(sel, ans, btn) {
    if (sel === ans) {
      btn.classList.add('btn-success');
      setTimeout(() => nextRadicalStep(), 600);
    } else {
      btn.classList.add('btn-error');
      setTimeout(() => btn.classList.remove('btn-error'), 500);
    }
  }

  function nextRadicalStep() {
    currentStep++;
    renderRadicalStep();
  }

  function renderRadicalCompletion() {
    const container = document.getElementById('page-content');
    container.innerHTML = `
      <div class="page-header">
        <button class="btn btn-ghost btn-sm mb-12" onclick="window.PlaygroundModule.renderCharPlayground(document.getElementById('page-content'))">← Back to Character Playground</button>
        <div class="pg-done-icon text-center" style="font-size:3rem; margin-bottom: 20px; color: var(--text);">🌟 Radical Mastered!</div>
      </div>
      <div class="cp-lesson-step" style="max-width:800px; margin: 0 auto; text-align: left;">
        <div class="cp-radical-intro mb-24">
          <div class="cp-radical-big text-center" style="color: var(--text)">${currentLesson.radical}</div>
          <div class="cp-radical-meta text-center" style="color: var(--accent)">${currentLesson.radical_pinyin} • ${currentLesson.radical_meaning}</div>
        </div>
        <h3 class="mb-16" style="color: var(--text)">Compounds Review</h3>
        <div class="cp-compounds-grid">
          ${currentLesson.compounds.map(c => `
            <div class="cp-compound-item card" onclick="showCharModal('${c.hanzi}')" style="background: var(--card-bg);">
              <div class="cp-c-hanzi" style="color: var(--text)">${c.hanzi}</div>
              <div class="cp-c-meta">
                <div class="cp-c-py" style="color: var(--accent)">${c.pinyin}</div>
                <div class="cp-c-def" style="color: var(--text-2)">${c.definition}</div>
              </div>
              <div class="cp-c-breakdown" style="color: var(--text-3); font-style: italic;">${c.breakdown}</div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-lg mt-32 w-full" onclick="window.PlaygroundModule.renderCharPlayground(document.getElementById('page-content'))">Continue to Next Radical →</button>
      </div>
    `;
  }

  function renderDecompTab() {
    return `
      <div class="cp-container">
        <div class="cp-search">
          <input type="text" class="input" id="cp-input" placeholder="Enter a character (e.g. 森, 好, 媽)...">
          <button class="btn btn-primary" onclick="window.PlaygroundModule.decompose()">Decompose</button>
        </div>
        <div id="cp-result" class="cp-result-area">
          <div class="empty-state"><p>Enter a character above to see its "building blocks".</p></div>
        </div>
        <div class="cp-basic-blocks mt-32">
          <h3 style="color: var(--text)">Common Building Blocks</h3>
          <div class="cp-block-grid">
            ${['人','口','木','水','火','土','日','月','心','手','女','子','門','纟'].map(c => `
              <div class="cp-block" style="color: var(--text); background: var(--card-bg);" onclick="window.PlaygroundModule.showCombinations('${c}')">${c}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderGameTab() {
    const FORMATIONS = App.state.characters.filter(c => c.components && c.components.length > 1 && c.components.join('') !== c.hanzi);
    if (!FORMATIONS.length) return `<div class="empty-state">No formation data available.</div>`;

    const challengeChar = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
    const challenge = {
      hanzi: challengeChar.hanzi,
      definition: challengeChar.definition,
      parts: challengeChar.components,
      result: challengeChar.hanzi
    };

    const pool = new Set(challenge.parts);
    while (pool.size < 8) {
      const randChar = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
      pool.add(randChar.components[0]);
    }
    const shuffledPool = Array.from(pool).sort(() => Math.random() - 0.5);

    window._cpGameTarget = challenge;
    window._cpGameSelected = [];

    return `
      <div class="cp-container cp-game-view">
        <div class="cp-game-header">
          <h3 style="color: var(--text)">Build the Character!</h3>
          <p style="color: var(--text-2)">Select components for: <strong class="text-accent" style="font-size:1.5rem">「${challenge.hanzi}」</strong></p>
          <div class="text-muted text-small">Meaning: ${challenge.definition}</div>
        </div>
        <div class="cp-built-area" id="cp-game-built" style="color: var(--text-3)">Select components...</div>
        <div class="cp-game-pool">
          ${shuffledPool.map(p => `<button class="cp-block cp-game-block" style="color: var(--text); background: var(--card-bg);" onclick="window.PlaygroundModule.cpGameSelect('${p}', this)">${p}</button>`).join('')}
        </div>
        <div id="cp-game-feedback" class="quiz-feedback"></div>
        <div class="flex gap-12 justify-center mt-24">
          <button class="btn btn-primary" onclick="window.PlaygroundModule.cpGameCheck()">Check Formation</button>
          <button class="btn btn-ghost" onclick="window.PlaygroundModule.switchCPTab('game')">Next Character 🔄</button>
        </div>
      </div>
    `;
  }

  function cpGameSelect(part, btn) {
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      window._cpGameSelected = window._cpGameSelected.filter(p => p !== part);
    } else {
      btn.classList.add('selected');
      window._cpGameSelected.push(part);
    }
    const area = document.getElementById('cp-game-built');
    if (area) {
      area.innerHTML = window._cpGameSelected.map(p => `<span class="cp-built-part">${p}</span>`).join(' + ') || '<span class="text-muted">Select components below...</span>';
    }
  }

  function cpGameCheck() {
    const target = window._cpGameTarget;
    const selected = [...window._cpGameSelected].sort();
    const correct = [...target.parts].sort();
    const feedback = document.getElementById('cp-game-feedback');
    const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'} show`;
    feedback.innerHTML = isCorrect ? `✓ Perfect! <strong>${target.parts.join(' + ')} = ${target.result}</strong>` : `✗ Not quite. Try again!`;
    if (isCorrect) App.logActivity('🧩', `Solved character puzzle: ${target.result}`);
  }

  function switchCPTab(tab) {
    const content = document.getElementById('cp-tab-content');
    const tabs = document.querySelectorAll('.cp-tab');
    tabs.forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tab)));
    if (tab === 'blocks') content.innerHTML = renderBlocksTab();
    else if (tab === 'decomp') content.innerHTML = renderDecompTab();
    else content.innerHTML = renderGameTab();
  }

  async function decompose() {
    const input = document.getElementById('cp-input').value.trim();
    if (!input) return;
    const char = input[0];
    const resultArea = document.getElementById('cp-result');
    resultArea.innerHTML = '<div class="spinner"></div>';
    const charData = await API.getCharacter(char);
    if (!charData) {
      resultArea.innerHTML = `<div class="empty-state"><p>Character not found in library.</p></div>`;
      return;
    }
    const parts = charData.components || charData.radicals || [];
    resultArea.innerHTML = `
      <div class="cp-decomp-view">
        <div class="cp-main-char">
          <div class="cp-char-big" style="color: var(--text)">${char}</div>
          <div class="cp-char-meta" style="color: var(--accent)">${charData.pinyin} • ${charData.definition}</div>
        </div>
        <div class="cp-arrow" style="color: var(--text-3)">⬇️ decomposes into</div>
        <div class="cp-parts">
          ${parts.length > 0 ? parts.map(c => `
            <div class="cp-part-item">
              <div class="cp-part-char" style="color: var(--text)">${c}</div>
              <div class="cp-part-label" style="color: var(--text-3)">${charData.radicals?.includes(c) ? 'Radical' : 'Component'}</div>
            </div>`).join('<div class="cp-part-plus" style="color: var(--text-3)">+</div>') 
          : `<div class="cp-part-item"><div class="cp-part-char" style="color: var(--text)">${char}</div><div class="cp-part-label" style="color: var(--text-3)">Base</div></div>`}
        </div>
        ${charData.mnemonic ? `<div class="cp-mnemonic mt-24" style="color: var(--text-2)"><strong style="color: var(--text)">Mnemonic:</strong> ${charData.mnemonic}</div>` : ''}
      </div>`;
  }

  async function showCombinations(block) {
    const resultArea = document.getElementById('cp-result');
    resultArea.innerHTML = '<div class="spinner"></div>';
    const allChars = await API.getCharacters({ limit: 2000 });
    const combinations = allChars.data.filter(c => c.radicals && c.radicals.includes(block));
    resultArea.innerHTML = `
      <div class="cp-combos">
        <h3 style="color: var(--text)">Characters containing 「${block}」</h3>
        <div class="cp-combo-grid">
          ${combinations.slice(0, 24).map(c => `
            <div class="cp-combo-item" style="background: var(--card-bg);" onclick="showCharModal('${c.hanzi}')">
              <div class="cp-combo-hanzi" style="color: var(--text)">${c.hanzi}</div>
              <div class="cp-combo-pinyin" style="color: var(--accent)">${c.pinyin}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function markLessonComplete(pgId, lessonId) {
    if (!App.state.progress.playground_lessons) App.state.progress.playground_lessons = {};
    App.state.progress.playground_lessons[lessonId] = true;
    
    // Check if group is complete
    const pg = currentPlaygroundData.find(p => p.id === pgId);
    const allDone = pg.lessons.every(l => App.state.progress.playground_lessons[l.id]);
    if (allDone) {
      if (!App.state.progress.playground) App.state.progress.playground = {};
      App.state.progress.playground[pgId] = true;
      App.logActivity('🏆', `Mastered Playground Chapter: ${pg.title}`);
    }

    App.saveProgress();
    openPlaygroundGroup(pgId);
  }

  return {
    render,
    renderCharPlayground,
    openBook,
    startChapter,
    scrollToSection,
    markChapterComplete,
    checkAnswer,
    checkFill,
    decompose,
    showCombinations,
    switchCPTab,
    openRadicalDetail,
    startRadicalLesson,
    nextRadicalStep,
    checkSpot,
    verifySpot,
    checkRadicalAnswer,
    cpGameSelect,
    cpGameCheck,
    switchView,
    openPlaygroundGroup,
    startPlaygroundLesson,
    markLessonComplete,
    openBlockLessons
  };
})();
