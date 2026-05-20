/* Sentence Builder */
'use strict';

window.SentenceBuilderModule = (() => {
  const DEFAULT_SESSION_SIZE = 20;
  const DEFAULT_LEVEL = 'novice_1';
  const SESSION_CHOICES = [10, 20, 50, 100];
  const GENERATOR_POOLS = {
    pronouns: [['我','I'],['你','you'],['他','he'],['她','she'],['我們','we'],['你們','you all']],
    people: [['學生','a student'],['老師','a teacher'],['朋友','a friend'],['同學','a classmate'],['醫生','a doctor'],['台灣人','Taiwanese'],['家人','family member'],['店員','clerk']],
    actions: [['喝水','drink water'],['吃飯','eat'],['看書','read a book'],['寫字','write characters'],['聽音樂','listen to music'],['學中文','study Chinese'],['去學校','go to school'],['回家','go home']],
    places: [['學校','school'],['家','home'],['圖書館','the library'],['商店','the store'],['餐廳','the restaurant'],['公園','the park'],['教室','the classroom'],['市場','the market']],
    times: [['今天','today'],['明天','tomorrow'],['早上','in the morning'],['下午','in the afternoon'],['晚上','at night'],['週末','on the weekend'],['下課以後','after class'],['吃飯以前','before eating']],
    objects: [['一本書','a book'],['一杯水','a cup of water'],['一支筆','a pen'],['一張照片','a photo'],['一個問題','a question'],['兩個朋友','two friends'],['三本書','three books'],['一份功課','one homework assignment']],
    foods: [['牛肉麵','beef noodle soup'],['水餃','dumplings'],['水果','fruit'],['咖啡','coffee'],['茶','tea'],['早餐','breakfast'],['晚餐','dinner'],['便當','a lunch box']],
    adjectives: [['忙','busy'],['累','tired'],['高興','happy'],['緊張','nervous'],['舒服','comfortable'],['傷心','sad']],
    measureItems: [['一杯','咖啡','a cup of coffee'],['一碗','飯','a bowl of rice'],['一瓶','水','a bottle of water'],['一張','票','a ticket'],['一件','衣服','a piece of clothing'],['一個','包子','a steamed bun'],['一本','書','a book'],['一支','筆','a pen']],
    transport: [['坐公車','take the bus'],['坐捷運','take the MRT'],['騎腳踏車','ride a bicycle'],['走路','walk'],['開車','drive'],['搭計程車','take a taxi'],['坐火車','take the train'],['換車','transfer vehicles']],
    reasons: [['今天下雨','it is raining today'],['我有考試','I have a test'],['他不舒服','he is not feeling well'],['餐廳很遠','the restaurant is far'],['工作很多','there is a lot of work'],['中文課很早','Chinese class is early'],['票已經賣完了','tickets are already sold out'],['路上很塞','traffic is heavy']],
    outcomes: [['我想留在家裡','I want to stay home'],['我們要早一點出門','we need to leave earlier'],['她不能去','she cannot go'],['你要帶傘','you need to bring an umbrella'],['他需要休息','he needs to rest'],['我先做功課','I will do homework first'],['我們改天再去','we will go another day'],['他決定坐捷運','he decided to take the MRT']],
    grammarNouns: [['生詞','vocabulary words'],['語法','grammar'],['聲調','tones'],['句子','sentences'],['課文','the lesson text'],['對話','dialogue']]
  };

  let state = {
    levels: [],
    levelId: localStorage.getItem('sentenceBuilderLevel') || DEFAULT_LEVEL,
    mode: localStorage.getItem('sentenceBuilderMode') || 'curriculum',
    sessionSize: Number(localStorage.getItem('sentenceBuilderSessionSize')) || DEFAULT_SESSION_SIZE,
    sentences: [],
    idx: 0,
    bank: [],
    answer: [],
    loaded: false,
    fallbackLexicon: []
  };

  function cleanSentence(s) {
    return String(s || '').replace(/[\s，。！？,.!?]/g, '').trim();
  }

  function hasChinese(s) {
    return /[\u3400-\u9fff]/.test(s || '');
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pick(arr, seed = Math.random()) {
    return arr[Math.floor(seed * arr.length) % arr.length];
  }

  function verbForm(subjectEn, verb) {
    if (subjectEn === 'I' || subjectEn === 'you' || subjectEn === 'we' || subjectEn === 'you all') return verb;
    if (verb === 'go') return 'goes';
    if (verb === 'have') return 'has';
    if (verb === 'do') return 'does';
    if (verb.endsWith('y')) return verb.slice(0, -1) + 'ies';
    return verb + 's';
  }

  function normalizeSessionSize(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_SESSION_SIZE;
    return Math.max(1, Math.min(999, n));
  }

  function pushWord(set, value) {
    const word = cleanSentence(value);
    if (word.length >= 2 && word.length <= 8 && hasChinese(word)) set.add(word);
  }

  function addVocabularyWords(set, source) {
    if (!source) return;
    if (Array.isArray(source)) {
      source.forEach(item => addVocabularyWords(set, item));
      return;
    }
    if (typeof source !== 'object') return;
    pushWord(set, source.hanzi || source.word || source.traditional || source.simplified || source.zh);
    addVocabularyWords(set, source.vocab);
    addVocabularyWords(set, source.words);
    addVocabularyWords(set, source.vocabulary);
    addVocabularyWords(set, source.example_words);
  }

  async function collectLexicon() {
    if (state.fallbackLexicon.length) return state.fallbackLexicon;
    const set = new Set();
    addVocabularyWords(set, App.state.characters || []);
    const sources = ['vocabulary', 'book1_content', 'book2_content', 'book3_content', 'scenarios_content', 'dialogues'];
    for (const source of sources) {
      try { addVocabularyWords(set, await API.get(source)); } catch (_) {}
    }
    state.fallbackLexicon = [...set].sort((a, b) => b.length - a.length);
    return state.fallbackLexicon;
  }

  function segmentSentence(text, lexicon) {
    const clean = cleanSentence(text);
    const tiles = [];
    let i = 0;
    while (i < clean.length) {
      const match = lexicon.find(word => clean.startsWith(word, i));
      if (match) {
        tiles.push(match);
        i += match.length;
      } else {
        tiles.push(clean[i]);
        i += 1;
      }
    }
    return tiles;
  }

  async function loadCurriculum() {
    if (state.loaded) return;
    try {
      const data = await API.get('sentence_builder_levels');
      state.levels = Array.isArray(data.levels) ? data.levels : [];
    } catch (_) {
      state.levels = [];
    }
    if (state.levels.length && !state.levels.some(level => level.id === state.levelId)) {
      state.levelId = state.levels[0].id;
    }
    state.loaded = true;
  }

  async function collectFallbackSentences() {
    const out = [];
    const lexicon = await collectLexicon();
    (App.state.characters || []).forEach(c => {
      const ex = c.example_sentence || {};
      if (hasChinese(ex.sentence)) out.push({ zh: ex.sentence, py: ex.pinyin || '', en: ex.english || c.definition || '', source: 'Automatic examples', lexicon, tags: ['auto'] });
    });
    try {
      const scenarios = await API.get('scenarios_content');
      scenarios.forEach(m => (m.scenarios || []).forEach(s => {
        (s.dialogue || []).forEach(conv => (conv.dialogue || []).forEach(line => {
          if (hasChinese(line.zh)) out.push({ zh: line.zh, py: line.py || '', en: line.en || '', source: m.title, lexicon, tags: ['scenario'] });
        }));
      }));
    } catch (_) {}
    return out.filter(x => cleanSentence(x.zh).length >= 4 && cleanSentence(x.zh).length <= 18).slice(0, 120);
  }

  function selectedLevel() {
    return state.levels.find(level => level.id === state.levelId) || state.levels[0] || null;
  }

  function normalizeSentence(sentence, level) {
    return {
      zh: sentence.zh,
      py: sentence.pinyin || sentence.py || '',
      en: sentence.en || sentence.english || '',
      tiles: Array.isArray(sentence.tiles) ? sentence.tiles : null,
      tags: Array.isArray(sentence.tags) ? sentence.tags : [],
      source: level ? level.title : sentence.source || 'Sentence Builder',
      levelId: level ? level.id : 'auto',
      difficulty: sentence.difficulty || (level ? level.difficulty : 1),
      generated: !!sentence.generated
    };
  }

  function generatedSentence(levelId, index) {
    const p = GENERATOR_POOLS;
    const s = pick(p.pronouns);
    const subj = s[0], subjEn = s[1];
    const source = 'Generated Practice';
    const difficulty = Math.max(1, ['novice_1','novice_2','a1_1','a1_2','a2_1','a2_2'].indexOf(levelId) + 1);
    const templates = {
      novice_1: [
        () => { const n = pick(p.people); return make(`${subj}是${n[0]}。`, `${subjEn} ${subjEn === 'I' ? 'am' : 'is'} ${n[1]}.`, [subj, '是', n[0]], ['generated','identity']); },
        () => { const a = pick(p.actions); return make(`${subj}${a[0]}。`, `${subjEn} ${a[1]}.`, [subj, a[0]], ['generated','action']); },
        () => { const o = pick(p.objects); return make(`${subj}有${o[0]}。`, `${subjEn} ${verbForm(subjEn, 'have')} ${o[1]}.`, [subj, '有', o[0]], ['generated','possession']); },
        () => { const pl = pick(p.places); return make(`${subj}在${pl[0]}。`, `${subjEn} ${subjEn === 'I' ? 'am' : 'is'} at ${pl[1]}.`, [subj, '在', pl[0]], ['generated','location']); }
      ],
      novice_2: [
        () => { const a = pick(p.actions); return make(`${subj}不${a[0]}。`, `${subjEn} ${verbForm(subjEn, 'do')} not ${a[1]}.`, [subj, '不', a[0]], ['generated','negation']); },
        () => { const a = pick(p.actions); const aux = subj === '他' || subj === '她' ? 'Does' : 'Do'; return make(`${subj}${a[0]}嗎？`, `${aux} ${subjEn} ${a[1]}?`, [subj, a[0], '嗎'], ['generated','question']); },
        () => { const t = pick(p.times), pl = pick(p.places); const verb = pl[0] === '家' ? '回' : '去'; return make(`${subj}${t[0]}${verb}${pl[0]}。`, `${subjEn} ${pl[0] === '家' ? 'go home' : verbForm(subjEn, 'go') + ' to ' + pl[1]} ${t[1]}.`, [subj, t[0], verb + pl[0]], ['generated','time']); },
        () => { const f = pick(p.foods); return make(`${subj}喜歡${f[0]}。`, `${subjEn} ${verbForm(subjEn, 'like')} ${f[1]}.`, [subj, '喜歡', f[0]], ['generated','food']); }
      ],
      a1_1: [
        () => { const t = pick(p.times), tr = pick(p.transport), pl = pick(p.places); const goZh = pl[0] === '家' ? '回家' : '去' + pl[0]; const goEn = pl[0] === '家' ? tr[1] + ' home' : tr[1] + ' to ' + pl[1]; return make(`${subj}${t[0]}${tr[0]}${goZh}。`, `${subjEn} ${goEn} ${t[1]}.`, [subj, t[0], tr[0], goZh], ['generated','transport']); },
        () => { const m = pick(p.measureItems); return make(`${subj}想買${m[0]}${m[1]}。`, `${subjEn} want to buy ${m[2]}.`, [subj, '想', '買', m[0], m[1]], ['generated','measure words']); },
        () => { const f = pick(p.foods); return make(`${subj}先吃${f[0]}，再去上課。`, `${subjEn} eat ${f[1]} first, then go to class.`, [subj, '先', '吃', f[0], '再', '去', '上課'], ['generated','sequence']); }
      ],
      a1_2: [
        () => { const adj = pick(p.adjectives); return make(`${subj}今天覺得很${adj[0]}。`, `${subjEn} feel very ${adj[1]} today.`, [subj, '今天', '覺得', '很', adj[0]], ['generated','feelings']); },
        () => { const pl = pick(p.places); return make(`${subj}在${pl[0]}學中文。`, `${subjEn} study Chinese at ${pl[1]}.`, [subj, '在', pl[0], '學', '中文'], ['generated','location']); },
        () => { const f = pick(p.foods); return make(`${subj}比較喜歡${f[0]}，不太喜歡咖啡。`, `${subjEn} prefer ${f[1]} and do not really like coffee.`, [subj, '比較', '喜歡', f[0], '不太', '喜歡', '咖啡'], ['generated','comparison']); },
        () => { const r = pick(p.reasons), o = pick(p.outcomes); return make(`因為${r[0]}，所以${o[0]}。`, `Because ${r[1]}, ${o[1]}.`, ['因為', r[0], '所以', o[0]], ['generated','because']); }
      ],
      a2_1: [
        () => { const t = pick(p.times), g = pick(p.grammarNouns); return make(`${subj}${t[0]}要先複習${g[0]}，然後練習聽力。`, `${subjEn} need to review ${g[1]} first and then practice listening ${t[1]}.`, [subj, t[0], '要', '先', '複習', g[0], '然後', '練習', '聽力'], ['generated','sequence']); },
        () => { const pl = pick(p.places); const hasTime = subj === '他' || subj === '她' ? 'has time' : 'have time'; const placeZh = pl[0] === '家' ? '在家' : '去' + pl[0]; const placeEn = pl[0] === '家' ? 'read at home' : 'go to ' + pl[1] + ' to read'; return make(`${subj}如果有時間，就會${placeZh}看書。`, `If ${subjEn} ${hasTime}, ${subjEn} will ${placeEn}.`, [subj, '如果', '有', '時間', '就會', placeZh, '看書'], ['generated','condition']); },
        () => { const adj = pick(p.adjectives); const beWord = subj === '我' ? 'am' : (subj === '他' || subj === '她' ? 'is' : 'are'); const wantWord = subj === '他' || subj === '她' ? 'wants' : 'want'; return make(`${subj}雖然很${adj[0]}，可是還是想學中文。`, `Although ${subjEn} ${beWord} ${adj[1]}, ${subjEn} still ${wantWord} to study Chinese.`, [subj, '雖然', '很', adj[0], '可是', '還是', '想', '學中文'], ['generated','contrast']); },
        () => { const m = pick(p.measureItems); return make(`${subj}把${m[0]}${m[1]}放在桌子上。`, `${subjEn} put ${m[2]} on the table.`, [subj, '把', m[0], m[1], '放在', '桌子上'], ['generated','把']); }
      ],
      a2_2: [
        () => { const pl = pick(p.places); const go = pl[0] === '家' ? '回家' : '去' + pl[0]; const goEn = pl[0] === '家' ? 'go home' : 'go to ' + pl[1]; return make(`${subj}本來想${go}，後來因為下雨就改在家裡休息。`, `${subjEn} originally wanted to ${goEn}, but later rested at home because it rained.`, [subj, '本來', '想', go, '後來', '因為', '下雨', '就', '改在', '家裡', '休息'], ['generated','change of plan']); },
        () => { const f = pick(p.foods); return make(`${subj}覺得這家店的${f[0]}不但好吃，而且價錢也合理。`, `${subjEn} think this shop's ${f[1]} is not only tasty but also reasonably priced.`, [subj, '覺得', '這家店的', f[0], '不但', '好吃', '而且', '價錢', '也', '合理'], ['generated','opinion']); },
        () => { const tr = pick(p.transport); return make(`${subj}寧可${tr[0]}，也不想在路上等太久。`, `${subjEn} would rather ${tr[1]} than wait too long on the road.`, [subj, '寧可', tr[0], '也不想', '在路上', '等', '太久'], ['generated','preference']); },
        () => { const g = pick(p.grammarNouns); const practiceWord = subj === '他' || subj === '她' ? 'practices' : 'practice'; return make(`${subj}只要每天練習${g[0]}，就會慢慢記住常用的說法。`, `As long as ${subjEn} ${practiceWord} ${g[1]} every day, ${subjEn} will gradually remember common expressions.`, [subj, '只要', '每天', '練習', g[0], '就會', '慢慢', '記住', '常用的', '說法'], ['generated','condition']); }
      ]
    };
    const levelTemplates = templates[levelId] || templates.novice_1;
    function make(zh, en, tiles, tags) {
      return { id: `generated_${levelId}_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`, zh, pinyin: '', en, tiles, tags, difficulty, generated: true, source };
    }
    return pick(levelTemplates)();
  }

  function generatedSession(level, count) {
    const out = [];
    const seen = new Set();
    let attempts = 0;
    while (out.length < count && attempts < count * 30) {
      const s = generatedSentence(level ? level.id : state.levelId, attempts);
      const key = cleanSentence(s.zh);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(normalizeSentence(s, level || { id: state.levelId, title: 'Generated Practice', difficulty: s.difficulty }));
      }
      attempts++;
    }
    while (out.length < count) out.push(normalizeSentence(generatedSentence(level ? level.id : state.levelId, out.length), level || { id: state.levelId, title: 'Generated Practice' }));
    return out;
  }

  async function startSession(levelId = state.levelId) {
    await loadCurriculum();
    state.levelId = levelId;
    state.sessionSize = normalizeSessionSize(state.sessionSize);
    localStorage.setItem('sentenceBuilderLevel', state.levelId);
    localStorage.setItem('sentenceBuilderMode', state.mode);
    localStorage.setItem('sentenceBuilderSessionSize', String(state.sessionSize));
    const level = selectedLevel();
    const pool = state.mode === 'generated'
      ? generatedSession(level, state.sessionSize)
      : level ? shuffle(level.sentences.map(sentence => normalizeSentence(sentence, level))).slice(0, Math.min(state.sessionSize, level.sentences.length)) : await collectFallbackSentences();
    state.sentences = pool;
    state.idx = 0;
    state.bank = [];
    state.answer = [];
  }

  function makeRound(sentence) {
    const tileText = sentence.tiles && sentence.tiles.length
      ? sentence.tiles.map(cleanSentence).filter(Boolean)
      : segmentSentence(sentence.zh, sentence.lexicon || state.fallbackLexicon || []);
    state.bank = shuffle(tileText.map((text, i) => ({ id: 'tile-' + i, text })));
    state.answer = [];
  }

  async function render(container) {
    container.innerHTML = '<div class="spinner"></div>';
    await loadCurriculum();
    if (!state.sentences.length) await startSession(state.levelId);
    if (!state.sentences[state.idx]) return renderDone(container);
    makeRound(state.sentences[state.idx]);
    draw(container);
  }

  function levelButton(level) {
    const active = level.id === state.levelId ? ' active' : '';
    const count = Array.isArray(level.sentences) ? level.sentences.length : 0;
    return `<button class="sentence-level-chip${active}" onclick="SentenceBuilderModule.changeLevel('${level.id}')"><strong>${esc(level.title)}</strong><span>${count} bank sentences</span></button>`;
  }

  function modeButton(mode, title, text) {
    const active = state.mode === mode ? ' active' : '';
    return `<button class="sentence-mode-chip${active}" onclick="SentenceBuilderModule.setMode('${mode}')"><strong>${title}</strong><span>${text}</span></button>`;
  }

  function lengthButton(n) {
    const active = state.sessionSize === n ? ' active' : '';
    return `<button class="sentence-length-chip${active}" onclick="SentenceBuilderModule.setSessionSize(${n})">${n}</button>`;
  }

  function controlsHtml(level) {
    const maxHint = state.mode === 'generated' ? 'Generated mode can keep creating level-matched prompts when you want longer practice.' : `Curriculum mode draws from ${level && level.sentences ? level.sentences.length : 100} reviewed prompts for this level.`;
    return `
      <section class="sentence-setup-card">
        <div class="sentence-setup-head">
          <div>
            <span>Session setup</span>
            <h3>Choose your practice</h3>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SentenceBuilderModule.restart()">Start Session</button>
        </div>
        <div class="sentence-setup-grid">
          <div class="sentence-setup-section sentence-setup-levels">
            <div class="sentence-setup-label">Level</div>
            ${state.levels.length ? `<div class="sentence-level-panel">${state.levels.map(levelButton).join('')}</div>` : ''}
          </div>
          <div class="sentence-setup-section">
            <div class="sentence-setup-label">Mode</div>
            <div class="sentence-mode-row">
              ${modeButton('curriculum', 'Curriculum Bank', 'Fixed reviewed sentence set')}
              ${modeButton('generated', 'Generate Practice', 'New level-matched sentences')}
            </div>
          </div>
          <div class="sentence-setup-section">
            <div class="sentence-setup-label">Questions</div>
            <div class="sentence-length-row">
              ${SESSION_CHOICES.map(lengthButton).join('')}
              <label class="sentence-custom-count"><span>Custom</span><input type="number" min="1" max="999" value="${state.sessionSize}" onchange="SentenceBuilderModule.setSessionSize(this.value)" /></label>
            </div>
          </div>
        </div>
        <p>${esc(maxHint)}</p>
      </section>`;
  }

  function draw(container) {
    const s = state.sentences[state.idx];
    const level = selectedLevel();
    const levelCount = level && Array.isArray(level.sentences) ? level.sentences.length : state.sentences.length;
    const sourceLabel = state.mode === 'generated' ? 'generated' : `${levelCount} in ${esc(s.source)}`;
    container.innerHTML = `
      <div class="sentence-builder-page">
        <section class="sentence-builder-hero">
          <div class="sentence-hero-copy">
            <div class="study-plan-kicker">Sentence Builder</div>
            <h2>Build the Sentence</h2>
            <p>Train active recall by arranging Chinese word tiles into complete sentences.</p>
          </div>
          <div class="sentence-hero-meter"><strong>${state.idx + 1}/${state.sentences.length}</strong><span>${sourceLabel}</span></div>
        </section>
        ${controlsHtml(level)}
        <section class="builder-card">
          <div class="builder-meta-row">
            <span>${esc(s.generated ? 'Generated Practice' : s.source)}</span>
            ${s.tags && s.tags.length ? `<span>${esc(s.tags.slice(0, 3).join(' / '))}</span>` : ''}
          </div>
          <div class="builder-prompt-block">
            <span>Meaning</span>
            <div class="builder-meaning">${esc(s.en || 'Build the Chinese sentence.')}</div>
          </div>
          <div class="builder-workspace">
            <div class="builder-zone-head"><span>Your sentence</span><small>Tap a tile to move it back</small></div>
            <div id="builder-answer" class="builder-answer" aria-label="Your answer">${state.answer.map(tileButton).join('')}</div>
            <div class="builder-zone-head"><span>Available tiles</span><small>Tap in the correct order</small></div>
            <div id="builder-bank" class="builder-bank" aria-label="Available tiles">${state.bank.map(tileButton).join('')}</div>
          </div>
          <div id="builder-feedback" class="quiz-feedback"></div>
          <div class="study-task-actions sentence-builder-actions">
            <button class="btn btn-primary" onclick="SentenceBuilderModule.check()">Check Answer</button>
            <button class="btn btn-ghost" onclick="SentenceBuilderModule.play()">Play Audio</button>
            <button class="btn btn-ghost" onclick="SentenceBuilderModule.skip()">Skip</button>
          </div>
        </section>
      </div>`;
  }

  function tileButton(t) {
    return `<button class="sentence-tile" data-id="${t.id}" onclick="SentenceBuilderModule.move('${t.id}')">${esc(t.text)}</button>`;
  }

  function move(id) {
    let from = state.bank;
    let to = state.answer;
    let idx = from.findIndex(t => t.id === id);
    if (idx < 0) {
      from = state.answer;
      to = state.bank;
      idx = from.findIndex(t => t.id === id);
    }
    if (idx < 0) return;
    to.push(from.splice(idx, 1)[0]);
    draw(document.getElementById('page-content'));
  }

  function currentText() {
    return state.answer.map(t => t.text).join('');
  }

  function check() {
    const s = state.sentences[state.idx];
    const expected = cleanSentence(s.zh);
    const actual = currentText();
    const ok = actual === expected;
    const fb = document.getElementById('builder-feedback');
    fb.className = `quiz-feedback ${ok ? 'correct' : 'wrong'} show`;
    fb.innerHTML = ok
      ? `Correct. ${esc(s.zh)}${s.py ? `<br><span class="text-muted">${esc(s.py)}</span>` : ''}<br><button class="btn btn-primary btn-sm mt-8" onclick="SentenceBuilderModule.next()">Next sentence</button>`
      : `Compare:<br><strong>${esc(s.zh)}</strong><br><span class="text-muted">Your answer: ${esc(actual || 'empty')}</span>`;
    if (!ok && window.WeaknessEngine) WeaknessEngine.record('grammar', { item: expected, label: s.en || expected, type: 'sentence-builder', level: s.levelId, generated: s.generated });
    if (ok) TTS.speak(s.zh);
  }

  function play() {
    const s = state.sentences[state.idx];
    if (s) TTS.speak(s.zh);
  }

  function next() {
    state.idx++;
    render(document.getElementById('page-content'));
  }

  function skip() {
    if (window.WeaknessEngine && state.sentences[state.idx]) {
      const s = state.sentences[state.idx];
      WeaknessEngine.record('grammar', { item: cleanSentence(s.zh), label: s.en || 'sentence', type: 'sentence-skip', level: s.levelId, generated: s.generated });
    }
    next();
  }

  function renderDone(container) {
    const level = selectedLevel();
    container.innerHTML = `
      <div class="card text-center p-32 sentence-builder-done">
        <h2>Sentence Builder Complete</h2>
        <p>You finished a ${state.sentences.length}-sentence ${state.mode === 'generated' ? 'generated' : 'curriculum'} session${level ? ` from ${esc(level.title)}` : ''}.</p>
        <div class="flex-center gap-12 wrap">
          <button class="btn btn-primary" onclick="SentenceBuilderModule.restart()">Build More</button>
          ${nextLevelId() ? '<button class="btn btn-ghost" onclick="SentenceBuilderModule.nextLevel()">Next Level</button>' : ''}
          <a class="btn btn-ghost" href="#/study-plan">Study Plan</a>
        </div>
      </div>`;
  }

  function nextLevelId() {
    const i = state.levels.findIndex(level => level.id === state.levelId);
    return i >= 0 && state.levels[i + 1] ? state.levels[i + 1].id : null;
  }

  async function changeLevel(levelId) {
    await startSession(levelId);
    render(document.getElementById('page-content'));
  }

  async function setMode(mode) {
    state.mode = mode === 'generated' ? 'generated' : 'curriculum';
    await restart();
  }

  async function setSessionSize(value) {
    state.sessionSize = normalizeSessionSize(value);
    localStorage.setItem('sentenceBuilderSessionSize', String(state.sessionSize));
    await restart();
  }

  async function nextLevel() {
    const id = nextLevelId();
    if (id) await changeLevel(id);
  }

  async function restart() {
    await startSession(state.levelId);
    render(document.getElementById('page-content'));
  }

  return { render, move, check, next, skip, play, restart, changeLevel, nextLevel, setMode, setSessionSize };
})();
