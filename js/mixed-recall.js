/* Mixed Recall Mode */
'use strict';

window.MixedRecallModule = (() => {
  let state = { questions: [], idx: 0, score: 0, answered: false, startedAt: 0 };

  function sample(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  function charLabel(c) {
    return c.traditional || c.hanzi;
  }

  function distractors(chars, correct, field, n = 3) {
    return sample(chars.filter(c => c.hanzi !== correct.hanzi), n).map(c => ({ text: field(c), char: c, correct: false }));
  }

  function makeOptions(chars, correct, field) {
    return sample([{ text: field(correct), char: correct, correct: true }, ...distractors(chars, correct, field)], 4);
  }

  function sentenceFor(c) {
    const ex = c.example_sentence || {};
    return ex.sentence || ex.zh || '';
  }

  function makeCloze(chars, c) {
    const sentence = sentenceFor(c);
    if (!sentence || !sentence.includes(charLabel(c))) return null;
    return {
      type: 'cloze',
      prompt: sentence.replace(charLabel(c), '____'),
      label: 'Fill the missing word',
      correct: c,
      options: makeOptions(chars, c, charLabel),
      area: 'grammar'
    };
  }

  function buildQuestions() {
    const chars = (App.state.characters || []).filter(c => c.hanzi && c.pinyin && c.definition).slice(0, 500);
    const weak = (App.state.progress.weakChars || []).map(h => chars.find(c => c.hanzi === h || c.traditional === h)).filter(Boolean);
    const pool = weak.length >= 5 ? weak.concat(sample(chars, 20)) : chars;
    const picks = sample(pool, 12);
    const qs = [];

    picks.forEach((c, i) => {
      const kind = i % 5;
      if (kind === 0) qs.push({ type: 'audio-hanzi', label: 'Hear audio, choose hanzi', prompt: 'Listen and pick the matching character.', correct: c, options: makeOptions(chars, c, charLabel), area: 'listening' });
      if (kind === 1) qs.push({ type: 'english-hanzi', label: 'See English, choose Chinese', prompt: c.definition, correct: c, options: makeOptions(chars, c, charLabel), area: 'vocabulary' });
      if (kind === 2) qs.push({ type: 'hanzi-pinyin', label: 'See hanzi, choose pinyin', prompt: charLabel(c), correct: c, options: makeOptions(chars, c, x => x.pinyin), area: 'pinyin' });
      if (kind === 3) {
        const cloze = makeCloze(chars, c);
        if (cloze) qs.push(cloze);
        else qs.push({ type: 'tone', label: 'Pick the correct tone', prompt: c.pinyin, correct: c, options: [1,2,3,4].map(t => ({ text: 'Tone ' + t, tone: t, correct: Pinyin.getTone(c.pinyin) === t })), area: 'tone' });
      }
      if (kind === 4) qs.push({ type: 'tone', label: 'Pick the correct tone', prompt: c.pinyin, correct: c, options: [1,2,3,4].map(t => ({ text: 'Tone ' + t, tone: t, correct: Pinyin.getTone(c.pinyin) === t })), area: 'tone' });
    });
    return qs.slice(0, 10);
  }

  function start() {
    state = { questions: buildQuestions(), idx: 0, score: 0, answered: false, startedAt: Date.now() };
  }

  function render(container) {
    if (!state.questions.length) start();
    const q = state.questions[state.idx];
    if (!q) return renderDone(container);
    state.answered = false;
    state.startedAt = Date.now();

    container.innerHTML = `
      <div class="mixed-recall-page">
        <section class="study-plan-hero">
          <div>
            <div class="study-plan-kicker">Mixed Recall Mode</div>
            <h2>Interleaved Practice</h2>
            <p>Audio, meaning, pinyin, cloze, and tone questions mixed together so memory works in real conditions.</p>
          </div>
          <div class="study-plan-meter"><strong>${state.idx + 1}/${state.questions.length}</strong><span>${state.score} correct</span></div>
        </section>
        <section class="mixed-card">
          <div class="study-task-kicker">${q.label}</div>
          <div class="mixed-prompt">${q.prompt}</div>
          ${q.type === 'audio-hanzi' ? `<button class="btn btn-primary" onclick="MixedRecallModule.playCurrent()">Play Audio</button>` : ''}
          <div class="mixed-options">
            ${q.options.map((o, i) => `<button class="mixed-option" data-i="${i}" onclick="MixedRecallModule.answer(${i}, this)">${o.text}</button>`).join('')}
          </div>
          <div id="mixed-feedback" class="quiz-feedback"></div>
        </section>
      </div>`;

    if (q.type === 'audio-hanzi') setTimeout(playCurrent, 350);
  }

  function playCurrent() {
    const q = state.questions[state.idx];
    if (q && q.correct) TTS.speak(charLabel(q.correct));
  }

  function answer(i, btn) {
    if (state.answered) return;
    state.answered = true;
    const q = state.questions[state.idx];
    const option = q.options[i];
    const correct = !!option.correct;
    const elapsed = Date.now() - state.startedAt;
    document.querySelectorAll('.mixed-option').forEach((b, bi) => {
      b.disabled = true;
      if (q.options[bi].correct) b.classList.add('correct');
    });
    if (!correct) btn.classList.add('wrong');
    if (correct) state.score++;
    else if (window.WeaknessEngine) WeaknessEngine.record(q.area, { hanzi: q.correct.hanzi, label: charLabel(q.correct), type: 'mixed-wrong', ms: elapsed });
    if (elapsed > 9000 && window.WeaknessEngine) WeaknessEngine.record('slow', { hanzi: q.correct.hanzi, label: charLabel(q.correct), type: 'mixed-slow', ms: elapsed });
    const fb = document.getElementById('mixed-feedback');
    fb.className = `quiz-feedback ${correct ? 'correct' : 'wrong'} show`;
    fb.innerHTML = `${correct ? 'Correct.' : 'Review this.'} <strong>${charLabel(q.correct)}</strong> ${q.correct.pinyin || ''} - ${q.correct.definition || ''}<br><button class="btn btn-primary btn-sm mt-8" onclick="MixedRecallModule.next()">Next</button>`;
  }

  function next() {
    state.idx++;
    render(document.getElementById('page-content'));
  }

  function renderDone(container) {
    App.logActivity('Mixed Recall', `Completed mixed recall: ${state.score}/${state.questions.length}`);
    container.innerHTML = `<div class="card text-center p-32"><h2>Mixed Recall Complete</h2><p>${state.score}/${state.questions.length} correct</p><div class="flex-center gap-12"><button class="btn btn-primary" onclick="MixedRecallModule.restart()">Practice Again</button><a class="btn btn-ghost" href="#/study-plan">Back to Study Plan</a></div></div>`;
  }

  function restart() {
    start();
    render(document.getElementById('page-content'));
  }

  return { render, answer, next, restart, playCurrent };
})();
