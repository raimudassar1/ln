/* ═══════════════════════════════════════════════════════════════
   app.js — Core: Router, State, Dashboard, Library, Settings
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── Global State ─────────────────────────────────────────────────────────────
const App = {
  state: {
    characters: [],
    vocabulary: null,
    settings: {},
    progress: {},
    loading: false,
  },

  // Load settings from localStorage
  loadSettings() {
    const defaults = {
      theme: 'light',
      annotation: 'pinyin',       // pinyin | zhuyin | both | none
      toneColors: true,
      dailyGoal: 10,
      quizDifficulty: 'A2',
      showQuizPinyin: true,
      displayName: 'Learner',
      showZhuyinDefault: false,
      unlockAll: true,
    };
    const saved = localStorage.getItem('tocfl_settings');
    this.state.settings = saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    // Force unlockAll to true as requested
    this.state.settings.unlockAll = true;
    this.applyTheme(this.state.settings.theme);
  },

  saveSettings() {
    localStorage.setItem('tocfl_settings', JSON.stringify(this.state.settings));
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  // Load progress from localStorage
  loadProgress() {
    const saved = localStorage.getItem('tocfl_progress');
    const defaults = {
      learnedChars: [],
      weakChars: [],
      savedSet: [],
      quizHistory: [],
      testHistory: [],
      streak: 0,
      lastStudyDate: null,
      totalReviewed: 0,
      dailyReviewed: 0,
      lastDailyDate: new Date().toDateString(),
      activityLog: [],
      chapters: {},
      scenarios: {},
      playground: {},
      onboardingComplete: false,
      mastery: 0
    };
    
    // Load from local storage or use defaults
    this.state.progress = saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };
    
    this.updateStreak();
  },

  saveProgress() {
    localStorage.setItem('tocfl_progress', JSON.stringify(this.state.progress));
  },

  updateStreak() {
    const today = new Date().toDateString();
    const last = this.state.progress.lastStudyDate;
    if (last === today) return; // already counted today

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday) {
      this.state.progress.streak = (this.state.progress.streak || 0) + 1;
    } else if (last !== today) {
      this.state.progress.streak = last ? 0 : (this.state.progress.streak || 0);
    }
    this.state.progress.lastStudyDate = today;

    // Reset daily count if new day
    if (this.state.progress.lastDailyDate !== today) {
      this.state.progress.dailyReviewed = 0;
      this.state.progress.lastDailyDate = today;
    }
  },

  logActivity(icon, text) {
    const log = this.state.progress.activityLog || [];
    log.unshift({ icon, text, time: new Date().toISOString() });
    this.state.progress.activityLog = log.slice(0, 20);
    this.saveProgress();
  },

  markLearned(hanzi) {
    if (!this.state.progress.learnedChars.includes(hanzi)) {
      this.state.progress.learnedChars.push(hanzi);
      this.state.progress.totalReviewed++;
      this.state.progress.dailyReviewed++;
      this.state.progress.lastStudyDate = new Date().toDateString();
      this.saveProgress();
    }
  },

  markWeak(hanzi) {
    if (!this.state.progress.weakChars.includes(hanzi)) {
      this.state.progress.weakChars.push(hanzi);
      this.saveProgress();
    }
  },

  unmarkWeak(hanzi) {
    this.state.progress.weakChars = this.state.progress.weakChars.filter(h => h !== hanzi);
    this.saveProgress();
  },

  addToSaved(hanzi) {
    if (!this.state.progress.savedSet.includes(hanzi)) {
      this.state.progress.savedSet.push(hanzi);
      this.saveProgress();
    }
  },

  removeFromSaved(hanzi) {
    this.state.progress.savedSet = this.state.progress.savedSet.filter(h => h !== hanzi);
    this.saveProgress();
  },
};

// ─── TTS Utility ──────────────────────────────────────────────────────────────
const TTS = {
  speak(text, lang = 'zh-TW', rate = 0.85, options = {}) {
    if (typeof lang === 'object') {
      options = lang;
      lang = options.lang || 'zh-TW';
      rate = options.rate || 0.85;
    } else if (typeof rate === 'object') {
      options = rate;
      rate = options.rate || 0.85;
    }
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Normalization for Pinyin-only inputs or problematic characters
    let processedText = text.toLowerCase().trim();
    
    // Check if input is mostly pinyin (latin chars). If so, it reads disjointedly.
    // Try to strip tone marks and spaces to see if it's purely pinyin
    const isPinyin = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s]+$/.test(processedText);

    // Map common standalone pinyin examples from onboarding to Hanzi
    const exactPinyinMap = {
      'mā': '媽', 'má': '麻', 'mǎ': '馬', 'mà': '罵',
      'bā': '八', 'bá': '拔', 'bǎ': '把', 'bà': '爸',
      'bō': '波', 'bó': '伯', 'bǐ': '比', 'bù': '不',
      'pā': '趴', 'pá': '爬', 'pó': '婆', 'pǐ': '匹',
      'wū': '屋', 'wú': '無', 'wǔ': '五', 'wù': '物',
      'hú': '胡', 'hé': '河', 'hē': '喝', 'hǎo': '好', 'hòu': '後',
      'yī': '一', 'yí': '疑', 'yǐ': '以', 'yì': '意',
      'nǚ': '女', 'lǚ': '旅行', 'qù': '去', 'jū': '居', 'xū': '需',
      'yǔ': '語', 'yú': '魚', 'hǎo': '好', 'nǐ hǎo': '你好',
      'nǐ': '你', 'nán': '南', 'nǎi': '奶', 'niú': '牛',
      'lǐ': '裡', 'lán': '藍', 'lái': '來', 'liù': '六',
      'jiā': '家', 'jiē': '街', 'jiù': '舊',
      'qī': '七', 'qù': '去', 'qǐ': '起',
      'xī': '西', 'xiā': '蝦', 'xiǎo': '小', 'xīn': '心', 'xiū': '修', 'xiē': '些',
      'zhī': '知', 'zhǐ': '紙', 'zhù': '住', 'zhǎo': '找', 'zhā': '渣', 'zhài': '債', 'zhōng': '中',
      'zī': '資', 'zǐ': '子', 'zù': '租', 'zǎo': '早', 'zài': '在',
      'chī': '吃', 'chū': '出', 'shā': '沙', 'shēn': '身', 'shī': '詩',
      'shū': '書', 'shú': '熟', 'shǔ': '鼠', 'shù': '樹', 'shōu': '收',
      'rén': '人',
      'māo': '貓', 'máo': '毛', 'mǎo': '卯', 'mào': '帽',
      'tāng': '湯', 'táng': '糖', 'tǎng': '躺', 'tàng': '燙',
      'mái': '埋', 'mài': '賣', 'mǎi': '買',
      'wén': '聞', 'wèn': '問',
      'sǐ': '死', 'sì': '四',
      'tiān': '天', 'tī': '梯', 'tài': '太', 'tóu': '頭',
      'dà': '大', 'dài': '帶', 'diào': '掉',
      'fàn': '飯', 'fēi': '飛', 'fān': '翻', 'fāng': '方', 'fēng': '風',
      'gē': '哥', 'gǒu': '狗', 'gōu': '溝', 'gěi': '給', 'gōng': '工',
      'kāi': '開',
      'mén': '門', 'mán': '蠻', 'màn': '慢', 'máng': '忙', 'míng': '明', 'mēng': '蒙',
      'bēi': '杯', 'bào': '報', 'biàn': '變', 'biē': '憋',
      'piào': '票',
      'b': '玻', 'p': '坡', 'm': '摸', 'f': '佛',
      'd': '得', 't': '特', 'n': '訥', 'l': '勒',
      'g': '哥', 'k': '科', 'h': '喝',
      'j': '基', 'q': '欺', 'x': '希',
      'zh': '知', 'ch': '蚩', 'sh': '詩', 'r': '日',
      'z': '資', 'c': '雌', 's': '思',
      'a': '啊', 'o': '喔', 'e': '鵝', 'i': '衣', 'u': '烏', 'ü': '迂'
    };

    if (exactPinyinMap[processedText]) {
      processedText = exactPinyinMap[processedText];
    } else if (isPinyin) {
      // If it's pinyin and not in map, the TTS will likely spell it out.
      // We let it pass but it's a known limitation for native TTS engines without pinyin support.
      processedText = text;
    } else {
      processedText = text;
    }

    const utt = new SpeechSynthesisUtterance(processedText);
    utt.lang = lang;
    utt.rate = rate;
    const gender = options.gender || null;
    utt.pitch = options.pitch || (gender === 'male' ? 0.88 : gender === 'female' ? 1.08 : 1.0);

    // Try to get a high-quality Chinese voice. Gender is best-effort because browsers expose different voice lists.
    const voices = window.speechSynthesis.getVoices();
    const preferredFemale = ['Yating', 'Hanhan', 'Xiaoxiao', 'HsiaoChen', 'Mei-Jia', 'Ting-Ting', 'Google 國語'];
    const preferredMale = ['Yunxi', 'Zhiwei', 'Kangkang', 'Google 普通话', 'Google Mandarin'];
    const preferred = [
      'Microsoft Yating Online (Natural) - Chinese (Taiwan)',
      'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
      'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
      'Microsoft Hiuga Online (Natural) - Chinese (Hong Kong)',
      'Google 國語', 'Google 普通话', 'Google Mandarin',
      'Xiaoxiao', 'Yating', 'Hanhan', 'Yunxi', 'Zhiwei', 'Mei-Jia'
    ];
    const zhVoices = voices.filter(v => v.lang && v.lang.startsWith('zh'));
    const genderNames = gender === 'male' ? preferredMale : gender === 'female' ? preferredFemale : [];
    let bestVoice = null;

    for (const name of genderNames) {
      bestVoice = zhVoices.find(v => v.name.includes(name));
      if (bestVoice) break;
    }

    if (!bestVoice) {
      for (const name of preferred) {
        bestVoice = zhVoices.find(v => v.name.includes(name));
        if (bestVoice) break;
      }
    }
    
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang === lang) || voices.find(v => v.lang === 'zh-TW') || zhVoices[0];
    }
    
    if (bestVoice) utt.voice = bestVoice;

    window.speechSynthesis.speak(utt);
    return utt;
  },

  ready(cb) {
    if (window.speechSynthesis.getVoices().length) { cb(); return; }
    window.speechSynthesis.addEventListener('voiceschanged', cb, { once: true });
  },
};

// ─── Pinyin Utilities ─────────────────────────────────────────────────────────
const Pinyin = {
  TONE_MAP: {
    'a': ['ā','á','ǎ','à','a'], 'e': ['ē','é','ě','è','e'],
    'i': ['ī','í','ǐ','ì','i'], 'o': ['ō','ó','ǒ','ò','o'],
    'u': ['ū','ú','ǔ','ù','u'], 'v': ['ǖ','ǘ','ǚ','ǜ','ü'],
  },

  // Get tone number from pinyin with diacritics
  getTone(pinyin) {
    if (!pinyin) return 0;
    const p = pinyin.toLowerCase();
    if (/[āēīōūǖ]/.test(p)) return 1;
    if (/[áéíóúǘ]/.test(p)) return 2;
    if (/[ǎěǐǒǔǚ]/.test(p)) return 3;
    if (/[àèìòùǜ]/.test(p)) return 4;
    return 5; // neutral
  },

  // Wrap a pinyin string in a tone-colored span
  colorize(pinyin) {
    if (!App.state.settings.toneColors) return `<span class="pinyin">${pinyin}</span>`;
    const tone = this.getTone(pinyin);
    const cls = tone >= 1 && tone <= 5 ? `tone${tone}` : '';
    return `<span class="pinyin ${cls}">${pinyin}</span>`;
  },

  // Convert numbered pinyin (ni3) → diacritics (nǐ) — simple heuristic
  numberedToMarked(s) {
    if (!s) return '';
    return s.replace(/([a-zA-ZüÜ]+)([1-5])/g, (_, syl, tone) => {
      const t = parseInt(tone) - 1;
      const lower = syl.toLowerCase();
      for (const [base, marks] of Object.entries(this.TONE_MAP)) {
        if (lower.includes(base)) {
          return syl.replace(new RegExp(base, 'i'), marks[t] || base);
        }
      }
      return syl;
    });
  },
};

// ─── API Client (Static Version for GitHub Pages) ───────────────────────────────────
const API = {
  base: 'data', // Relative to public/

  async get(path) {
    // For static files, we just append .json if it's not already there
    let url = `${this.base}/${path}`;
    if (!url.endsWith('.json')) url += '.json';
    
    // Cache buster for static local files
    url += `?v=${Date.now()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
    return res.json();
  },

  async getCharacters(params = {}) {
    // For static, we always load characters_all.json and filter in-memory if needed
    // However, App.boot already preloads App.state.characters
    if (App.state.characters && App.state.characters.length > 0 && Object.keys(params).length > 0) {
        let results = [...App.state.characters];
        const { level, category, search, limit = 50, offset = 0 } = params;
        if (level) results = results.filter(c => c.level === level.toLowerCase());
        if (category) results = results.filter(c => c.category === category.toLowerCase());
        if (search) {
            const q = search.trim().toLowerCase();
            results = results.filter(c => 
                c.hanzi.includes(q) || 
                (c.traditional && c.traditional.includes(q)) ||
                (c.definition && c.definition.toLowerCase().includes(q)) ||
                (c.pinyin && c.pinyin.toLowerCase().includes(q))
            );
        }
        return { total: results.length, data: results.slice(offset, offset + limit) };
    }
    const result = await this.get('characters_all');
    return result;
  },

  async getCharacter(hanzi) {
    if (App.state.characters) {
        const char = App.state.characters.find(c => c.hanzi === hanzi || c.traditional === hanzi);
        if (char) return char;
    }
    const result = await this.getCharacters();
    return result.data.find(c => c.hanzi === hanzi || c.traditional === hanzi);
  },

  async getReadings() {
    const readings = await this.get('readings');
    return readings.map(r => ({
      id: r.id, title: r.title, genre: r.genre, difficulty: r.difficulty,
      char_count: r.text_zh ? r.text_zh.length : 0,
      question_count: r.questions ? r.questions.length : 0,
      description: r.description
    }));
  },

  async getReading(id) {
    const readings = await this.get('readings');
    const reading = readings.find(r => r.id === id);
    if (reading && !reading.tokens) {
        const vocab = await this.get('vocabulary');
        reading.tokens = this.annotateText(reading.text_zh, App.state.characters, vocab);
    }
    return reading;
  },

  async annotate(text) {
    const vocab = await this.get('vocabulary');
    const tokens = this.annotateText(text, App.state.characters, vocab);
    return { tokens };
  },

  async fetchURL(url) {
    throw new Error('URL fetching is not supported in the static version. Please copy-paste text instead.');
  },

  async getMockTests(type) {
    const tests = await this.get('mock-tests');
    let filtered = tests;
    if (type) filtered = tests.filter(t => t.type === type);
    return filtered.map(t => ({
      id: t.id, title: t.title, type: t.type, difficulty: t.difficulty,
      question_count: t.questions ? t.questions.length : 0,
      time_limit: t.time_limit
    }));
  },

  async getMockTest(id) {
    const tests = await this.get('mock-tests');
    return tests.find(t => t.id === id);
  },

  async getStats() {
    const characters = App.state.characters;
    const byLevel = { novice: 0, a1: 0, a2: 0, b1: 0 };
    (characters || []).forEach(c => { if (byLevel[c.level] !== undefined) byLevel[c.level]++; });
    return { total_characters: characters.length, by_level: byLevel, app_version: '2.0.0 (Static)' };
  },

  annotateText(text, characters, vocab) {
    if (!text || !characters) return [];
    const charMap = {};
    characters.forEach(c => { charMap[c.hanzi] = c; if (c.traditional) charMap[c.traditional] = c; });
    const wordMap = {};
    if (vocab && vocab.sets) {
      vocab.sets.forEach(set => {
        (set.words || []).forEach(w => {
          if (w.word && w.word.length > 1) wordMap[w.word] = w;
        });
      });
    }
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (!this.isChinese(ch)) {
        tokens.push({ hanzi: ch, pinyin: '', zhuyin: '', definition: '', type: 'punct' });
        i++; continue;
      }
      let matched = false;
      for (let len = Math.min(6, text.length - i); len > 1; len--) {
        const candidate = text.substring(i, i + len);
        if (wordMap[candidate]) {
          const w = wordMap[candidate];
          tokens.push({ hanzi: candidate, pinyin: w.pinyin || '', zhuyin: w.zhuyin || '', definition: w.definition || '', type: 'word' });
          i += len; matched = true; break;
        }
      }
      if (!matched) {
        const data = charMap[ch];
        if (data) {
          tokens.push({ hanzi: ch, pinyin: data.pinyin || '', zhuyin: data.zhuyin || '', definition: data.definition || '', type: 'char' });
        } else {
          tokens.push({ hanzi: ch, pinyin: '', zhuyin: '', definition: '', type: 'unknown' });
        }
        i++;
      }
    }
    return tokens;
  },

  isChinese(ch) {
    const code = ch.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf) || (code >= 0xf900 && code <= 0xfaff);
  }
};

// ─── Modal ────────────────────────────────────────────────────────────────────
window.Modal = {
  show(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.hide();
    }, { once: true });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hide();
    }, { once: true });
  },

  hide() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },
};

const Modal = window.Modal;

// ─── Word/Character Detail Bridge ───────────────────────────────────────────
function showWordDetail(word) {
  if (window.VocabularyModule && window.VocabularyModule.showDetail(word)) {
    // Success
  } else {
    showCharModal(word[0]); // Fallback to first character
  }
}

// ─── Character Detail Modal ───────────────────────────────────────────────────
async function showCharModal(hanziOrObj) {
  let char;
  if (typeof hanziOrObj === 'object') {
    char = hanziOrObj;
  } else {
    try { 
      char = await API.getCharacter(hanziOrObj); 
      if (!char) throw new Error('Not found');
    }
    catch (e) { 
      console.warn('Character not found:', hanziOrObj);
      return; 
    }
  }

  const toneClass = `tone${Pinyin.getTone(char.pinyin)}`;
  const isSaved = App.state.progress.savedSet.includes(char.hanzi);
  const isLearned = App.state.progress.learnedChars.includes(char.hanzi);

  const exWords = (char.example_words || []).map(w => `
    <div class="example-word-item">
      <span class="ew-word">${w.word}</span>
      <span class="ew-pinyin">${w.pinyin || ''}</span>
      <span class="ew-def">${w.definition || ''}</span>
    </div>`).join('');

  const sentence = char.example_sentence || {};

  // Ensure modal is wide enough for the 2-column layout
  const modalContent = document.getElementById('modal-content');
  if (modalContent) modalContent.style.maxWidth = '800px';

  Modal.show(`
    <button class="modal-close" onclick="Modal.hide()">✕</button>

    <div class="vd-layout" style="margin-top: 10px;">
      <!-- Left: Context & Explanation -->
      <div class="vd-left" style="text-align:left">
        <div class="vd-word-header" onclick="TTS.speak('${char.traditional || char.hanzi}')" style="cursor:pointer; display:inline-block; margin-bottom:16px">
          <div class="vd-hanzi" style="text-align:left; line-height:1">${char.traditional || char.hanzi}</div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
            <span class="vd-pinyin tone-colors" style="margin-top:0">${Pinyin.colorize(char.pinyin || '')}</span>
            <span class="vd-audio-icon">🔊</span>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
          <span class="badge ${char.tocfl_band === 'A2' ? 'badge-a2' : 'badge-b1'}">${char.tocfl_band || char.level || ''}</span>
          <span class="badge badge-gray">${char.category || ''}</span>
          <span class="badge badge-gray">${char.stroke_count || '?'} strokes</span>
          <span class="text-muted text-small" style="margin-left:auto">Rank #${char.frequency_rank || '?'}</span>
        </div>

        <div class="modal-section">
          <h4>Definition</h4>
          <p style="font-size:1rem;color:var(--text)">${char.definition || ''}</p>
        </div>

        ${char.example_words && char.example_words.length ? `
        <div class="modal-section">
          <h4>Example Words</h4>
          ${exWords}
        </div>` : ''}

        ${sentence.sentence ? `
        <div class="modal-section">
          <h4>Example Sentence</h4>
          <div class="sentence-block">
            <div class="sb-zh">${sentence.sentence}</div>
            <div class="sb-py">${sentence.pinyin || ''}</div>
            <div class="sb-en">${sentence.english || ''}</div>
          </div>
        </div>` : ''}

        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn ${isSaved ? 'btn-secondary' : 'btn-outline'}" id="modal-save-btn"
            onclick="toggleSaveChar('${char.hanzi}', this)">
            ${isSaved ? '★ Saved' : '☆ Save'}
          </button>
          <button class="btn ${isLearned ? 'btn-secondary' : 'btn-gold'}" id="modal-learn-btn"
            onclick="markLearnedFromModal('${char.hanzi}', this)">
            ${isLearned ? '✓ Learned' : 'Mark Learned'}
          </button>
        </div>
      </div>

      <!-- Right: Interactive Drawing Canvas -->
      <div class="vd-right" style="display:flex; flex-direction:column;">
        <div class="vd-section" style="flex:1; display:flex; flex-direction:column; margin-bottom:0">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px">
            <div class="flex items-center gap-8">
              <select class="input input-sm" style="width:auto; padding:2px 8px; height:28px; font-size:0.75rem" onchange="DrawingBoard.setMode(this.value)">
                <option value="guided">Guided</option>
                <option value="freehand">Freehand</option>
              </select>
              <div id="app-pen-controls" style="display:none; align-items:center; gap:8px">
                <input type="range" min="1" max="15" value="4" style="width:60px" oninput="DrawingBoard.setPenWidth(this.value)">
                <label style="font-size:0.7rem; display:flex; align-items:center; gap:4px; user-select:none; cursor:pointer">
                    <input type="checkbox" onchange="DrawingBoard.setPenOnly(this.checked)"> Pen Only
                </label>
              </div>
            </div>
            <div class="flex gap-8">
              <button class="btn btn-ghost btn-sm" onclick="App.animateStrokes()">Animate</button>
              <button class="btn btn-ghost btn-sm" onclick="App.clearCanvas()">Reset 🔄</button>
            </div>
          </div>
          <div class="canvas-container" style="flex:1; min-height:300px; background:var(--off-white); border:2px dashed var(--border); border-radius:var(--radius); position:relative; overflow:hidden; touch-action:none; display:flex; align-items:center; justify-content:center;">
            <div id="app-hanzi-writer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"></div>
            <canvas id="app-freehand-canvas" style="position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; display:none"></canvas>
          </div>
        </div>
      </div>
    </div>
  `);

  setTimeout(() => {
    DrawingBoard.init('app-hanzi-writer', 'app-freehand-canvas', char.hanzi);
    
    // Toggle pen controls visibility based on mode
    const modeSelect = document.querySelector('.vd-right select');
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const controls = document.getElementById('app-pen-controls');
            if (controls) controls.style.display = e.target.value === 'freehand' ? 'flex' : 'none';
        });
    }
  }, 50);
}

App.clearCanvas = function() {
  DrawingBoard.reset();
};

App.animateStrokes = function() {
  DrawingBoard.animate();
};

App.initDrawingPad = function(hanzi) {
  DrawingBoard.init('app-hanzi-writer', 'app-freehand-canvas', hanzi);
};
function toggleSaveChar(hanzi, btn) {
  if (App.state.progress.savedSet.includes(hanzi)) {
    App.removeFromSaved(hanzi);
    btn.textContent = '☆ Save';
    btn.className = 'btn btn-outline';
  } else {
    App.addToSaved(hanzi);
    btn.textContent = '★ Saved';
    btn.className = 'btn btn-secondary';
  }
}

function markLearnedFromModal(hanzi, btn) {
  App.markLearned(hanzi);
  btn.textContent = '✓ Learned';
  btn.className = 'btn btn-secondary';
  App.logActivity('✅', `Marked 「${hanzi}」 as learned`);
  updateStreakDisplay();
}

function resetAllProgress() {
  if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
    localStorage.removeItem('tocfl_progress');
    location.reload();
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
const routes = {
  '/':                    { title: 'Dashboard',          render: renderDashboard,         route: 'dashboard' },
  '/onboarding':          { title: 'Pinyin & Tones',     render: renderOnboarding,        route: 'onboarding' },
  '/beginner-launchpad':  { title: 'Beginner Launchpad', render: renderBeginnerLaunchpadPage, route: 'beginner-launchpad' },
  '/beginner-coach':      { title: 'Beginner Coach',     render: renderBeginnerCoachPage, route: 'beginner-coach' },
  '/learn':               { title: 'Learning Path',      render: renderLearnPath,         route: 'learn' },
  '/b1-coach':           { title: 'B1 Coach',           render: renderB1CoachPage,      route: 'b1-coach' },
  '/study-plan':         { title: 'Study Today',        render: renderStudyPlanPage,    route: 'study-plan' },
  '/mixed-recall':       { title: 'Mixed Recall',       render: renderMixedRecallPage,  route: 'mixed-recall' },
  '/sentence-builder':   { title: 'Sentence Builder',   render: renderSentenceBuilderPage, route: 'sentence-builder' },
  '/chapters':            { title: 'Chapters',           render: renderChaptersPage,      route: 'chapters' },
  '/playground':          { title: 'Beginner Playground', render: renderPlayground,       route: 'playground' },
  '/char-playground':     { title: 'Character Playground',render: renderCharPlayground,   route: 'char-playground' },
  '/scenarios':           { title: 'Everyday Scenarios', render: renderScenariosPage,     route: 'scenarios' },
  '/library':             { title: 'Character Library',  render: renderLibrary,           route: 'library' },
  '/vocabulary':          { title: 'Vocabulary Library', render: renderVocabLibrary,       route: 'vocabulary' },
  '/vocabulary-books':    { title: 'Course Books',       render: renderVocabularyBooks,    route: 'vocabulary-books' },
  '/grammar':             { title: 'Grammar Academy',    render: renderGrammarLibrary,     route: 'grammar' },
  '/flashcards':          { title: 'Flashcards',         render: renderFlashcardsPage,    route: 'flashcards' },
  '/dialogue':            { title: 'Dialogue Practice',  render: renderDialoguePage,      route: 'dialogue' },
  '/quiz/pronunciation':  { title: 'Pronunciation Quiz', render: renderPronunciationQuiz, route: 'quiz-pronunciation' },
  '/quiz/vocabulary':     { title: 'Vocabulary Quiz',    render: renderVocabQuiz,         route: 'quiz-vocabulary' },
  '/quiz/flash':          { title: 'Picture Flash Quiz', render: renderFlashQuizPage,     route: 'quiz-flash' },
  '/quiz/tones':          { title: 'Tone Training',      render: renderToneGame,          route: 'quiz-tones' },
  '/reading':             { title: 'Reading',            render: renderReadingPage,       route: 'reading' },
  '/mock-test/reading':   { title: 'Reading Mock Test',  render: renderMockReadingPage,   route: 'mock-reading' },
  '/mock-test/listening': { title: 'Listening Mock Test', render: renderMockListeningPage, route: 'mock-listening' },

  '/tocfl':               { title: 'TOCFL Exam Center', render: renderTOCFLPage,       route: 'tocfl' },
  '/tocfl-content':       { title: 'TOCFL Content',      render: renderTOCFLContentPage, route: 'tocfl-content' },
  '/exams':               { title: 'Monthly Exams',      render: renderExamsPage,         route: 'exams' },
  '/settings':            { title: 'Settings',           render: renderSettings,          route: 'settings' },
};

function navigate(path) {
  const raw = String(path || '/').trim();
  const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const normalized = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  window.location.hash = '#' + normalized;
}

function resolveRoute(path) {
  if (routes[path]) return routes[path];
  if (path.startsWith('/beginner-launchpad/')) return routes['/beginner-launchpad'];
  if (path.startsWith('/beginner-coach/')) return routes['/beginner-coach'];
  return routes['/'];
}

function getPath() {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return '/';
  return hash.replace('#', '') || '/';
}

let routerRenderToken = 0;

async function router() {
  const token = ++routerRenderToken;
  const path = getPath();
  const route = resolveRoute(path);
  closeMobileNav();

  // Update nav active state
  updateSidebarActive(route.route);
  updateMobileSectionState(route.route);

  document.getElementById('topbar-title').textContent = route.title;

  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="spinner"></div>';

  try {
    await route.render(content);
    if (token !== routerRenderToken) { router(); return; }
    if (resolveRoute(getPath()).route !== route.route) router();
  } catch (err) {
    if (token !== routerRenderToken) return;
    content.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">!</div>
        <h3>Something went wrong</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary mt-8" onclick="location.reload()">Reload</button>
      </div>`;
    console.error('Route error:', err);
  }
}


window.addEventListener('hashchange', router);

function closeMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('nav-scrim');
  const toggle = document.getElementById('mobile-menu-toggle');
  sidebar?.classList.remove('open');
  document.body.classList.remove('nav-open');
  if (scrim) scrim.hidden = true;
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

const mobileNavGroups = {
  start: ['dashboard', 'b1-coach', 'study-plan', 'learn'],
  beginner: ['beginner-coach', 'beginner-launchpad', 'quiz-flash', 'onboarding', 'quiz-pronunciation', 'quiz-tones', 'playground'],
  course: ['vocabulary-books', 'chapters', 'grammar', 'dialogue', 'reading', 'scenarios'],
  practice: ['flashcards', 'mixed-recall', 'sentence-builder', 'char-playground', 'library', 'vocabulary'],
  exams: ['tocfl', 'tocfl-content', 'exams', 'mock-reading', 'mock-listening', 'quiz-vocabulary']
};

function updateSidebarActive(routeName) {
  document.querySelectorAll('#sidebar .nav-item[data-route]').forEach(item => {
    item.classList.toggle('active', item.dataset.route === routeName);
  });
}

function updateMobileSectionState(routeName) {
  const activeGroup = Object.entries(mobileNavGroups).find(([, routes]) => routes.includes(routeName))?.[0] || 'start';
  document.querySelectorAll('.bottom-nav-menu').forEach(btn => btn.classList.toggle('active', btn.dataset.mobileMenu === activeGroup));
  document.querySelectorAll('.mobile-section-link').forEach(link => link.classList.toggle('active', link.dataset.route === routeName));
  closeMobileSectionTray();
}

function closeMobileSectionTray() {
  const bar = document.getElementById('mobile-section-bar');
  if (!bar) return;
  bar.hidden = true;
  bar.classList.remove('open');
  document.querySelectorAll('.bottom-nav-menu').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
}

function openMobileSection(section) {
  const bar = document.getElementById('mobile-section-bar');
  if (!bar) return;
  const sections = {
    start: [['/', 'dashboard', 'Dashboard'], ['/b1-coach', 'b1-coach', 'B1 Coach'], ['/study-plan', 'study-plan', 'Today'], ['/learn', 'learn', 'Path']],
    beginner: [['/beginner-coach', 'beginner-coach', 'Coach'], ['/beginner-launchpad', 'beginner-launchpad', 'Launchpad'], ['/quiz/flash', 'quiz-flash', 'Picture Quiz'], ['/onboarding', 'onboarding', 'Pinyin'], ['/quiz/pronunciation', 'quiz-pronunciation', 'Pronunciation'], ['/quiz/tones', 'quiz-tones', 'Tones'], ['/playground', 'playground', 'Playground']],
    course: [['/vocabulary-books', 'vocabulary-books', 'Books'], ['/chapters', 'chapters', 'Chapters'], ['/grammar', 'grammar', 'Grammar'], ['/dialogue', 'dialogue', 'Dialogue'], ['/reading', 'reading', 'Reading'], ['/scenarios', 'scenarios', 'Scenarios']],
    practice: [['/flashcards', 'flashcards', 'Cards'], ['/mixed-recall', 'mixed-recall', 'Mixed'], ['/sentence-builder', 'sentence-builder', 'Sentences'], ['/char-playground', 'char-playground', 'Characters'], ['/library', 'library', 'Library'], ['/vocabulary', 'vocabulary', 'Words']],
    exams: [['/tocfl', 'tocfl', 'TOCFL'], ['/tocfl-content', 'tocfl-content', 'Native'], ['/exams', 'exams', 'Monthly'], ['/mock-test/reading', 'mock-reading', 'Reading Test'], ['/mock-test/listening', 'mock-listening', 'Listening Test'], ['/quiz/vocabulary', 'quiz-vocabulary', 'Vocab Quiz']]
  };
  const sectionIcons = {
    dashboard: 'dashboard', 'b1-coach': 'route', 'beginner-coach': 'check', learn: 'map', onboarding: 'music', chapters: 'book', 'beginner-launchpad': 'layers',
    'vocabulary-books': 'notebook', library: 'library', vocabulary: 'vocabulary', grammar: 'grammar', flashcards: 'flashcards',
    tocfl: 'target', 'tocfl-content': 'file', 'quiz-vocabulary': 'vocabulary', 'quiz-flash': 'flashcards', 'quiz-tones': 'target',
    'quiz-pronunciation': 'letters', exams: 'exam', reading: 'reading', dialogue: 'dialogue', 'mock-reading': 'file',
    'mock-listening': 'headphones', 'study-plan': 'check', 'mixed-recall': 'brain', 'sentence-builder': 'layers',
    playground: 'play', 'char-playground': 'puzzle', scenarios: 'scenarios'
  };
  const renderIcon = route => window.IconSystem?.svg(sectionIcons[route] || 'dashboard') || '';
  const currentRoute = resolveRoute(getPath()).route;
  bar.innerHTML = (sections[section] || sections.start)
    .map(([href, route, label]) => `<a class="mobile-section-link" data-route="${route}" href="#${href}">${renderIcon(route)}<span>${label}</span></a>`)
    .join('');
  const isOpenForSection = !bar.hidden && bar.dataset.section === section;
  if (isOpenForSection) {
    closeMobileSectionTray();
    return;
  }
  bar.dataset.section = section;
  bar.hidden = false;
  bar.classList.add('open');
  document.querySelectorAll('.bottom-nav-menu').forEach(btn => {
    const isActive = btn.dataset.mobileMenu === section;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-expanded', String(isActive));
  });
  document.querySelectorAll('.mobile-section-link').forEach(link => link.classList.toggle('active', link.dataset.route === currentRoute));
}

function setupMobileBottomNav() {
  let lastTouchActivation = 0;
  const activate = (btn, source = 'click') => {
    const section = btn?.dataset?.mobileMenu;
    if (!section) return;
    if (source === 'touch' || source === 'pointer-touch') lastTouchActivation = Date.now();
    openMobileSection(section);
  };
  document.querySelectorAll('.bottom-nav-menu').forEach(btn => {
    btn.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault();
      activate(btn, 'pointer-touch');
    }, { passive: false });
    btn.addEventListener('touchend', e => {
      if (Date.now() - lastTouchActivation < 450) return;
      e.preventDefault();
      activate(btn, 'touch');
    }, { passive: false });
    btn.addEventListener('click', e => {
      if (Date.now() - lastTouchActivation < 450) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      activate(btn, 'click');
    });
  });
  document.getElementById('mobile-section-bar')?.addEventListener('click', e => {
    const link = e.target.closest('.mobile-section-link');
    if (link) closeMobileSectionTray();
  });
  closeMobileSectionTray();
}
function toggleMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('nav-scrim');
  const toggle = document.getElementById('mobile-menu-toggle');
  const isOpen = !sidebar?.classList.contains('open');
  sidebar?.classList.toggle('open', isOpen);
  document.body.classList.toggle('nav-open', isOpen);
  if (scrim) scrim.hidden = !isOpen;
  if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function renderBeginnerLaunchpadPage(container) {
  if (window.BeginnerLaunchpadModule) return BeginnerLaunchpadModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Beginner Launchpad is not loaded</h3></div>';
}


function renderBeginnerCoachPage(container) {
  if (window.BeginnerCoachModule) return BeginnerCoachModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Beginner Coach is not loaded</h3></div>';
}

function renderB1CoachPage(container) {
  if (window.B1CoachModule) return B1CoachModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>B1 Coach is not loaded</h3></div>';
}

async function renderMixedRecallPage(container) {
  return MixedRecallModule.render(container);
}

async function renderSentenceBuilderPage(container) {
  return SentenceBuilderModule.render(container);
}

async function renderTOCFLPage(container) {
  if (typeof TOCFLModule !== 'undefined') return TOCFLModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>TOCFL Lab is not loaded</h3></div>';
}

async function renderTOCFLContentPage(container) {
  if (typeof TOCFLContentModule !== 'undefined') return TOCFLContentModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>TOCFL Content is not loaded</h3></div>';
}

async function renderStudyPlanPage(container) {
  if (!window.StudyPlanModule) {
    container.innerHTML = '<div class="empty-state"><h3>Study Plan is not loaded</h3></div>';
    return;
  }
  return StudyPlanModule.render(container);
}

async function renderDashboard(container) {
  if (!App.state.characters.length) {
    try {
      const charResult = await API.getCharacters({ limit: 9999 });
      App.state.characters = charResult.data || [];
    } catch (err) {
      console.warn('Dashboard character preload failed:', err.message);
    }
  }

  const prog  = App.state.progress;
  const chars = App.state.characters;
  const totalChars = chars.length || 0;
  const learned    = prog.learnedChars.length;
  const pct        = totalChars > 0 ? Math.round((learned / totalChars) * 100) : 0;
  const daily      = prog.dailyReviewed || 0;
  const goal       = App.state.settings.dailyGoal || 10;
  const dailyPct   = Math.min(100, Math.round((daily / goal) * 100));
  const displayName = App.state.settings.displayName || 'Learner';

  const srs = SRS.getStats();
  const dueToday = srs.due_today || 0;

  const LEVELS = ['novice','a1','a2','b1'];
  const LMETA  = {
    novice:{name:'Novice',color:'#16a34a'},
    a1:{name:'A1',color:'#2563eb'},
    a2:{name:'A2',color:'#d97706'},
    b1:{name:'B1',color:'#7c3aed'}
  };
  const levelStats = LEVELS.map(lvl => {
    const total = chars.filter(c => c.level === lvl).length;
    const done = chars.filter(c => c.level === lvl && prog.learnedChars.includes(c.hanzi)).length;
    return { lvl, ...LMETA[lvl], total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }).filter(l => l.total > 0);

  let cotd = null;
  if (chars.length) {
    const idx = Math.floor(Date.now() / 86400000) % chars.length;
    cotd = chars[idx];
  }

  const recentActivity = (prog.activityLog || []).slice(0, 5);
  const isFirstTime = learned === 0 && !prog.lastStudyDate;
  const renderIcon = name => window.IconSystem?.svg(name) || '';
  const weakCount = (prog.weakChars || []).length;
  const beginnerGuided = window.BeginnerCoachModule ? BeginnerCoachModule.guidedOn() : true;
  const nextHref = beginnerGuided && learned < 120 ? '#/beginner-coach' : '#/b1-coach';
  const nextLabel = beginnerGuided && learned < 120 ? 'Open Beginner Coach' : 'Open B1 Coach';
  const nextTitle = beginnerGuided && learned < 120 ? "Follow today's beginner mission" : "Follow today's B1 mission";
  const nextDesc = beginnerGuided && learned < 120
    ? 'Guided Mode chooses one beginner task, then adds writing and speaking practice without locking the rest of the app.'
    : 'Your 180-day roadmap chooses the tasks, exam focus, and weak-area repair for today.';

  let recommendation = null;
  if (prog.weakChars && prog.weakChars.length > 0) {
    const randomWeak = prog.weakChars[Math.floor(Math.random() * prog.weakChars.length)];
    recommendation = {
      title: 'Targeted Review',
      desc: `You have repeated misses around ${randomWeak}. Give it a short focused pass.`,
      action: `showCharModal('${randomWeak}')`,
      btn: 'Practice Now'
    };
  } else if (learned < 50) {
    recommendation = {
      title: 'Beginner Launchpad',
      desc: 'Start with tiny lessons, first-100 words, mini stories, and no overwhelm.',
      action: "navigate('/beginner-launchpad')",
      btn: 'Open Launchpad'
    };
  }

  const cotdJson = cotd ? JSON.stringify(cotd).replace(/"/g, '&quot;') : '';

  container.innerHTML = `
    <div class="dashboard-modern">
      <section class="dash-hero-modern">
        <div class="dash-hero-copy">
          <div class="dash-kicker"><span>Novice</span><span>A1</span><span>A2</span><span>B1</span></div>
          <h1>Welcome back, ${displayName}</h1>
          <p>${isFirstTime ? 'Start with sound and tone control, then move into characters and real dialogue.' : 'Keep today simple: review what is due, then push one small skill forward.'}</p>
          <div class="dash-hero-actions">
            <a class="btn btn-primary" href="${nextHref}">${renderIcon('play')}<span>${nextLabel}</span></a>
            <a class="btn btn-outline" href="#/tocfl-content">${renderIcon('exam')}<span>TOCFL Practice</span></a>
          </div>
        </div>
        <div class="dash-progress-orbit" aria-label="Overall progress">
          <div class="dash-progress-ring" style="--dash-pct:${pct}">
            <strong>${pct}%</strong>
            <span>${totalChars ? `${learned}/${totalChars}` : 'Ready'}</span>
          </div>
          <div class="dash-ring-label">${totalChars ? 'characters learned' : 'loading library'}</div>
        </div>
      </section>

      <section class="dash-main-grid">
        <article class="dash-next-card">
          <div class="dash-card-icon">${renderIcon('check')}</div>
          <div>
            <div class="dash-card-label">Next best action</div>
            <h2>${nextTitle}</h2>
            <p>${nextDesc}</p>
          </div>
          <a class="btn btn-primary" href="${nextHref}">${nextLabel}</a>
        </article>

        <article class="dash-metric-card">
          <div class="dash-card-icon">${renderIcon('flame')}</div>
          <span>Streak</span>
          <strong>${prog.streak || 0}</strong>
          <small>${daily}/${goal} reviews today</small>
          <div class="dash-mini-bar"><span style="width:${dailyPct}%"></span></div>
        </article>

        <article class="dash-metric-card">
          <div class="dash-card-icon">${renderIcon('brain')}</div>
          <span>SRS Queue</span>
          <strong>${srs.total || 0}</strong>
          <small>${srs.mature || 0} mature - ${dueToday} due</small>
        </article>

        <article class="dash-metric-card">
          <div class="dash-card-icon">${renderIcon('target')}</div>
          <span>Weak Areas</span>
          <strong>${weakCount}</strong>
          <small>${weakCount ? 'Ready for targeted review' : 'No weak areas logged yet'}</small>
        </article>
      </section>

      ${window.WeaknessEngine ? `<div class="dash-weakness-wrap">${WeaknessEngine.renderSummaryCard()}</div>` : ''}

      ${recommendation ? `
      <section class="dash-recommend-card">
        <div class="dash-card-icon">${renderIcon('lightbulb')}</div>
        <div>
          <div class="dash-card-label">Recommended</div>
          <h2>${recommendation.title}</h2>
          <p>${recommendation.desc}</p>
        </div>
        <button class="btn btn-primary" onclick="${recommendation.action}">${recommendation.btn}</button>
      </section>` : ''}

      <section class="dash-action-grid">
        <a href="#/beginner-coach" class="dash-action-card dash-action-card-primary">
          ${renderIcon('check')}
          <strong>Beginner Daily Coach</strong>
          <span>Do exactly this today</span>
        </a>
        <a href="#/beginner-launchpad" class="dash-action-card">
          ${renderIcon('rocket')}
          <strong>Beginner Launchpad</strong>
          <span>First 100 words</span>
        </a>
        <a href="#/b1-coach" class="dash-action-card">
          ${renderIcon('route')}
          <strong>B1 Coach</strong>
          <span>180-day mission plan</span>
        </a>
        <a href="#/study-plan" class="dash-action-card">
          ${renderIcon('check')}
          <strong>Study Today</strong>
          <span>One guided session</span>
        </a>
        <a href="#/mixed-recall" class="dash-action-card">
          ${renderIcon('brain')}
          <strong>Mixed Recall</strong>
          <span>Audio, hanzi, pinyin</span>
        </a>
        <a href="#/sentence-builder" class="dash-action-card">
          ${renderIcon('layers')}
          <strong>Sentence Builder</strong>
          <span>Active grammar practice</span>
        </a>
        <a href="#/dialogue" class="dash-action-card">
          ${renderIcon('dialogue')}
          <strong>Dialogues</strong>
          <span>Real conversation flow</span>
        </a>
        <a href="#/scenarios" class="dash-action-card">
          ${renderIcon('scenarios')}
          <strong>Scenarios</strong>
          <span>Daily life situations</span>
        </a>
        <a href="#/quiz/pronunciation" class="dash-action-card">
          ${renderIcon('letters')}
          <strong>Pronunciation</strong>
          <span>Tones and pinyin</span>
        </a>
      </section>

      ${levelStats.length ? `
      <section class="dash-panel-modern">
        <div class="dash-section-head">
          <div>
            <span>Level map</span>
            <h2>Progress by level</h2>
          </div>
          <a href="#/learn">Open path</a>
        </div>
        <div class="dash-level-grid">
          ${levelStats.map(l => `
            <article class="dash-level-card" style="--level-color:${l.color}">
              <div><strong>${l.name}</strong><span>${l.done}/${l.total}</span></div>
              <div class="dash-level-bar"><span style="width:${l.pct}%"></span></div>
              <small>${l.pct}% complete</small>
            </article>`).join('')}
        </div>
      </section>` : ''}

      ${cotd ? `
      <section class="dash-character-card" data-char="${cotd.traditional || cotd.hanzi}">
        <button class="dash-character-main" onclick="TTS.speak('${cotd.traditional || cotd.hanzi}')" title="Hear character">
          ${cotd.traditional || cotd.hanzi}
        </button>
        <div class="dash-character-info">
          <span>Character of the day</span>
          <h2 class="tone-colors">${Pinyin.colorize(cotd.pinyin || '')}</h2>
          <p>${cotd.definition || ''}</p>
          ${cotd.example_sentence ? `<blockquote>${cotd.example_sentence.sentence || ''}<small>${cotd.example_sentence.english || ''}</small></blockquote>` : ''}
          <div class="dash-character-actions">
            <button class="btn btn-outline btn-sm" onclick="TTS.speak('${cotd.traditional || cotd.hanzi}')">${renderIcon('volume')}<span>Hear</span></button>
            <button class="btn btn-primary btn-sm" onclick="showCharModal(${cotdJson})">Details</button>
          </div>
        </div>
      </section>` : ''}

      <section class="dash-panel-modern">
        <div class="dash-section-head">
          <div>
            <span>Activity</span>
            <h2>Recent learning</h2>
          </div>
        </div>
        ${recentActivity.length ? `
          <div class="dash-activity-list">
            ${recentActivity.map(a => `
              <div class="dash-activity-item">
                <span class="dash-activity-dot"></span>
                <strong>${a.text}</strong>
                <small>${timeAgo(a.time)}</small>
              </div>`).join('')}
          </div>` : `
          <div class="dash-empty-modern">
            ${renderIcon('route')}
            <p>No activity yet. Start with Pinyin & Tones and this area will become your learning timeline.</p>
            <a class="btn btn-primary btn-sm" href="#/onboarding">Start Pinyin</a>
          </div>`}
      </section>
    </div>
  `;

  updateStreakDisplay();
  updateTopbarBadge();
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function updateStreakDisplay() {
  const el = document.getElementById('streak-count');
  if (el) el.textContent = App.state.progress.streak || 0;
}

// ─── Library ──────────────────────────────────────────────────────────────────
let libraryState = {
  search: '', level: '', category: '', offset: 0, limit: 60,
  total: 0, data: [],
};

async function renderLibrary(container) {
  if (App.state.lastLevelFilter) {
    libraryState.level = App.state.lastLevelFilter;
    libraryState.offset = 0;
    App.state.lastLevelFilter = null;
  }

  // Render skeleton immediately
  container.innerHTML = `
    <div class="page-header">
      <h2>Character Library</h2>
      <p>Browse all 1,443 TOCFL characters with pinyin, zhuyin & definitions.</p>
    </div>
    <div class="library-controls">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" class="input" id="lib-search" placeholder="Search hanzi, pīnyīn, or English…" value="${libraryState.search}">
      </div>
      <select class="input" id="lib-level" style="width:auto;min-width:100px">
        <option value="">All Levels</option>
        <option value="novice" ${libraryState.level==='novice'?'selected':''}>Novice</option>
        <option value="a1" ${libraryState.level==='a1'?'selected':''}>A1</option>
        <option value="a2" ${libraryState.level==='a2'?'selected':''}>A2</option>
        <option value="b1" ${libraryState.level==='b1'?'selected':''}>B1</option>
        <option value="b2" ${libraryState.level==='b2'?'selected':''}>B2</option>
        <option value="c1" ${libraryState.level==='c1'?'selected':''}>C1</option>
      </select>
      <select class="input" id="lib-category" style="width:auto;min-width:130px">
        <option value="">All Categories</option>
      </select>
      <button class="btn btn-ghost btn-sm" id="lib-reset">Reset</button>
    </div>
    <div id="lib-results-info" class="text-small text-muted mb-12"></div>
    <div class="char-grid" id="char-grid"><div class="spinner"></div></div>
    <div class="pagination" id="lib-pagination"></div>
  `;

  // Wire up controls
  let searchTimeout;
  document.getElementById('lib-search')?.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      libraryState.search = e.target.value;
      libraryState.offset = 0;
      loadLibraryPage();
    }, 300);
  });

  document.getElementById('lib-level')?.addEventListener('change', e => {
    libraryState.level = e.target.value;
    libraryState.offset = 0;
    loadLibraryPage();
  });

  document.getElementById('lib-category')?.addEventListener('change', e => {
    libraryState.category = e.target.value;
    libraryState.offset = 0;
    loadLibraryPage();
  });

  document.getElementById('lib-reset')?.addEventListener('click', () => {
    libraryState = { search: '', level: '', category: '', offset: 0, limit: 60, total: 0, data: [] };
    document.getElementById('lib-search').value = '';
    document.getElementById('lib-level').value = '';
    document.getElementById('lib-category').value = '';
    loadLibraryPage();
  });

  // Populate Categories from currently loaded character set
  const catSel = document.getElementById('lib-category');
  if (catSel && App.state.characters.length > 0) {
    const categories = [...new Set(App.state.characters.map(c => c.category).filter(Boolean))].sort();
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      if (c === libraryState.category) opt.selected = true;
      catSel.appendChild(opt);
    });
  }

  await loadLibraryPage();
}

async function loadLibraryPage() {
  const grid = document.getElementById('char-grid');
  const info = document.getElementById('lib-results-info');
  if (!grid) return;

  grid.innerHTML = '<div class="spinner"></div>';

  try {
    const params = {
      limit: libraryState.limit,
      offset: libraryState.offset,
    };
    if (libraryState.search) params.search = libraryState.search;
    if (libraryState.level) params.level = libraryState.level;
    if (libraryState.category) params.category = libraryState.category;

    const result = await API.getCharacters(params);
    libraryState.total = result.total;
    libraryState.data = result.data;

    if (info) info.textContent = `Showing ${result.data.length} of ${result.total} characters`;

    if (!result.data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">🔍</div><h3>No characters found</h3><p>Try a different search term or filter.</p></div>`;
      renderPagination();
      return;
    }

    grid.innerHTML = result.data.map(c => {
      const isLearned = App.state.progress.learnedChars.includes(c.hanzi);
      const isWeak = App.state.progress.weakChars.includes(c.hanzi);
      const toneClass = Pinyin.getTone(c.pinyin) ? `tone${Pinyin.getTone(c.pinyin)}` : '';
      return `
        <div class="char-card ${isLearned ? 'learned' : ''} ${isWeak ? 'weak' : ''}"
             onclick="showCharModal(${JSON.stringify(c).replace(/"/g, '&quot;')})">
          <span class="char-badge card-badge">
            <span class="badge badge-${c.level || 'a2'}">${(c.level || '').toUpperCase()}</span>
          </span>
          <span class="char-hanzi">${c.traditional || c.hanzi}</span>
          <div class="char-pinyin tone-colors ${toneClass}" style="color:var(--tone${Pinyin.getTone(c.pinyin) || 1})">${c.pinyin || ''}</div>
          <div class="char-zhuyin">${c.zhuyin || ''}</div>
          <div class="char-def">${c.definition || ''}</div>
        </div>`;
    }).join('');

    renderPagination();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">⚠️</div><h3>Failed to load characters</h3><p>${err.message}</p></div>`;
  }
}

function renderPagination() {
  const container = document.getElementById('lib-pagination');
  if (!container) return;

  const { total, limit, offset } = libraryState;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit);

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="libGoPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>← Prev</button>`;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  pages.forEach(p => {
    if (p === '…') {
      html += `<span style="padding:6px 4px;color:var(--text-3)">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="libGoPage(${p})">${p + 1}</button>`;
    }
  });

  html += `<button class="page-btn" onclick="libGoPage(${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>`;

  container.innerHTML = html;
}

function libGoPage(page) {
  const totalPages = Math.ceil(libraryState.total / libraryState.limit);
  if (page < 0 || page >= totalPages) return;
  libraryState.offset = page * libraryState.limit;
  loadLibraryPage();
  document.getElementById('char-grid')?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function renderSettings(container) {
  const s = App.state.settings;
  const p = App.state.progress;

  container.innerHTML = `
    <div class="page-header">
      <h2>Settings</h2>
      <p>Customize your learning experience.</p>
    </div>
    <div style="max-width:600px">

      <div class="card mb-16">
        <div class="settings-section">
          <h3>Profile</h3>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Display Name</div>
            </div>
            <input type="text" class="input" id="set-name" value="${s.displayName || 'Learner'}" style="width:180px">
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Daily Character Goal</div>
              <div class="setting-desc">Characters to review per day</div>
            </div>
            <input type="number" class="input" id="set-goal" value="${s.dailyGoal || 10}" min="1" max="100" style="width:80px">
          </div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="settings-section">
          <h3>Display</h3>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Dark Mode</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-dark" ${s.theme === 'dark' ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Tone Colors</div>
              <div class="setting-desc">Color pinyin by tone: <span style="color:var(--tone1)">1st</span> <span style="color:var(--tone2)">2nd</span> <span style="color:var(--tone3)">3rd</span> <span style="color:var(--tone4)">4th</span></div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-tones" ${s.toneColors ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Annotation Mode</div>
              <div class="setting-desc">What to show above characters</div>
            </div>
            <div class="radio-group">
              ${['pinyin','zhuyin','both','none'].map(v => `
                <label class="radio-option">
                  <input type="radio" name="annotation" value="${v}" ${s.annotation === v ? 'checked' : ''}>
                  <label>${v.charAt(0).toUpperCase()+v.slice(1)}</label>
                </label>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="settings-section">
          <h3>Quiz</h3>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Default Difficulty</div>
            </div>
            <div class="radio-group">
              ${['A2','B1','Both'].map(v => `
                <label class="radio-option">
                  <input type="radio" name="difficulty" value="${v}" ${s.quizDifficulty === v ? 'checked' : ''}>
                  <label>${v}</label>
                </label>`).join('')}
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Show Pinyin in Quizzes</div>
              <div class="setting-desc">Display pinyin hints in audio/recognition quizzes</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-show-quiz-pinyin" ${s.showQuizPinyin !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Unlock All Content</div>
              <div class="setting-desc">Bypass level locks for testing</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="set-unlock-all" ${s.unlockAll ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="settings-section">
          <h3>AI Chat (Beta)</h3>
          <p class="setting-desc mb-12">To use the Smart AI Chat, you need a free API key from <a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent)">Google AI Studio</a>. This key is stored only in your browser.</p>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Gemini API Key</div>
            </div>
            <input type="password" class="input" id="set-gemini-key" value="${s.geminiKey || ''}" placeholder="Paste AI Key here..." style="width:220px">
          </div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="settings-section">
          <h3>Progress</h3>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Learned Characters</div>
            </div>
            <span class="font-bold">${p.learnedChars.length}</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Saved Set</div>
            </div>
            <span class="font-bold">${p.savedSet.length}</span>
          </div>
          <button class="btn btn-outline btn-error mt-12" onclick="resetAllProgress()">Delete All Progress</button>
        </div>
      </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Weak Characters</div>
            </div>
            <span class="font-bold">${p.weakChars.length}</span>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Tests Completed</div>
            </div>
            <span class="font-bold">${(p.testHistory || []).length}</span>
          </div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="settings-section">
          <h3>Data Management</h3>
          <p class="setting-desc mb-16">Since this app runs locally in your browser, you can export your progress to a file to use on another device.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-outline" onclick="exportProgress()">📤 Export Progress</button>
            <button class="btn btn-outline" onclick="document.getElementById('import-file').click()">📥 Import Progress</button>
            <input type="file" id="import-file" style="display:none" onchange="importProgress(this)">
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="set-save-btn">Save Settings</button>
        <button class="btn btn-ghost btn-error" id="set-reset-btn">Reset All Progress</button>
      </div>
      <div id="set-saved-msg" class="hidden" style="margin-top:10px;color:var(--tone2);font-weight:600">✓ Settings saved!</div>
    </div>
  `;

  document.getElementById('set-save-btn')?.addEventListener('click', () => {
    App.state.settings.displayName = document.getElementById('set-name').value || 'Learner';
    App.state.settings.dailyGoal = parseInt(document.getElementById('set-goal').value) || 10;
    App.state.settings.theme = document.getElementById('set-dark').checked ? 'dark' : 'light';
    App.state.settings.toneColors = document.getElementById('set-tones').checked;
    App.state.settings.annotation = document.querySelector('input[name="annotation"]:checked')?.value || 'pinyin';
    App.state.settings.quizDifficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'A2';
    App.state.settings.showQuizPinyin = document.getElementById('set-show-quiz-pinyin').checked;
    App.state.settings.unlockAll = document.getElementById('set-unlock-all').checked;
    App.state.settings.geminiKey = document.getElementById('set-gemini-key').value || '';
    App.saveSettings();
    App.applyTheme(App.state.settings.theme);
    const msg = document.getElementById('set-saved-msg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  });

  document.getElementById('set-reset-btn')?.addEventListener('click', () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) {
      localStorage.removeItem('tocfl_progress');
      App.loadProgress();
      navigate('/');
    }
  });
}

// ─── Progress Management Utilities ───────────────────────────────────────────
function exportProgress() {
  const data = localStorage.getItem('tocfl_progress');
  if (!data) return alert("No progress data to export.");
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mandarin_progress_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importProgress(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm('Importing progress will overwrite your current progress. Continue?')) {
        localStorage.setItem('tocfl_progress', JSON.stringify(data));
        window.location.reload();
      }
    } catch (err) {
      alert("Invalid progress file.");
    }
  };
  reader.readAsText(file);
}

// ─── Stub renders (implemented in other JS files) ─────────────────────────────
// These are defined in their respective files but need to exist at load time
function renderFlashcardsPage(container) {
  if (window.FlashcardsModule) return window.FlashcardsModule.render(container);
  container.innerHTML = '<div class="spinner"></div><p class="text-center text-muted mt-8">Loading flashcards…</p>';
}

function renderPronunciationQuiz(container) {
  if (window.QuizModule) return window.QuizModule.renderPronunciation(container);
  container.innerHTML = '<div class="empty-state"><h3>Quiz Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderVocabQuiz(container) {
  if (window.QuizModule) return window.QuizModule.renderVocabulary(container);
  container.innerHTML = '<div class="empty-state"><h3>Quiz Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderFlashQuizPage(container) {
  if (window.FlashQuizModule) return window.FlashQuizModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Flash Quiz Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderToneGame(container) {
  if (typeof ToneGame !== 'undefined') return ToneGame.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Tone Game Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderVocabLibrary(container) {
  if (window.VocabularyModule) return window.VocabularyModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Vocabulary Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderVocabularyBooks(container) {
  if (window.VocabularyBooksModule) return window.VocabularyBooksModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Course Books Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderGrammarLibrary(container) {
  if (typeof GrammarModule !== 'undefined') return GrammarModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Grammar Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderReadingPage(container) {
  if (typeof ReaderModule !== 'undefined') return ReaderModule.render(container);
}

function renderMockReadingPage(container) {
  if (typeof MockTestModule !== 'undefined') return MockTestModule.renderReading(container);
}

function renderMockListeningPage(container) {
  if (typeof MockTestModule !== 'undefined') return MockTestModule.renderListening(container);
}

function renderExamsPage(container) {
  if (window.ExamModule) return ExamModule.renderHub(container);
  container.innerHTML = '<div class="spinner"></div>';
}

// ─── Topbar level badge ──────────────────────────────────────────────────────
function updateTopbarBadge() {
  const chars = App.state.characters;
  const learned = App.state.progress.learnedChars;
  const badge = document.getElementById('topbar-level');
  if (!badge || !chars.length) return;

  // Find highest level with any learned chars
  const levels = ['b1','a2','a1','novice'];
  let currentLevel = 'Novice';
  let badgeClass = 'badge-gray';
  for (const lvl of levels) {
    const lvlChars = chars.filter(c => c.level === lvl);
    const lvlLearned = lvlChars.filter(c => learned.includes(c.hanzi));
    if (lvlLearned.length > 0) {
      const map = { novice:'Novice', a1:'A1', a2:'A2', b1:'B1' };
      const clsMap = { novice:'badge-gray', a1:'badge-a2', a2:'badge-b1', b1:'badge-red' };
      currentLevel = map[lvl] || lvl.toUpperCase();
      badgeClass = clsMap[lvl] || 'badge-gray';
      break;
    }
  }
  badge.textContent = currentLevel;
  badge.className = 'badge ' + badgeClass;
}

// ─── New module stubs ────────────────────────────────────────
function renderOnboarding(container) {
  if (typeof OnboardingModule !== 'undefined') return OnboardingModule.render(container);
  container.innerHTML = '<div class="spinner"></div>';
}

function renderLearnPath(container) {
  if (typeof LearnModule !== 'undefined') return LearnModule.render(container);
  container.innerHTML = '<div class="spinner"></div>';
}

function renderChaptersPage(container) {
  if (typeof ChapterModule !== 'undefined') return ChapterModule.render(container);
  container.innerHTML = '<div class="spinner"></div>';
}

function renderPlayground(container) {
  if (window.PlaygroundModule) return window.PlaygroundModule.render(container);
  container.innerHTML = '<div class="empty-state"><h3>Playground Module Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderCharPlayground(container) {
  if (window.PlaygroundModule) return window.PlaygroundModule.renderCharPlayground(container);
  container.innerHTML = '<div class="empty-state"><h3>Character Playground Loading Error</h3><p>Please refresh the page to try again.</p></div>';
}

function renderScenariosPage(container) {
  if (typeof ScenarioModule !== 'undefined') return ScenarioModule.render(container);
  container.innerHTML = '<div class="spinner"></div>';
}

function renderDialoguePage(container) {
  if (typeof DialogueModule !== 'undefined') return DialogueModule.render(container);
  container.innerHTML = '<div class="spinner"></div>';
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  App.loadSettings();
  App.loadProgress();

  // Dark mode toggle
  document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    const dark = App.state.settings.theme !== 'dark';
    App.state.settings.theme = dark ? 'dark' : 'light';
    App.saveSettings();
    App.applyTheme(App.state.settings.theme);
  });

  // TTS test
  document.getElementById('tts-test-btn')?.addEventListener('click', () => {
    TTS.speak('你好，歡迎使用漢語學習應用程式。');
  });

  document.getElementById('mobile-menu-toggle')?.addEventListener('click', toggleMobileNav);
  setupMobileBottomNav();
  document.getElementById('nav-scrim')?.addEventListener('click', closeMobileNav);
  document.querySelectorAll('#sidebar .nav-item').forEach(item => {
    item.addEventListener('click', closeMobileNav);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // Route immediately before heavy curriculum preload so pages never sit on the boot spinner.
  router();

  // Preload characters into memory for client-side operations
  try {
    const charResult = await API.getCharacters({ limit: 9999 });
    App.state.characters = charResult.data || [];
    
    const vocabResult = await API.get('vocabulary');
    App.state.vocabulary = vocabResult.sets || [];
    
    if (window.ExamModule) ExamModule.init();

    updateTopbarBadge();
    if (getPath() === '/') router();
  } catch (err) {
    console.warn('Could not preload curriculum data:', err.message);
  }

  // Router already ran before preload; data-driven modules refresh themselves as needed.
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}









