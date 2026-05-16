/* ═══════════════════════════════════════════════════════════════
   tone-game.js — Interactive Mandarin Tone Training Game
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const ToneGame = (() => {

  const TONES = [
    { num: 1, name: 'First Tone (High Level)', symbol: 'ā', desc: 'Flat, high pitch like a robot.' },
    { num: 2, name: 'Second Tone (Rising)', symbol: 'á', desc: 'Starts mid, rises high like a question.' },
    { num: 3, name: 'Third Tone (Falling-Rising)', symbol: 'ǎ', desc: 'Starts mid, dips low, then rises.' },
    { num: 4, name: 'Fourth Tone (Falling)', symbol: 'à', desc: 'Starts high, drops sharply like a command.' }
  ];

  const GAME_DATA = [
    { syllable: 'mā', tone: 1, char: '媽' }, { syllable: 'má', tone: 2, char: '麻' }, { syllable: 'mǎ', tone: 3, char: '馬' }, { syllable: 'mà', tone: 4, char: '罵' },
    { syllable: 'bā', tone: 1, char: '八' }, { syllable: 'bá', tone: 2, char: '拔' }, { syllable: 'bǎ', tone: 3, char: '把' }, { syllable: 'bà', tone: 4, char: '爸' },
    { syllable: 'tāng', tone: 1, char: '湯' }, { syllable: 'táng', tone: 2, char: '糖' }, { syllable: 'tǎng', tone: 3, char: '躺' }, { syllable: 'tàng', tone: 4, char: '燙' },
    { syllable: 'shū', tone: 1, char: '書' }, { syllable: 'shú', tone: 2, char: '熟' }, { syllable: 'shǔ', tone: 3, char: '數' }, { syllable: 'shù', tone: 4, char: '樹' }
  ];

  let currentState = {
    score: 0,
    total: 0,
    currentTarget: null
  };

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Tone Training Game</h2>
        <p>Train your ear to distinguish the four Mandarin tones.</p>
      </div>

      <div class="tone-game-container">
        <div class="tone-guide-grid mb-32">
          ${TONES.map(t => `
            <div class="tone-guide-card tone${t.num}">
              <div class="tg-num">${t.num}</div>
              <div class="tg-sym">${t.symbol}</div>
              <div class="tg-name">${t.name}</div>
            </div>
          `).join('')}
        </div>

        <div class="card p-32 text-center shadow-lg" style="background:var(--off-white); border:2px solid var(--border)">
          <div class="tone-score mb-16">Score: <strong>${currentState.score} / ${currentState.total}</strong></div>
          <h3 class="mb-24">Listen and Identify the Tone</h3>
          
          <button class="btn btn-gold btn-lg pulse-animation" id="tone-play-btn" onclick="ToneGame.playTarget()">
            🔊 Play Sound
          </button>

          <div class="tone-options-grid mt-32">
            ${[1, 2, 3, 4].map(num => `
              <button class="btn btn-outline tone-btn tone${num}" onclick="ToneGame.guess(${num}, this)">
                Tone ${num}
              </button>
            `).join('')}
          </div>

          <div id="tone-feedback" class="quiz-feedback mt-24"></div>
          
          <button class="btn btn-primary mt-24 hidden" id="tone-next-btn" onclick="ToneGame.nextRound()">
            Next Round →
          </button>
        </div>
      </div>
    `;
    nextRound();
  }

  function nextRound() {
    currentState.currentTarget = GAME_DATA[Math.floor(Math.random() * GAME_DATA.length)];
    document.getElementById('tone-next-btn').classList.add('hidden');
    document.getElementById('tone-feedback').classList.remove('show');
    document.querySelectorAll('.tone-btn').forEach(b => {
      b.classList.remove('btn-success', 'btn-error');
      b.classList.add('btn-outline');
      b.disabled = false;
    });
    setTimeout(() => playTarget(), 500);
  }

  function playTarget() {
    if (currentState.currentTarget) {
      TTS.speak(currentState.currentTarget.syllable);
    }
  }

  function guess(num, btn) {
    currentState.total++;
    const isCorrect = num === currentState.currentTarget.tone;
    const feedback = document.getElementById('tone-feedback');

    if (isCorrect) {
      currentState.score++;
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-success');
      feedback.className = 'quiz-feedback correct show';
      feedback.innerHTML = `✓ Correct! 「${currentState.currentTarget.char}」 is <strong>Tone ${num}</strong> (${currentState.currentTarget.syllable})`;
      App.logActivity('🎵', `Mastered tone ${num} for ${currentState.currentTarget.syllable}`);
    } else {
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-error');
      feedback.className = 'quiz-feedback wrong show';
      feedback.innerHTML = `✗ Incorrect. Try listening again.`;
    }

    document.querySelectorAll('.tone-btn').forEach(b => b.disabled = true);
    document.getElementById('tone-next-btn').classList.remove('hidden');
    updateScore();
  }

  function updateScore() {
    const scoreEl = document.querySelector('.tone-score');
    if (scoreEl) scoreEl.innerHTML = `Score: <strong>${currentState.score} / ${currentState.total}</strong>`;
  }

  return { render, playTarget, guess, nextRound };

})();
