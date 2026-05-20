/* ═══════════════════════════════════════════════════════════════
   learn.js — Guided Learning Path with Level Progression & SRS
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const LearnModule = (() => {

  const LEVEL_ORDER = ['novice','a1','a2','b1'];
  const LEVEL_META  = {
    novice: { name:'Novice',     color:'#27ae60', icon:'🌱', unlock:0,   desc:'Essential everyday characters' },
    a1:     { name:'TOCFL A1',   color:'#2980b9', icon:'🌿', unlock:80,  desc:'Survival Chinese basics' },
    a2:     { name:'TOCFL A2',   color:'#e67e22', icon:'🌳', unlock:80,  desc:'Elementary communication' },
    b1:     { name:'TOCFL B1',   color:'#8e44ad', icon:'🏆', unlock:75,  desc:'Independent learner level' },
  };

  // ── Main Render ──────────────────────────────────────────────
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Learning Path</h2>
        <p>Follow the guided path from absolute beginner to TOCFL B1. Each level unlocks when you master the previous one.</p>
      </div>
      <div id="learn-main"><div class="spinner"></div></div>
    `;

    const chars  = App.state.characters;
    const prog   = App.state.progress;
    const srsStats = SRS.getStats();

    // Fetch playground data
    let playgroundData = [];
    try {
      const res = await fetch('data/playground_content.json');
      playgroundData = await res.json();
    } catch(e) { console.error(e); }

    let levels;
    try { levels = await API.get('/levels'); }
    catch { levels = LEVEL_ORDER.map(id => ({ id, ...LEVEL_META[id], total: chars.filter(c => c.level === id).length })); }

    renderPath(document.getElementById('learn-main'), chars, prog, srsStats, levels, playgroundData);
  }

  function renderPath(container, chars, prog, srsStats, levels, playgroundData) {
    // Calculate per-level mastery
    const byLevel = {};
    LEVEL_ORDER.forEach(lvl => {
      const total = chars.filter(c => c.level === lvl).length;
      const learned = chars.filter(c => c.level === lvl && prog.learnedChars.includes(c.hanzi)).length;
      const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
      byLevel[lvl] = { total, learned, pct };
    });

    // Playground stats
    const totalPgLessons = (playgroundData || []).reduce((acc, pg) => acc + pg.lessons.length, 0);
    const donePgLessons = Object.keys(prog.playground || {}).length;
    const pgPct = totalPgLessons > 0 ? Math.round((donePgLessons / totalPgLessons) * 100) : 0;

    // Determine which levels are unlocked (All unlocked for static version)
    function isUnlocked(lvl) {
      return true;
    }

    // SRS due cards
    const dueToday = srsStats.due_today || 0;

    container.innerHTML = `

      <!-- Today's queue -->
      <div class="card mb-20" style="background:linear-gradient(135deg,var(--charcoal),var(--charcoal-2));color:#fff;position:relative;overflow:hidden">
        <div style="position:absolute;right:-10px;top:-10px;font-size:8rem;opacity:0.05;font-family:var(--font-zh)">學</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Today's SRS Queue</div>
            <div style="font-size:2.2rem;font-weight:900;color:${dueToday>0?'var(--gold)':'#58d68d'}">${dueToday}</div>
            <div style="font-size:0.85rem;color:rgba(255,255,255,0.6)">cards due for review</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            ${dueToday > 0
              ? `<button class="btn btn-primary" onclick="startSRSSession()">Review ${dueToday} Cards →</button>`
              : `<div style="font-size:0.85rem;color:rgba(255,255,255,0.5)">✓ All caught up! Come back tomorrow.</div>`}
            <button class="btn" style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2)" onclick="startSRSSession()">+ Study New</button>
          </div>
        </div>
        <div style="display:flex;gap:20px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap">
          ${[
            [srsStats.total||0,'Cards in SRS'],
            [srsStats.learned||0,'Learned'],
            [srsStats.mature||0,'Mature (21d+)'],
            [srsStats.average_interval||0,'Avg interval (days)'],
          ].map(([val,label]) => `
            <div>
              <div style="font-size:1.3rem;font-weight:700;color:#fff">${val}</div>
              <div style="font-size:0.68rem;color:rgba(255,255,255,0.4)">${label}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Level cards -->
      <div style="display:flex;flex-direction:column;gap:16px" id="level-cards">
        
        <!-- Beginner Playground Entry -->
        <div class="card level-card" style="border-left:4px solid var(--gold); background: var(--off-white);">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(243,156,18,0.1);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">
              🎠
            </div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:1rem">Beginner Playground</div>
              <div style="font-size:0.82rem;color:var(--text-3)">Baby-style high-repetition foundation building</div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:2px">${donePgLessons}/${totalPgLessons} lessons completed</div>
            </div>
            <div style="text-align:center;flex-shrink:0">
              <div style="font-size:1.6rem;font-weight:900;color:var(--gold)">${pgPct}%</div>
              <div style="font-size:0.68rem;color:var(--text-3)">progress</div>
            </div>
          </div>
          <div class="progress-bar" style="margin-bottom:14px"><div class="progress-fill" style="width:${pgPct}%;background:var(--gold)"></div></div>
          <button class="btn btn-primary btn-sm" onclick="navigate('/playground')">Enter Playground →</button>
        </div>

        ${levels.map((lvl, idx) => {
          const meta   = LEVEL_META[lvl.id] || { color:'#888', icon:'📚', name: lvl.id };
          const stats  = byLevel[lvl.id] || { total: lvl.total||0, learned: 0, pct: 0 };
          const active = stats.pct < 100;

          return `
          <div class="card level-card" style="border-left:4px solid ${meta.color}">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:${active?'14px':'0'}">
              <!-- Icon -->
              <div style="width:52px;height:52px;border-radius:50%;background:${meta.color+'22'};border:2px solid ${meta.color};display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">
                ${meta.icon}
              </div>
              <!-- Info -->
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                  <div style="font-weight:700;font-size:1rem">${meta.name}</div>
                  ${stats.pct === 100 ? '<span class="badge" style="background:rgba(39,174,96,0.1);color:#27ae60">✓ Complete</span>' : ''}
                </div>
                <div style="font-size:0.82rem;color:var(--text-3)">${meta.desc}</div>
                <div style="font-size:0.78rem;color:var(--text-3);margin-top:2px">${stats.learned}/${stats.total} characters mastered</div>
              </div>
              <!-- Percent -->
              <div style="text-align:center;flex-shrink:0">
                <div style="font-size:1.6rem;font-weight:900;color:${meta.color}">${stats.pct}%</div>
                <div style="font-size:0.68rem;color:var(--text-3)">mastered</div>
              </div>
            </div>

            <!-- Progress bar -->
            <div style="margin-bottom:14px">
              <div class="progress-bar"><div class="progress-fill" style="width:${stats.pct}%;background:${meta.color}"></div></div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" onclick="studyLevel('${lvl.id}')">
                ${stats.learned === 0 ? '🌱 Start Level' : '📖 Continue'}
              </button>
              <button class="btn btn-ghost btn-sm" onclick="browseLevel('${lvl.id}')">Browse Characters</button>
              ${stats.total > 0 ? `<button class="btn btn-ghost btn-sm" onclick="quizLevel('${lvl.id}')">Quick Quiz</button>` : ''}
            </div>

            <!-- Character preview strip -->
            <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap" id="preview-${lvl.id}">
              ${chars.filter(c => c.level === lvl.id).slice(0,12).map(c => {
                const isLearned = prog.learnedChars.includes(c.hanzi);
                return `<span onclick="showCharModal(${JSON.stringify(c).replace(/"/g,'&quot;')})" style="font-family:var(--font-zh);font-size:1.3rem;cursor:pointer;padding:4px;border-radius:4px;color:${isLearned?meta.color:'var(--text)'};background:${isLearned?meta.color+'15':'var(--off-white)'};transition:all 0.1s" title="${c.pinyin} — ${c.definition}">${c.traditional||c.hanzi}</span>`;
              }).join('')}
              ${stats.total > 12 ? `<span style="font-size:0.75rem;color:var(--text-3);align-self:center">+${stats.total - 12} more</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- SRS session modal area -->
      <div id="srs-session-area" class="hidden" style="position:fixed;inset:0;background:var(--warm-white);z-index:200;overflow-y:auto;padding:28px">
        <div style="max-width:600px;margin:0 auto">
          <button class="btn btn-ghost btn-sm" style="margin-bottom:20px" onclick="closeSRSSession()">← Exit Session</button>
          <div id="srs-session-content"></div>
        </div>
      </div>
    `;

    // Wire up level actions
    window.studyLevel = (lvl) => {
      const levelChars = chars.filter(c => c.level === lvl);
      openSRSSession(levelChars);
    };

    window.quizLevel = (lvl) => {
      // Navigate to pronunciation quiz pre-filtered by level
      App.state.lastLevelFilter = lvl;
      navigate('#/quiz/pronunciation');
    };

    window.browseLevel = (lvl) => {
      App.state.lastLevelFilter = lvl;
      navigate('#/library');
    };

    window.startSRSSession = () => {
      openSRSSession(chars);
    };

    window.closeSRSSession = () => {
      document.getElementById('srs-session-area')?.classList.add('hidden');
      // Refresh stats after session
      render(document.getElementById('learn-main').parentElement);
    };

    function openSRSSession(pool) {
      const area = document.getElementById('srs-session-area');
      const content = document.getElementById('srs-session-content');
      if (!area || !content) return;
      area.classList.remove('hidden');
      SRS.renderSRSSession(content, null).catch(e => {
        content.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><h3>${e.message}</h3></div>`;
      });
    }
  }

  // ── Lesson View (10 new chars at a time) ────────────────────
  function renderLesson(container, chars, levelMeta) {
    // Pick next 10 unlearned
    const unlearned = chars.filter(c => !App.state.progress.learnedChars.includes(c.hanzi));
    const batch = unlearned.slice(0, 10);

    if (!batch.length) {
      container.innerHTML = `
        <div class="card text-center" style="padding:40px">
          <div style="font-size:3rem;margin-bottom:12px">🎉</div>
          <h3>All characters in this level learned!</h3>
          <p class="text-muted mb-20">Review with SRS to keep them fresh.</p>
          <button class="btn btn-primary" onclick="navigate('#/learn')">Back to Path</button>
        </div>`;
      return;
    }

    let currentIdx = 0;

    function showChar(idx) {
      const char = batch[idx];
      if (!char) { finishLesson(); return; }

      container.innerHTML = `
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-sm" onclick="navigate('#/learn')">← Exit</button>
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${(idx/batch.length)*100}%"></div></div>
          <span class="text-small text-muted">${idx+1}/${batch.length}</span>
        </div>

        <div class="card" style="text-align:center;padding:40px 28px;margin-bottom:14px">
          <div style="font-family:var(--font-zh);font-size:6rem;font-weight:900;line-height:1;margin-bottom:16px;cursor:pointer" onclick="TTS.speak('${char.traditional||char.hanzi}')">${char.traditional||char.hanzi}</div>
          <div style="font-size:1.6rem;font-weight:700;color:var(--tone${Pinyin.getTone(char.pinyin)||1});margin-bottom:4px">${char.pinyin||''}</div>
          <div style="font-size:1rem;color:var(--text-2);margin-bottom:16px">${char.definition||''}</div>

          ${char.mnemonic ? `<div style="background:rgba(243,156,18,0.08);border-left:3px solid var(--gold);padding:10px 16px;border-radius:var(--radius-sm);font-size:0.85rem;color:var(--text-2);text-align:left;margin-bottom:14px">💡 ${char.mnemonic}</div>` : ''}

          ${char.example_sentence ? `
          <div class="sentence-block" style="text-align:left;margin-bottom:14px">
            <div class="sb-zh">${char.example_sentence.sentence}</div>
            <div class="sb-py">${char.example_sentence.pinyin||''}</div>
            <div class="sb-en">${char.example_sentence.english||''}</div>
          </div>` : ''}

          ${(char.example_words||[]).length ? `
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:4px">
            ${char.example_words.map(w => `
              <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:8px 12px;text-align:center;cursor:pointer" onclick="TTS.speak('${w.word}')">
                <div style="font-family:var(--font-zh);font-size:1.2rem;font-weight:600">${w.word}</div>
                <div style="font-size:0.72rem;color:var(--text-3)">${w.pinyin||''}</div>
                <div style="font-size:0.68rem;color:var(--text-3)">${w.definition||''}</div>
              </div>`).join('')}
          </div>` : ''}

          <button class="btn btn-ghost btn-sm" style="margin-top:12px" onclick="TTS.speak('${char.traditional||char.hanzi}')">🔊 Hear pronunciation</button>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="nextChar(${idx})">Got it! Next →</button>
          <button class="btn btn-ghost" onclick="showChar(${idx})">↺ Again</button>
        </div>
      `;

      // Auto-play on load
      setTimeout(() => TTS.speak(char.traditional||char.hanzi), 400);
    }

    window.nextChar = (idx) => {
      const char = batch[idx];
      App.markLearned(char.hanzi);
      SRS.review(char.hanzi, 'GOOD', char.level||'novice');
      showChar(idx + 1);
    };

    function finishLesson() {
      container.innerHTML = `
        <div class="card text-center" style="padding:40px">
          <div style="font-size:3rem;margin-bottom:12px">✅</div>
          <h3 style="margin-bottom:6px">Lesson complete!</h3>
          <p class="text-muted mb-4">${batch.length} new characters introduced.</p>
          <p class="text-small text-muted mb-20">They've been added to your SRS queue — review them tomorrow to reinforce memory.</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="navigate('#/learn')">Back to Path</button>
            <button class="btn btn-outline" onclick="navigate('#/quiz/pronunciation')">Quiz Now</button>
          </div>
        </div>`;
      App.logActivity('📖', `Learned ${batch.length} new characters`);
    }

    showChar(0);
  }

  return { render };
})();
