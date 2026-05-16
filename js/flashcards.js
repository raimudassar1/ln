/* ═══════════════════════════════════════════════════════════════
   flashcards.js — Flashcard Study Module
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.FlashcardsModule = (() => {

  let deck = [];
  let currentIndex = 0;
  let sessionKnow = 0;
  let sessionReview = 0;
  let sessionStart = 0;
  let isFlipped = false;
  let studyMode = 'all';
  let studyLevel = 'all';
  let studyCategory = '';

  function buildDeck() {
    const chars = App.state.characters;
    if (!chars.length) return [];

    let pool = [...chars];

    if (studyLevel !== 'all') pool = pool.filter(c => c.level === studyLevel);

    if (studyCategory) pool = pool.filter(c => c.category === studyCategory);

    if (studyMode === 'saved') pool = pool.filter(c => App.state.progress.savedSet.includes(c.hanzi));
    else if (studyMode === 'weak') pool = pool.filter(c => App.state.progress.weakChars.includes(c.hanzi));
    else if (studyMode === 'unlearned') pool = pool.filter(c => !App.state.progress.learnedChars.includes(c.hanzi));

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool;
  }

  function getCategories() {
    const chars = App.state.characters;
    return [...new Set(chars.map(c => c.category).filter(Boolean))].sort();
  }

  async function render(container) {
    const categories = getCategories();

    container.innerHTML = `
      <div class="page-header">
        <h2>Flashcards</h2>
        <p>Study characters with spaced repetition. Use keyboard shortcuts for quick review.</p>
      </div>

      <!-- Controls -->
      <div class="card mb-20" id="fc-controls">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div>
            <label class="text-small text-muted" style="display:block;margin-bottom:4px">Study Set</label>
            <select class="input" id="fc-mode" style="width:auto">
              <option value="all">All Characters</option>
              <option value="unlearned">Not Yet Learned</option>
              <option value="saved">My Saved Set</option>
              <option value="weak">Weak Characters</option>
            </select>
          </div>
          <div>
            <label class="text-small text-muted" style="display:block;margin-bottom:4px">Level</label>
            <select class="input" id="fc-level" style="width:auto">
              <option value="all">All Levels</option>
              <option value="novice">Novice</option>
              <option value="a1">A1</option>
              <option value="a2">A2</option>
              <option value="b1">B1</option>
            </select>
          </div>
          <div>
            <label class="text-small text-muted" style="display:block;margin-bottom:4px">Category</label>
            <select class="input" id="fc-category" style="width:auto">
              <option value="">All Categories</option>
              ${categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="fc-start-btn">Start Session</button>
        </div>
      </div>

      <!-- Flashcard area -->
      <div class="flashcard-container" id="fc-area" style="display:none">
        <!-- Session info -->
        <div class="flashcard-session-info" id="fc-session-info">
          <span>Card <strong id="fc-current">1</strong> / <strong id="fc-total">0</strong></span>
          <span>✓ <strong id="fc-know-count" style="color:var(--tone2)">0</strong> known</span>
          <span>✗ <strong id="fc-review-count" style="color:var(--tone4)">0</strong> to review</span>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar flashcard-progress-bar">
          <div class="progress-fill" id="fc-progress" style="width:0%"></div>
        </div>

        <!-- The card -->
        <div class="flashcard-scene" id="fc-scene" role="button" tabindex="0" aria-label="Flashcard — click or press Space to flip">
          <div class="flashcard" id="fc-card">
            <!-- Front -->
            <div class="card-face card-front">
              <button class="fc-tts-btn" id="fc-tts-front" title="Pronounce" aria-label="Pronounce">🔊</button>
              <div class="fc-hanzi" id="fc-hanzi">？</div>
              <div class="fc-hint">Click card or press <kbd>Space</kbd> to reveal</div>
            </div>
            <!-- Back -->
            <div class="card-face card-back">
              <button class="fc-tts-btn" id="fc-tts-back" title="Pronounce" aria-label="Pronounce">🔊</button>
              <div class="pinyin-lg tone-colors" id="fc-pinyin" style="color:var(--gold)"></div>
              <div id="fc-zhuyin" style="font-family:var(--font-zh);font-size:1rem;color:rgba(255,255,255,0.5);margin-bottom:8px"></div>
              <div class="fc-def" id="fc-def"></div>
              <div id="fc-example-word" class="fc-example"></div>
              <div id="fc-example-py" class="fc-example-py"></div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flashcard-controls">
          <button class="btn fc-btn-review" id="fc-btn-review" title="Press R" style="display:none">✗ Review Again <kbd style="font-size:0.65rem;opacity:0.7">R</kbd></button>
          <button class="btn fc-btn-know" id="fc-btn-know" title="Press K" style="display:none">✓ Know It <kbd style="font-size:0.65rem;opacity:0.7">K</kbd></button>
          <button class="btn fc-btn-skip" id="fc-btn-skip">Skip →</button>
        </div>

        <!-- Keyboard hints -->
        <div class="kbd-hint">
          <kbd>Space</kbd> flip &nbsp;
          <kbd>K</kbd> know it &nbsp;
          <kbd>R</kbd> review &nbsp;
          <kbd>→</kbd> next &nbsp;
          <kbd>←</kbd> prev
        </div>
      </div>

      <!-- Session complete -->
      <div class="card text-center" id="fc-complete" style="display:none;padding:40px">
        <div style="font-size:3rem;margin-bottom:12px">🎉</div>
        <h3 style="font-size:1.4rem;margin-bottom:6px">Session Complete!</h3>
        <div style="display:flex;gap:24px;justify-content:center;margin:20px 0">
          <div><div style="font-size:2rem;font-weight:900;color:var(--tone2)" id="final-know">0</div><div class="text-small text-muted">Known</div></div>
          <div><div style="font-size:2rem;font-weight:900;color:var(--tone4)" id="final-review">0</div><div class="text-small text-muted">To Review</div></div>
          <div><div style="font-size:2rem;font-weight:900;color:var(--gold)" id="final-time">0s</div><div class="text-small text-muted">Time</div></div>
        </div>
        <div id="final-pct" style="font-size:1.1rem;margin-bottom:20px;color:var(--text-2)"></div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" id="fc-restart-btn">Study Again</button>
          <button class="btn btn-outline" id="fc-weak-btn" style="display:none">Study Weak Cards</button>
          <button class="btn btn-ghost" onclick="navigate('/')">Back to Dashboard</button>
        </div>
      </div>
    `;

    // Wire controls
    document.getElementById('fc-start-btn')?.addEventListener('click', startSession);

    setupKeyboard();
  }

  function startSession() {
    studyMode = document.getElementById('fc-mode')?.value || 'all';
    studyLevel = document.getElementById('fc-level')?.value || 'all';
    studyCategory = document.getElementById('fc-category')?.value || '';

    deck = buildDeck();

    if (!deck.length) {
      alert('No characters match your selection. Try different filters.');
      return;
    }

    currentIndex = 0;
    sessionKnow = 0;
    sessionReview = 0;
    sessionStart = Date.now();
    isFlipped = false;

    document.getElementById('fc-controls').style.display = 'none';
    document.getElementById('fc-area').style.display = 'flex';
    document.getElementById('fc-complete').style.display = 'none';
    document.getElementById('fc-total').textContent = deck.length;

    showCard(0);
  }

  function showCard(idx) {
    if (idx >= deck.length) { endSession(); return; }

    const char = deck[idx];
    isFlipped = false;

    // Reset flip
    const card = document.getElementById('fc-card');
    card.classList.remove('flipped');

    // Front
    document.getElementById('fc-hanzi').textContent = char.traditional || char.hanzi;

    // Back
    const tone = Pinyin.getTone(char.pinyin);
    const pinyinEl = document.getElementById('fc-pinyin');
    pinyinEl.innerHTML = Pinyin.colorize(char.pinyin || '');
    pinyinEl.style.color = '';
    pinyinEl.className = 'pinyin-lg tone-colors';

    document.getElementById('fc-zhuyin').textContent = char.zhuyin || '';
    document.getElementById('fc-def').textContent = char.definition || '';

    // Example word
    const ew = char.example_words?.[0];
    if (ew) {
      document.getElementById('fc-example-word').textContent = ew.word || '';
      document.getElementById('fc-example-py').textContent = ew.pinyin ? `${ew.pinyin} — ${ew.definition || ''}` : '';
    } else {
      document.getElementById('fc-example-word').textContent = '';
      document.getElementById('fc-example-py').textContent = '';
    }

    // Update counters
    document.getElementById('fc-current').textContent = idx + 1;
    document.getElementById('fc-know-count').textContent = sessionKnow;
    document.getElementById('fc-review-count').textContent = sessionReview;

    // Progress
    document.getElementById('fc-progress').style.width = `${(idx / deck.length) * 100}%`;

    // Hide action buttons until flipped
    document.getElementById('fc-btn-review').style.display = 'none';
    document.getElementById('fc-btn-know').style.display = 'none';
    document.getElementById('fc-btn-skip').style.display = 'block';

    // Wire card click
    const scene = document.getElementById('fc-scene');
    scene.onclick = flipCard;

    // TTS buttons
    document.getElementById('fc-tts-front').onclick = (e) => {
      e.stopPropagation();
      TTS.speak(char.traditional || char.hanzi);
    };
    document.getElementById('fc-tts-back').onclick = (e) => {
      e.stopPropagation();
      TTS.speak(char.traditional || char.hanzi);
    };

    // Nav buttons
    document.getElementById('fc-btn-skip').onclick = () => {
      currentIndex++;
      showCard(currentIndex);
    };
    document.getElementById('fc-btn-know').onclick = () => handleAnswer(true);
    document.getElementById('fc-btn-review').onclick = () => handleAnswer(false);
  }

  function flipCard() {
    if (isFlipped) return;
    isFlipped = true;
    document.getElementById('fc-card').classList.add('flipped');
    document.getElementById('fc-btn-review').style.display = 'flex';
    document.getElementById('fc-btn-know').style.display = 'flex';
    document.getElementById('fc-btn-skip').style.display = 'none';

    // Auto-pronounce on flip
    const char = deck[currentIndex];
    if (char) {
      setTimeout(() => TTS.speak(char.traditional || char.hanzi), 300);
    }
  }

  function handleAnswer(knew) {
    const char = deck[currentIndex];
    if (!char) return;

    if (knew) {
      sessionKnow++;
      App.markLearned(char.hanzi);
      App.unmarkWeak(char.hanzi);
    } else {
      sessionReview++;
      App.markWeak(char.hanzi);
    }

    App.state.progress.dailyReviewed = (App.state.progress.dailyReviewed || 0) + 1;
    App.state.progress.lastStudyDate = new Date().toDateString();
    App.saveProgress();

    currentIndex++;
    showCard(currentIndex);
  }

  function endSession() {
    document.getElementById('fc-area').style.display = 'none';
    document.getElementById('fc-complete').style.display = 'block';

    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const total = sessionKnow + sessionReview;
    const pct = total > 0 ? Math.round((sessionKnow / total) * 100) : 0;

    document.getElementById('final-know').textContent = sessionKnow;
    document.getElementById('final-review').textContent = sessionReview;
    document.getElementById('final-time').textContent = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed/60)}m ${elapsed%60}s`;
    document.getElementById('final-pct').textContent = `${pct}% accuracy — ${total} cards reviewed`;

    const weakBtn = document.getElementById('fc-weak-btn');
    if (sessionReview > 0) {
      weakBtn.style.display = 'inline-flex';
      weakBtn.onclick = () => {
        studyMode = 'weak';
        document.getElementById('fc-mode').value = 'weak';
        document.getElementById('fc-complete').style.display = 'none';
        document.getElementById('fc-controls').style.display = 'flex';
      };
    }

    document.getElementById('fc-restart-btn').onclick = () => {
      document.getElementById('fc-complete').style.display = 'none';
      document.getElementById('fc-controls').style.display = 'block';
    };

    App.logActivity('🃏', `Flashcards: ${sessionKnow} known, ${sessionReview} to review`);
  }

  function setupKeyboard() {
    document.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    // Only when flashcard area is visible
    const area = document.getElementById('fc-area');
    if (!area || area.style.display === 'none') return;

    // Don't capture if typing in input
    if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (!isFlipped) flipCard();
        break;
      case 'ArrowRight':
        e.preventDefault();
        currentIndex++;
        showCard(currentIndex);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) { currentIndex--; showCard(currentIndex); }
        break;
      case 'k': case 'K':
        if (isFlipped) handleAnswer(true);
        break;
      case 'r': case 'R':
        if (isFlipped) handleAnswer(false);
        break;
    }
  }

  // Clean up keyboard listener when leaving page
  window.addEventListener('hashchange', () => {
    document.removeEventListener('keydown', handleKey);
  });

  return { render };

})();
