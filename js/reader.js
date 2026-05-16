/* ═══════════════════════════════════════════════════════════════
   reader.js — Reading Module with Annotation Engine
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const ReaderModule = (() => {

  let currentPassage = null;
  let annotationMode = 'pinyin'; // pinyin | zhuyin | both | none
  let toneColorsOn = true;
  let answeredQuestions = {};

  async function render(container) {
    annotationMode = App.state.settings.annotation || 'pinyin';
    toneColorsOn = App.state.settings.toneColors !== false;

    container.innerHTML = `
      <div class="page-header">
        <h2>Reading</h2>
        <p>Annotated real-world Chinese texts. Hover or tap any word to see pinyin and meaning.</p>
      </div>

      <div class="tab-switcher" style="max-width:400px">
        <button class="tab-btn active" id="tab-passages" onclick="switchReadingTab('passages')">Curated Passages</button>
        <button class="tab-btn" id="tab-live" onclick="switchReadingTab('live')">Live Reader</button>
      </div>

      <div id="reading-passages-panel">
        <div id="passage-list-area"><div class="spinner"></div></div>
        <div id="passage-reader-area" style="display:none"></div>
      </div>

      <div id="reading-live-panel" style="display:none">
        ${renderLiveReader()}
      </div>
    `;

    window.switchReadingTab = (tab) => {
      document.getElementById('tab-passages').classList.toggle('active', tab === 'passages');
      document.getElementById('tab-live').classList.toggle('active', tab === 'live');
      document.getElementById('reading-passages-panel').style.display = tab === 'passages' ? '' : 'none';
      document.getElementById('reading-live-panel').style.display = tab === 'live' ? '' : 'none';
    };

    await loadPassageList();
    setupLiveReader();
  }

  async function loadPassageList() {
    const area = document.getElementById('passage-list-area');
    if (!area) return;

    try {
      const passages = await API.getReadings();
      if (!passages.length) {
        area.innerHTML = '<div class="empty-state"><div class="es-icon">📖</div><h3>No passages yet</h3><p>Passages will appear here once data is loaded.</p></div>';
        return;
      }

      const genreIcons = {
        'transit': '🚇', 'menu': '🍜', 'news': '📰', 'chat': '💬',
        'social': '📱', 'label': '🏷️', 'story': '📖', 'weather': '🌤️', 'classified': '📋'
      };

      area.innerHTML = `
        <div class="passage-list">
          ${passages.map(p => `
            <div class="passage-card" onclick="openPassage('${p.id}')">
              <div class="pc-genre">${genreIcons[p.genre] || '📄'} ${p.genre || 'General'}</div>
              <div class="pc-title">${p.title}</div>
              <div class="text-small text-muted">${p.description || ''}</div>
              <div class="pc-meta">
                <span class="badge ${p.difficulty === 'A2' ? 'badge-a2' : 'badge-b1'}">${p.difficulty}</span>
                <span class="text-small text-muted">${p.char_count} chars</span>
                <span class="text-small text-muted">${p.question_count} questions</span>
              </div>
            </div>`).join('')}
        </div>`;

      window.openPassage = openPassage;
    } catch (err) {
      area.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Could not load passages</h3><p>${err.message}</p></div>`;
    }
  }

  async function openPassage(id) {
    const listArea = document.getElementById('passage-list-area');
    const readerArea = document.getElementById('passage-reader-area');
    if (!listArea || !readerArea) return;

    listArea.style.display = 'none';
    readerArea.style.display = 'block';
    readerArea.innerHTML = '<div class="spinner"></div>';
    answeredQuestions = {};

    try {
      const passage = await API.getReading(id);
      currentPassage = passage;
      renderPassage(readerArea, passage);
    } catch (err) {
      readerArea.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Error</h3><p>${err.message}</p>
        <button class="btn btn-ghost mt-8" onclick="backToPassageList()">← Back</button></div>`;
    }

    window.backToPassageList = () => {
      listArea.style.display = '';
      readerArea.style.display = 'none';
      readerArea.innerHTML = '';
    };
  }

  function renderPassage(container, passage) {
    const learnedSet = new Set(App.state.progress.learnedChars);

    container.innerHTML = `
      <div class="reading-passage-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button class="btn btn-ghost btn-sm" onclick="backToPassageList()">← Back</button>
          <h3 style="flex:1;font-size:1.1rem">${passage.title}</h3>
          <span class="badge ${passage.difficulty === 'A2' ? 'badge-a2' : 'badge-b1'}">${passage.difficulty}</span>
        </div>

        <!-- Annotation Controls -->
        <div class="reading-controls">
          <span class="text-small text-muted">Annotation:</span>
          <div class="radio-group">
            ${['pinyin','zhuyin','both','none'].map(m => `
              <label class="radio-option">
                <input type="radio" name="anno-mode" value="${m}" ${annotationMode===m?'checked':''} onchange="setAnnotationMode('${m}')">
                <label>${m.charAt(0).toUpperCase()+m.slice(1)}</label>
              </label>`).join('')}
          </div>
          <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
            <label class="text-small" style="display:flex;align-items:center;gap:4px;cursor:pointer">
              <input type="checkbox" id="tone-color-toggle" ${toneColorsOn?'checked':''} onchange="setToneColors(this.checked)">
              Tone colors
            </label>
          </div>
        </div>

        <!-- Passage text -->
        <div id="passage-text" class="reading-text-container ${annotationMode !== 'none' ? 'pinyin-mode' : ''}"></div>
      </div>

      <!-- Questions -->
      ${passage.questions && passage.questions.length ? `
      <div class="card">
        <h4 style="margin-bottom:16px;font-size:0.9rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3)">Comprehension Questions</h4>
        <div id="questions-area">
          ${passage.questions.map((q, qi) => `
            <div class="mb-20" data-qi="${qi}">
              <div style="font-weight:600;margin-bottom:10px">${qi+1}. ${q.question}</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${q.options.map((opt, oi) => `
                  <button class="quiz-option" style="text-align:left;padding:10px 14px"
                    data-qi="${qi}" data-oi="${oi}" data-correct="${oi === q.correct_index}"
                    onclick="handleReadingAnswer(this, ${qi}, ${oi}, ${q.correct_index})">
                    ${String.fromCharCode(65+oi)}. ${opt}
                  </button>`).join('')}
              </div>
              <div class="quiz-feedback" id="q-feedback-${qi}"></div>
            </div>`).join('')}
        </div>
        <div id="q-score" class="hidden text-center" style="padding:16px;font-size:1rem;font-weight:600"></div>
      </div>` : ''}
    `;

    // Render annotated text
    renderAnnotatedText(passage.tokens || [], learnedSet);

    // Set up word tooltip
    setupWordTooltip();

    window.setAnnotationMode = (mode) => {
      annotationMode = mode;
      const ptEl = document.getElementById('passage-text');
      if (ptEl) ptEl.className = `reading-text-container ${mode !== 'none' ? 'pinyin-mode' : ''}`;
      if (currentPassage) renderAnnotatedText(currentPassage.tokens || [], learnedSet);
    };

    window.setToneColors = (on) => {
      toneColorsOn = on;
      if (currentPassage) renderAnnotatedText(currentPassage.tokens || [], learnedSet);
    };

    window.handleReadingAnswer = (btn, qi, oi, correct) => {
      if (answeredQuestions[qi]) return;
      answeredQuestions[qi] = oi;

      const isCorrect = oi === correct;
      document.querySelectorAll(`button[data-qi="${qi}"]`).forEach(b => {
        b.disabled = true;
        if (parseInt(b.dataset.oi) === correct) b.classList.add('correct');
      });
      if (!isCorrect) btn.classList.add('wrong');

      const fb = document.getElementById(`q-feedback-${qi}`);
      if (fb) {
        fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'} show`;
        fb.textContent = isCorrect ? '✓ Correct!' : `✗ The correct answer was: ${passage.questions[qi].options[correct]}`;
      }

      // Check if all answered
      if (passage.questions && Object.keys(answeredQuestions).length === passage.questions.length) {
        const correct_count = Object.entries(answeredQuestions).filter(([qi, oi]) => oi === passage.questions[qi].correct_index).length;
        const scoreEl = document.getElementById('q-score');
        if (scoreEl) {
          scoreEl.className = '';
          scoreEl.style.color = correct_count >= passage.questions.length * 0.7 ? 'var(--tone2)' : 'var(--tone4)';
          scoreEl.textContent = `Score: ${correct_count} / ${passage.questions.length}`;
        }
      }
    };
  }

  function renderAnnotatedText(tokens, learnedSet) {
    const container = document.getElementById('passage-text');
    if (!container) return;

    if (!tokens || !tokens.length) {
      container.textContent = currentPassage?.text_zh || '';
      return;
    }

    let html = '';
    tokens.forEach(token => {
      if (token.type === 'punct' || !token.hanzi.match(/[\u4e00-\u9fff]/)) {
        html += `<span>${token.hanzi}</span>`;
        return;
      }

      const isKnown = [...token.hanzi].every(ch => learnedSet.has(ch));
      const toneNum = Pinyin.getTone(token.pinyin);
      const toneClass = toneColorsOn ? `tone${toneNum}` : '';

      let annotation = '';
      if (annotationMode === 'pinyin' || annotationMode === 'both') {
        annotation += `<span class="pinyin ${toneClass}" style="display:block;font-size:0.6em;line-height:1.3;text-align:center">${token.pinyin || ''}</span>`;
      }
      if (annotationMode === 'zhuyin' || annotationMode === 'both') {
        annotation += `<span style="display:block;font-family:var(--font-zh);font-size:0.55em;line-height:1.2;text-align:center;color:var(--text-3)">${token.zhuyin || ''}</span>`;
      }

      const escapedToken = JSON.stringify(token).replace(/"/g, '&quot;');

      if (annotationMode !== 'none' && annotation) {
        html += `<ruby class="rt-token ${isKnown ? '' : 'unknown'}" 
          data-token="${escapedToken}" 
          onclick="showWordPopup(event, ${escapedToken})"
          style="display:inline-flex;flex-direction:column-reverse;align-items:center;margin:0 1px;vertical-align:bottom">
          <rb>${token.hanzi}</rb>
          <rt style="display:flex;flex-direction:column;align-items:center">${annotation}</rt>
        </ruby>`;
      } else {
        html += `<span class="rt-token ${isKnown ? '' : 'unknown'}" 
          data-token="${escapedToken}"
          onclick="showWordPopup(event, ${escapedToken})">${token.hanzi}</span>`;
      }
    });

    container.innerHTML = html;
  }

  function setupWordTooltip() {
    const tooltip = document.getElementById('word-tooltip');
    if (!tooltip) return;

    document.addEventListener('mousemove', (e) => {
      if (tooltip.classList.contains('hidden')) return;
      const x = Math.min(e.clientX + 12, window.innerWidth - 200);
      const y = Math.min(e.clientY + 12, window.innerHeight - 150);
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.rt-token')) {
        tooltip.classList.add('hidden');
      }
    });

    window.showWordPopup = (event, token) => {
      if (typeof token === 'string') {
        try { token = JSON.parse(token); } catch { return; }
      }
      if (!token || !token.pinyin) return;

      event.stopPropagation();

      const toneNum = Pinyin.getTone(token.pinyin);
      const toneColor = `var(--tone${toneNum})`;

      tooltip.querySelector('.wt-hanzi').textContent = token.hanzi;
      tooltip.querySelector('.wt-pinyin').innerHTML = `<span style="color:${toneColor};font-size:1rem;font-weight:600">${token.pinyin}</span>`;
      tooltip.querySelector('.wt-zhuyin').textContent = token.zhuyin || '';
      tooltip.querySelector('.wt-def').textContent = token.definition || '';

      const x = Math.min(event.clientX + 12, window.innerWidth - 200);
      const y = Math.min(event.clientY + 12, window.innerHeight - 150);
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.classList.remove('hidden');
    };
  }

  // ── Live Reader ──────────────────────────────────────────────
  function renderLiveReader() {
    return `
      <div class="card mb-16">
        <h3 style="margin-bottom:12px;font-size:1rem">Live Text Reader</h3>
        <div style="margin-bottom:10px">
          <div class="text-small text-muted mb-8">Quick sources (opens in reader):</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
            <button class="btn btn-sm btn-ghost" onclick="fetchFromURL('https://www.cna.com.tw/news/ahel/202401010001.aspx')">中央社 CNA</button>
            <button class="btn btn-sm btn-ghost" onclick="fetchFromURL('https://news.tvbs.com.tw/life')">TVBS</button>
            <button class="btn btn-sm btn-ghost" onclick="fetchFromURL('https://www.ettoday.net')">ETtoday</button>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input type="text" class="input" id="live-url" placeholder="Paste URL to fetch Chinese text…">
            <button class="btn btn-primary" onclick="fetchFromURL()">Fetch</button>
          </div>
        </div>
        <div class="divider"></div>
        <div class="text-small text-muted mb-8">Or paste Chinese text directly:</div>
        <textarea class="input" id="live-text" rows="5" placeholder="貼上任何中文文字，自動加上拼音標注…" style="font-family:var(--font-zh);font-size:1.1rem;resize:vertical"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-primary" onclick="annotateLiveText()">Annotate →</button>
          <button class="btn btn-ghost" onclick="document.getElementById('live-text').value='';document.getElementById('live-result').innerHTML=''">Clear</button>
        </div>
      </div>

      <div id="live-result"></div>
    `;
  }

  function setupLiveReader() {
    window.annotateLiveText = async () => {
      const text = document.getElementById('live-text')?.value?.trim();
      if (!text) return;

      const resultArea = document.getElementById('live-result');
      if (resultArea) resultArea.innerHTML = '<div class="spinner"></div>';

      try {
        const data = await API.annotate(text);
        const learnedSet = new Set(App.state.progress.learnedChars);

        const fakePassage = { tokens: data.tokens, text_zh: text, questions: [] };
        currentPassage = fakePassage;

        if (resultArea) {
          resultArea.innerHTML = `
            <div class="reading-passage-card">
              <div class="reading-controls">
                <span class="text-small text-muted">Annotation:</span>
                <div class="radio-group">
                  ${['pinyin','zhuyin','both','none'].map(m => `
                    <label class="radio-option">
                      <input type="radio" name="anno-mode" value="${m}" ${annotationMode===m?'checked':''} onchange="setAnnotationMode('${m}')">
                      <label>${m.charAt(0).toUpperCase()+m.slice(1)}</label>
                    </label>`).join('')}
                </div>
              </div>
              <div id="passage-text" class="reading-text-container pinyin-mode" lang="zh-TW"></div>
            </div>`;
          renderAnnotatedText(data.tokens, learnedSet);
          setupWordTooltip();
        }
      } catch (err) {
        if (resultArea) resultArea.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Annotation failed</h3><p>${err.message}</p></div>`;
      }
    };

    window.fetchFromURL = async (url) => {
      const inputUrl = url || document.getElementById('live-url')?.value?.trim();
      if (!inputUrl) return;

      const resultArea = document.getElementById('live-result');
      if (resultArea) resultArea.innerHTML = '<div class="spinner"></div><p class="text-center text-muted">Fetching page…</p>';

      try {
        const data = await API.fetchURL(inputUrl);
        if (data.text) {
          const textArea = document.getElementById('live-text');
          if (textArea) textArea.value = data.text.slice(0, 2000);
          window.annotateLiveText();
        }
      } catch (err) {
        if (resultArea) resultArea.innerHTML = `
          <div class="empty-state">
            <div class="es-icon">🌐</div>
            <h3>Could not fetch URL</h3>
            <p>${err.message}</p>
            <p class="text-small text-muted mt-8">Some sites block external requests. Try pasting the text directly.</p>
          </div>`;
      }
    };
  }

  return { render };

})();
