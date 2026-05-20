/* Daily Smart Study Plan */
'use strict';

window.StudyPlanModule = (() => {
  const STORE_VERSION = 1;
  const TASKS = [
    { id: 'srs', label: 'Review memory cards', minutes: 6, skill: 'Memory' },
    { id: 'weak', label: 'Repair weak words', minutes: 5, skill: 'Accuracy' },
    { id: 'tone', label: 'Tune your ear', minutes: 4, skill: 'Listening' },
    { id: 'dialogue', label: 'Speak a useful dialogue', minutes: 6, skill: 'Speaking' },
    { id: 'quiz', label: 'Finish with recall', minutes: 4, skill: 'Recall' },
  ];

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function ensureProgress() {
    const p = App.state.progress;
    if (!p.studyPlan || p.studyPlan.version !== STORE_VERSION || p.studyPlan.date !== todayKey()) {
      p.studyPlan = { version: STORE_VERSION, date: todayKey(), completed: [], startedAt: null, finishedAt: null };
      App.saveProgress();
    }
    return p.studyPlan;
  }

  function done(id) {
    return ensureProgress().completed.includes(id);
  }

  function markDone(id) {
    const plan = ensureProgress();
    if (!plan.completed.includes(id)) plan.completed.push(id);
    if (!plan.startedAt) plan.startedAt = new Date().toISOString();
    if (plan.completed.length >= TASKS.length && !plan.finishedAt) {
      plan.finishedAt = new Date().toISOString();
      App.logActivity('Study', 'Completed the Daily Smart Study Plan');
    }
    App.saveProgress();
    render(document.getElementById('page-content'));
  }

  function findChar(hanzi) {
    return (App.state.characters || []).find(c => c.hanzi === hanzi || c.traditional === hanzi);
  }

  function getWeakItems(limit = 5) {
    const weak = App.state.progress.weakChars || [];
    const mapped = weak.map(findChar).filter(Boolean);
    if (mapped.length) return mapped.slice(0, limit);
    const learned = App.state.progress.learnedChars || [];
    return learned.map(findChar).filter(Boolean).slice(0, limit);
  }

  function getNewItems(limit = 5) {
    const learned = new Set(App.state.progress.learnedChars || []);
    return (App.state.characters || []).filter(c => !learned.has(c.hanzi)).slice(0, limit);
  }

  function getSrsSummary() {
    const chars = App.state.characters || [];
    if (typeof SRS === 'undefined' || !chars.length) return { due: [], newCards: [], dueCount: 0, newCount: 0 };
    const q = SRS.getDueCards(chars, 5, 12);
    return { due: q.due || [], newCards: q.new || [], dueCount: q.dueCount || 0, newCount: q.newCount || 0 };
  }

  async function buildPlanData() {
    const srs = getSrsSummary();
    const weak = getWeakItems(5);
    const newItems = getNewItems(5);
    let dialogues = [];
    let scenarios = [];
    try { dialogues = await API.get('/dialogues'); } catch (_) { dialogues = []; }
    try { scenarios = await API.get('scenarios_content'); } catch (_) { scenarios = []; }
    const day = Math.floor(Date.now() / 86400000);
    const dialogue = dialogues.length ? dialogues[day % dialogues.length] : null;
    const module = scenarios.length ? scenarios[day % scenarios.length] : null;
    return { srs, weak, newItems, dialogue, module };
  }

  function pctComplete() {
    return Math.round((ensureProgress().completed.length / TASKS.length) * 100);
  }

  function taskCard(task, body, action) {
    const checked = done(task.id);
    return `
      <article class="study-task ${checked ? 'complete' : ''}">
        <div class="study-task-check">${checked ? (window.IconSystem ? window.IconSystem.svg('check') : 'Done') : ''}</div>
        <div class="study-task-main">
          <div class="study-task-kicker">${task.skill} - ${task.minutes} min</div>
          <h3>${task.label}</h3>
          ${body}
          <div class="study-task-actions">${action}</div>
        </div>
      </article>`;
  }

  function renderWeakList(items) {
    if (!items.length) return '<p class="text-muted">No weak words yet. Use this slot for new characters today.</p>';
    return `<div class="study-chip-list">${items.map(c => `
      <button class="study-word-chip" onclick="TTS.speak('${(c.traditional || c.hanzi).replace(/'/g, "\\'")}')">
        <span class="study-chip-zh">${c.traditional || c.hanzi}</span>
        <span>${c.pinyin || ''}</span>
        <small>${c.definition || ''}</small>
      </button>`).join('')}</div>`;
  }

  function renderSrsSession() {
    const host = document.getElementById('study-plan-active');
    if (!host) return;
    host.classList.remove('hidden');
    host.innerHTML = '<div class="study-active-head"><h3>SRS Review</h3><button class="btn btn-ghost btn-sm" onclick="StudyPlanModule.closeActive()">Close</button></div><div id="study-srs-host"></div>';
    SRS.renderSRSSession(document.getElementById('study-srs-host'));
  }

  function closeActive() {
    const host = document.getElementById('study-plan-active');
    if (host) host.classList.add('hidden');
  }

  async function render(container) {
    ensureProgress();
    container.innerHTML = '<div class="spinner"></div>';
    const data = await buildPlanData();
    const p = pctComplete();
    const dueText = data.srs.dueCount > 0
      ? `${data.srs.dueCount} due cards are waiting. Start here before learning anything new.`
      : 'No due cards right now. Add a small new-card review to keep momentum.';
    const weakItems = data.weak.length ? data.weak : data.newItems;
    const dialogueTitle = data.dialogue ? data.dialogue.title : 'Dialogue Practice';
    const scenarioTitle = data.module ? data.module.title : 'Everyday Scenarios';

    container.innerHTML = `
      <div class="study-plan-page">
        <section class="study-plan-hero">
          <div>
            <div class="study-plan-kicker">Daily Smart Study Plan</div>
            <h2>Study Today</h2>
            <p>A focused session that combines review, weak spots, listening, speaking, and recall so you do not waste energy choosing what to do next.</p>
          </div>
          <div class="study-plan-meter">
            <strong>${p}%</strong>
            <span>${ensureProgress().completed.length}/${TASKS.length} tasks done</span>
          </div>
        </section>

        <div class="study-progress-bar"><div style="width:${p}%"></div></div>
        <div class="study-plan-weakness-slot">${window.WeaknessEngine ? WeaknessEngine.renderSummaryCard() : ''}</div>
        <div id="study-plan-active" class="study-plan-active hidden"></div>

        <section class="study-task-list">
          ${taskCard(TASKS[0], `<p>${dueText}</p>`, `
            <button class="btn btn-primary btn-sm" onclick="StudyPlanModule.renderSrsSession()">Start Review</button>
            <button class="btn btn-ghost btn-sm" onclick="StudyPlanModule.markDone('srs')">Mark Done</button>`)}

          ${taskCard(TASKS[1], `${renderWeakList(weakItems)}<p class="text-small text-muted">Say each item aloud, then tap it to hear the pronunciation.</p>`, `
            <button class="btn btn-primary btn-sm" onclick="StudyPlanModule.markDone('weak')">Finished Weak Review</button>`)}

          ${taskCard(TASKS[2], '<p>Do one short tone or pronunciation drill before moving into meaning. This keeps listening sharp.</p>', `
            <a class="btn btn-primary btn-sm" href="#/quiz/tones">Tone Drill</a>
            <a class="btn btn-ghost btn-sm" href="#/onboarding">Pinyin Trainer</a>
            <button class="btn btn-ghost btn-sm" onclick="StudyPlanModule.markDone('tone')">Mark Done</button>`)}

          ${taskCard(TASKS[3], `<p>Today's speaking target: <strong>${dialogueTitle}</strong>. If you want more context, use <strong>${scenarioTitle}</strong>.</p>`, `
            <a class="btn btn-primary btn-sm" href="#/dialogue">Open Dialogue</a>
            <a class="btn btn-ghost btn-sm" href="#/scenarios">Scenarios</a>
            <a class="btn btn-ghost btn-sm" href="#/sentence-builder">Sentence Builder</a>
            <button class="btn btn-ghost btn-sm" onclick="StudyPlanModule.markDone('dialogue')">Mark Done</button>`)}

          ${taskCard(TASKS[4], '<p>End with active recall. A short quiz after review tells the app what to strengthen next.</p>', `
            <a class="btn btn-primary btn-sm" href="#/mixed-recall">Mixed Recall</a>
            <a class="btn btn-ghost btn-sm" href="#/quiz/vocabulary">Vocabulary Quiz</a>
            <a class="btn btn-ghost btn-sm" href="#/quiz/pronunciation">Pronunciation Quiz</a>
            <button class="btn btn-ghost btn-sm" onclick="StudyPlanModule.markDone('quiz')">Mark Done</button>`)}
        </section>
      </div>`;
  }

  return { render, markDone, renderSrsSession, closeActive };
})();



