/* ═══════════════════════════════════════════════════════════════
   vocabulary_books.js — Vocabulary organized by Course Books (1-3)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.VocabularyBooksModule = (() => {
  let state = {
    book: 1,
    chapter: '01',
    data: null,
    loading: false
  };

  function injectStyles() {
    if (document.getElementById('vocabulary-books-styles')) return;
    const style = document.createElement('style');
    style.id = 'vocabulary-books-styles';
    style.textContent = `
      .vocab-row:hover { background-color: var(--off-white); cursor: pointer; }
      .vocab-table th { position: sticky; top: 0; z-index: 10; background: var(--off-white); box-shadow: 0 1px 0 var(--border); }
      .chapter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-bottom: 24px; }
      .chapter-btn { 
        padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: white; 
        text-align: center; cursor: pointer; transition: all 0.2s; font-weight: 600; font-size: 0.9rem;
      }
      .chapter-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--off-white); }
      .chapter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
      .vocab-hanzi-large { font-size: 1.4rem; font-weight: 700; color: var(--text); }
      .play-btn-circle {
        width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        background: var(--off-white); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
      }
      .play-btn-circle:hover { background: var(--accent); color: white; border-color: var(--accent); }
    `;
    document.head.appendChild(style);
  }

  async function loadBook(bookNum) {
    state.loading = true;
    injectStyles();
    const content = document.getElementById('vocabulary-books-content');
    if (content) content.innerHTML = '<div class="spinner"></div>';

    try {
      const resp = await fetch(`books/book${bookNum}/vocabulary_b${bookNum}.json`);
      if (!resp.ok) throw new Error(`Failed to load Book ${bookNum} data`);
      state.data = await resp.json();
      state.book = bookNum;

      // Extract unique chapters (lessons)
      const chapters = [...new Set(state.data.map(item => {
        const match = item.vocab_id.match(/L(\d+)/);
        return match ? match[1] : null;
      }))].filter(Boolean).sort();

      if (!chapters.includes(state.chapter)) {
        state.chapter = chapters[0];
      }

      state.loading = false;
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

  function renderContent() {
    const container = document.getElementById('vocabulary-books-content');
    if (!container || !state.data) return;

    const chapters = [...new Set(state.data.map(item => {
      const match = item.vocab_id.match(/L(\d+)/);
      return match ? match[1] : null;
    }))].filter(Boolean).sort();

    const filtered = state.data.filter(item => item.vocab_id.includes(`L${state.chapter}`));

    container.innerHTML = `
      <div class="section-title">Select Lesson</div>
      <div class="chapter-grid">
        ${chapters.map(ch => `
          <div class="chapter-btn ${state.chapter === ch ? 'active' : ''}" onclick="VocabularyBooksModule.switchChapter('${ch}')">
            Lesson ${parseInt(ch)}
          </div>
        `).join('')}
      </div>

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

    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;
    
    content.style.maxWidth = '850px';

    content.innerHTML = `
      <div class="vocab-detail-modal">
        <button class="modal-close" onclick="VocabularyBooksModule.closeModal()">✕</button>
        
        <div class="vd-layout">
          <div class="vd-left" style="text-align:left">
            <div class="vd-word-header" onclick="VocabularyBooksModule.play('${vocab.audio_file}')" style="cursor:pointer; display:inline-block; margin-bottom:16px">
              <div class="vd-hanzi" style="text-align:left; line-height:1; font-size: 3.5rem;">${vocab.traditional}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:12px">
                <span class="vd-pinyin tone-colors" style="margin-top:0; font-size: 1.2rem;">${Pinyin.colorize(vocab.pinyin)}</span>
                <span class="vd-audio-icon" style="font-size: 1.2rem;">🔊</span>
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
                  <select class="input input-sm" style="width:auto; padding:2px 8px; height:28px; font-size:0.75rem" onchange="DrawingBoard.setMode(this.value)">
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

    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target === modal) VocabularyBooksModule.closeModal(); };

    setTimeout(() => {
        const char = currentWordChars[currentCharIndex];
        DrawingBoard.init('book-hanzi-writer', 'book-freehand-canvas', char);
    }, 50);
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
      document.querySelectorAll('.char-select-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline'));
      btn.classList.replace('btn-outline', 'btn-primary');
      currentCharIndex = idx;
      DrawingBoard.init('book-hanzi-writer', 'book-freehand-canvas', currentWordChars[currentCharIndex]);
    },
    animateStrokes: () => DrawingBoard.animate(),
    clearCanvas: () => DrawingBoard.reset(),
    closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
      document.getElementById('modal-content').style.maxWidth = '';
    }
  };
})();
