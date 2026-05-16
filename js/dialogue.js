/* ═══════════════════════════════════════════════════════════════
   dialogue.js — Scripted Conversation Practice Module
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const DialogueModule = (() => {

  let currentDialogue = null;
  let playMode = false;   // Auto-play mode
  let lineIndex  = 0;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Dialogue Practice</h2>
        <p>Learn Chinese through real conversations. Read, listen, and practice with scripted dialogues.</p>
      </div>
      <div id="dialogue-main"><div class="spinner"></div></div>
    `;

    try {
      const dialogues = await API.get('/dialogues');
      renderList(document.getElementById('dialogue-main'), dialogues);
    } catch (err) {
      document.getElementById('dialogue-main').innerHTML =
        `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Error loading dialogues</h3><p>${err.message}</p></div>`;
    }
  }

  function renderList(container, dialogues) {
    const levelColors = { novice:'#27ae60', a1:'#2980b9', a2:'#e67e22', b1:'#8e44ad' };
    const levelNames  = { novice:'Novice', a1:'A1', a2:'A2', b1:'B1' };
    const topicIcons  = { greetings:'👋', food:'🍜', transport:'🚇', health:'🏥', shopping:'🛍️', communication:'📞', directions:'🗺️' };

    container.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;align-items:center">
        <span class="text-small text-muted">Filter:</span>
        ${['all','novice','a1','a2','b1'].map(l => `
          <button class="tab-btn ${l==='all'?'active':''}" style="flex:none;background:var(--off-white);border:1px solid var(--border)"
            onclick="filterDialogues('${l}',this)">${l==='all'?'All Levels':levelNames[l]||l}</button>`).join('')}
      </div>
      <div class="dialogue-grid" id="dialogue-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
        ${dialogues.map(d => `
          <div class="card dialogue-card" data-level="${d.level}" style="cursor:pointer;transition:all 0.15s;border-left:4px solid ${levelColors[d.level]||'var(--border)'}" onclick="openDialogue('${d.id}')" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span class="badge" style="background:${levelColors[d.level]}22;color:${levelColors[d.level]};border:none">${levelNames[d.level]||d.level}</span>
              <span style="font-size:1.2rem">${topicIcons[d.topic]||'💬'}</span>
            </div>
            <div style="font-weight:700;font-size:1rem;margin-bottom:4px">${d.title}</div>
            <div style="font-size:0.8rem;color:var(--text-3);margin-bottom:10px">${d.scene}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${(d.vocabulary||[]).slice(0,3).map(v => `<span style="background:var(--off-white);border-radius:4px;padding:2px 7px;font-family:var(--font-zh);font-size:0.85rem">${v}</span>`).join('')}
              ${(d.vocabulary||[]).length > 3 ? `<span style="font-size:0.75rem;color:var(--text-3);align-self:center">+${d.vocabulary.length-3} more</span>` : ''}
            </div>
            <div style="margin-top:10px;font-size:0.78rem;color:var(--text-3)">${d.lines?.length||0} lines · ${(d.grammar_points||[]).length} grammar points</div>
          </div>`).join('')}
      </div>
    `;

    window.filterDialogues = (level, btn) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.dialogue-card').forEach(card => {
        card.parentElement.style.display = level === 'all' || card.dataset.level === level ? '' : 'none';
      });
    };

    window.openDialogue = (id) => {
      const d = dialogues.find(x => x.id === id);
      if (d) openDialogueView(container, d, dialogues);
    };
  }

  function openDialogueView(container, dialogue, allDialogues) {
    currentDialogue = dialogue;
    lineIndex = 0;

    const speakerColors = ['var(--tone1)','var(--tone2)','var(--tone4)','var(--tone3)','#8e44ad'];
    const speakers = [...new Set(dialogue.lines.map(l => l.speaker))];
    const speakerMap = {};
    speakers.forEach((s,i) => speakerMap[s] = speakerColors[i % speakerColors.length]);

    container.innerHTML = `
      <!-- Back bar -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" onclick="renderDialogueList()">← All Dialogues</button>
        <h3 style="flex:1;font-size:1.05rem;font-weight:700">${dialogue.title}</h3>
        <span class="badge" style="background:rgba(41,128,185,0.1);color:#2980b9">${dialogue.level.toUpperCase()}</span>
      </div>

      <!-- Scene -->
      <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;font-size:0.85rem;color:var(--text-2)">
        📍 <strong>Scene:</strong> ${dialogue.scene}
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary btn-sm" id="dlg-play-btn" onclick="toggleDialoguePlay()">▶ Auto-Play</button>
        <button class="btn btn-ghost btn-sm" onclick="playAllLines()">🔊 Read All</button>
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          <label class="text-small" style="display:flex;align-items:center;gap:5px;cursor:pointer">
            <input type="checkbox" id="show-pinyin" checked onchange="togglePinyinDisplay()"> Pinyin
          </label>
          <label class="text-small" style="display:flex;align-items:center;gap:5px;cursor:pointer">
            <input type="checkbox" id="show-english" onchange="toggleEnglishDisplay()"> English
          </label>
        </div>
      </div>

      <!-- Dialogue lines -->
      <div class="card mb-16" id="dlg-lines" style="padding:20px;display:flex;flex-direction:column;gap:0">
        ${dialogue.lines.map((line, i) => {
          const isYou = line.speaker === '你' || line.speaker === 'You';
          const color = speakerMap[line.speaker] || 'var(--text-2)';
          return `
            <div class="dlg-line" id="dlg-line-${i}" style="display:flex;gap:12px;padding:14px 0;${i<dialogue.lines.length-1?'border-bottom:1px solid var(--border)':''}${isYou?';flex-direction:row-reverse':''};transition:background 0.2s;border-radius:var(--radius-sm)">
              <!-- Speaker bubble -->
              <div style="width:44px;height:44px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700;color:${color};text-align:center;font-family:var(--font-zh);line-height:1.2">${line.speaker}</div>
              <!-- Content -->
              <div style="flex:1;${isYou?'text-align:right':''}">
                <div style="font-family:var(--font-zh);font-size:1.2rem;font-weight:600;margin-bottom:3px;line-height:1.5">${line.zh}</div>
                <div class="dlg-pinyin" style="font-size:0.8rem;color:var(--text-3);margin-bottom:2px">${line.pinyin}</div>
                <div class="dlg-english hidden" style="font-size:0.8rem;color:var(--text-3);font-style:italic">${line.english}</div>
                ${line.notes ? `<div style="font-size:0.72rem;color:var(--gold);margin-top:4px">💡 ${line.notes}</div>` : ''}
              </div>
              <!-- Play button -->
              <button onclick="playLine(${i})" style="background:none;border:none;cursor:pointer;font-size:1rem;color:var(--text-3);align-self:center;padding:4px 6px;border-radius:4px;transition:background 0.1s" onmouseover="this.style.background='var(--off-white)'" onmouseout="this.style.background='none'">🔊</button>
            </div>`;
        }).join('')}
      </div>

      <!-- Vocabulary -->
      <div class="card mb-16">
        <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:12px">Key Vocabulary</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${(dialogue.vocabulary||[]).map(v => `
            <button onclick="TTS.speak('${v}')" style="background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 12px;cursor:pointer;font-family:var(--font-zh);font-size:1rem;transition:all 0.1s" onmouseover="this.style.borderColor='var(--red)'" onmouseout="this.style.borderColor='var(--border)'">${v} 🔊</button>`).join('')}
        </div>
      </div>

      <!-- Grammar points -->
      ${dialogue.grammar_points?.length ? `
      <div class="card mb-16">
        <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:12px">Grammar Points</h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${dialogue.grammar_points.map((gp,i) => `
            <div style="display:flex;align-items:baseline;gap:10px;padding:8px 12px;background:var(--off-white);border-radius:var(--radius-sm)">
              <span style="width:20px;height:20px;background:var(--red);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0">${i+1}</span>
              <span style="font-size:0.85rem;color:var(--text-2)">${gp}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Practice section -->
      <div class="card mb-16">
        <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:12px">Practice — Say It Yourself</h4>
        <p class="text-small text-muted mb-12">Click any line marked "你" (You) and practice saying it aloud after hearing it.</p>
        <div id="practice-area" style="display:flex;flex-direction:column;gap:8px">
          ${dialogue.lines.filter(l => l.speaker === '你' || l.speaker === 'You').map((line,i) => `
            <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:12px 14px">
              <div style="font-family:var(--font-zh);font-size:1.1rem;margin-bottom:4px">${line.zh}</div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-bottom:8px">${line.pinyin}</div>
              <button onclick="practicePlayLine('${line.zh.replace(/'/g,"\\'")}',this)" class="btn btn-outline btn-sm">🔊 Hear, then repeat</button>
            </div>`).join('')}
        </div>
      </div>
    `;

    // Globals for this dialogue view
    window.renderDialogueList = () => renderList(container, allDialogues);

    window.playLine = (i) => {
      const line = dialogue.lines[i];
      if (!line) return;
      highlightLine(i);
      TTS.speak(line.zh, 'zh-TW', 0.8);
    };

    window.practicePlayLine = (text, btn) => {
      btn.textContent = '🔊 Playing…';
      TTS.speak(text, 'zh-TW', 0.7);
      setTimeout(() => { btn.textContent = '🔊 Hear, then repeat'; }, 2000);
    };

    let autoPlayTimer = null;
    window.toggleDialoguePlay = () => {
      playMode = !playMode;
      const btn = document.getElementById('dlg-play-btn');
      if (playMode) {
        btn.textContent = '⏸ Pause';
        btn.style.background = 'var(--gold)';
        lineIndex = 0;
        playNextLine();
      } else {
        clearTimeout(autoPlayTimer);
        btn.textContent = '▶ Auto-Play';
        btn.style.background = '';
      }
    };

    function playNextLine() {
      if (!playMode || lineIndex >= dialogue.lines.length) {
        playMode = false;
        const btn = document.getElementById('dlg-play-btn');
        if (btn) { btn.textContent = '▶ Auto-Play'; btn.style.background = ''; }
        return;
      }
      const line = dialogue.lines[lineIndex];
      highlightLine(lineIndex);
      TTS.speak(line.zh, 'zh-TW', 0.8);
      lineIndex++;
      // Estimate duration: ~300ms per character + 1000ms pause
      const duration = Math.max(2000, line.zh.length * 350 + 1200);
      autoPlayTimer = setTimeout(playNextLine, duration);
    }

    window.playAllLines = () => {
      playMode = false;
      lineIndex = 0;
      function next() {
        if (lineIndex >= dialogue.lines.length) return;
        const line = dialogue.lines[lineIndex];
        highlightLine(lineIndex);
        TTS.speak(line.zh, 'zh-TW', 0.8);
        lineIndex++;
        const duration = Math.max(2000, line.zh.length * 350 + 1000);
        setTimeout(next, duration);
      }
      next();
    };

    window.togglePinyinDisplay = () => {
      const show = document.getElementById('show-pinyin').checked;
      document.querySelectorAll('.dlg-pinyin').forEach(el => el.style.display = show ? '' : 'none');
    };

    window.toggleEnglishDisplay = () => {
      const show = document.getElementById('show-english').checked;
      document.querySelectorAll('.dlg-english').forEach(el => el.classList.toggle('hidden', !show));
    };
  }

  function highlightLine(i) {
    document.querySelectorAll('.dlg-line').forEach((el, j) => {
      el.style.background = j === i ? 'rgba(243,156,18,0.06)' : '';
    });
    document.getElementById(`dlg-line-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return { render };
})();
