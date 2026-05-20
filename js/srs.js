/* ═══════════════════════════════════════════════════════════════
   srs.js — Spaced Repetition System (SM-2 Algorithm)
   Runs entirely in localStorage — no server needed.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const SRS = (() => {

  const STORE_KEY = 'tocfl_srs_cards';
  const QUALITY = { AGAIN: 0, HARD: 2, GOOD: 4, EASY: 5 };

  // ── Card Schema ──────────────────────────────────────────────
  // {
  //   hanzi: string,
  //   interval: number (days),
  //   repetitions: number,
  //   ef: number (easiness factor, default 2.5),
  //   due: ISO date string,
  //   level: string,
  //   history: [{date, quality}]
  // }

  function loadCards() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveCards(cards) {
    localStorage.setItem(STORE_KEY, JSON.stringify(cards));
  }

  function getCard(hanzi) {
    const cards = loadCards();
    return cards[hanzi] || null;
  }

  function initCard(hanzi, level = 'novice') {
    return {
      hanzi,
      level,
      interval: 0,
      repetitions: 0,
      ef: 2.5,
      due: new Date().toISOString(),
      history: [],
      new: true,
    };
  }

  // ── SM-2 Algorithm ───────────────────────────────────────────
  // quality: 0=Again, 1=Hard, 2=Good, 3=Easy (mapped to 0,2,4,5 internally)
  function review(hanzi, qualityLabel, level = 'novice') {
    const cards = loadCards();
    let card = cards[hanzi] || initCard(hanzi, level);

    const q = { AGAIN: 0, HARD: 2, GOOD: 4, EASY: 5 }[qualityLabel] ?? 4;

    // SM-2 core
    if (q >= 3) {
      if (card.repetitions === 0) card.interval = 1;
      else if (card.repetitions === 1) card.interval = 6;
      else card.interval = Math.round(card.interval * card.ef);
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    // Update easiness factor
    card.ef = Math.max(1.3, card.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Cap interval at 365 days
    card.interval = Math.min(365, card.interval);

    // Set next due date
    const due = new Date();
    due.setDate(due.getDate() + card.interval);
    card.due = due.toISOString();
    card.new = false;
    card.level = level;

    // Record history
    card.history = card.history || [];
    card.history.push({ date: new Date().toISOString(), quality: qualityLabel, interval: card.interval });
    if (card.history.length > 50) card.history = card.history.slice(-50);

    cards[hanzi] = card;
    saveCards(cards);
    return card;
  }

  // ── Queue Management ─────────────────────────────────────────
  function getDueCards(allChars, maxNew = 10, maxReview = 20) {
    const cards = loadCards();
    const now = new Date();

    const due = [];
    const newCards = [];

    allChars.forEach(char => {
      const card = cards[char.hanzi];
      if (!card) {
        newCards.push({ ...char, srs: null, isNew: true });
      } else {
        const dueDate = new Date(card.due);
        if (dueDate <= now) {
          due.push({ ...char, srs: card, isNew: false });
        }
      }
    });

    // Sort due cards by most overdue first
    due.sort((a, b) => new Date(a.srs.due) - new Date(b.srs.due));

    // Shuffle new cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    return {
      due: due.slice(0, maxReview),
      new: newCards.slice(0, maxNew),
      dueCount: due.length,
      newCount: newCards.length,
    };
  }

  function getStats() {
    const cards = loadCards();
    const now = new Date();
    const allCards = Object.values(cards);

    return {
      total: allCards.length,
      due_today: allCards.filter(c => new Date(c.due) <= now).length,
      learned: allCards.filter(c => c.repetitions > 0).length,
      mature: allCards.filter(c => c.interval >= 21).length,
      new_seen: allCards.filter(c => !c.new).length,
      average_interval: allCards.length
        ? Math.round(allCards.reduce((s, c) => s + (c.interval || 0), 0) / allCards.length)
        : 0,
    };
  }

  function resetCard(hanzi) {
    const cards = loadCards();
    delete cards[hanzi];
    saveCards(cards);
  }

  function resetAll() {
    localStorage.removeItem(STORE_KEY);
  }

  // ── SRS Study Session UI ─────────────────────────────────────
  async function renderSRSSession(container, levelFilter = null) {
    let pool = App.state.characters;
    if (levelFilter) pool = pool.filter(c => c.level === levelFilter);
    if (!pool.length) {
      container.innerHTML = `<div class="empty-state"><div class="es-icon">📚</div><h3>No characters loaded</h3><p>Character data is loading…</p></div>`;
      return;
    }

    const { due, new: newCards, dueCount, newCount } = getDueCards(pool, 10, 20);
    const sessionCards = [...due, ...newCards];

    if (!sessionCards.length) {
      renderSRSComplete(container, pool);
      return;
    }

    let sessionIdx = 0;
    let sessionCorrect = 0;
    let sessionTotal = 0;
    const againQueue = [];

    function showNext() {
      // First work through again-queue
      const card = againQueue.length > 0 ? againQueue.shift() : sessionCards[sessionIdx++];
      if (!card && !againQueue.length) { renderSRSComplete(container, pool); return; }
      if (!card) { renderSRSComplete(container, pool); return; }
      renderSRSCard(container, card, handleAnswer, { sessionIdx: Math.min(sessionIdx, sessionCards.length), total: sessionCards.length, correct: sessionCorrect });
    }

    function handleAnswer(card, quality) {
      sessionTotal++;
      if (quality !== 'AGAIN') sessionCorrect++;

      const level = card.level || levelFilter || 'novice';
      review(card.hanzi, quality, level);

      if (quality === 'AGAIN') againQueue.push(card);

      // Update app progress
      if (quality === 'GOOD' || quality === 'EASY') {
        App.markLearned(card.hanzi);
        App.unmarkWeak(card.hanzi);
      } else if (quality === 'AGAIN') {
        App.markWeak(card.hanzi);
      }

      showNext();
    }

    showNext();
  }

  function renderSRSCard(container, char, onAnswer, session) {
    const isNew = char.isNew;
    const srs = char.srs;
    const pct = session.total > 0 ? Math.round((session.sessionIdx / session.total) * 100) : 0;

    container.innerHTML = `
      <div class="srs-session">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div class="progress-bar" style="flex:1">
            <div class="progress-fill" style="width:${pct}%;transition:width 0.4s"></div>
          </div>
          <span class="text-small text-muted">${session.sessionIdx}/${session.total}</span>
          ${isNew ? '<span class="badge badge-a2">New</span>' : `<span class="badge badge-gray">Due in ${srs ? Math.max(0, Math.round((new Date(srs.due) - Date.now()) / 86400000)) : 0}d</span>`}
        </div>

        <!-- Card front -->
        <div id="srs-front" class="card" style="text-align:center;padding:48px 28px;margin-bottom:16px;min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;cursor:pointer" onclick="revealSRSBack()">
          <div style="font-family:var(--font-zh);font-size:6rem;font-weight:900;line-height:1">${char.traditional || char.hanzi}</div>
          ${isNew ? '<div class="badge badge-a2" style="margin-top:8px">New character</div>' : ''}
          <div class="text-muted text-small" style="margin-top:8px">Tap to reveal</div>
        </div>

        <!-- Card back (hidden) -->
        <div id="srs-back" class="card hidden" style="padding:28px;margin-bottom:16px">
          <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
            <div style="font-family:var(--font-zh);font-size:3.5rem;font-weight:900;margin-bottom:8px">${char.traditional || char.hanzi}</div>
            <div style="font-size:1.5rem;font-weight:600;color:var(--tone${Pinyin.getTone(char.pinyin)||1})">${char.pinyin || ''}</div>
            <div style="font-size:1rem;color:var(--text-2);margin-top:4px">${char.definition || ''}</div>
          </div>

          ${char.mnemonic ? `
          <div style="background:rgba(243,156,18,0.08);border-left:3px solid var(--gold);padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:14px;font-size:0.85rem;color:var(--text-2)">
            💡 ${char.mnemonic}
          </div>` : ''}

          ${char.example_sentence ? `
          <div class="sentence-block" style="margin-bottom:14px">
            <div class="sb-zh">${char.example_sentence.sentence}</div>
            <div class="sb-py">${char.example_sentence.pinyin || ''}</div>
            <div class="sb-en">${char.example_sentence.english || ''}</div>
          </div>` : ''}

          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" onclick="TTS.speak('${char.traditional || char.hanzi}')">🔊 Hear</button>
          </div>

          <!-- Rating buttons -->
          <div style="margin-top:20px">
            <div class="text-small text-muted mb-8 text-center">How well did you remember it?</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
              <button class="btn" style="flex-direction:column;gap:3px;background:rgba(192,57,43,0.1);color:var(--red);border:1.5px solid rgba(192,57,43,0.3);padding:10px 6px" onclick="srsAnswer('AGAIN')">
                <span style="font-size:1.2rem">😓</span>
                <span style="font-size:0.72rem;font-weight:700">Again</span>
                <span style="font-size:0.62rem;opacity:0.7">&lt;1 day</span>
              </button>
              <button class="btn" style="flex-direction:column;gap:3px;background:rgba(231,76,60,0.08);color:#e74c3c;border:1.5px solid rgba(231,76,60,0.3);padding:10px 6px" onclick="srsAnswer('HARD')">
                <span style="font-size:1.2rem">😬</span>
                <span style="font-size:0.72rem;font-weight:700">Hard</span>
                <span style="font-size:0.62rem;opacity:0.7">1 day</span>
              </button>
              <button class="btn" style="flex-direction:column;gap:3px;background:rgba(39,174,96,0.08);color:#27ae60;border:1.5px solid rgba(39,174,96,0.3);padding:10px 6px" onclick="srsAnswer('GOOD')">
                <span style="font-size:1.2rem">😊</span>
                <span style="font-size:0.72rem;font-weight:700">Good</span>
                <span style="font-size:0.62rem;opacity:0.7">${srs ? Math.max(1, Math.round((srs.interval||1)*2.5)) : 3}d</span>
              </button>
              <button class="btn" style="flex-direction:column;gap:3px;background:rgba(41,128,185,0.08);color:#2980b9;border:1.5px solid rgba(41,128,185,0.3);padding:10px 6px" onclick="srsAnswer('EASY')">
                <span style="font-size:1.2rem">🎯</span>
                <span style="font-size:0.72rem;font-weight:700">Easy</span>
                <span style="font-size:0.62rem;opacity:0.7">${srs ? Math.max(4, srs.interval*3) : 7}d</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    window.revealSRSBack = () => {
      document.getElementById('srs-front').classList.add('hidden');
      document.getElementById('srs-back').classList.remove('hidden');
      TTS.speak(char.traditional || char.hanzi);
    };

    window.srsAnswer = (quality) => onAnswer(char, quality);
  }

  function renderSRSComplete(container, pool) {
    const stats = getStats();
    const tomorrow = getDueCards(pool, 10, 20);

    container.innerHTML = `
      <div class="card text-center" style="padding:40px">
        <div style="font-size:3rem;margin-bottom:12px">🎉</div>
        <h3 style="font-size:1.4rem;margin-bottom:6px">All caught up!</h3>
        <p class="text-muted mb-20">You've reviewed all due cards for now.</p>

        <div style="display:flex;gap:20px;justify-content:center;margin-bottom:24px;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="font-size:1.8rem;font-weight:900;color:var(--red)">${stats.due_today}</div>
            <div class="text-small text-muted">Due today</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.8rem;font-weight:900;color:var(--tone2)">${stats.learned}</div>
            <div class="text-small text-muted">Cards learned</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.8rem;font-weight:900;color:var(--gold)">${stats.mature}</div>
            <div class="text-small text-muted">Mature (21+ days)</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1.8rem;font-weight:900;color:var(--tone1)">${stats.average_interval}d</div>
            <div class="text-small text-muted">Avg interval</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="navigate('/')">Back to Dashboard</button>
          <button class="btn btn-outline" onclick="navigate('#/flashcards')">Flashcards</button>
        </div>
      </div>
    `;
  }

  return { review, getDueCards, getStats, resetCard, resetAll, renderSRSSession, QUALITY };

})();
