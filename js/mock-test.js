/* ═══════════════════════════════════════════════════════════════
   mock-test.js — TOCFL Mock Test Modules (Reading + Listening)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const MockTestModule = (() => {

  // ── Shared Test State ────────────────────────────────────────
  let testState = {
    test: null,
    current: 0,
    answers: {},
    flagged: new Set(),
    timer: null,
    timeLeft: 0,
    started: false,
    finished: false,
  };

  function clearTestState() {
    if (testState.timer) clearInterval(testState.timer);
    testState = { test: null, current: 0, answers: {}, flagged: new Set(), timer: null, timeLeft: 0, started: false, finished: false };
  }

  window.addEventListener('hashchange', () => {
    if (testState.timer) clearInterval(testState.timer);
    window.speechSynthesis?.cancel();
  });

  // ── Reading Mock Test ────────────────────────────────────────
  async function renderReading(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Reading Mock Test</h2>
        <p>TOCFL-style reading exam simulation. No pinyin shown during exam — authentic test conditions.</p>
      </div>
      <div id="reading-test-area"><div class="spinner"></div></div>`;

    try {
      const tests = await API.getMockTests('reading');
      renderTestList('reading-test-area', tests, 'reading');
    } catch (err) {
      document.getElementById('reading-test-area').innerHTML =
        `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
    }
  }

  // ── Listening Mock Test ──────────────────────────────────────
  async function renderListening(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Listening Mock Test</h2>
        <p>TOCFL-style listening simulation via Text-to-Speech (zh-TW). Max 2 replays per item.</p>
      </div>
      <div id="listening-test-area"><div class="spinner"></div></div>`;

    try {
      const tests = await API.getMockTests('listening');
      renderTestList('listening-test-area', tests, 'listening');
    } catch (err) {
      document.getElementById('listening-test-area').innerHTML =
        `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
    }
  }

  // ── Test List ────────────────────────────────────────────────
  function renderTestList(areaId, tests, type) {
    const area = document.getElementById(areaId);
    if (!area) return;

    // Show past scores
    const history = App.state.progress.testHistory || [];
    const relevantHistory = history.filter(h => h.type === type).slice(0, 5);

    area.innerHTML = `
      ${relevantHistory.length ? `
        <div class="card mb-16">
          <h4 style="margin-bottom:10px;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3)">Recent Scores</h4>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${relevantHistory.map(h => `
              <div style="background:var(--off-white);padding:8px 14px;border-radius:var(--radius-sm);font-size:0.85rem">
                <div style="font-weight:700;color:${h.pct >= 70 ? 'var(--tone2)' : 'var(--tone4)'}">${h.pct}%</div>
                <div class="text-muted text-small">${h.title}</div>
                <div class="text-muted text-small">${new Date(h.date).toLocaleDateString()}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      ${!tests.length ? `<div class="empty-state"><div class="es-icon">📝</div><h3>No tests available</h3></div>` :
        `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
          ${tests.map(t => `
            <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="startTest('${t.id}','${type}')"
              onmouseover="this.style.borderColor='var(--red)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <span class="badge ${t.difficulty === 'A2' ? 'badge-a2' : t.difficulty === 'B1' ? 'badge-b1' : 'badge-gray'}">${t.difficulty}</span>
                <span class="text-small text-muted">${t.time_limit || 30} min</span>
              </div>
              <div style="font-weight:700;font-size:1rem;margin-bottom:4px">${t.title}</div>
              <div class="text-small text-muted">${t.question_count} questions</div>
              <button class="btn btn-primary btn-sm" style="margin-top:12px;width:100%">Start Test →</button>
            </div>`).join('')}
        </div>`}
    `;

    window.startTest = async (id, testType) => {
      area.innerHTML = '<div class="spinner"></div>';
      try {
        const test = await API.getMockTest(id);
        clearTestState();
        testState.test = test;
        testState.timeLeft = (test.time_limit || 30) * 60;
        if (testType === 'reading') renderReadingTest(area, test);
        else renderListeningTest(area, test);
      } catch (err) {
        area.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><h3>Error loading test</h3><p>${err.message}</p></div>`;
      }
    };
  }

  // ── Reading Test UI ──────────────────────────────────────────
  function renderReadingTest(container, test) {
    container.innerHTML = `
      <div class="test-layout">
        <div>
          <div id="test-question-panel" class="test-question-panel"></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-ghost btn-sm" id="test-prev" onclick="testNav(-1)">← Previous</button>
            <button class="btn btn-ghost btn-sm" id="test-flag" onclick="testFlag()">🚩 Flag</button>
            <button class="btn btn-primary btn-sm" id="test-next" style="margin-left:auto" onclick="testNav(1)">Next →</button>
            <button class="btn btn-gold btn-sm" id="test-submit" onclick="submitTest()" style="display:none">Submit Test</button>
          </div>
        </div>
        <div class="test-sidebar">
          <div class="test-timer" id="test-timer">30:00</div>
          <div class="text-small text-muted text-center mb-8">Time Remaining</div>
          <div class="text-small text-muted mb-8">Questions</div>
          <div class="question-grid" id="q-grid"></div>
          <button class="btn btn-gold w-full" style="margin-top:12px" onclick="submitTest()">Submit Test</button>
        </div>
      </div>`;

    renderQGrid();
    showTestQuestion(0);
    startTimer(container, test);
  }

  function renderQGrid() {
    const grid = document.getElementById('q-grid');
    if (!grid || !testState.test) return;
    const qs = testState.test.questions;
    grid.innerHTML = qs.map((_, i) => `
      <div class="q-dot ${testState.answers[i] !== undefined ? 'answered' : ''} ${testState.flagged.has(i) ? 'flagged' : ''} ${i === testState.current ? 'current' : ''}"
        onclick="jumpToQuestion(${i})">${i+1}</div>`).join('');

    window.jumpToQuestion = (i) => {
      testState.current = i;
      showTestQuestion(i);
      renderQGrid();
    };
  }

  function showTestQuestion(idx) {
    testState.current = idx;
    const q = testState.test?.questions[idx];
    if (!q) return;

    const panel = document.getElementById('test-question-panel');
    if (!panel) return;

    const total = testState.test.questions.length;
    const isFlagged = testState.flagged.has(idx);

    let questionHTML = '';

    if (q.type === 'passage') {
      questionHTML = `
        <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;font-family:var(--font-zh);font-size:1.2rem;line-height:2.2;lang='zh-TW'">${q.passage}</div>
        <div style="font-weight:600;margin-bottom:12px">${idx+1}. ${q.question}</div>`;
    } else if (q.type === 'cloze') {
      questionHTML = `
        <div style="font-family:var(--font-zh);font-size:1.2rem;margin-bottom:12px;line-height:2">${q.sentence}</div>
        ${q.pinyin_hint ? `<div class="text-small text-muted mb-8 ${typeof App !== 'undefined' && App.state && App.state.settings && App.state.settings.showQuizPinyin === false ? 'hidden' : ''}">(Pinyin hint: ${q.pinyin_hint})</div>` : ''}
        <div style="font-weight:600;margin-bottom:12px">${idx+1}. Choose the correct character for the blank:</div>`;
    } else if (q.type === 'ordering') {
      questionHTML = `
        <div style="font-weight:600;margin-bottom:12px">${idx+1}. ${q.question}</div>
        <div style="margin-bottom:12px">Arrange these sentences in the correct order:</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
          ${q.sentences.map((s, si) => `<div style="background:var(--off-white);padding:8px 12px;border-radius:var(--radius-sm);font-family:var(--font-zh)">${String.fromCharCode(65+si)}. ${s}</div>`).join('')}
        </div>`;
    } else {
      questionHTML = `<div style="font-weight:600;margin-bottom:12px">${idx+1}. ${q.question}</div>`;
    }

    const savedAnswer = testState.answers[idx];

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span class="text-small text-muted">Question ${idx+1} of ${total}</span>
        ${isFlagged ? '<span class="badge badge-gold">🚩 Flagged</span>' : ''}
      </div>
      ${questionHTML}
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <button class="quiz-option ${savedAnswer === oi ? 'correct' : ''}"
            onclick="selectTestAnswer(${idx}, ${oi})"
            style="${savedAnswer === oi ? 'border-color:var(--charcoal);background:rgba(44,62,80,0.08)' : ''}">
            <span>${String.fromCharCode(65+oi)}. ${opt}</span>
          </button>`).join('')}
      </div>
    `;

    // Update nav buttons
    document.getElementById('test-prev').disabled = idx === 0;
    const isLast = idx === total - 1;
    document.getElementById('test-next').style.display = isLast ? 'none' : '';
    document.getElementById('test-submit').style.display = isLast ? '' : 'none';

    renderQGrid();

    window.selectTestAnswer = (qi, oi) => {
      testState.answers[qi] = oi;
      document.querySelectorAll('.quiz-option').forEach((b, i) => {
        b.style.borderColor = i === oi ? 'var(--charcoal)' : '';
        b.style.background = i === oi ? 'rgba(44,62,80,0.08)' : '';
      });
      renderQGrid();
    };
  }

  window.testNav = (dir) => {
    const next = testState.current + dir;
    if (next < 0 || next >= testState.test?.questions.length) return;
    showTestQuestion(next);
  };

  window.testFlag = () => {
    const i = testState.current;
    if (testState.flagged.has(i)) testState.flagged.delete(i);
    else testState.flagged.add(i);
    renderQGrid();
    showTestQuestion(i);
  };

  function startTimer(container, test) {
    const timerEl = document.getElementById('test-timer');
    if (!timerEl) return;

    testState.timer = setInterval(() => {
      testState.timeLeft--;
      const m = Math.floor(testState.timeLeft / 60);
      const s = testState.timeLeft % 60;
      if (timerEl) {
        timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        timerEl.classList.toggle('warning', testState.timeLeft < 300);
      }
      if (testState.timeLeft <= 0) {
        clearInterval(testState.timer);
        submitTest();
      }
    }, 1000);
  }

  window.submitTest = () => {
    if (testState.finished) return;
    testState.finished = true;
    if (testState.timer) clearInterval(testState.timer);

    const test = testState.test;
    if (!test) return;

    let correct = 0;
    test.questions.forEach((q, i) => {
      if (testState.answers[i] === q.correct_index) correct++;
    });

    const total = test.questions.length;
    const pct = Math.round((correct / total) * 100);
    let band = 'Below A2';
    if (pct >= 85) band = test.difficulty === 'B1' ? 'B1' : 'B1+';
    else if (pct >= 70) band = 'B1';
    else if (pct >= 55) band = 'A2+';
    else if (pct >= 40) band = 'A2';

    // Save history
    const entry = {
      type: test.type,
      title: test.title,
      date: new Date().toISOString(),
      score: correct,
      total,
      pct,
      band,
    };
    App.state.progress.testHistory = [entry, ...(App.state.progress.testHistory || [])].slice(0, 20);
    App.saveProgress();
    App.logActivity('📝', `Mock test: ${test.title} — ${pct}%`);

    // Show results
    const area = document.getElementById('reading-test-area') || document.getElementById('listening-test-area');
    if (area) showTestResults(area, test, correct, total, pct, band);
  };

  function showTestResults(container, test, correct, total, pct, band) {
    const wrongItems = test.questions.map((q, i) => ({ q, i, userAnswer: testState.answers[i] }))
      .filter(item => item.userAnswer !== item.q.correct_index);

    container.innerHTML = `
      <div class="card test-result-card">
        <div style="font-size:3rem;margin-bottom:8px">${pct >= 75 ? '🎉' : pct >= 55 ? '📈' : '📚'}</div>
        <div class="result-score">${pct}%</div>
        <div class="result-label">${correct} / ${total} correct</div>
        <div class="result-band">${band}</div>

        <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:900;color:var(--tone2)">${correct}</div>
            <div class="text-small text-muted">Correct</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:900;color:var(--tone4)">${total - correct}</div>
            <div class="text-small text-muted">Incorrect</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.5rem;font-weight:900;color:var(--gold)">${total - Object.keys(testState.answers).length}</div>
            <div class="text-small text-muted">Skipped</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px">
          <button class="btn btn-primary" onclick="location.reload()">Take Another Test</button>
          <button class="btn btn-ghost" onclick="navigate('/')">Dashboard</button>
        </div>

        ${wrongItems.length ? `
          <div style="text-align:left;border-top:1px solid var(--border);padding-top:20px">
            <h4 style="margin-bottom:14px;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3)">Answer Review</h4>
            ${wrongItems.map(item => `
              <div style="margin-bottom:16px;padding:14px;background:rgba(192,57,43,0.04);border-left:3px solid var(--red);border-radius:var(--radius-sm)">
                <div style="font-weight:600;margin-bottom:8px">Q${item.i+1}: ${item.q.question}</div>
                ${item.q.passage ? `<div style="font-family:var(--font-zh);font-size:0.95rem;margin-bottom:8px;color:var(--text-2);background:var(--off-white);padding:8px;border-radius:4px">${item.q.passage.slice(0,200)}…</div>` : ''}
                <div style="color:var(--tone4)">Your answer: ${item.userAnswer !== undefined ? String.fromCharCode(65+item.userAnswer)+'. '+item.q.options[item.userAnswer] : '(not answered)'}</div>
                <div style="color:var(--tone2)">Correct: ${String.fromCharCode(65+item.q.correct_index)}. ${item.q.options[item.q.correct_index]}</div>
                ${item.q.explanation ? `<div class="text-small text-muted mt-8">${item.q.explanation}</div>` : ''}
                ${item.q.pinyin_review ? `<div class="text-small mt-8">${Pinyin.colorize(item.q.pinyin_review)}</div>` : ''}
              </div>`).join('')}
          </div>` : `
          <div style="color:var(--tone2);font-weight:600;font-size:1.1rem">🏆 Perfect score! Excellent work!</div>`}
      </div>
    `;
  }

  // ── Listening Test UI ────────────────────────────────────────
  function renderListeningTest(container, test) {
    container.innerHTML = `
      <div class="test-layout">
        <div>
          <div id="test-question-panel" class="test-question-panel"></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-ghost btn-sm" id="test-prev" onclick="testNav(-1)">← Previous</button>
            <button class="btn btn-primary btn-sm" id="test-next" style="margin-left:auto" onclick="testNav(1)">Next →</button>
            <button class="btn btn-gold btn-sm" id="test-submit" onclick="submitListeningTest()" style="display:none">Submit Test</button>
          </div>
        </div>
        <div class="test-sidebar">
          <div class="test-timer" id="test-timer">20:00</div>
          <div class="text-small text-muted text-center mb-8">Time Remaining</div>
          <div class="text-small text-muted mb-8">Questions</div>
          <div class="question-grid" id="q-grid"></div>
          <button class="btn btn-gold w-full" style="margin-top:12px" onclick="submitListeningTest()">Submit</button>
        </div>
      </div>
    `;

    renderQGrid();
    showListeningQuestion(0);
    startTimer(container, test);

    window.submitListeningTest = window.submitTest;
  }

  function showListeningQuestion(idx) {
    testState.current = idx;
    const q = testState.test?.questions[idx];
    if (!q) return;

    const panel = document.getElementById('test-question-panel');
    if (!panel) return;

    const total = testState.test.questions.length;
    const replaysLeft = q._replaysLeft ?? 2;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span class="text-small text-muted">Question ${idx+1} of ${total}</span>
        <span class="badge badge-gray">${q.item_type || 'Listening'}</span>
      </div>

      <div class="listening-player">
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:10px">${q.item_type || 'Listen to the audio'}</div>
        <button class="play-btn-large" id="lq-play" onclick="playListeningItem(${idx})">▶</button>
        <div class="replay-count" id="replay-info">Replays remaining: ${replaysLeft}</div>
      </div>

      <div class="text-small text-muted mb-10" style="font-style:italic">${q.question}</div>

      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <button class="quiz-option"
            onclick="selectTestAnswer(${idx}, ${oi})"
            ${testState.answers[idx] === oi ? 'style="border-color:var(--charcoal);background:rgba(44,62,80,0.08)"' : ''}>
            ${String.fromCharCode(65+oi)}. ${opt}
          </button>`).join('')}
      </div>
    `;

    document.getElementById('test-prev').disabled = idx === 0;
    const isLast = idx === total - 1;
    document.getElementById('test-next').style.display = isLast ? 'none' : '';
    document.getElementById('test-submit').style.display = isLast ? '' : 'none';

    renderQGrid();

    window.selectTestAnswer = (qi, oi) => {
      testState.answers[qi] = oi;
      document.querySelectorAll('.quiz-option').forEach((b, i) => {
        b.style.borderColor = i === oi ? 'var(--charcoal)' : '';
        b.style.background = i === oi ? 'rgba(44,62,80,0.08)' : '';
      });
      renderQGrid();
    };

    window.testNav = (dir) => {
      window.speechSynthesis?.cancel();
      const next = testState.current + dir;
      if (next < 0 || next >= testState.test?.questions.length) return;
      showListeningQuestion(next);
    };
  }

  window.playListeningItem = (idx) => {
    const q = testState.test?.questions[idx];
    if (!q) return;

    if (q._replaysLeft === undefined) q._replaysLeft = 2;
    else if (q._replaysLeft <= 0) return;
    else q._replaysLeft--;

    const info = document.getElementById('replay-info');
    const playBtn = document.getElementById('lq-play');

    if (playBtn) playBtn.disabled = true;

    TTS.speak(q.text_zh || q.audio_text || '');

    const utt = window.speechSynthesis.getVoices(); // trigger load

    setTimeout(() => {
      if (info) info.textContent = `Replays remaining: ${q._replaysLeft}`;
      if (playBtn) {
        playBtn.disabled = q._replaysLeft <= 0;
        playBtn.textContent = q._replaysLeft <= 0 ? '✕' : '🔁';
      }
    }, 1500);
  };

  return { renderReading, renderListening };

})();
