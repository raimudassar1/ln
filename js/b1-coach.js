/* B1 Coach Mode - static 180-day roadmap with portable progress */
'use strict';

window.B1CoachModule = (() => {
  const KEY = 'b1CoachProgress';
  const DAYS = 180;
  const VERSION = 1;
  const PHASES = [
    { start: 1, end: 14, id: 'foundation', name: 'Foundation Reset', level: 'Pre-A1', target: 'Pinyin, tones, survival words', exam: 'Sound check' },
    { start: 15, end: 45, id: 'novice', name: 'Novice Survival', level: 'Novice', target: '300-400 core words, basic listening', exam: 'Novice mini test' },
    { start: 46, end: 90, id: 'a1', name: 'A1 Build', level: 'A1', target: '500 words, sentence order, daily topics', exam: 'Band A lower mock' },
    { start: 91, end: 135, id: 'a2', name: 'A2 Expansion', level: 'A2', target: '1000 words, connected speech and reading', exam: 'Band A upper mock' },
    { start: 136, end: 165, id: 'b1bridge', name: 'B1 Bridge', level: 'B1 prep', target: 'Longer texts, inference, opinions', exam: 'Band B bridge mock' },
    { start: 166, end: 180, id: 'bootcamp', name: 'Exam Bootcamp', level: 'B1 focus', target: 'Timed simulation and weak-area repair', exam: 'Full B1 readiness gate' }
  ];

  const ROUTES = {
    pinyin: '#/onboarding', srs: '#/learn', study: '#/study-plan', sentence: '#/sentence-builder', mixed: '#/mixed-recall',
    listening: '#/mock-test/listening', reading: '#/reading', tocfl: '#/tocfl-content', tocflLab: '#/tocfl', exams: '#/exams',
    books: '#/vocabulary-books', scenarios: '#/scenarios', dialogue: '#/dialogue', grammar: '#/grammar', quiz: '#/quiz/pronunciation'
  };

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateISO, days) {
    const d = new Date(dateISO + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function daysBetween(startISO, endISO) {
    const a = new Date(startISO + 'T00:00:00');
    const b = new Date(endISO + 'T00:00:00');
    return Math.floor((b - a) / 86400000);
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        version: VERSION,
        startDate: parsed.startDate || todayISO(),
        completed: parsed.completed || {},
        examScores: parsed.examScores || {},
        notes: parsed.notes || {},
        lastExport: parsed.lastExport || null
      };
    } catch (_) {
      return { version: VERSION, startDate: todayISO(), completed: {}, examScores: {}, notes: {}, lastExport: null };
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: VERSION }));
  }

  function currentDay(state) {
    return Math.max(1, Math.min(DAYS, daysBetween(state.startDate, todayISO()) + 1));
  }

  function phaseForDay(day) {
    return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[PHASES.length - 1];
  }

  function dayTheme(day) {
    const mod = (day - 1) % 7;
    return ['Sound + SRS', 'Vocabulary + Sentences', 'Listening Focus', 'Reading Focus', 'Grammar + Output', 'Mixed Recall', 'Exam Review'][mod];
  }

  function dailyTasks(day) {
    const phase = phaseForDay(day);
    const mod = (day - 1) % 7;
    const base = [
      { id: 'srs', title: 'Clear due reviews', detail: 'SRS first: protect memory before adding new material.', mins: 10, route: ROUTES.srs },
      { id: 'weak', title: 'Repair weak areas', detail: 'Use today\'s weak tones, words, grammar, or dialogue misses.', mins: 10, route: ROUTES.study },
      { id: 'sentence', title: 'Build sentences', detail: 'Active recall: arrange tiles, check, then replay audio.', mins: phase.id === 'foundation' ? 10 : 15, route: ROUTES.sentence },
      { id: 'listening', title: 'Listening repetition', detail: phase.id === 'bootcamp' ? 'Timed listening set with limited replay.' : 'Listen, repeat, and shadow short lines.', mins: 15, route: mod === 2 ? ROUTES.listening : ROUTES.dialogue },
      { id: 'tocfl', title: 'TOCFL-style item set', detail: 'Practice official-style questions and review mistakes.', mins: phase.id === 'foundation' ? 10 : 20, route: phase.id === 'bootcamp' ? ROUTES.tocflLab : ROUTES.tocfl }
    ];
    if (phase.id === 'foundation') base[4] = { id: 'pinyin', title: 'Tone and pinyin drill', detail: 'Do not skip sound work. It protects listening later.', mins: 15, route: ROUTES.pinyin };
    if (phase.id === 'a1') base[1] = { id: 'book', title: 'Course Book lesson block', detail: 'Dialogue, vocabulary, one short quiz from the current lesson.', mins: 20, route: ROUTES.books };
    if (phase.id === 'a2') base[3] = { id: 'reading', title: 'Short reading + recall', detail: 'Read for detail, then retell the meaning in simple Chinese.', mins: 20, route: ROUTES.reading };
    if (phase.id === 'b1bridge') base[2] = { id: 'grammar', title: 'B1 grammar output', detail: 'Use one connector/pattern in your own sentence.', mins: 20, route: ROUTES.grammar };
    if (mod === 6) return [
      { id: 'review', title: 'Weekly mistake review', detail: 'Review all wrong items before touching new content.', mins: 20, route: ROUTES.study },
      { id: 'mock', title: 'Strict mini exam', detail: 'Timed, no hints, no multitasking. Record the score.', mins: 30, route: ROUTES.exams },
      { id: 'repair', title: 'Repair the weakest skill', detail: 'Pick the lowest score: tones, listening, vocab, grammar, or reading.', mins: 20, route: ROUTES.mixed },
      { id: 'plan', title: 'Plan next week', detail: 'Export progress if you will switch devices.', mins: 5, route: '#/b1-coach' }
    ];
    return base;
  }

  function dayCompletion(state, day) {
    const tasks = dailyTasks(day);
    const done = state.completed[String(day)] || {};
    const count = tasks.filter(t => done[t.id]).length;
    return { count, total: tasks.length, pct: tasks.length ? Math.round((count / tasks.length) * 100) : 0 };
  }

  function completedDays(state) {
    let n = 0;
    for (let day = 1; day <= DAYS; day++) {
      const c = dayCompletion(state, day);
      if (c.total && c.count >= c.total) n++;
    }
    return n;
  }

  function roadmapStats(state) {
    const doneDays = completedDays(state);
    const day = currentDay(state);
    return {
      day,
      doneDays,
      pct: Math.round((doneDays / DAYS) * 100),
      remaining: Math.max(0, DAYS - day),
      targetDate: addDays(state.startDate, DAYS - 1),
      phase: phaseForDay(day),
      today: dayCompletion(state, day)
    };
  }

  function taskHtml(state, day, task) {
    const checked = !!(state.completed[String(day)] || {})[task.id];
    return `<label class="coach-task ${checked ? 'done' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="B1CoachModule.toggleTask(${day}, '${task.id}', this.checked)">
      <span class="coach-task-check"></span>
      <span class="coach-task-copy"><strong>${esc(task.title)}</strong><small>${esc(task.detail)}</small></span>
      <span class="coach-task-mins">${task.mins}m</span>
      <a href="${task.route}" class="coach-task-go">Open</a>
    </label>`;
  }

  function phaseHtml(stats) {
    return PHASES.map(phase => {
      const active = stats.day >= phase.start && stats.day <= phase.end;
      const passed = stats.day > phase.end;
      return `<article class="coach-phase ${active ? 'active' : ''} ${passed ? 'passed' : ''}">
        <span>Days ${phase.start}-${phase.end}</span>
        <strong>${esc(phase.name)}</strong>
        <small>${esc(phase.level)} · ${esc(phase.target)}</small>
        <em>${esc(phase.exam)}</em>
      </article>`;
    }).join('');
  }

  function examHtml(stats) {
    const gates = [
      { day: 14, title: 'Gate 1: Pinyin + tone survival', target: '80% tone/pinyin accuracy', route: ROUTES.quiz },
      { day: 45, title: 'Gate 2: Novice readiness', target: 'Novice listening/reading mini test', route: ROUTES.tocfl },
      { day: 90, title: 'Gate 3: A1 lower Band A', target: 'Timed listening + reading', route: ROUTES.tocflLab },
      { day: 135, title: 'Gate 4: A2 upper Band A', target: 'Official content review and weak repair', route: ROUTES.tocfl },
      { day: 165, title: 'Gate 5: B1 bridge', target: 'Longer listening, reading inference, grammar output', route: ROUTES.exams },
      { day: 180, title: 'Final B1 readiness simulation', target: 'Full focus mode. No hints. Timed.', route: ROUTES.tocflLab }
    ];
    return gates.map(g => `<article class="coach-exam-card ${stats.day >= g.day ? 'due' : ''}">
      <span>Day ${g.day}</span>
      <strong>${esc(g.title)}</strong>
      <small>${esc(g.target)}</small>
      <a href="${g.route}" class="btn btn-outline btn-sm">Open Exam Focus</a>
    </article>`).join('');
  }

  function render(container) {
    const state = load();
    const stats = roadmapStats(state);
    const tasks = dailyTasks(stats.day);
    const todayDone = stats.today;
    container.innerHTML = `<div class="b1-coach-page">
      <section class="coach-hero">
        <div class="coach-hero-copy">
          <div class="coach-kicker">6-Month B1 Coach</div>
          <h1>Day ${stats.day}: ${esc(dayTheme(stats.day))}</h1>
          <p>A strict static roadmap from under 50 words to B1 exam readiness. Follow today, export progress when switching devices, and keep the exam target visible.</p>
          <div class="coach-hero-actions">
            <button class="btn btn-primary" onclick="B1CoachModule.startPlan()">Start / Reset Start Date</button>
            <button class="btn btn-outline" onclick="B1CoachModule.exportProgress()">Export Sync File</button>
            <label class="btn btn-outline coach-import-btn">Import Sync File<input type="file" accept="application/json" onchange="B1CoachModule.importProgress(this.files[0])"></label>
          </div>
        </div>
        <div class="coach-score-card">
          <div class="coach-ring" style="--coach-pct:${stats.pct}"><strong>${stats.pct}%</strong><span>${stats.doneDays}/${DAYS} days</span></div>
          <small>Target date: ${esc(stats.targetDate)}</small>
        </div>
      </section>

      <section class="coach-today-grid">
        <article class="coach-today-card">
          <div class="coach-section-head"><span>Today\'s mission</span><strong>${todayDone.count}/${todayDone.total} complete</strong></div>
          <div class="coach-progress-bar"><span style="width:${todayDone.pct}%"></span></div>
          <div class="coach-task-list">${tasks.map(t => taskHtml(state, stats.day, t)).join('')}</div>
        </article>
        <aside class="coach-rules-card">
          <span>Rules for B1 in 6 months</span>
          <ul>
            <li>Daily work before browsing other pages.</li>
            <li>Weekly strict mini exam, no hints.</li>
            <li>Every wrong answer becomes tomorrow\'s review.</li>
            <li>Export progress before changing devices.</li>
          </ul>
        </aside>
      </section>

      <section class="coach-panel">
        <div class="coach-section-head"><span>Roadmap</span><strong>${esc(stats.phase.name)}</strong></div>
        <div class="coach-phase-grid">${phaseHtml(stats)}</div>
      </section>

      <section class="coach-panel">
        <div class="coach-section-head"><span>Strict exam focus</span><strong>6 gates</strong></div>
        <div class="coach-exam-grid">${examHtml(stats)}</div>
      </section>

      <section class="coach-sync-card">
        <div><span>Static app sync</span><h2>Best course of action for 3 devices</h2><p>This app can save progress locally on each device, but static pages cannot automatically sync across devices without a backend/login. Use Export Sync File at the end of study, then import it on the next device. Later, the best upgrade is optional cloud sync through a tiny backend or a private GitHub/Gist-style storage connector.</p></div>
      </section>
    </div>`;
  }

  function startPlan() {
    const state = load();
    if (!confirm('Set today as Day 1 of the 6-month B1 plan? This keeps existing completed tasks but recalculates the schedule from today.')) return;
    state.startDate = todayISO();
    save(state);
    render(document.getElementById('page-content'));
  }

  function toggleTask(day, taskId, checked) {
    const state = load();
    const key = String(day);
    if (!state.completed[key]) state.completed[key] = {};
    state.completed[key][taskId] = !!checked;
    save(state);
    render(document.getElementById('page-content'));
  }

  function exportProgress() {
    const state = load();
    state.lastExport = new Date().toISOString();
    save(state);
    const payload = {
      app: 'Zhongwen Learning',
      type: 'progress-sync',
      version: VERSION,
      exportedAt: state.lastExport,
      localStorage: {
        [KEY]: localStorage.getItem(KEY),
        tocfl_progress: localStorage.getItem('tocfl_progress'),
        sentenceBuilderLevel: localStorage.getItem('sentenceBuilderLevel'),
        sentenceBuilderMode: localStorage.getItem('sentenceBuilderMode'),
        sentenceBuilderSessionSize: localStorage.getItem('sentenceBuilderSessionSize')
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zhongwen-b1-progress-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const store = payload.localStorage || payload;
        Object.entries(store).forEach(([key, value]) => {
          if (value === null || typeof value === 'undefined') return;
          if ([KEY, 'tocfl_progress', 'sentenceBuilderLevel', 'sentenceBuilderMode', 'sentenceBuilderSessionSize'].includes(key)) {
            localStorage.setItem(key, String(value));
          }
        });
        alert('Progress imported. The page will refresh now.');
        location.reload();
      } catch (err) {
        alert('Could not import this file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  return { render, startPlan, toggleTask, exportProgress, importProgress };
})();
