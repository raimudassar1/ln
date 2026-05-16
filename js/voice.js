/* ═══════════════════════════════════════════════════════════════
   voice.js — MediaRecorder Wrapper for Pronunciation Practice
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const VoicePractice = (() => {
  let mediaRecorder = null;
  let audioChunks = [];
  let audioUrl = null;
  let isRecording = false;

  async function startRecording(btnId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
        const playBtn = document.getElementById(btnId + '-play');
        if (playBtn) playBtn.classList.remove('hidden');
      };

      mediaRecorder.start();
      isRecording = true;
      updateUI(btnId, true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to practice pronunciation.');
    }
  }

  function stopRecording(btnId) {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;
      updateUI(btnId, false);
    }
  }

  function playBack() {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  }

  function updateUI(btnId, recording) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (recording) {
      btn.innerHTML = '🛑 Stop';
      btn.classList.add('btn-error');
      btn.classList.add('pulse-animation');
    } else {
      btn.innerHTML = '🎤 Record';
      btn.classList.remove('btn-error');
      btn.classList.remove('pulse-animation');
    }
  }

  function renderVoiceModule(containerId) {
    return `
      <div class="voice-practice-box">
        <div style="display:flex; gap:10px; align-items:center; justify-content:center; margin-top:16px;">
          <button class="btn btn-outline btn-sm" id="${containerId}-rec" onclick="VoicePractice.toggle('${containerId}-rec')">🎤 Record</button>
          <button class="btn btn-gold btn-sm hidden" id="${containerId}-rec-play" onclick="VoicePractice.playBack()">▶️ Play Mine</button>
        </div>
        <div style="font-size:0.7rem; color:var(--text-3); margin-top:8px;">Record yourself and compare with the teacher.</div>
      </div>
    `;
  }

  function toggle(btnId) {
    if (isRecording) stopRecording(btnId);
    else startRecording(btnId);
  }

  return {
    toggle,
    playBack,
    renderVoiceModule
  };
})();
