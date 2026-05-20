/* ═══════════════════════════════════════════════════════════════
   flash-quiz.js — Interactive Emoji-based Vocabulary Quiz & Gallery
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.FlashQuizModule = (() => {
  let state = {
    data: null,
    categories: [],
    currentCategory: 'All',
    viewMode: 'gallery', // 'gallery' or 'quiz'
    pool: [],
    index: 0,
    score: 0,
    chosen: false,
    loading: false
  };

  async function loadData() {
    if (state.data) return;
    state.loading = true;
    try {
      const resp = await fetch('data/picture_flashcards.json');
      state.data = await resp.json();
      state.categories = Object.keys(state.data.categories);
    } catch (err) {
      console.error('Failed to load flashcard data:', err);
    }
    state.loading = false;
  }

  function render(container) {
    if (state.loading) {
      container.innerHTML = '<div class="spinner"></div>';
      return;
    }

    if (!state.data) {
      loadData().then(() => render(container));
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div style="font-size: 0.75rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px;">Vocabulary Practice</div>
        <h2>Picture Flash Cards</h2>
        <p>Master common nouns and actions with visual emoji association.</p>
      </div>

      <div class="flash-tabs mb-24">
        <button class="flash-tab ${state.viewMode === 'gallery' ? 'active' : ''}" onclick="FlashQuizModule.setView('gallery')">🖼️ Gallery View</button>
        <button class="flash-tab ${state.viewMode === 'quiz' ? 'active' : ''}" onclick="FlashQuizModule.setView('quiz')">🎯 Quiz Mode</button>
      </div>

      <div class="card mb-24">
        <div style="margin-bottom:16px">
          <label class="setting-label">Select Category</label>
          <div style="display:flex; gap:10px">
            <select class="input" style="flex:1" onchange="FlashQuizModule.setCategory(this.value)">
              <option value="All">All Categories</option>
              ${state.categories.map(cat => `<option value="${cat}" ${state.currentCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
            ${state.viewMode === 'quiz' ? `<button class="btn btn-primary" style="min-width:120px" onclick="FlashQuizModule.startQuiz()">Start Quiz</button>` : ''}
          </div>
        </div>
      </div>

      <div id="flash-content-area">
        ${state.viewMode === 'gallery' ? renderGallery() : renderQuizIntro()}
      </div>
    `;
  }

  function renderGallery() {
    let items = [];
    if (state.currentCategory === 'All') {
      Object.values(state.data.categories).forEach(arr => items.push(...arr));
    } else {
      items = state.data.categories[state.currentCategory] || [];
    }

    return `
      <div class="flash-gallery-grid">
        ${items.map(item => `
          <div class="flash-card-item" onclick="TTS.speak('${item.zh}')">
            <div class="flash-card-emoji">${item.em}</div>
            <div class="flash-card-zh">${item.zh}</div>
            <div class="flash-card-py tone-colors">${Pinyin.colorize(item.py)}</div>
            <div class="flash-card-en">${item.en}</div>
            <button class="flash-card-tts">🔊</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderQuizIntro() {
    return `
      <div class="empty-state">
        <div class="es-icon">🎯</div>
        <h3>Ready for a challenge?</h3>
        <p>Choose a category above and click <strong>"Start Quiz"</strong> to test your skills.</p>
      </div>
    `;
  }

  function setView(mode) {
    state.viewMode = mode;
    const content = document.getElementById('page-content');
    if (content) render(content);
  }

  function setCategory(cat) {
    state.currentCategory = cat;
    const content = document.getElementById('page-content');
    if (content) render(content);
  }

  function startQuiz() {
    let allItems = [];
    if (state.currentCategory === 'All') {
      Object.values(state.data.categories).forEach(arr => allItems.push(...arr));
    } else {
      allItems = state.data.categories[state.currentCategory] || [];
    }

    if (allItems.length < 4) {
      alert("Not enough items in this category for a quiz.");
      return;
    }

    state.pool = allItems.sort(() => Math.random() - 0.5).slice(0, 15);
    state.index = 0;
    state.score = 0;
    state.chosen = false;

    showQuestion();
  }

  function showQuestion() {
    if (state.index >= state.pool.length) {
      showResults();
      return;
    }

    const item = state.pool[state.index];
    let allItems = [];
    Object.values(state.data.categories).forEach(arr => allItems.push(...arr));
    
    const wrong = allItems
      .filter(i => i.zh !== item.zh)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const options = [item, ...wrong].sort(() => Math.random() - 0.5);

    const content = `
      <div class="quiz-overlay-custom">
        <div class="quiz-header-custom">
          <button class="btn btn-ghost btn-sm" onclick="FlashQuizModule.closeQuiz()">✕ Close</button>
          <div style="font-weight:700">Question ${state.index + 1} / ${state.pool.length}</div>
          <div style="color:var(--gold); font-weight:800">⭐ ${state.score}</div>
        </div>
        
        <div class="quiz-card-custom animate-pop-in">
          <div class="quiz-visual">${item.em}</div>
          <div class="quiz-prompt">What is the Traditional Chinese for:</div>
          <div class="quiz-target">"${item.en}"</div>
          
          <div class="quiz-options-grid">
            ${options.map(opt => `
              <button class="quiz-option-btn" onclick="FlashQuizModule.checkAnswer('${opt.zh}', '${item.zh}', this)">
                <span class="opt-hanzi">${opt.zh}</span>
                <span class="opt-pinyin">${opt.py}</span>
              </button>
            `).join('')}
          </div>
          
          <button class="btn btn-primary w-full hidden" id="quiz-next-btn" onclick="FlashQuizModule.next()">Next Question →</button>
        </div>
      </div>
    `;

    Modal.show(content);
    const mc = document.getElementById('modal-content');
    if (mc) {
      mc.style.background = 'transparent';
      mc.style.boxShadow = 'none';
      mc.style.maxWidth = '100%';
    }
  }

  function checkAnswer(chosen, correct, btn) {
    if (state.chosen) return;
    state.chosen = true;

    const btns = document.querySelectorAll('.quiz-option-btn');
    btns.forEach(b => {
      const hanzi = b.querySelector('.opt-hanzi').textContent;
      if (hanzi === correct) b.classList.add('correct');
      else if (hanzi === chosen) b.classList.add('wrong');
      b.style.pointerEvents = 'none';
    });

    if (chosen === correct) {
      state.score++;
    }

    document.getElementById('quiz-next-btn')?.classList.remove('hidden');
    if (window.TTS) window.TTS.speak(correct);
  }

  function showResults() {
    const percent = Math.round((state.score / state.pool.length) * 100);
    const content = `
      <div class="quiz-overlay-custom">
        <div class="quiz-card-custom text-center animate-pop-in">
          <div style="font-size:4rem">🏆</div>
          <h2 style="margin:16px 0 8px">Quiz Complete!</h2>
          <div style="font-size:2rem; font-weight:800; color:var(--accent)">${state.score} / ${state.pool.length}</div>
          <p style="color:var(--text-3); margin-bottom:24px">${percent}% accuracy. ${percent >= 80 ? 'Excellent!' : 'Keep practicing!'}</p>
          
          <div class="flex gap-8">
            <button class="btn btn-primary flex-1" onclick="FlashQuizModule.startQuiz()">Try Again</button>
            <button class="btn btn-outline flex-1" onclick="FlashQuizModule.closeQuiz()">Finish</button>
          </div>
        </div>
      </div>
    `;
    Modal.show(content);
  }

  function injectStyles() {
    if (document.getElementById('flash-quiz-styles')) return;
    const style = document.createElement('style');
    style.id = 'flash-quiz-styles';
    style.textContent = `
      .flash-tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
      .flash-tab { padding: 10px 20px; border-radius: 8px; border: 1px solid transparent; background: none; cursor: pointer; color: var(--text-3); font-weight: 700; transition: all 0.2s; }
      .flash-tab.active { background: var(--accent); color: #fff; }
      .flash-tab:hover:not(.active) { background: var(--off-white); }
      
      .flash-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; margin-top: 16px; }
      .flash-card-item { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 16px; text-align: center; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
      .flash-card-item:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--accent); }
      .flash-card-emoji { font-size: 3rem; margin-bottom: 8px; }
      .flash-card-zh { font-size: 1.25rem; font-weight: 800; color: var(--text); line-height:1.2; }
      .flash-card-py { font-size: 0.85rem; margin-top: 4px; font-weight: 500; }
      .flash-card-en { font-size: 0.85rem; color: var(--text-3); margin-top: 6px; font-style: italic; }
      .flash-card-tts { position: absolute; bottom: 8px; right: 8px; background: none; border: none; font-size: 0.85rem; opacity: 0.2; cursor: pointer; }
      .flash-card-item:hover .flash-card-tts { opacity: 1; color: var(--accent); }

      .quiz-overlay-custom { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; width:100%; max-width:500px; margin:0 auto; }
      .quiz-header-custom { display:flex; justify-content:space-between; align-items:center; width:100%; color:#fff; margin-bottom:20px; }
      .quiz-card-custom { background:var(--clean-surface, var(--card-bg)); color:var(--clean-text, var(--text)); border:1px solid var(--clean-line, var(--border)); border-radius:20px; padding:24px; width:100%; box-shadow:0 10px 30px rgba(0,0,0,0.2); }
      .quiz-visual { font-size:6rem; text-align:center; margin-bottom:20px; }
      .quiz-prompt { font-size:0.85rem; color:var(--clean-muted, var(--text-3)); text-transform:uppercase; font-weight:800; letter-spacing:0.04em; text-align:center; }
      .quiz-target { font-size:1.5rem; font-weight:800; text-align:center; margin-bottom:24px; color:var(--clean-text, var(--text)); }
      .quiz-options-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
      .quiz-option-btn { background:var(--clean-surface-2, var(--card-bg)); color:var(--clean-text, var(--text)); border:1px solid var(--clean-line, var(--border)); border-radius:12px; padding:12px 8px; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:4px; }
      .quiz-option-btn:hover { border-color:var(--accent); background:color-mix(in srgb, var(--clean-surface-2, var(--card-bg)) 86%, var(--accent) 14%); }
      .quiz-option-btn.correct { background:#eafaf1 !important; border-color:#27ae60 !important; color:#14532d !important; }
      .quiz-option-btn.wrong { background:#fdedec !important; border-color:#e74c3c !important; color:#7f1d1d !important; }
      .opt-hanzi { font-size:1.35rem; font-weight:800; color:inherit; }
      .opt-pinyin { font-size:0.8rem; color:var(--clean-muted, var(--text-3)); opacity:1; }
      .quiz-option-btn.correct .opt-pinyin, .quiz-option-btn.wrong .opt-pinyin { color:inherit; opacity:0.82; }
    `;
    document.head.appendChild(style);
  }

  injectStyles();

  return {
    render,
    setView,
    setCategory,
    startQuiz,
    checkAnswer,
    next: () => { state.index++; state.chosen = false; showQuestion(); },
    closeQuiz: () => { 
        Modal.hide(); 
        const mc = document.getElementById('modal-content');
        if (mc) { mc.style.background = ''; mc.style.boxShadow = ''; mc.style.maxWidth = ''; }
    }
  };
})();


