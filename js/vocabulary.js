/* ═══════════════════════════════════════════════════════════════
   vocabulary.js — Vocabulary Module with Pagination & High-Perf Lookup
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.VocabularyModule = (() => {

  let vocabState = {
    category: 'all',
    currentSet: 'all',
    showPinyin: true,
    showEnglish: true,
    search: '',
    page: 1,
    pageSize: 40
  };

  let drawingPad = null;
  let vocabCache = null;

  function getUniqueVocab() {
    if (vocabCache) return vocabCache;
    if (!App.state.vocabulary || !Array.isArray(App.state.vocabulary)) return [];
    
    const uniqueMap = new Map();
    const charMap = new Map();
    
    // Index characters for O(1) lookup
    if (App.state.characters) {
      App.state.characters.forEach(c => {
        if (c.hanzi) charMap.set(c.hanzi, c);
        if (c.traditional && c.traditional !== c.hanzi) charMap.set(c.traditional, c);
      });
    }
    
    App.state.vocabulary.forEach(set => {
      if (!set.words || !Array.isArray(set.words)) return;
      
      set.words.forEach(w => {
        if (!w.word) return;
        const targetWord = w.word.trim();
        if (!uniqueMap.has(targetWord)) {
          const charMeta = charMap.get(targetWord);
          uniqueMap.set(targetWord, {
            ...w,
            word: targetWord,
            setId: set.id,
            setName: set.name,
            level: set.level || charMeta?.level || 'A1',
            category: charMeta?.category || 'general',
            examples: w.example_words || charMeta?.example_words || [],
            sentence: w.example_sentence || charMeta?.example_sentence || null
          });
        }
      });
    });
    
    vocabCache = Array.from(uniqueMap.values());
    return vocabCache;
  }

  async function ensureVocabularyData() {
    if (!Array.isArray(App.state.vocabulary)) {
      try {
        const vocabResult = await API.get('vocabulary');
        App.state.vocabulary = Array.isArray(vocabResult) ? vocabResult : (vocabResult.sets || []);
      } catch (err) {
        console.warn('Could not load vocabulary library data:', err.message);
        App.state.vocabulary = [];
      }
    }

    if (!Array.isArray(App.state.characters) || App.state.characters.length === 0) {
      try {
        const charResult = await API.getCharacters({ limit: 9999 });
        App.state.characters = charResult.data || [];
      } catch (err) {
        console.warn('Could not load character metadata for vocabulary library:', err.message);
        App.state.characters = [];
      }
    }
  }

  async function render(container) {
    container.innerHTML = '<div class="spinner"></div><p class="text-center text-muted mt-8">Loading vocabulary...</p>';
    await ensureVocabularyData();
    vocabCache = null; // Clear cache to pick up data changes
    const vocabSets = Array.isArray(App.state.vocabulary) ? App.state.vocabulary : [];
    const allVocab = getUniqueVocab();
    const categories = ['all', ...new Set(allVocab.map(v => v.category).filter(Boolean))].sort();
    
    container.innerHTML = `
      <div class="page-header">
        <h2>Vocabulary Library</h2>
        <p>Master all ${allVocab.length} words with definitions, context, and interactive writing practice.</p>
      </div>

      <div class="library-controls mb-24">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="input" id="vocab-search" placeholder="Search words or meanings..." value="${vocabState.search}">
        </div>
        
        <div class="flex gap-8 flex-wrap">
          <select class="input" id="vocab-set-select" style="width:auto">
            <option value="all">All Sets</option>
            ${vocabSets.map(s => `<option value="${s.id}" ${vocabState.currentSet === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>

          <select class="input" id="vocab-cat-select" style="width:auto">
            ${categories.map(c => `<option value="${c}" ${vocabState.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
          </select>
        </div>

        <div class="flex gap-8">
          <button class="btn ${vocabState.showPinyin ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="VocabularyModule.toggleAnnotation('pinyin')">Pinyin</button>
          <button class="btn ${vocabState.showEnglish ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="VocabularyModule.toggleAnnotation('english')">English</button>
        </div>
      </div>

      <div class="vocab-grid" id="vocab-grid"></div>
      <div id="vocab-pagination" class="pagination-container mt-24"></div>
    `;

    // Wire up events
    const searchInput = document.getElementById('vocab-search');
    let searchTimeout;
    searchInput?.addEventListener('input', e => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        vocabState.search = e.target.value.toLowerCase();
        vocabState.page = 1;
        updateGrid();
      }, 300);
    });

    document.getElementById('vocab-cat-select')?.addEventListener('change', e => {
      vocabState.category = e.target.value;
      vocabState.page = 1;
      updateGrid();
    });

    document.getElementById('vocab-set-select')?.addEventListener('change', e => {
      vocabState.currentSet = e.target.value;
      vocabState.page = 1;
      updateGrid();
    });

    updateGrid();
  }

  function updateGrid() {
    const grid = document.getElementById('vocab-grid');
    const pagContainer = document.getElementById('vocab-pagination');
    if (!grid) return;

    let filtered = getUniqueVocab();
    
    // Filter
    if (vocabState.category !== 'all') {
      filtered = filtered.filter(v => v.category === vocabState.category);
    }
    if (vocabState.currentSet !== 'all') {
      filtered = filtered.filter(v => v.setId === vocabState.currentSet);
    }
    if (vocabState.search) {
      filtered = filtered.filter(v => 
        v.word.includes(vocabState.search) || 
        v.definition.toLowerCase().includes(vocabState.search) ||
        v.pinyin.toLowerCase().includes(vocabState.search)
      );
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / vocabState.pageSize);
    
    // Paginate
    const start = (vocabState.page - 1) * vocabState.pageSize;
    const pagedItems = filtered.slice(start, start + vocabState.pageSize);

    if (pagedItems.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><h3>No matching vocabulary</h3></div>`;
      if (pagContainer) pagContainer.innerHTML = '';
      return;
    }

    grid.innerHTML = pagedItems.map(v => `
      <div class="vocab-card animate-fade-in" onclick="VocabularyModule.showDetail('${v.word.replace(/'/g, "\\'")}')">
        <div class="vocab-badges">
          <span class="v-badge v-badge-level">${v.level}</span>
          <span class="v-badge v-badge-cat">${v.category}</span>
        </div>
        <div class="vocab-info" style="padding:12px">
          <div class="vocab-hanzi" style="font-size:2.5rem; margin-bottom:4px">${v.word}</div>
          <div class="vocab-py ${vocabState.showPinyin ? '' : 'hidden'}" style="font-size:0.9rem; color:var(--tone1)">${v.pinyin}</div>
          <div class="vocab-def ${vocabState.showEnglish ? '' : 'hidden'}" style="font-size:0.85rem; color:var(--text-muted); margin-top:4px">${v.definition}</div>
        </div>
        <div class="vocab-set-tag">${v.setName}</div>
      </div>
    `).join('');

    renderPagination(pagContainer, totalPages);
  }

  function renderPagination(container, totalPages) {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div class="flex items-center justify-center gap-12">
        <button class="btn btn-sm btn-ghost" ${vocabState.page === 1 ? 'disabled' : ''} onclick="VocabularyModule.setPage(${vocabState.page - 1})">← Prev</button>
        <span class="text-small">Page <strong>${vocabState.page}</strong> of ${totalPages}</span>
        <button class="btn btn-sm btn-ghost" ${vocabState.page === totalPages ? 'disabled' : ''} onclick="VocabularyModule.setPage(${vocabState.page + 1})">Next →</button>
      </div>
    `;
    container.innerHTML = html;
  }

  let drawState = { penOnly: false, strokeWidth: 6 };
  let hw = null;
  let currentWordChars = [];
  let currentCharIndex = 0;

  function showDetail(wordStr) {
    if (!wordStr) return false;
    const targetWord = wordStr.trim();
    
    const allVocab = getUniqueVocab();
    const vocab = allVocab.find(v => v.word === targetWord);
    
    if (!vocab) {
      return false;
    }

    currentWordChars = Array.from(vocab.word).filter(c => /[\u4e00-\u9fa5]/.test(c));
    if (currentWordChars.length === 0) return false;
    
    currentCharIndex = 0;

    const modalContent = `
      <div class="vocab-detail-modal">
        <button class="modal-close" onclick="Modal.hide()">✕</button>
        
        <div class="vd-layout">
          <!-- Left: Context & Explanation -->
          <div class="vd-left" style="text-align:left">
            <div class="vd-word-header" onclick="TTS.speak('${vocab.word}')" style="cursor:pointer; display:inline-block; margin-bottom:16px">
              <div class="vd-hanzi" style="text-align:left; line-height:1; color: var(--text);">${vocab.word}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
                <span class="vd-pinyin tone-colors" style="margin-top:0">${Pinyin.colorize(vocab.pinyin)}</span>
                <span class="vd-audio-icon" style="color: var(--accent);">🔊</span>
              </div>
            </div>

            <div class="vd-section">
              <h4 style="color: var(--text-3); font-size: 0.75rem; text-transform: uppercase;">Meaning</h4>
              <p class="vd-definition" style="color: var(--text);">${vocab.definition}</p>
            </div>

            ${vocab.sentence ? `
              <div class="vd-section">
                <h4 style="color: var(--text-3); font-size: 0.75rem; text-transform: uppercase;">Context Example</h4>
                <div class="sentence-block" style="background: var(--off-white);">
                  <div class="sb-zh" style="color: var(--text);">${vocab.sentence.sentence}</div>
                  <div class="sb-py" style="color: var(--text-2);">${vocab.sentence.pinyin}</div>
                  <div class="sb-en" style="color: var(--text-3);">${vocab.sentence.english}</div>
                </div>
              </div>
            ` : ''}

            ${vocab.examples && vocab.examples.length > 0 ? `
              <div class="vd-section">
                <h4 style="color: var(--text-3); font-size: 0.75rem; text-transform: uppercase;">Related Words</h4>
                <div class="vd-examples-list">
                  ${vocab.examples.map(ex => `
                    <div class="vd-ex-item" style="border-bottom-color: var(--border);">
                      <span class="ex-zh" style="color: var(--text);">${ex.word}</span>
                      <span class="ex-py" style="color: var(--text-2);">${ex.pinyin}</span>
                      <span class="ex-def" style="color: var(--text-3);">${ex.def}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right: Interactive Drawing Canvas -->
          <div class="vd-right" style="display:flex; flex-direction:column;">
            <div class="vd-section" style="flex:1; display:flex; flex-direction:column; margin-bottom:0">
              
              ${currentWordChars.length > 1 ? `
              <div style="display:flex; gap:8px; margin-bottom:12px; justify-content:center">
                ${currentWordChars.map((c, i) => `
                  <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-outline'} char-select-btn" onclick="VocabularyModule.selectCanvasChar(${i}, this)">${c}</button>
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
                  <button class="btn btn-ghost btn-sm" onclick="VocabularyModule.animateStrokes()">Animate</button>
                  <button class="btn btn-ghost btn-sm" onclick="VocabularyModule.clearCanvas()">Reset 🔄</button>
                </div>
              </div>
              <div class="canvas-container" style="flex:1; min-height:300px; background:var(--off-white); border:2px dashed var(--border); border-radius:var(--radius); position:relative; overflow:hidden; touch-action:none; display:flex; align-items:center; justify-content:center;">
                <div id="vocab-hanzi-writer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"></div>
                <canvas id="vocab-freehand-canvas" style="position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; display:none"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const mc = document.getElementById('modal-content');
    if (mc) mc.style.maxWidth = '800px';
    Modal.show(modalContent);

    setTimeout(() => {
        const char = currentWordChars[currentCharIndex];
        DrawingBoard.init('vocab-hanzi-writer', 'vocab-freehand-canvas', char);
    }, 100);

    return true;
  }

  return {
    render,
    toggleAnnotation(type) {
      if (type === 'pinyin') vocabState.showPinyin = !vocabState.showPinyin;
      if (type === 'english') vocabState.showEnglish = !vocabState.showEnglish;
      render(document.getElementById('page-content'));
    },
    showDetail,
    setPage(p) {
      vocabState.page = p;
      updateGrid();
      window.scrollTo(0, 0);
    },
    selectCanvasChar(idx, btn) {
      document.querySelectorAll('.char-select-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
      currentCharIndex = idx;
      DrawingBoard.init('vocab-hanzi-writer', 'vocab-freehand-canvas', currentWordChars[currentCharIndex]);
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
