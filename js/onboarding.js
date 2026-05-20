/* ═══════════════════════════════════════════════════════════════
   onboarding.js — Pinyin Trainer, Tone Ear Training, Start Here
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const OnboardingModule = (() => {

  // ── Main Render ──────────────────────────────────────────────
  async function render(container) {
    let drillData = null;
    try { drillData = await API.get('/pinyin-drills'); } catch {}

    const done = App.state.progress.onboardingComplete;

    container.innerHTML = `
      <div class="page-header">
        <h2>Start Here — Pinyin & Tones</h2>
        <p>Master the Chinese sound system before studying characters. This is your foundation.</p>
      </div>

      <div class="tab-switcher" style="max-width:600px">
        <button class="tab-btn active" id="ob-tab-overview" onclick="obTab('overview')">Overview</button>
        <button class="tab-btn" id="ob-tab-tones"    onclick="obTab('tones')">4 Tones</button>
        <button class="tab-btn" id="ob-tab-sounds"   onclick="obTab('sounds')">Sounds</button>
        <button class="tab-btn" id="ob-tab-ear"      onclick="obTab('ear')">Ear Training</button>
        <button class="tab-btn" id="ob-tab-rules"    onclick="obTab('rules')">Tone Rules</button>
      </div>

      <div id="ob-panel-overview">${renderOverview(done)}</div>
      <div id="ob-panel-tones"   class="hidden">${drillData ? renderTones(drillData) : '<div class="spinner"></div>'}</div>
      <div id="ob-panel-sounds"  class="hidden">${drillData ? renderSounds(drillData) : '<div class="spinner"></div>'}</div>
      <div id="ob-panel-ear"     class="hidden">${drillData ? renderEarTraining(drillData) : '<div class="spinner"></div>'}</div>
      <div id="ob-panel-rules"   class="hidden">${drillData ? renderToneRules(drillData) : '<div class="spinner"></div>'}</div>
    `;

    window.obTab = (name) => {
      ['overview','tones','sounds','ear','rules'].forEach(n => {
        document.getElementById(`ob-panel-${n}`)?.classList.toggle('hidden', n !== name);
        document.getElementById(`ob-tab-${n}`)?.classList.toggle('active', n === name);
      });
    };

    // Wire ear training after render
    if (drillData) wireEarTraining(drillData);
  }

  // ── Overview Panel ───────────────────────────────────────────
  function renderOverview(done) {
    return `
      <div style="max-width:720px">
        <!-- Hero -->
        <div style="background:linear-gradient(135deg,var(--charcoal),var(--charcoal-2));color:#fff;border-radius:var(--radius);padding:32px;margin-bottom:24px;position:relative;overflow:hidden">
          <div style="position:absolute;right:-20px;top:-20px;font-size:10rem;opacity:0.05;font-family:var(--font-zh)">音</div>
          <h3 style="font-size:1.3rem;margin-bottom:8px;color:#fff">Why Start With Pinyin?</h3>
          <p style="color:rgba(255,255,255,0.75);line-height:1.7;margin-bottom:16px">
            Pinyin is the romanization system for Mandarin Chinese. It tells you <strong style="color:var(--gold)">exactly how to pronounce</strong> every character. Master it once — use it forever.
          </p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">
            ${[
              ['🔤','21 Initials','Consonants at the start of a syllable'],
              ['🔈','36 Finals','Vowel sounds that end a syllable'],
              ['🎵','4 Tones + Neutral','The same sound = different meanings'],
            ].map(([icon,title,desc]) => `
              <div style="background:rgba(255,255,255,0.07);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:1.6rem;margin-bottom:6px">${icon}</div>
                <div style="font-weight:700;font-size:0.85rem;color:#fff;margin-bottom:3px">${title}</div>
                <div style="font-size:0.72rem;color:rgba(255,255,255,0.5)">${desc}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- The tone colours legend -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:14px">Tone Color System</h4>
          <p class="text-small text-muted mb-12">Throughout this app, pinyin is color-coded by tone to help you memorize them visually.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${[
              ['1st — Level','ā','var(--tone1)','High and steady'],
              ['2nd — Rising','á','var(--tone2)','Goes up like a question'],
              ['3rd — Dip','ǎ','var(--tone3)','Falls then rises'],
              ['4th — Falling','à','var(--tone4)','Sharp drop down'],
              ['Neutral','a','var(--tone5)','Short and light'],
            ].map(([label,sym,color,desc]) => `
              <div style="flex:1;min-width:130px;background:var(--off-white);border-radius:var(--radius-sm);padding:12px;text-align:center;border-top:3px solid ${color}">
                <div style="font-size:1.6rem;font-weight:700;color:${color};font-family:var(--font-pinyin)">${sym}</div>
                <div style="font-size:0.78rem;font-weight:700;margin:4px 0">${label}</div>
                <div style="font-size:0.68rem;color:var(--text-3)">${desc}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- The 4 tones quick-play -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:14px">Hear All 4 Tones — "ma"</h4>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${[
              ['mā','1','媽 mother','var(--tone1)'],
              ['má','2','麻 hemp','var(--tone2)'],
              ['mǎ','3','馬 horse','var(--tone3)'],
              ['mà','4','罵 scold','var(--tone4)'],
            ].map(([py,t,meaning,color]) => `
              <button onclick="TTS.speak('${meaning.split(' ')[0]}')" style="flex:1;min-width:100px;background:var(--off-white);border:2px solid ${color};border-radius:var(--radius-sm);padding:14px 10px;cursor:pointer;transition:all 0.15s;font-family:var(--font-ui)" onmouseover="this.style.background='var(--card-bg)'" onmouseout="this.style.background='var(--off-white)'">
                <div style="font-size:1.6rem;font-weight:700;color:${color}">${py}</div>
                <div style="font-size:0.72rem;color:var(--text-3);margin-top:3px">${meaning}</div>
                <div style="font-size:1.1rem;margin-top:4px">🔊</div>
              </button>`).join('')}
          </div>
          <p class="text-small text-muted" style="margin-top:10px">Click each to hear. Four completely different words — just from tone!</p>
        </div>

        <!-- Learning roadmap -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:14px">Your Learning Path</h4>
          <div style="display:flex;flex-direction:column;gap:0">
            ${[
              ['🎵','Step 1','Master Pinyin & Tones','You are here','var(--tone2)','Complete the Tones and Sounds tabs above'],
              ['🌱','Step 2','Novice Characters (300)','Basic everyday characters','#95a5a6','Numbers, colors, family, verbs'],
              ['🌿','Step 3','TOCFL A1 (300)','Survival Chinese','#95a5a6','Greetings, shopping, transport, food'],
              ['🌳','Step 4','TOCFL A2 (250)','Elementary level','#95a5a6','Complex sentences, reading passages'],
              ['🏆','Step 5','TOCFL B1 (150)','Independent learner','#95a5a6','News, opinions, mock exams'],
            ].map(([icon,step,title,sub,color,detail],i) => `
              <div style="display:flex;gap:14px;padding:14px 0;${i<4?'border-bottom:1px solid var(--border)':''}">
                <div style="width:44px;height:44px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;${i===0?'box-shadow:0 0 0 3px rgba(39,174,96,0.2)':''}">${icon}</div>
                <div style="flex:1">
                  <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${color};margin-bottom:2px">${step}</div>
                  <div style="font-weight:600;font-size:0.95rem">${title}</div>
                  <div style="font-size:0.78rem;color:var(--text-3)">${detail}</div>
                </div>
                <div style="font-size:0.72rem;color:var(--text-3);text-align:right;align-self:center">${sub}</div>
              </div>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" onclick="obTab('tones')">Start: 4 Tones →</button>
          <button class="btn btn-ghost" onclick="navigate('#/learn')">Go to Learning Path</button>
        </div>
      </div>
    `;
  }

  // ── Tones Panel ──────────────────────────────────────────────
  function renderTones(data) {
    const tones = data.tones || [];
    return `
      <div style="max-width:720px">
        <div class="card mb-16" style="background:var(--off-white)">
          <p style="font-size:0.9rem;color:var(--text-2)">
            🎵 <strong>Mandarin has 4 tones + 1 neutral tone.</strong> The same syllable spoken with a different tone is a completely different word. This is the #1 thing beginners must master.
          </p>
        </div>

        <!-- Tone pitch diagram -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:16px">Pitch Contour Diagram</h4>
          <div style="display:flex;align-items:flex-end;justify-content:center;gap:32px;height:120px;padding:0 20px">
            ${[
              ['1st','ā','var(--tone1)','M1,100 L60,0','Flat high'],
              ['2nd','á','var(--tone2)','M1,80 L60,0','Rising'],
              ['3rd','ǎ','var(--tone3)','M1,60 L30,100 L60,20','Dip-rise'],
              ['4th','à','var(--tone4)','M1,0 L60,100','Falling'],
              ['Neutral','a','var(--tone5)','M1,60 L30,60','Short'],
            ].map(([name,sym,color,path,label]) => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <svg width="62" height="100" viewBox="0 0 62 100" style="overflow:visible">
                  <path d="${path}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
                </svg>
                <div style="font-size:1.1rem;font-weight:700;color:${color}">${sym}</div>
                <div style="font-size:0.68rem;color:var(--text-3);text-align:center">${name}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Individual tone cards -->
        ${tones.map(tone => `
          <div class="card mb-12" style="border-left:4px solid ${tone.color}">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
              <div style="font-size:2.2rem;font-weight:900;color:${tone.color};font-family:var(--font-pinyin);width:48px;text-align:center">${tone.symbol}</div>
              <div>
                <div style="font-weight:700;font-size:1rem">${tone.name}</div>
                <div style="font-size:0.85rem;color:var(--text-2)">${tone.description}</div>
              </div>
            </div>
            <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;font-size:0.85rem;color:var(--text-2)">
              💡 <strong>Tip:</strong> ${tone.tip}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${(tone.examples || []).map(ex => `
                <button onclick="TTS.speak('${ex.hanzi}')" style="display:flex;align-items:center;gap:8px;background:var(--card-bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;cursor:pointer;transition:all 0.15s;font-family:var(--font-ui)" onmouseover="this.style.borderColor='${tone.color}'" onmouseout="this.style.borderColor='var(--border)'">
                  <span style="font-family:var(--font-zh);font-size:1.4rem;font-weight:700">${ex.hanzi}</span>
                  <span>
                    <span style="display:block;font-size:0.85rem;font-weight:600;color:${tone.color}">${ex.pinyin}</span>
                    <span style="display:block;font-size:0.72rem;color:var(--text-3)">${ex.meaning}</span>
                  </span>
                  <span style="font-size:0.9rem;color:var(--text-3)">🔊</span>
                </button>`).join('')}
            </div>
          </div>`).join('')}

        <!-- Tone pair comparisons -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:12px">Critical Tone Pairs</h4>
          <p class="text-small text-muted mb-12">These pairs are commonly confused. Click to hear the difference.</p>
          ${(data.tone_pairs || []).map(pair => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
              <button onclick="TTS.speak('${pair.a.hanzi}')" style="flex:1;background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;cursor:pointer;text-align:center" onmouseover="this.style.background='var(--card-bg)'" onmouseout="this.style.background='var(--off-white)'">
                <div style="font-family:var(--font-zh);font-size:1.6rem;font-weight:700">${pair.a.hanzi}</div>
                <div style="font-size:0.8rem;color:var(--tone${Pinyin.getTone(pair.a.pinyin)||1})">${pair.a.pinyin}</div>
                <div style="font-size:0.72rem;color:var(--text-3)">${pair.a.meaning}</div>
              </button>
              <div style="color:var(--text-3);font-size:1.2rem">vs</div>
              <button onclick="TTS.speak('${pair.b.hanzi}')" style="flex:1;background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;cursor:pointer;text-align:center" onmouseover="this.style.background='var(--card-bg)'" onmouseout="this.style.background='var(--off-white)'">
                <div style="font-family:var(--font-zh);font-size:1.6rem;font-weight:700">${pair.b.hanzi}</div>
                <div style="font-size:0.8rem;color:var(--tone${Pinyin.getTone(pair.b.pinyin)||1})">${pair.b.pinyin}</div>
                <div style="font-size:0.72rem;color:var(--text-3)">${pair.b.meaning}</div>
              </button>
              <div style="flex:1.2;font-size:0.72rem;color:var(--text-3);padding-left:4px">${pair.note}</div>
            </div>`).join('')}
        </div>

        <button class="btn btn-primary" onclick="obTab('sounds')">Next: Sounds & Initials →</button>
      </div>
    `;
  }

  // ── Sounds Panel ─────────────────────────────────────────────
  function renderSounds(data) {
    const initials = data.initials || [];
    const finals   = data.finals   || [];
    const pairs    = data.minimal_pairs_drills || [];

    return `
      <div style="max-width:720px">
        <!-- Initials -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:4px">21 Initials (Consonants)</h4>
          <p class="text-small text-muted mb-14">Click any to hear it pronounced. Pay attention to the description.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
            ${initials.map(ini => `
              <button onclick="playInitial('${ini.symbol}')" style="background:var(--off-white);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;cursor:pointer;font-family:var(--font-ui);font-size:0.9rem;font-weight:700;color:var(--text);transition:all 0.15s;min-width:48px;text-align:center" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text)'">${ini.symbol}</button>`).join('')}
          </div>
          <div id="initial-desc" style="background:var(--off-white);border-radius:var(--radius-sm);padding:12px 14px;font-size:0.85rem;color:var(--text-2);min-height:48px">
            Click any consonant above to see its description.
          </div>
        </div>

        <!-- Tricky initials callout -->
        <div class="card mb-16" style="border-left:4px solid var(--gold)">
          <h4 style="margin-bottom:10px;font-size:0.9rem">⚠️ The Tricky Ones for English Speakers</h4>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${[
              ['x vs sh','x = tongue near FRONT teeth (lighter). sh = tongue CURLED back.','xīn vs shēn'],
              ['j vs zh','j = flat tongue. zh = curled tongue back.','jiā vs zhā'],
              ['q vs ch','q = like "ch" in cheese + puff. ch = curled back + puff.','qù vs chū'],
              ['z vs zh','z = flat "dz". zh = curled back.','zài vs zhài'],
              ['r','Not like English "r" — tongue curled back, voice humming.','rén'],
              ['b/d/g vs p/t/k','Chinese b/d/g have NO puff of air. p/t/k DO.','bā vs pā'],
            ].map(([pair,tip,ex]) => `
              <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:10px 14px">
                <div style="font-weight:700;margin-bottom:2px;font-size:0.9rem">${pair}</div>
                <div style="font-size:0.82rem;color:var(--text-2)">${tip}</div>
                <div style="font-size:0.78rem;color:var(--text-3);margin-top:3px">Example: ${ex}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Finals -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:4px">Key Finals (Vowel Sounds)</h4>
          <p class="text-small text-muted mb-12">Finals are the vowel endings of syllables. Click to play.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
            ${finals.map(f => `
              <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:10px 12px;cursor:pointer;transition:all 0.15s" onclick="TTS.speak('${f.examples?.[0]||f.symbol}','zh-TW',0.7)">
                <div style="font-weight:700;font-size:1rem;color:var(--red)">${f.symbol}</div>
                <div style="font-size:0.75rem;color:var(--text-2);margin:2px 0">${f.description}</div>
                <div style="font-size:0.7rem;color:var(--text-3)">${(f.examples||[]).slice(0,2).join(', ')}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Minimal pairs drill -->
        <div class="card mb-16">
          <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-3);margin-bottom:12px">Minimal Pairs Practice</h4>
          ${pairs.map(drill => `
            <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border)">
              <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px">${drill.title}</div>
              <div style="font-size:0.8rem;color:var(--text-2);margin-bottom:10px;background:var(--off-white);padding:8px 12px;border-radius:var(--radius-sm)">${drill.instruction}</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${(drill.pairs||[]).map(p => `
                  <div style="display:flex;gap:8px;align-items:center">
                    <button onclick="TTS.speak('${p.a.split(' ')[0]}')" style="flex:1;background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;cursor:pointer;font-family:var(--font-ui);font-size:0.85rem" onmouseover="this.style.borderColor='var(--tone2)'" onmouseout="this.style.borderColor='var(--border)'">🔊 ${p.a}</button>
                    <span style="color:var(--text-3);font-size:0.8rem">vs</span>
                    <button onclick="TTS.speak('${p.b.split(' ')[0]}')" style="flex:1;background:var(--off-white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px;cursor:pointer;font-family:var(--font-ui);font-size:0.85rem" onmouseover="this.style.borderColor='var(--tone4)'" onmouseout="this.style.borderColor='var(--border)'">🔊 ${p.b}</button>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>

        <button class="btn btn-primary" onclick="obTab('ear')">Next: Ear Training →</button>
      </div>
    `;
  }

  // ── Ear Training Panel ───────────────────────────────────────
  function renderEarTraining(data) {
    return `
      <div style="max-width:640px">
        <div class="card mb-16" style="background:var(--off-white)">
          <p class="text-small">🎧 <strong>Ear training</strong> teaches you to <em>hear</em> tone differences — not just see them. Listen carefully, then choose. Correct answers show instantly.</p>
        </div>
        <div id="ear-sets">
          ${(data.ear_training_sets||[]).map((set,si) => `
            <div class="card mb-16" id="ear-set-${si}">
              <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:4px">${set.title}</h4>
              <p class="text-small text-muted mb-14">${set.instruction}</p>
              <div id="ear-items-${si}">
                ${(set.items||[]).map((item,ii) => renderEarItem(item, si, ii)).join('')}
              </div>
            </div>`).join('')}
        </div>
        <button class="btn btn-primary" onclick="obTab('rules')">Next: Tone Rules →</button>
      </div>
    `;
  }

  function renderEarItem(item, si, ii) {
    const hasOpts = Array.isArray(item.options);
    if (hasOpts) {
      return `
        <div class="ear-item" id="ear-${si}-${ii}" style="margin-bottom:14px;padding:14px;background:var(--off-white);border-radius:var(--radius-sm)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <button class="btn btn-primary btn-sm" onclick="playEar('${item.audio_text}',${si},${ii})">▶ Play</button>
            <span class="text-small text-muted">${item.display || item.audio_text}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${item.options.map((opt,oi) => `
              <button class="ear-opt" data-si="${si}" data-ii="${ii}" data-oi="${oi}" data-correct="${oi===item.correct_index}"
                onclick="checkEar(this,${si},${ii})"
                style="background:var(--card-bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;cursor:pointer;font-family:var(--font-ui);font-size:0.85rem;text-align:left;transition:all 0.15s">
                ${String.fromCharCode(65+oi)}. ${opt}
              </button>`).join('')}
          </div>
          <div class="ear-feedback hidden" id="ear-fb-${si}-${ii}" style="margin-top:8px;font-size:0.82rem;padding:6px 10px;border-radius:4px"></div>
        </div>`;
    }
    // Tone number items
    return `
      <div class="ear-item" id="ear-${si}-${ii}" style="margin-bottom:14px;padding:14px;background:var(--off-white);border-radius:var(--radius-sm)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <button class="btn btn-primary btn-sm" onclick="playEar('${item.audio_text}',${si},${ii})">▶ Play</button>
          <span style="font-size:1.2rem;font-weight:600;font-family:var(--font-pinyin)">${item.display||item.audio_text}</span>
        </div>
        <div style="display:flex;gap:8px">
          ${[1,2,3,4].map(t => `
            <button data-si="${si}" data-ii="${ii}" data-correct="${t===item.correct_tone}"
              onclick="checkEarTone(this,${si},${ii},${t})"
              style="flex:1;background:var(--card-bg);border:2px solid var(--tone${t});border-radius:var(--radius-sm);padding:8px 4px;cursor:pointer;color:var(--tone${t});font-weight:700;font-size:0.9rem">
              ${t}${t===1?'st':t===2?'nd':t===3?'rd':'th'}
            </button>`).join('')}
        </div>
        <div class="ear-feedback hidden" id="ear-fb-${si}-${ii}" style="margin-top:8px;font-size:0.82rem;padding:6px 10px;border-radius:4px"></div>
      </div>`;
  }

  function wireEarTraining(data) {
    window.playEar = (text, si, ii) => {
      TTS.speak(text, 'zh-TW', 0.75);
    };

    window.checkEar = (btn, si, ii) => {
      const isCorrect = btn.dataset.correct === 'true';
      document.querySelectorAll(`[data-si="${si}"][data-ii="${ii}"]`).forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.style.background = 'rgba(39,174,96,0.15)', b.style.borderColor = '#27ae60', b.style.color = '#27ae60';
      });
      if (!isCorrect) btn.style.background = 'rgba(192,57,43,0.1)', btn.style.borderColor = 'var(--red)', btn.style.color = 'var(--red)';
      const fb = document.getElementById(`ear-fb-${si}-${ii}`);
      if (fb) {
        fb.classList.remove('hidden');
        fb.style.background = isCorrect ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.08)';
        fb.style.color = isCorrect ? '#27ae60' : 'var(--red)';
        fb.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect — the correct answer is highlighted in green.';
      }
    };

    window.checkEarTone = (btn, si, ii, tone) => {
      const isCorrect = btn.dataset.correct === 'true';
      document.querySelectorAll(`[data-si="${si}"][data-ii="${ii}"]`).forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.style.background = 'rgba(39,174,96,0.15)';
      });
      if (!isCorrect) btn.style.background = 'rgba(192,57,43,0.1)';
      const fb = document.getElementById(`ear-fb-${si}-${ii}`);
      if (fb) {
        fb.classList.remove('hidden');
        fb.style.background = isCorrect ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.08)';
        fb.style.color = isCorrect ? '#27ae60' : 'var(--red)';
        fb.textContent = isCorrect ? '✓ Correct!' : '✗ Wrong tone — review the pitch diagram in the Tones tab.';
      }
    };

    window.playInitial = (symbol) => {
      const drillData = window._cachedDrillData;
      const ini = (drillData?.initials||[]).find(i => i.symbol === symbol);
      const desc = document.getElementById('initial-desc');
      if (ini && desc) {
        desc.innerHTML = `<strong style="color:var(--red)">${symbol}</strong> — ${ini.description}<br><span class="text-muted text-small">Example: ${ini.example}</span>`;
      }
      TTS.speak(ini?.example?.split(' ')[0] || symbol, 'zh-TW', 0.7);
    };
  }

  // ── Tone Rules Panel ─────────────────────────────────────────
  function renderToneRules(data) {
    const rules = data.tone_sandhi_rules || [];
    return `
      <div style="max-width:640px">
        <div class="card mb-16" style="background:var(--off-white)">
          <p class="text-small">📐 <strong>Tone sandhi</strong> — certain tones change when spoken together. These rules happen automatically in natural speech. Learn them now to avoid confusion.</p>
        </div>

        ${rules.map(rule => `
          <div class="card mb-16">
            <h4 style="font-weight:700;font-size:1rem;margin-bottom:4px">${rule.rule}</h4>
            <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:8px">${rule.description}</p>
            <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:8px 14px;margin-bottom:12px;font-size:0.85rem;font-weight:700;color:var(--red)">${rule.formula}</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${(rule.examples||[]).map(ex => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--off-white);border-radius:var(--radius-sm)">
                  <button onclick="TTS.speak('${ex.written}')" style="background:none;border:none;cursor:pointer;font-family:var(--font-zh);font-size:1.8rem;font-weight:700;padding:0">${ex.written}</button>
                  <div style="flex:1">
                    <div style="font-size:0.85rem;font-weight:600">Spoken: <span style="color:var(--red)">${ex.spoken_pinyin}</span></div>
                    <div style="font-size:0.75rem;color:var(--text-3)">${ex.note}</div>
                  </div>
                  <button onclick="TTS.speak('${ex.written}')" class="btn btn-ghost btn-sm btn-icon">🔊</button>
                </div>`).join('')}
            </div>
          </div>`).join('')}

        <!-- Tone mark placement rule -->
        <div class="card mb-16" style="border-left:4px solid var(--gold)">
          <h4 style="margin-bottom:10px">📍 Where to Place the Tone Mark</h4>
          <p class="text-small text-muted mb-10">When a syllable has multiple vowels, where does the tone mark go?</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['Rule 1','If there is an <strong>a</strong> or <strong>e</strong>, the mark always goes on it.','māo, hēi, guài'],
              ['Rule 2','If there is <strong>ou</strong>, the mark goes on the <strong>o</strong>.','gōu, hòu'],
              ['Rule 3','Otherwise, the mark goes on the <strong>last vowel</strong>.','guī, liú, duì'],
            ].map(([r,desc,ex]) => `
              <div style="background:var(--off-white);border-radius:var(--radius-sm);padding:10px 14px">
                <div style="font-weight:700;font-size:0.85rem;color:var(--gold);margin-bottom:3px">${r}</div>
                <div style="font-size:0.82rem;color:var(--text-2)">${desc}</div>
                <div style="font-size:0.78rem;color:var(--text-3);margin-top:3px">Examples: ${ex}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card mb-16">
          <h4 style="margin-bottom:12px">✅ Pinyin Complete!</h4>
          <p class="text-small text-muted mb-14">You've covered the essentials of the pinyin system. Now start building your character vocabulary.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="navigate('#/learn')">Start Learning Characters →</button>
            <button class="btn btn-outline" onclick="navigate('#/quiz/pronunciation')">Test Your Pronunciation</button>
          </div>
        </div>
      </div>
    `;
  }

  return { render };
})();
