/* ═══════════════════════════════════════════════════════════════
   quiz.js — Enhanced Pronunciation & Vocabulary Quiz Modules
   ═══════════════════════════════════════════════════════════════ */

'use strict';

window.QuizModule = (() => {

  // ── Shared Quiz State ────────────────────────────────────────
  let quizState = {
    mode: 'A',          // Pronunciation mode (A-E)
    submode: 'hanzi-to-def', // Vocab submode
    source: 'level',    // level | category | chapter | book | radical
    level: 'a2',
    category: '',
    chapterId: '',
    book: 1,
    bookChapter: '01',
    radicalPhase: 1,
    questionCount: 20,
    questions: [],
    current: 0,
    score: 0,
    wrong: [],
    answered: false,
    startTime: 0,
  };

  // Utility: Shuffle array
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Utility: Pick incorrect options
  function pickDistractors(correctItem, allItems, field, count = 3) {
    const correctVal = correctItem[field];
    // Filter out the correct one and items with the same field value
    let pool = allItems.filter(item => 
      item.hanzi !== correctItem.hanzi && 
      item[field] !== correctVal &&
      item[field] !== undefined &&
      String(item[field]).trim() !== ""
    );
    
    // If pool is too small, fallback to the full character library
    if (pool.length < count && App.state.characters) {
      const fullPool = App.state.characters.filter(item => 
        item.hanzi !== correctItem.hanzi && 
        item[field] !== correctVal &&
        item[field] !== undefined &&
        String(item[field]).trim() !== ""
      );
      pool = [...pool, ...fullPool];
    }
    
    return shuffle(pool).slice(0, count);
  }


  function asText(value) {
    return String(value || '').trim();
  }

  function firstMeaning(value) {
    return asText(value).split(/[;?,?]/)[0].trim() || asText(value);
  }

  function normalizeBookVocab(item, bookNum) {
    return {
      hanzi: item.traditional || item.hanzi || item.word || '',
      traditional: item.traditional || item.hanzi || item.word || '',
      pinyin: item.pinyin || '',
      definition: item.english || item.definition || '',
      level: `Book ${bookNum}`,
      category: `Lesson ${parseInt((item.vocab_id || '').match(/L(\d+)/)?.[1] || '1')}`,
      audio_file: item.audio_file || '',
      vocab_id: item.vocab_id || '',
      example_sentence: item.example_sentence || null
    };
  }

  function collectBookSentences(chapter) {
    const out = [];
    if (!chapter) return out;
    (chapter.dialogues || []).forEach(dialogue => {
      (dialogue.lines || []).forEach(line => out.push({ sentence: line.zh, pinyin: line.py, english: line.en }));
    });
    (chapter.listening || []).forEach(item => out.push({ sentence: item.text, pinyin: item.py, english: item.en || item.title || '' }));
    (chapter.readings || []).forEach(item => out.push({ sentence: item.text, pinyin: item.py, english: item.en || item.title || '' }));
    return out.filter(item => item.sentence);
  }

  function enrichBookVocabWithContext(vocabItems, bookContent, bookNum) {
    const chapters = new Map((bookContent || []).map(ch => [Number(ch.chapter), ch]));
    return (vocabItems || []).map(raw => {
      const item = normalizeBookVocab(raw, bookNum);
      const lesson = Number((item.vocab_id || '').match(/L(\d+)/)?.[1] || 1);
      const chapter = chapters.get(lesson);
      const sentences = collectBookSentences(chapter);
      const target = item.traditional || item.hanzi;
      const found = sentences.find(sentence => sentence.sentence && target && sentence.sentence.includes(target));
      if (found) item.example_sentence = found;
      else if (!item.example_sentence && target) {
        item.example_sentence = {
          sentence: `\u6211\u6b63\u5728\u5b78${target}\u3002`,
          pinyin: '',
          english: `I am learning ${item.definition || target}.`
        };
      }
      return item;
    }).filter(item => item.hanzi && item.definition);
  }

  function normalizeRadical(radical) {
    const examples = Array.isArray(radical.examples) ? radical.examples : [];
    const firstExample = examples[0] || {};
    const component = radical.component || '';
    const meaning = radical.coreMeaning || radical.learningRole || '';
    const exampleChar = firstExample.character || component;
    const exampleMeaning = firstExample.meaning || firstMeaning(meaning);
    return {
      hanzi: component,
      traditional: component,
      pinyin: radical.pinyin || '',
      definition: meaning,
      level: `Phase ${radical.phase}`,
      category: radical.phaseName || 'Radical',
      radical_id: radical.id,
      examples,
      learningRole: radical.learningRole || '',
      example_sentence: {
        sentence: `${component}\u5e38\u51fa\u73fe\u5728${exampleChar}\u9019\u500b\u5b57\u88e1\u3002`,
        pinyin: '',
        english: `${component} appears in characters such as ${exampleChar}, meaning ${exampleMeaning}.`
      }
    };
  }

  // ── Unified Data Pool ───────────────────────────────────────
  function getQuizPool() {
    let pool = [];

    if (quizState.source === 'level') {
      // Pull from Character Library by TOCFL Level
      pool = App.state.characters;
      if (quizState.level !== 'all') {
        pool = pool.filter(c => c.level === quizState.level);
      }
    } 
    else if (quizState.source === 'category') {
      // Pull from Character Library by Thematic Category
      pool = App.state.characters.filter(c => c.category === quizState.category);
    } 
    else if (quizState.source === 'chapter') {
      // Pull from Vocabulary Library by Chapter/Set
      const sets = getChapterSets();
      const set = sets.find(s => s.id === quizState.chapterId);
      if (set) {
        // Map vocab items to match character schema for quiz compatibility
        pool = set.words.map(w => {
          // Try to find full metadata in character library if it's a single char
          const charMeta = App.state.characters.find(c => c.hanzi === w.word || c.traditional === w.word);
          return {
            hanzi: w.word,
            traditional: w.word,
            pinyin: w.pinyin,
            definition: w.definition,
            level: charMeta?.level || set.level || 'a1',
            category: charMeta?.category || set.name,
            example_sentence: charMeta?.example_sentence || null,
            zhuyin: w.zhuyin || charMeta?.zhuyin || ''
          };
        });
      }
    }
    else if (quizState.source === 'book') {
      if (quizState.bookData) {
        pool = quizState.bookData.filter(item => {
          const lesson = String(item.vocab_id || '').match(/L(\d+)/)?.[1];
          return lesson === quizState.bookChapter;
        });
      }
    }

    else if (quizState.source === 'radical') {
      if (quizState.radicalData) {
        pool = quizState.radicalData.filter(r => Number(r.phase) === Number(quizState.radicalPhase)).map(normalizeRadical);
      }
    }

    return pool;
  }

  function getCategories() {
    return [...new Set(App.state.characters.map(c => c.category).filter(Boolean))].sort();
  }

  function getChapterSets() {
    const sets = [...(App.state.vocabulary || [])];
    if (sets.length > 0) {
      // Add a virtual set for the full curriculum
      sets.unshift({
        id: 'full-curriculum',
        name: '📚 Complete 30-Chapter Set',
        level: 'Mixed',
        words: sets.filter(s => s.id.startsWith('ch')).reduce((acc, s) => acc.concat(s.words), [])
      });
    }
    return sets;
  }

  // ── Pronunciation Quiz Questions ────────────────────────────
  function buildPronunciationQuestions(pool, count) {
    const questions = [];
    const selected = shuffle(pool).slice(0, count);
    const mode = quizState.mode;

    selected.forEach(item => {
      if (mode === 'A') { // Pinyin Recognition
        const distractors = pickDistractors(item, pool, 'pinyin', 3);
        if (distractors.length < 3) return;
        const options = shuffle([item, ...distractors]);
        questions.push({
          type: 'pinyin-choice',
          question_hanzi: item.traditional || item.hanzi,
          question_label: 'Choose the correct pinyin:',
          correct: item,
          options: options.map(o => ({
            hanzi: o.traditional || o.hanzi,
            pinyin: o.pinyin,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      } else if (mode === 'B') { // Tone ID (Only for single characters)
        if (item.hanzi.length > 1) return; 
        const toneNum = Pinyin.getTone(item.pinyin);
        if (!toneNum || toneNum === 5) return;
        questions.push({
          type: 'tone-choice',
          question_hanzi: item.traditional || item.hanzi,
          question_label: 'What is the tone of this character?',
          correct_tone: toneNum,
          correct: item,
          options: [1,2,3,4].map(t => ({
            label: `${t}${t===1?' (flat)':t===2?' (rising)':t===3?' (falling-rising)':' (falling)'}`,
            tone: t,
            isCorrect: t === toneNum,
          })),
        });
      } else if (mode === 'C') { // Hanzi from Pinyin
        const distractors = pickDistractors(item, pool, 'hanzi', 3);
        if (distractors.length < 3) return;
        const options = shuffle([item, ...distractors]);
        questions.push({
          type: 'hanzi-from-pinyin',
          question_pinyin: item.pinyin,
          question_label: 'Choose the correct character/word:',
          correct: item,
          options: options.map(o => ({
            hanzi: o.traditional || o.hanzi,
            pinyin: o.pinyin,
            definition: o.definition,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      } else if (mode === 'D') { // Audio Mode
        const distractors = pickDistractors(item, pool, 'hanzi', 3);
        if (distractors.length < 3) return;
        const options = shuffle([item, ...distractors]);
        questions.push({
          type: 'audio-hanzi',
          question_label: 'Listen and choose the correct answer:',
          audio_text: item.traditional || item.hanzi,
          correct: item,
          options: options.map(o => ({
            hanzi: o.traditional || o.hanzi,
            pinyin: o.pinyin,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      }
    });

    return questions;
  }

  // ── Vocabulary Quiz Questions ───────────────────────────────
  function buildVocabQuestions(pool, count) {
    const questions = [];
    const selected = shuffle(pool).slice(0, count);
    const submode = quizState.submode;

    selected.forEach(item => {
      if (submode === 'hanzi-to-def') {
        const distractors = pickDistractors(item, pool, 'definition', 3);
        if (distractors.length < 3) return;
        questions.push({
          type: 'hanzi-to-def',
          question_label: 'What does this mean?',
          question_hanzi: item.traditional || item.hanzi,
          question_pinyin: item.pinyin,
          correct: item,
          options: shuffle([item, ...distractors]).map(o => ({
            definition: o.definition,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      } else if (submode === 'def-to-hanzi') {
        const distractors = pickDistractors(item, pool, 'hanzi', 3);
        if (distractors.length < 3) return;
        questions.push({
          type: 'def-to-hanzi',
          question_label: 'Choose the correct Hanzi for:',
          question_def: item.definition,
          correct: item,
          options: shuffle([item, ...distractors]).map(o => ({
            hanzi: o.traditional || o.hanzi,
            pinyin: o.pinyin,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      } else if (submode === 'cloze') {
        const sentence = item.example_sentence;
        if (!sentence || !sentence.sentence) return;
        const target = item.traditional || item.hanzi;
        if (!target || !sentence.sentence.includes(target)) return;
        const blanked = sentence.sentence.replace(target, '___');
        const distractors = pickDistractors(item, pool, 'hanzi', 3);
        if (distractors.length < 3) return;
        questions.push({
          type: 'cloze',
          question_label: 'Fill in the blank:',
          sentence: blanked,
          sentence_pinyin: sentence.pinyin,
          english: sentence.english,
          correct: item,
          options: shuffle([item, ...distractors]).map(o => ({
            hanzi: o.traditional || o.hanzi,
            pinyin: o.pinyin,
            isCorrect: o.hanzi === item.hanzi,
          })),
        });
      }
    });

    return questions;
  }

  // ── GUI: Render Selection Screen ────────────────────────────
  function renderSetup(container, type) {
    if (App.state.lastLevelFilter) {
      quizState.source = 'level';
      quizState.level = App.state.lastLevelFilter;
      App.state.lastLevelFilter = null;
    }

    const categories = getCategories();
    const sets = getChapterSets();

    if (!quizState.category && categories.length > 0) quizState.category = categories[0];
    if (!quizState.chapterId && sets.length > 0) quizState.chapterId = sets[0].id;

    container.innerHTML = `
      <div class="page-header">
        <h2>${type === 'pron' ? 'Pronunciation' : 'Vocabulary'} Quiz</h2>
        <p>${type === 'pron' ? 'Master tones and pinyin recognition.' : 'Test meanings and sentence context.'}</p>
      </div>

      <div id="quiz-setup" class="card mb-20" style="max-width:700px">
        <h3 class="mb-16">1. Choose Your Learning Path</h3>
        
        <!-- Source Selection Tabs -->
        <div class="tab-switcher mb-20">
          <button class="tab-btn ${quizState.source === 'level' ? 'active' : ''}" id="btn-src-level" onclick="QuizModule.setSource('level')">Levels (A1/A2)</button>
          <button class="tab-btn ${quizState.source === 'category' ? 'active' : ''}" id="btn-src-category" onclick="QuizModule.setSource('category')">Thematic Groups</button>
          <button class="tab-btn ${quizState.source === 'chapter' ? 'active' : ''}" id="btn-src-chapter" onclick="QuizModule.setSource('chapter')">Curriculum Chapters</button>
          <button class="tab-btn ${quizState.source === 'book' ? 'active' : ''}" id="btn-src-book" onclick="QuizModule.setSource('book')">Course Books</button>
          <button class="tab-btn ${quizState.source === 'radical' ? 'active' : ''}" id="btn-src-radical" onclick="QuizModule.setSource('radical')">Radicals Masterclass</button>
        </div>

        <div id="source-config" class="mb-20">
          <!-- Radical Config -->
          <div id="config-radical" class="quiz-config-panel ${quizState.source === 'radical' ? '' : 'hidden'}">
            <div class="text-small text-muted mb-8">Select Radical Phase</div>
            <div class="selection-grid">
              ${[1, 2, 3].map(p => `
                <div class="select-tile ${quizState.radicalPhase === p ? 'active' : ''}" onclick="QuizModule.setRadicalPhase(${p}, this)">
                  <div class="tile-title">PHASE ${p}</div>
                  <div class="tile-sub">${p === 1 ? 'Novice' : p === 2 ? 'Mastery' : 'Advanced'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Level Config -->
          <div id="config-level" class="quiz-config-panel ${quizState.source === 'level' ? '' : 'hidden'}">
            <div class="text-small text-muted mb-8">Select TOCFL Level</div>
            <div class="selection-grid">
              ${['novice', 'a1', 'a2', 'all'].map(lvl => `
                <div class="select-tile ${quizState.level === lvl ? 'active' : ''}" onclick="QuizModule.setLevel('${lvl}', this)">
                  <div class="tile-title">${lvl.toUpperCase()}</div>
                  <div class="tile-sub">${lvl === 'all' ? 'Full Library' : 'Level ' + lvl.toUpperCase()}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Category Config -->
          <div id="config-category" class="quiz-config-panel ${quizState.source === 'category' ? '' : 'hidden'}">
            <div class="text-small text-muted mb-8">Select Topic</div>
            <select class="input" onchange="window.QuizModule.state.category = this.value">
              ${categories.map(c => `<option value="${c}" ${quizState.category === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
            </select>
          </div>

          <!-- Chapter Config -->
          <div id="config-chapter" class="quiz-config-panel ${quizState.source === 'chapter' ? '' : 'hidden'}">
            <div class="text-small text-muted mb-8">Select Lesson Set</div>
            <select class="input" onchange="window.QuizModule.state.chapterId = this.value">
              ${sets.map(s => `<option value="${s.id}" ${quizState.chapterId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>

          <!-- Book Config -->
          <div id="config-book" class="quiz-config-panel ${quizState.source === 'book' ? '' : 'hidden'}">
            <div class="flex gap-12 mb-12">
              <div style="flex:1">
                <div class="text-small text-muted mb-4">Book</div>
                <select class="input" onchange="QuizModule.switchBook(this.value)">
                  <option value="1" ${quizState.book === 1 ? 'selected' : ''}>Book 1</option>
                  <option value="2" ${quizState.book === 2 ? 'selected' : ''}>Book 2</option>
                  <option value="3" ${quizState.book === 3 ? 'selected' : ''}>Book 3</option>
                </select>
              </div>
              <div style="flex:2">
                <div class="text-small text-muted mb-4">Lesson</div>
                <select class="input" id="quiz-book-chapter" onchange="window.QuizModule.state.bookChapter = this.value">
                  <option value="01">Lesson 1</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <h3 class="mb-16">2. Select Quiz Mode</h3>
        <div class="selection-grid mb-20">
          ${type === 'pron' ? `
            ${[
              {v:'A', t:'Pinyin', s:'Match Hanzi to Pinyin'},
              {v:'B', t:'Tones', s:'Identify the correct tone'},
              {v:'C', t:'Hanzi', s:'Match Pinyin to Hanzi'},
              {v:'D', t:'Listening', s:'Choose Hanzi from Audio'}
            ].map(m => `
              <div class="select-tile mode-tile ${quizState.mode === m.v ? 'active' : ''}" onclick="window.QuizModule.setMode('${m.v}', this)">
                <div class="tile-title">${m.t}</div>
                <div class="tile-sub">${m.s}</div>
              </div>
            `).join('')}
          ` : `
            ${[
              {v:'hanzi-to-def', t:'Meaning', s:'What does it mean?'},
              {v:'def-to-hanzi', t:'Writing', s:'Choose the Hanzi'},
              {v:'cloze', t:'Context', s:'Fill in the blank'}
            ].map(m => `
              <div class="select-tile mode-tile ${quizState.submode === m.v ? 'active' : ''}" onclick="window.QuizModule.setSubmode('${m.v}', this)">
                <div class="tile-title">${m.t}</div>
                <div class="tile-sub">${m.s}</div>
              </div>
            `).join('')}
          `}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap: 16px;">
           <div style="display:flex; align-items:center; gap: 16px;">
             <div>
               <span class="text-small text-muted">Question Count:</span>
               <select class="input" style="width:80px; margin-left:8px" onchange="window.QuizModule.state.questionCount = parseInt(this.value)">
                 <option value="10" ${quizState.questionCount === 10 ? 'selected' : ''}>10</option>
                 <option value="20" ${quizState.questionCount === 20 ? 'selected' : ''}>20</option>
                 <option value="50" ${quizState.questionCount === 50 ? 'selected' : ''}>50</option>
                 <option value="999999" ${quizState.questionCount === 999999 ? 'selected' : ''}>All</option>
               </select>
             </div>
             <label class="toggle" style="display:flex; align-items:center; gap:8px">
               <input type="checkbox" onchange="App.state.settings.showQuizPinyin = this.checked; if(App.saveSettings) App.saveSettings()" ${App.state.settings.showQuizPinyin !== false ? 'checked' : ''}>
               <span class="toggle-slider"></span>
               <span class="text-small text-muted" style="margin-left: 40px;">Show Pinyin Hints</span>
             </label>
           </div>
           <button class="btn btn-primary btn-lg" onclick="window.QuizModule.startQuiz('${type}')">Start Quiz ✨</button>
        </div>
      </div>

      <div id="quiz-area" style="display:none; max-width:600px; margin: 0 auto;"></div>
    `;
  }

  // ── Public API Functions ────────────────────────────────────
  window.QuizModule = {
    state: quizState,
    
    renderPronunciation(container) {
      renderSetup(container, 'pron');
    },

    renderVocabulary(container) {
      renderSetup(container, 'vocab');
    },

    async setSource(src) {
      quizState.source = src;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`btn-src-${src}`).classList.add('active');
      
      document.querySelectorAll('.quiz-config-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`config-${src}`).classList.remove('hidden');

      if (src === 'book' && !quizState.bookData) {
        await this.switchBook(quizState.book);
      }
      if (src === 'radical' && !quizState.radicalData) {
        await this.loadRadicalData();
      }
    },

    setRadicalPhase(p, el) {
      quizState.radicalPhase = parseInt(p);
      el.parentElement.querySelectorAll('.select-tile').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    },

    async switchBook(bookNum) {
      quizState.book = parseInt(bookNum);
      const [vocabData, contentData] = await Promise.all([
        this.loadBookData(bookNum),
        this.loadBookContent(bookNum)
      ]);
      quizState.bookContent = contentData;
      quizState.bookData = enrichBookVocabWithContext(vocabData, contentData, quizState.book);
      
      const chapters = [...new Set(quizState.bookData.map(item => {
        const match = String(item.vocab_id || '').match(/L(\d+)/);
        return match ? match[1] : null;
      }))].filter(Boolean).sort();
      
      const select = document.getElementById('quiz-book-chapter');
      if (select) {
        select.innerHTML = chapters.map(ch => `<option value="${ch}" ${quizState.bookChapter === ch ? 'selected' : ''}>Lesson ${parseInt(ch)}</option>`).join('');
        quizState.bookChapter = chapters.includes(quizState.bookChapter) ? quizState.bookChapter : (select.value || chapters[0] || '01');
        select.value = quizState.bookChapter;
      }
    },

    async loadBookData(bookNum) {
      const resp = await fetch(`books/book${bookNum}/vocabulary_b${bookNum}.json`);
      if (!resp.ok) throw new Error(`Book ${bookNum} vocabulary could not load.`);
      return resp.json();
    },

    async loadBookContent(bookNum) {
      try {
        const resp = await fetch(`data/book${bookNum}_content.json`);
        if (!resp.ok) return [];
        return await resp.json();
      } catch (_) {
        return [];
      }
    },

    async loadRadicalData() {
      const resp = await fetch('data/radicals_set.json');
      if (!resp.ok) throw new Error('Radical Masterclass data could not load.');
      const json = await resp.json();
      quizState.radicalData = json.radicals || [];
      return quizState.radicalData;
    },

    setLevel(lvl, el) {
      quizState.level = lvl;
      el.parentElement.querySelectorAll('.select-tile').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    },

    setMode(m, el) {
      quizState.mode = m;
      el.parentElement.querySelectorAll('.mode-tile').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    },

    setSubmode(m, el) {
      quizState.submode = m;
      el.parentElement.querySelectorAll('.mode-tile').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    },

    async startQuiz(type) {
      if (quizState.source === 'book' && !quizState.bookData) await this.switchBook(quizState.book);
      if (quizState.source === 'radical' && !quizState.radicalData) await this.loadRadicalData();
      const pool = getQuizPool();
      if (pool.length === 0) {
        alert('The selected set is empty. Please choose a different category or chapter.');
        return;
      }

      quizState.questions = type === 'pron' 
        ? buildPronunciationQuestions(pool, quizState.questionCount)
        : buildVocabQuestions(pool, quizState.questionCount);

      if (quizState.questions.length === 0) {
        alert('No valid questions could be generated. Try a different mode.');
        return;
      }

      quizState.current = 0;
      quizState.score = 0;
      quizState.wrong = [];
      quizState.startTime = Date.now();
      quizState.answered = false;

      document.getElementById('quiz-setup').style.display = 'none';
      document.getElementById('quiz-area').style.display = 'block';
      showQuestion();
    },

    playQuestionAudio() {
      const q = quizState.questions[quizState.current];
      if (q && q.correct && q.correct.audio_file) {
        this.playAudio(q.correct.audio_file);
      } else {
        TTS.speak(q.audio_text || q.question_hanzi || q.correct.hanzi);
      }
    },

    playAudio(filename) {
      if (!filename) return;
      const path = `books/book${quizState.book}/audio_b${quizState.book}/${filename}`;
      new Audio(path).play().catch(err => console.error("Quiz Audio Error:", err));
    }
  };

  // ── Quiz Execution ──────────────────────────────────────────
  function showQuestion() {
    const area = document.getElementById('quiz-area');
    quizState.questionStarted = Date.now();
    const q = quizState.questions[quizState.current];
    
    if (!q) {
      showResults();
      return;
    }

    const progress = `${quizState.current + 1} / ${quizState.questions.length}`;
    const pct = Math.round((quizState.current / quizState.questions.length) * 100);

    let questionHTML = '';
    if (q.type === 'pinyin-choice' || q.type === 'tone-choice') {
      questionHTML = `<div class="hanzi-xl mb-8">${q.question_hanzi}</div>`;
    } else if (q.type === 'hanzi-from-pinyin') {
      questionHTML = `<div class="pinyin-display">${q.question_pinyin}</div>`;
    } else if (q.type === 'audio-hanzi') {
      questionHTML = `
        <button class="play-btn-large" onclick="QuizModule.playQuestionAudio()">▶</button>
        <div class="text-muted mt-8">Click to listen</div>`;
    } else if (q.type === 'hanzi-to-def') {
      questionHTML = `
        <div class="hanzi-xl mb-8">${q.question_hanzi}</div>
        <div class="pinyin-display-sm ${App.state.settings.showQuizPinyin === false ? 'hidden' : ''}">${Pinyin.colorize(q.question_pinyin || '')}</div>
        <button class="btn btn-sm btn-ghost mt-8" onclick="QuizModule.playQuestionAudio()">🔊</button>`;
    } else if (q.type === 'def-to-hanzi') {
      questionHTML = `
        <div class="definition-display">"${q.question_def}"</div>`;
    } else if (q.type === 'cloze') {
      questionHTML = `
        <div class="sentence-display mb-12">${q.sentence}</div>
        <div class="text-muted small ${App.state.settings.showQuizPinyin === false ? 'hidden' : ''}">${q.sentence_pinyin || ''}</div>
        <div class="text-italic mt-4">${q.english || ''}</div>`;
    }

    let optionsHTML = q.options.map((opt, i) => {
      let content = '';
      if (q.type === 'hanzi-to-def') content = opt.definition;
      else if (q.type === 'tone-choice') content = opt.label;
      else if (q.type === 'pinyin-choice') content = `<span style="color:var(--tone${Pinyin.getTone(opt.pinyin)||1})">${opt.pinyin}</span>`;
      else content = `<span class="qo-hanzi">${opt.hanzi}</span><span class="qo-pinyin ${App.state.settings.showQuizPinyin === false ? 'hidden' : ''}">${opt.pinyin || ''}</span>`;

      return `<button class="quiz-option" data-correct="${opt.isCorrect}" onclick="handleAnswer(this)">${content}</button>`;
    }).join('');

    area.innerHTML = `
      <div class="quiz-header">
        <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="ml-12 text-small">${progress}</span>
        <span class="badge badge-a2 ml-12">${quizState.score} ✓</span>
      </div>

      <div class="quiz-question-card animate-fade-in">
        <div class="text-small text-muted mb-12 uppercase letter-spacing-1">${q.question_label}</div>
        ${questionHTML}
      </div>

      <div class="quiz-options-grid">${optionsHTML}</div>
      <div id="quiz-feedback" class="quiz-feedback"></div>

      <div class="flex-end mt-20">
        <button id="next-btn" class="btn btn-primary hidden" onclick="QuizModule.nextQuestion()">Next Question →</button>
      </div>
    `;

    if (q.type === 'audio-hanzi') {
      setTimeout(() => QuizModule.playQuestionAudio(), 400);
    }
  }

  window.handleAnswer = function(btn) {
    if (quizState.answered) return;
    quizState.answered = true;

    const q = quizState.questions[quizState.current];
    const isCorrect = btn.dataset.correct === 'true';

    document.querySelectorAll('.quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    if (!isCorrect) btn.classList.add('wrong');

    const feedback = document.getElementById('quiz-feedback');
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'} show`;
    
    const item = q.correct;
    feedback.innerHTML = `
      <div class="flex-center gap-12">
        <span>${isCorrect ? '✓' : '✗'} <strong>${item.traditional || item.hanzi}</strong> [${Pinyin.colorize(item.pinyin)}] - ${item.definition}</span>
        <button class="btn btn-sm btn-ghost" onclick="QuizModule.playQuestionAudio()">🔊</button>
      </div>
    `;

    const elapsed = Date.now() - (quizState.questionStarted || Date.now());
    if (isCorrect) {
      quizState.score++;
      App.unmarkWeak(item.hanzi);
    } else {
      quizState.wrong.push(item);
      App.markWeak(item.hanzi);
      const area = q.type === 'tone-choice' ? 'tone' : (q.type && q.type.includes('pinyin') ? 'pinyin' : 'vocabulary');
      if (window.WeaknessEngine) WeaknessEngine.record(area, { hanzi: item.hanzi, label: item.traditional || item.hanzi, type: 'quiz-wrong', ms: elapsed });
    }
    if (elapsed > 9000 && window.WeaknessEngine) WeaknessEngine.record('slow', { hanzi: item.hanzi, label: item.traditional || item.hanzi, type: 'quiz-slow', ms: elapsed });

    document.getElementById('next-btn').classList.remove('hidden');
  };

  window.QuizModule.nextQuestion = function() {
    quizState.answered = false;
    quizState.current++;
    showQuestion();
  };

  function showResults() {
    const area = document.getElementById('quiz-area');
    const total = quizState.questions.length;
    const pct = Math.round((quizState.score / total) * 100);
    const time = Math.round((Date.now() - quizState.startTime) / 1000);

    App.logActivity('🎯', `Quiz completed: ${quizState.score}/${total} (${pct}%)`);
    App.saveProgress();

    area.innerHTML = `
      <div class="card text-center animate-pop-in">
        <div class="result-icon">${pct >= 80 ? '🏆' : pct >= 50 ? '🥈' : '📚'}</div>
        <h2 class="result-score">${pct}%</h2>
        <p class="mb-20">${quizState.score} of ${total} correct in ${time}s</p>
        
        <div class="flex-center gap-12 mb-24">
          <button class="btn btn-primary" onclick="location.reload()">New Quiz</button>
          <button class="btn btn-ghost" onclick="navigate('/')">Dashboard</button>
        </div>

        ${quizState.wrong.length > 0 ? `
          <div class="review-section">
            <h4 class="mb-12 text-muted uppercase small">Items to Review</h4>
            <div class="review-list">
              ${quizState.wrong.map(w => `
                <div class="review-item" onclick="TTS.speak('${w.hanzi}')">
                  <span class="hanzi">${w.traditional || w.hanzi}</span>
                  <span class="pinyin">${w.pinyin}</span>
                  <span class="def">${w.definition}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<p class="text-success">Perfect score! Well done.</p>'}
      </div>
    `;
  }

  return window.QuizModule;

})();
