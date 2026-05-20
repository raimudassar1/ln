/* ═══════════════════════════════════════════════════════════════
   grammar.js — B1 Grammar Library & Explorer
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const GrammarModule = (() => {

  let grammarData = null;

  async function init() {
    if (!grammarData) {
      try {
        const res = await fetch('data/b1_grammar.json');
        const json = await res.json();
        grammarData = json.patterns;
      } catch (e) {
        console.error("Failed to load grammar data", e);
        grammarData = [];
      }
    }
  }

  async function render(container) {
    await init();
    
    container.innerHTML = `
      <div class="page-header">
        <h2>Grammar Library</h2>
        <p>Master 30 essential B1-level grammar patterns for professional and daily communication.</p>
      </div>

      <div class="grammar-search mb-24">
        <input type="text" class="input" id="grammar-input" placeholder="Search patterns (e.g. 'because', '把')..." oninput="GrammarModule.filterPatterns()">
      </div>

      <div class="grammar-grid" id="grammar-list">
        ${renderPatternList(grammarData)}
      </div>
    `;
  }

  function renderPatternList(patterns) {
    if (!patterns.length) return `<div class="empty-state">No patterns found.</div>`;
    
    return patterns.map(p => `
      <div class="grammar-card" onclick="GrammarModule.showDetail('${p.id}')">
        <div class="grammar-card-main">
          <div class="grammar-pattern-title">${p.pattern}</div>
          <div class="grammar-pattern-pinyin">${p.pattern_pinyin}</div>
        </div>
        <div class="grammar-card-footer">
          <span class="badge badge-primary">${p.category}</span>
          <span class="grammar-pattern-name">${p.english_name}</span>
        </div>
      </div>
    `).join('');
  }

  function filterPatterns() {
    const query = document.getElementById('grammar-input').value.toLowerCase();
    const filtered = grammarData.filter(p => 
      p.pattern.toLowerCase().includes(query) || 
      p.english_name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
    document.getElementById('grammar-list').innerHTML = renderPatternList(filtered);
  }

  function showDetail(id) {
    const p = grammarData.find(pat => pat.id === id);
    if (!p) return;

    const modalContent = `
      <div class="modal-header">
        <div class="modal-title-box">
          <h3 class="modal-title">${p.pattern}</h3>
          <div class="modal-subtitle">${p.english_name}</div>
        </div>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      
      <div class="modal-body">
        <div class="modal-section">
          <h4>Meaning</h4>
          <p>${p.meaning}</p>
        </div>

        <div class="modal-section">
          <h4>Structure</h4>
          <div class="grammar-structure-box">${p.structure_diagram}</div>
        </div>

        <div class="modal-section">
          <h4>Examples</h4>
          <div class="grammar-examples">
            ${p.examples.map(ex => `
              <div class="grammar-example-item">
                <div class="ge-zh" onclick="TTS.speak('${ex.zh}')">🔊 ${ex.zh}</div>
                <div class="ge-py">${ex.pinyin}</div>
                <div class="ge-en">${ex.english}</div>
              </div>
            `).join('')}
          </div>
        </div>

        ${p.common_mistakes ? `
        <div class="modal-section">
          <h4>Common Mistakes</h4>
          <div class="alert alert-warning" style="font-size:0.9rem">
            ${p.common_mistakes}
          </div>
        </div>` : ''}

        <div class="modal-section">
          <h4>Taiwan Usage Note</h4>
          <p class="text-muted" style="font-size:0.9rem italic">${p.taiwan_usage_note}</p>
        </div>

        <div class="modal-section">
          <h4>Practice</h4>
          <div class="card p-16" style="background:var(--off-white)">
            <p class="mb-12">${p.practice_sentence.prompt}</p>
            <button class="btn btn-outline btn-sm" id="show-answer-btn" onclick="this.nextElementSibling.classList.toggle('hidden')">Show Answer</button>
            <div class="mt-12 hidden">
              <div class="font-zh text-large color-accent">${p.practice_sentence.answer}</div>
              <div class="text-small text-muted">${p.practice_sentence.pinyin}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = modalContent;
    overlay.classList.remove('hidden');
  }

  return {
    render,
    filterPatterns,
    showDetail
  };
})();
