/* ═══════════════════════════════════════════════════════════════
   ai-chat.js — Smart AI Conversation Partner (Robust Version)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const AIChat = (() => {
  let chatHistory = [];
  let currentContext = null;
  let lastFailedText = null;
  let showPinyin = true;
  let showEnglish = true;
  let currentLevel = 'novice'; 
  let isSlow = true; // Default to slow for beginners

  function open(context) {
    currentContext = context;
    // Set level based on context if available, otherwise use global setting or novice
    currentLevel = context.level || App.state.settings.quizDifficulty?.toLowerCase() || 'novice';
    if (currentLevel === 'both') currentLevel = 'a1';
    
    const key = App.state.settings.geminiKey;

    if (!key) {
      renderSetupModal();
      return;
    }

    startChat(key);
  }

  function renderSetupModal() {
    Modal.show(`
      <div class="ai-chat-container" style="height:auto; padding:30px; text-align:center">
        <span style="font-size:3rem">🤖</span>
        <h3>AI Partner Setup</h3>
        <p style="font-size:0.9rem; color:var(--text-3); margin-bottom:20px">
          Enter your free <strong>Gemini API Key</strong> from Google AI Studio. 
          <br><a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent)">Get a free key here →</a>
        </p>
        <input type="password" id="ai-setup-key" class="input" placeholder="Paste your API key here..." style="width:100%; margin-bottom:15px">
        <button class="btn btn-primary w-full" onclick="AIChat.saveKeyAndStart()">Save & Start Chat</button>
        <button class="btn btn-ghost btn-sm mt-12" onclick="Modal.hide()">Cancel</button>
      </div>
    `);
  }

  function saveKeyAndStart() {
    const keyInput = document.getElementById('ai-setup-key');
    const key = keyInput ? keyInput.value.trim() : '';
    if (!key) return alert('Please enter a valid key.');
    
    App.state.settings.geminiKey = key;
    App.saveSettings();
    startChat(key);
  }

  function clearKey() {
    if (confirm("Remove saved API key?")) {
      App.state.settings.geminiKey = '';
      App.saveSettings();
      renderSetupModal();
    }
  }

  async function startChat(key) {
    chatHistory = []; // Reset history
    renderModal();
    
    const systemPrompt = `SYSTEM INSTRUCTION: You are a native Chinese speaker from Taiwan. 
    Act as the character in this scenario: "${currentContext.scene || currentContext.title}". 
    IMPORTANT: ALWAYS respond in the following format:
    Chinese Text | Pinyin | English Translation | Word-by-word Breakdown
    Example: 你好嗎？ | nǐ hǎo ma? | How are you? | 你 (you) + 好 (good) + 嗎 (question)
    Respond only in Traditional Chinese. Keep it natural and short.`;

    await sendMessage(systemPrompt + "\n\nHello! Please greet me and start the conversation.");
  }

  function renderModal() {
    Modal.show(`
      <div class="ai-chat-container">
        <div class="ai-chat-header">
          <div style="display:flex; align-items:center; gap:10px; flex:1">
            <span style="font-size:1.5rem">🤖</span>
            <div>
              <div style="font-weight:700">AI Partner</div>
              <select class="level-select" id="ai-level-select" onchange="AIChat.setLevel(this.value)">
                <option value="novice" ${currentLevel==='novice'?'selected':''}>Lvl: Novice (Pre-A1)</option>
                <option value="a1" ${currentLevel==='a1'?'selected':''}>Lvl: A1/A2</option>
                <option value="b1" ${currentLevel==='b1'?'selected':''}>Lvl: B1/Native</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center; margin-right:15px">
            <button class="btn btn-ghost btn-sm toggle-btn ${isSlow ? 'active' : ''}" id="toggle-slow" onclick="AIChat.toggleSlow()" title="Slow Speech">🐢</button>
            <button class="btn btn-ghost btn-sm toggle-btn ${showPinyin ? 'active' : ''}" id="toggle-pinyin" onclick="AIChat.toggleDisplay('pinyin')" title="Toggle Pinyin">PY</button>
            <button class="btn btn-ghost btn-sm toggle-btn ${showEnglish ? 'active' : ''}" id="toggle-english" onclick="AIChat.toggleDisplay('english')" title="Toggle English">EN</button>
          </div>
          <div style="display:flex; gap:5px">
            <button class="btn btn-ghost btn-sm" onclick="AIChat.clearKey()" title="Reset API Key" style="color:#fff; opacity:0.6">⚙️</button>
            <button class="btn btn-ghost btn-sm" onclick="Modal.hide()" style="color:#fff">✕</button>
          </div>
        </div>
        
        <div class="ai-chat-messages" id="ai-chat-messages">
          <div class="ai-chat-bubble ai-bubble-system">
            Connected. Click any Chinese character to see its details!
          </div>
        </div>

        <div class="ai-chat-input-area">
          <input type="text" id="ai-chat-input" placeholder="Type in Chinese..." autocomplete="off">
          <button class="btn btn-primary" id="ai-chat-send" onclick="AIChat.handleSend()">Send</button>
        </div>
      </div>
    `);

    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
      setTimeout(() => input.focus(), 100);
    }
  }

  function toggleSlow() {
    isSlow = !isSlow;
    document.getElementById('toggle-slow')?.classList.toggle('active', isSlow);
  }

  function setLevel(lvl) {
    currentLevel = lvl;
    addMessage('system', `Level changed to ${lvl.toUpperCase()}. The AI will now use much simpler sentences.`);
  }

  function toggleDisplay(type) {
    if (type === 'pinyin') showPinyin = !showPinyin;
    if (type === 'english') showEnglish = !showEnglish;
    
    document.getElementById('toggle-pinyin')?.classList.toggle('active', showPinyin);
    document.getElementById('toggle-english')?.classList.toggle('active', showEnglish);

    document.querySelectorAll('.ai-pinyin').forEach(el => el.style.display = showPinyin ? 'block' : 'none');
    document.querySelectorAll('.ai-english').forEach(el => el.style.display = showEnglish ? 'block' : 'none');
    document.querySelectorAll('.ai-literal').forEach(el => el.style.display = showEnglish ? 'block' : 'none');
  }

  async function handleSend() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    await sendMessage(text);
  }

  function addMessage(role, text) {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `ai-chat-bubble ai-bubble-${role}`;
    
    let contentHtml = '';
    let speakText = text;

    if (role === 'ai') {
        const parts = text.split('|').map(p => p.trim());
        const hanzi = parts[0] || '';
        const pinyin = parts[1] || '';
        const english = parts[2] || '';
        const literal = parts[3] || ''; 
        speakText = hanzi;

        const interactiveHanzi = hanzi.split('').map(char => {
            if (/[\u4e00-\u9fa5]/.test(char)) {
                return `<span class="clickable-char" onclick="showCharModal('${char}')">${char}</span>`;
            }
            return char;
        }).join('');

        contentHtml = `
            <div class="ai-hanzi">${interactiveHanzi}</div>
            <div class="ai-pinyin" style="display:${showPinyin ? 'block' : 'none'}">${pinyin}</div>
            <div class="ai-english" style="display:${showEnglish ? 'block' : 'none'}">${english}</div>
            ${literal ? `<div class="ai-literal" style="display:${showEnglish ? 'block' : 'none'}"><span>Breakdown:</span> ${literal}</div>` : ''}
        `;
    } else if (role === 'user') {
        const tipRegex = /\[(.*?)\]/g;
        const cleanText = text.replace(tipRegex, '<span class="ai-tip">💡 $1</span>');
        speakText = text.replace(tipRegex, "");
        contentHtml = `<div class="ai-bubble-content">${cleanText}</div>`;
    } else {
        contentHtml = `<div class="ai-bubble-content">${text}</div>`;
    }
    
    bubble.innerHTML = `
        ${contentHtml}
        <button class="ai-play-btn" onclick="TTS.speak('${speakText.replace(/'/g, "\\'").replace(/\n/g, " ")}', 'zh-TW', ${isSlow ? 0.5 : 0.85})">🔊</button>
    `;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessage(text) {
    const key = App.state.settings.geminiKey;
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    chatHistory.push({ role: 'user', parts: [{ text: text }] });

    const typing = document.createElement('div');
    typing.className = 'ai-chat-bubble ai-bubble-ai typing';
    typing.innerHTML = 'Connecting to AI...';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();

      if (listData.error) throw new Error(listData.error.message);

      let availableModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.split('/').pop());

      availableModels.sort((a, b) => {
        if (a.includes('2.0-flash')) return -1;
        if (b.includes('2.0-flash')) return 1;
        if (a.includes('1.5-flash')) return -1;
        if (b.includes('1.5-flash')) return 1;
        return 0;
      });

      if (availableModels.length === 0) throw new Error("No usable models found for this API key.");

      let success = false;
      let lastModelError = "";

      for (const model of availableModels) {
        typing.innerHTML = `Trying ${model}...`;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          
          let levelInstruction = "";
          if (currentLevel === 'novice') {
              levelInstruction = "ABSOLUTE BEGINNER (Pre-A1): Use ONLY extremely basic words like 你, 好, 我, 是, 謝謝. Max 3 words per sentence. Be extremely repetitive. Format: Chinese | Pinyin | Meaning | Literal Breakdown.";
          } else if (currentLevel === 'a1') {
              levelInstruction = "BEGINNER (A1): Simple vocabulary, short sentences. Format: Chinese | Pinyin | Meaning | Literal Breakdown.";
          } else {
              levelInstruction = "NATURAL: Natural Taiwanese person flow. Format: Chinese | Pinyin | English | (empty).";
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: `You are a native Chinese speaker from Taiwan. Act as: "${currentContext.scene || currentContext.title}". ${levelInstruction} ALWAYS respond in format: Chinese | Pinyin | English | Breakdown. Respond in Traditional Chinese.` }] },
              contents: chatHistory
            })
          });

          const data = await response.json();
          if (data.error) {
            lastModelError = data.error.message;
            continue;
          }

          if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            chatHistory.push({ role: 'model', parts: [{ text: aiText }] });
            if (typing.parentNode) container.removeChild(typing);
            addMessage('ai', aiText);
            success = true;
            break; 
          }
        } catch (e) {
          lastModelError = e.message;
        }
      }

      if (!success) throw new Error(lastModelError || "All available models failed to respond.");

    } catch (err) {
      if (typing.parentNode) container.removeChild(typing);
      const errDiv = document.createElement('div');
      errDiv.className = 'ai-chat-bubble ai-bubble-system';
      errDiv.innerHTML = `
        <div style="color:#e74c3c; font-weight:700">AI Connection Failed</div>
        <div style="font-size:0.75rem; color:#666; margin:8px 0">${err.message}</div>
        <button class="btn btn-sm btn-outline mt-12" onclick="AIChat.retry('${text.replace(/'/g,"\\'")}', this)">🔄 Auto-Fix & Retry</button>
      `;
      container.appendChild(errDiv);
      container.scrollTop = container.scrollHeight;
      chatHistory.pop();
    }
  }

  async function retry(text, btn) {
    const bubble = btn.closest('.ai-chat-bubble');
    if (bubble) bubble.remove();
    await sendMessage(text);
  }

  function injectStyles() {
    if (document.getElementById('ai-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-chat-styles';
    style.innerHTML = `
      .ai-chat-container { display: flex; flex-direction: column; height: 550px; max-height: 85vh; background: var(--card-bg); border-radius: 12px; overflow: hidden; }
      .ai-chat-header { background: var(--accent); color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
      .ai-chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: var(--off-white); }
      .ai-chat-bubble { max-width: 85%; padding: 12px 16px; border-radius: 18px; position: relative; font-size: 0.95rem; line-height: 1.5; }
      .ai-bubble-user { align-self: flex-end; background: var(--accent); color: #ffffff !important; border-bottom-right-radius: 4px; }
      .ai-bubble-ai { align-self: flex-start; background: #ffffff; color: #1a1a1a !important; border: 1px solid var(--border); border-bottom-left-radius: 4px; }
      .ai-bubble-system { align-self: center; background: #f8f9fa; font-size: 0.8rem; color: #666 !important; text-align: center; width: 100%; border-radius: 8px; border: 1px solid #eee; padding: 8px; }
      .ai-hanzi { font-size: 1.25rem; font-weight: 600; letter-spacing: 1px; }
      .ai-pinyin { font-size: 0.85rem; color: #666; margin-top: 4px; font-weight: 500; }
      .ai-english { font-size: 0.9rem; color: var(--accent); margin-top: 6px; font-style: italic; }
      .ai-literal { font-size: 0.75rem; color: #7f8c8d; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #eee; }
      .ai-literal span { font-weight: 700; font-size: 0.6rem; text-transform: uppercase; margin-right: 4px; color: #95a5a6; }
      .clickable-char { cursor: pointer; border-radius: 4px; transition: all 0.2s; padding: 0 2px; }
      .clickable-char:hover { background: rgba(243,156,18,0.15); color: var(--gold); border-bottom: 2px solid var(--gold); }
      .toggle-btn { border: 1px solid rgba(255,255,255,0.3) !important; color: #fff !important; min-width: 35px; opacity: 0.5; }
      .toggle-btn.active { opacity: 1; background: rgba(255,255,255,0.2) !important; font-weight: bold; }
      .level-select { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.3); font-size: 0.7rem; border-radius: 4px; padding: 2px 4px; cursor: pointer; outline: none; }
      .level-select option { color: #000; }
      .ai-chat-input-area { padding: 15px; border-top: 1px solid var(--border); display: flex; gap: 10px; background: #fff; }
      .ai-chat-input-area input { flex: 1; border: 1px solid var(--border); border-radius: 20px; padding: 10px 20px; outline: none; background: #fff; color: #000; }
      .ai-play-btn { position: absolute; top: 5px; right: -32px; background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 1.1rem; }
      .ai-bubble-user .ai-play-btn { right: auto; left: -32px; }
      .typing { font-weight: bold; animation: aiPulse 1.5s infinite; }
      @keyframes aiPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    `;
    document.head.appendChild(style);
  }

  injectStyles();

  return { open, saveKeyAndStart, handleSend, clearKey, retry, toggleDisplay, setLevel, toggleSlow };
})();
