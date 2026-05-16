'use strict';

/**
 * ExamModule
 * Comprehensive Achievement Certification Engine.
 * Features: Pinyin Tones, Vocab, Writing (Canvas), Listening, Reading, Grammar.
 */
window.ExamModule = {
    state: {
        currentMonth: null,
        examData: [],
        generatedTest: null,
        userAnswers: {},
        showPinyin: false,
        sourceVocab: [], // Current month's vocabulary pool
        knownVocab: new Set(), // Characters already learned in previous months
        currentCanvasChar: null
    },

    /**
     * Initialize the module and preload exam definitions
     */
    async init() {
        try {
            const response = await fetch('data/monthly_exams.json');
            this.state.examData = await response.json();
            
            if (!App.state.progress.exams) {
                App.state.progress.exams = {};
            }
        } catch (error) {
            console.error("ExamModule init error:", error);
        }
    },

    /**
     * Render the Exam Hub
     */
    async renderHub(container) {
        if (!container) return;
        
        // Ensure data is loaded
        if (this.state.examData.length === 0) {
            await this.init();
        }

        this.state.currentMonth = null;
        
        const levels = [
            { id: 'novice', title: 'Novice Level', subtitle: 'A1.1', desc: 'Laying the foundation', icon: '🌱', color: '#10b981' },
            { id: 'a1',     title: 'A1 Mastery', subtitle: 'A1.2', desc: 'Daily life & social survival', icon: '🗣️', color: '#3b82f6' },
            { id: 'a2',     title: 'A2 Proficiency', subtitle: 'A2', desc: 'Fluent interaction & professional basics', icon: '🚀', color: '#8b5cf6' },
            { id: 'b1',     title: 'B1 Independent', subtitle: 'B1', desc: 'Complex discussion & academic bridge', icon: '👑', color: '#6366f1' }
        ];

        // Calculate overall progress
        const completedExams = Object.keys(App.state.progress.exams || {}).filter(k => App.state.progress.exams[k]).length;
        const totalExams = this.state.examData.length;
        const progressPct = Math.round((completedExams / totalExams) * 100) || 0;

        let html = `
            <div class="exam-hub-modern">
                <!-- Hero Section -->
                <div class="exam-hero">
                    <div class="exam-hero-content">
                        <div class="exam-hero-badge">OFFICIAL CERTIFICATION</div>
                        <h1 class="exam-hero-title">Certification Center</h1>
                        <p class="exam-hero-desc">Complete rigorous 100-question assessments to prove your Mandarin proficiency from Novice to TOCFL B1.</p>
                        
                        <div class="exam-global-progress">
                            <div class="egp-info">
                                <span style="color:white;opacity:0.9">Overall Certification Progress</span>
                                <span style="color:white"><strong>${completedExams}</strong> / ${totalExams} Mastery Badges</span>
                            </div>
                            <div class="egp-bar-bg">
                                <div class="egp-bar-fill" style="width: ${progressPct}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="exam-levels-wrapper">
        `;

        levels.forEach(lvl => {
            const levelExams = this.state.examData.filter(e => e.level === lvl.id);
            if (!levelExams.length) return;

            const lvlCompleted = levelExams.filter(e => App.state.progress.exams && App.state.progress.exams[e.id]).length;
            const lvlTotal = levelExams.length;
            const isLvlComplete = lvlCompleted === lvlTotal;

            html += `
                <div class="exam-level-track">
                    <div class="level-track-header">
                        <div class="lth-icon" style="background: ${lvl.color}15; color: ${lvl.color};">${lvl.icon}</div>
                        <div class="lth-info">
                            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                                <h2 style="color: var(--text); margin: 0; font-size: 1.6rem; font-weight: 800;">${lvl.title}</h2>
                                <span class="level-badge" style="background: ${lvl.color};">${lvl.subtitle}</span>
                                ${isLvlComplete ? '<span class="level-badge" style="background: #fbbf24; color: #78350f;">🏆 MASTERED</span>' : ''}
                            </div>
                            <p style="color: var(--text-3); margin: 4px 0 0 0; font-weight: 600;">${lvl.desc}</p>
                        </div>
                        <div class="lth-progress">
                            <span style="font-weight: 800; font-size: 1.2rem; color: ${lvl.color};">${lvlCompleted}/${lvlTotal}</span>
                        </div>
                    </div>

                    <div class="exam-cards-grid">
                        ${levelExams.map(exam => {
                            const isCompleted = App.state.progress.exams && App.state.progress.exams[exam.id];
                            return `
                                <div class="exam-modern-card ${isCompleted ? 'is-certified' : ''}" onclick="ExamModule.startExam(${exam.id})">
                                    <div class="emc-header">
                                        <span class="emc-month">LEVEL ${exam.id}</span>
                                        ${isCompleted 
                                            ? '<div class="emc-status certified"><span class="icon">🏆</span> Certified</div>' 
                                            : '<div class="emc-status open"><span class="icon">📝</span> Available</div>'
                                        }
                                    </div>
                                    <div class="emc-body">
                                        <h3 class="emc-title">${exam.title}</h3>
                                        <p class="emc-desc">${exam.description}</p>
                                    </div>
                                    <div class="emc-footer">
                                        <div class="emc-meta">
                                            <span>⏱ 60m</span>
                                            <span>📊 100 Qs</span>
                                        </div>
                                        <button class="emc-btn ${isCompleted ? 'btn-ghost' : 'btn-primary'}">
                                            ${isCompleted ? 'Recertify' : 'Start Exam'}
                                        </button>
                                    </div>
                                    ${isCompleted ? `<div class="emc-certified-bg">🏆</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="exam-info-box card mt-60 mb-100" style="max-width: 800px; margin-left: auto; margin-right: auto; text-align: center; background: var(--off-white); border: 1px dashed var(--border);">
                    <h3 style="color: var(--text)">Certification Requirements</h3>
                    <p style="color: var(--text-2); line-height: 1.6;">All exams are randomized and generated from your curriculum data. To receive a proficiency certificate, you must complete the 100-question assessment with a score of <strong>80%</strong> or higher. Take your time; these are professional-grade evaluations.</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.addStyles();
        window.scrollTo(0, 0);
    },

    /**
     * Start a comprehensive exam
     */
    async startExam(id) {
        const examDef = this.state.examData.find(e => e.id === id);
        if (!examDef) return;

        App.state.loading = true;
        this.state.currentMonth = id; // id is the unique key now
        this.state.userAnswers = {};
        this.state.showPinyin = false;

        try {
            const bookId = examDef.sources.books.id;
            const resources = await Promise.all([
                fetch(`data/book${bookId}_content.json`).then(r => r.json()),
                fetch('data/playground_content.json').then(r => r.json()),
                fetch('data/char_playground_content.json').then(r => r.json())
            ]);

            const [bookData, playgroundData, charPlaygroundData] = resources;

            this.generateTest(examDef, bookData, playgroundData, charPlaygroundData);
            this.renderExam();
        } catch (error) {
            console.error("Error starting exam:", error);
            alert("Critical: Failed to load exam content. Ensure data/book[1-3]_content.json exist.");
        } finally {
            App.state.loading = false;
        }
    },

    /**
     * Compile a 100-question massive comprehensive test
     */
    generateTest(def, bookData, playgroundData, charPlaygroundData) {
        const test = {
            title: def.title,
            sections: []
        };

        const relevantChapters = bookData.filter(c => def.sources.books.chapters.includes(c.chapter));
        const pgIds = def.sources.playground || [];
        const relevantPG = playgroundData.filter(p => pgIds.includes(p.id));
        
        // Build exhaustive vocab pool
        const vocabPool = [];
        relevantChapters.forEach(c => {
            if (c.vocab && c.vocab.length) vocabPool.push(...c.vocab);
        });
        
        // Safety: fallback to global vocab if pool is too small for randomization
        if (vocabPool.length < 50) {
            bookData.forEach(c => vocabPool.push(...(c.vocab || [])));
        }

        this.state.sourceVocab = vocabPool;

        // --- Section 1: Tone & Phonetic Analysis (20 Qs) ---
        const toneQs = this.getRandom(vocabPool, 20).map((v, idx) => ({
            id: `t_${idx}`,
            type: 'tone',
            question: `Identify correct tone for: <span class="font-zh" style="font-size:2.2rem">「${v.hanzi}」</span>`,
            options: this.shuffle([v.pinyin, ...this.getRandom(vocabPool.filter(x => x.pinyin !== v.pinyin), 3).map(x => x.pinyin)]),
            answer: v.pinyin
        }));
        test.sections.push({ title: "I. Phonetic & Tone Discrimination", questions: toneQs });

        // --- Section 2: Character ↔ Definition Match (30 Qs) ---
        const vocabQs = this.getRandom(vocabPool, 30).map((v, idx) => {
            const isReverse = idx % 2 === 0;
            const pool = isReverse ? vocabPool.map(x => x.hanzi) : vocabPool.map(x => x.definition);
            const distractors = this.getRandom(pool.filter(x => x !== (isReverse ? v.hanzi : v.definition)), 3);
            return {
                id: `v_${idx}`,
                type: 'vocab',
                question: isReverse ? `Select Hanzi for: "<strong>${v.definition}</strong>"` : `Define: <span class="font-zh" style="font-size:1.5rem">「${v.hanzi}」</span>`,
                options: this.shuffle([(isReverse ? v.hanzi : v.definition), ...distractors]),
                answer: (isReverse ? v.hanzi : v.definition)
            };
        });
        test.sections.push({ title: "II. Vocabulary & Semantic Recall", questions: vocabQs });

        // --- Section 3: Contextual Logic (10 Qs) ---
        const dialoguePool = [];
        relevantChapters.forEach(c => { if (c.dialogues) dialoguePool.push(...c.dialogues); });
        if (dialoguePool.length === 0) bookData.forEach(c => { if (c.dialogues) dialoguePool.push(...c.dialogues); });

        const dialogueQs = this.getRandom(dialoguePool, 10).map((d, dIdx) => {
            const line = this.getRandom(d.lines, 1)[0];
            const distractors = this.getRandom(vocabPool.map(x => x.hanzi), 3);
            return {
                id: `d_${dIdx}`,
                type: 'logic',
                question: `Complete the conversation logically: <br><strong>A: </strong> (Previous context unavailable)<br><strong>B: </strong> ______`,
                options: this.shuffle([line.zh, ...distractors]),
                answer: line.zh
            };
        });
        test.sections.push({ title: "III. Contextual Conversational Logic", questions: dialogueQs });

        // --- Section 4: Particle & Grammar Mastery (20 Qs) ---
        const grammarPool = [];
        relevantChapters.forEach(c => { if (c.quizzes) grammarPool.push(...c.quizzes); });
        if (grammarPool.length < 20) bookData.forEach(c => { if (c.quizzes) grammarPool.push(...c.quizzes); });

        const grammarQs = this.getRandom(grammarPool, 20).map((q, idx) => ({
            id: `g_${idx}`,
            type: 'grammar',
            question: q.type === 'fill' ? `Complete correctly: <br><span class="font-zh" style="font-size:1.4rem">${q.sentence.replace('___', '______')}</span>` : q.question,
            options: q.options || ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
            answer: q.answer
        }));
        test.sections.push({ title: "IV. Syntactic Structure & Particles", questions: grammarQs });

        // --- Section 5: Orthographic Writing (10 Qs) ---
        const writingQs = this.getRandom(vocabPool.filter(v => v.hanzi && v.hanzi.length === 1), 10).map((v, idx) => ({
            id: `w_${idx}`,
            type: 'writing',
            targetChar: v.hanzi,
            question: `Write character from memory: <strong>${v.definition}</strong>`,
            answer: v.hanzi
        }));
        test.sections.push({ title: "V. Orthographic Writing Mastery", questions: writingQs });

        // --- Section 6: Auditory Comprehension (5 Qs) ---
        const listenPassages = [];
        relevantPG.forEach(p => p.lessons.forEach(l => { if (l.listening) listenPassages.push(l.listening); }));
        if (!listenPassages.length) {
            playgroundData.forEach(p => p.lessons.forEach(l => { if (l.listening) listenPassages.push(l.listening); }));
        }

        const selectedListen = this.getRandom(listenPassages, 1)[0];
        if (selectedListen) {
            const qs = selectedListen.questions.slice(0, 5).map((q, qIdx) => ({
                id: `l_final_${qIdx}`,
                type: 'listening',
                question: q.q,
                options: q.options,
                answer: q.answer
            }));
            test.sections.push({ title: "VI. Auditory Comprehension", context: selectedListen.text, isAudio: true, questions: qs });
        }

        // --- Section 7: Reading Proficiency (5 Qs) ---
        const readPassages = [];
        relevantChapters.forEach(c => { if (c.readings) readPassages.push(...c.readings); });
        if (!readPassages.length) bookData.forEach(c => { if (c.readings) readPassages.push(...c.readings); });

        const selectedRead = this.getRandom(readPassages, 1)[0];
        if (selectedRead) {
            const qs = selectedRead.questions.slice(0, 5).map((q, qIdx) => ({
                id: `r_final_${qIdx}`,
                type: 'reading',
                question: q.q,
                options: q.options,
                answer: q.answer
            }));
            test.sections.push({ title: "VII. Reading Proficiency", context: selectedRead.text, questions: qs });
        }

        this.state.generatedTest = test;
    },

    /**
     * Render the massive exam UI
     */
    renderExam() {
        const container = document.getElementById('page-content');
        if (!container) return;

        let totalQuestions = 0;
        this.state.generatedTest.sections.forEach(s => totalQuestions += s.questions.length);

        let html = `
            <div class="exam-app-container" style="background: var(--bg);">
                <!-- Exam Sticky Header -->
                <header class="exam-top-nav" style="background: var(--card-bg); border-bottom: 2px solid var(--accent);">
                    <div class="etn-left">
                        <button class="exit-btn" onclick="ExamModule.confirmExit()" style="background: var(--off-white); color: var(--text);">EXIT</button>
                        <div class="exam-title-group">
                            <span class="exam-label">B1 CERTIFICATION</span>
                            <h2 style="color: var(--text)">${this.state.generatedTest.title}</h2>
                        </div>
                    </div>
                    <div class="etn-center">
                        <div class="pinyin-toggle-box" style="color: var(--text)">
                            <label class="toggle">
                                <input type="checkbox" id="global-pinyin-toggle" onchange="ExamModule.togglePinyin(this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span>SHOW PINYIN</span>
                        </div>
                    </div>
                    <div class="etn-right">
                        <div class="exam-progress-stats">
                            <div class="prog-bar-container" style="background: var(--border);">
                                <div class="prog-bar-fill" id="exam-prog-fill" style="width: 0%"></div>
                            </div>
                            <span id="exam-prog-text" style="color: var(--text-3)">0 / ${totalQuestions}</span>
                        </div>
                    </div>
                </header>

                <div class="exam-main-body">
        `;

        this.state.generatedTest.sections.forEach((section, sIdx) => {
            html += `
                <section class="exam-mega-section">
                    <div class="ems-header">
                        <span class="ems-num">${sIdx + 1}</span>
                        <h3 style="color: var(--text)">${section.title}</h3>
                    </div>
                    
                    ${section.context ? `
                        <div class="ems-context card shadow-sm" style="background: var(--card-bg); border-left: 8px solid var(--accent);">
                            ${section.isAudio ? `
                                <div class="audio-instruction">
                                    <button class="btn btn-primary audio-play-btn" onclick="ExamModule.playText(\`${section.context.replace(/'/g, "\\'")}\`)">
                                        🔊 PLAY AUDIO PASSAGE
                                    </button>
                                    <p style="color: var(--text-2); margin-top: 16px;">Listen to the passage carefully before answering the questions below.</p>
                                </div>
                            ` : `
                                <div class="reading-passage font-zh" style="color: var(--text)">
                                    ${this.annotateText(section.context)}
                                </div>
                            `}
                        </div>
                    ` : ''}

                    <div class="ems-questions-list">
            `;

            section.questions.forEach((q) => {
                html += `
                    <div class="exam-question-item card" id="q-item-${q.id}" style="background: var(--card-bg); border: 1px solid var(--border);">
                        <div class="eq-body">
                            <p class="eq-text" style="color: var(--text)">${this.annotateText(q.question)}</p>
                            
                            ${q.type === 'writing' ? `
                                <div class="writing-task">
                                    <div class="writing-canvas-box" style="background: white; border: 2px dashed var(--border);">
                                        <div id="writing-hanzi-${q.id}" class="canvas-writer"></div>
                                        <canvas id="writing-canvas-${q.id}" class="canvas-freehand"></canvas>
                                    </div>
                                    <div class="canvas-controls">
                                        <button class="btn btn-ghost btn-sm" onclick="ExamModule.resetWriting('${q.id}', '${q.targetChar}')">Clear Canvas</button>
                                        <button class="btn btn-ghost btn-sm" onclick="ExamModule.markWritingDone('${q.id}')">Submit Drawing</button>
                                    </div>
                                </div>
                            ` : `
                                <div class="options-grid-premium">
                                    ${q.options.map(opt => `
                                        <button class="eq-option" style="background: var(--card-bg); border: 2px solid var(--border); color: var(--text);" onclick="ExamModule.answerQuestion(this, '${opt.replace(/'/g, "\\'")}', '${q.answer.replace(/'/g, "\\'")}', '${q.id}')">
                                            ${this.annotateText(opt)}
                                        </button>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            });

            html += `</div></section>`;
        });

        html += `
                </div>
                <footer class="exam-footer" style="background: var(--card-bg); border-top: 1px solid var(--border);">
                    <button class="btn btn-success btn-huge" onclick="ExamModule.submitFinal()">SUBMIT COMPLETED EXAM</button>
                </footer>
            </div>
        `;

        container.innerHTML = html;
        
        // Initialize writing canvases
        this.state.generatedTest.sections.forEach(s => {
            s.questions.forEach(q => {
                if (q.type === 'writing') {
                    setTimeout(() => {
                        window.DrawingBoard.init(`writing-hanzi-${q.id}`, `writing-canvas-${q.id}`, q.targetChar);
                    }, 100);
                }
            });
        });

        window.scrollTo(0, 0);
    },

    /**
     * Logic to annotate text with Pinyin if it's "complex" or if toggle is ON
     */
    annotateText(text) {
        if (!text) return '';
        const regex = /[\u4e00-\u9fa5]+/g;
        
        return text.replace(regex, (match) => {
            const charData = App.state.characters.find(c => c.hanzi === match || c.traditional === match);
            const pinyin = charData ? charData.pinyin : '';
            const isComplex = charData && (charData.frequency_rank > 500 || this.state.showPinyin);
            
            if (isComplex && pinyin) {
                return `<ruby>${match}<rt class="exam-rt ${this.state.showPinyin ? 'show' : ''}" style="color: var(--accent)">${pinyin}</rt></ruby>`;
            }
            return match;
        });
    },

    togglePinyin(show) {
        this.state.showPinyin = show;
        document.querySelectorAll('.exam-rt').forEach(rt => {
            rt.classList.toggle('show', show);
        });
    },

    playText(text) {
        if (typeof TTS !== 'undefined') {
            TTS.speak(text, 'zh-TW', 0.75);
        }
    },

    answerQuestion(btn, selected, correct, qId) {
        if (this.state.userAnswers[qId]) return;
        
        this.state.userAnswers[qId] = { isCorrect: selected === correct };
        
        const parent = btn.closest('.options-grid-premium');
        parent.querySelectorAll('.eq-option').forEach(b => {
            b.disabled = true;
            if (b.textContent.trim() === correct) b.classList.add('correct');
            else if (b.textContent.trim() === selected) b.classList.add('incorrect');
        });
        
        this.updateProgress();
    },

    resetWriting(id, char) {
        window.DrawingBoard.reset();
        window.DrawingBoard.init(`writing-hanzi-${id}`, `writing-canvas-${id}`, char);
    },

    markWritingDone(id) {
        if (this.state.userAnswers[id]) return;
        this.state.userAnswers[id] = { isCorrect: true }; 
        this.updateProgress();
    },

    updateProgress() {
        let answered = Object.keys(this.state.userAnswers).length;
        let total = 0;
        this.state.generatedTest.sections.forEach(s => total += s.questions.length);
        
        const percent = (answered / total) * 100;
        const fill = document.getElementById('exam-prog-fill');
        const text = document.getElementById('exam-prog-text');
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${answered} / ${total}`;
    },

    confirmExit() {
        if (confirm("Warning: Leaving will lose your progress on this exam. Exit anyway?")) {
            this.renderHub(document.getElementById('page-content'));
        }
    },

    submitFinal() {
        let total = 0;
        this.state.generatedTest.sections.forEach(s => total += s.questions.length);
        let answered = Object.keys(this.state.userAnswers).length;

        if (answered < total) {
            if (!confirm(`You have only answered ${answered} out of ${total} questions. Submit anyway?`)) return;
        }

        let correct = Object.values(this.state.userAnswers).filter(a => a.isCorrect).length;
        const score = Math.round((correct / total) * 100);
        
        if (score >= 80) {
            if (!App.state.progress.exams) App.state.progress.exams = {};
            App.state.progress.exams[this.state.currentMonth] = true;
            App.saveProgress();
            this.showResult(score, true);
        } else {
            this.showResult(score, false);
        }
    },

    showResult(score, passed) {
        const modal = document.createElement('div');
        modal.className = 'exam-result-overlay';
        modal.innerHTML = `
            <div class="exam-result-card ${passed ? 'pass' : 'fail'}" style="background: var(--card-bg); border: 2px solid ${passed ? '#27ae60' : '#e74c3c'};">
                <div class="result-badge">${passed ? '🏅' : '📚'}</div>
                <h2 style="color: var(--text)">${passed ? 'CERTIFICATION GRANTED' : 'CERTIFICATION DENIED'}</h2>
                <div class="score-grid">
                    <div class="score-item">
                        <span class="sv" style="color: var(--text)">${score}%</span>
                        <span class="sl" style="color: var(--text-3)">YOUR SCORE</span>
                    </div>
                    <div class="score-item">
                        <span class="sv" style="color: var(--text)">80%</span>
                        <span class="sl" style="color: var(--text-3)">REQUIRED</span>
                    </div>
                </div>
                <p class="result-msg" style="color: var(--text-2)">${passed ? 'Outstanding. You have officially demonstrated B1 level proficiency for this milestone.' : 'You are close. Review your study materials and retake the exam to receive your certification.'}</p>
                <button class="btn btn-primary btn-lg" onclick="this.closest('.exam-result-overlay').remove(); ExamModule.renderHub(document.getElementById('page-content'))">RETURN TO HUB</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    getRandom(arr, n) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    },

    shuffle(arr) {
        return [...arr].sort(() => 0.5 - Math.random());
    },

    addStyles() {
        if (document.getElementById('exam-pro-styles')) return;
        const style = document.createElement('style');
        style.id = 'exam-pro-styles';
        style.textContent = `
            /* Modern Exam Hub Styles */
            .exam-hub-modern { padding-bottom: 80px; background: var(--bg); min-height: 100vh; }
            
            .exam-hero {
                background: linear-gradient(135deg, var(--charcoal), #1a252f);
                padding: 100px 20px 140px;
                text-align: center;
                color: white;
                margin-bottom: -60px;
            }
            .exam-hero-content { max-width: 850px; margin: 0 auto; }
            .exam-hero-badge { 
                display: inline-block; padding: 6px 18px; background: rgba(255,255,255,0.1); 
                border-radius: 30px; font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; 
                margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.15);
            }
            .exam-hero-title { font-size: 4rem; font-weight: 900; margin-bottom: 16px; letter-spacing: -1.5px; color: white; }
            .exam-hero-desc { font-size: 1.25rem; color: rgba(255,255,255,0.75); line-height: 1.6; margin-bottom: 48px; }
            
            .exam-global-progress { 
                max-width: 500px; margin: 0 auto;
                background: rgba(255,255,255,0.05); padding: 24px; border-radius: 20px; 
                backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); text-align: left; 
            }
            .egp-info { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 0.9rem; font-weight: 700; }
            .egp-bar-bg { height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; }
            .egp-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #3b82f6); border-radius: 5px; transition: width 1.2s ease-in-out; }

            .exam-levels-wrapper { max-width: 1150px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; }
            
            .exam-level-track { background: var(--card-bg); border-radius: 24px; padding: 40px; margin-bottom: 40px; box-shadow: var(--shadow-xl); border: 1px solid var(--border); }
            .level-track-header { display: flex; align-items: center; gap: 28px; padding-bottom: 32px; margin-bottom: 32px; border-bottom: 1px solid var(--border); }
            .lth-icon { width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; flex-shrink: 0; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }
            .lth-info { flex: 1; }
            .level-badge { padding: 4px 12px; border-radius: 8px; color: white; font-size: 0.75rem; font-weight: 900; letter-spacing: 1px; }
            .lth-progress { background: var(--off-white); padding: 10px 20px; border-radius: 14px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }

            .exam-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
            
            .exam-modern-card { 
                background: var(--card-bg); border: 2px solid var(--border); border-radius: 20px; padding: 32px; 
                cursor: pointer; transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;
                display: flex; flex-direction: column;
            }
            .exam-modern-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-2xl); border-color: var(--accent); }
            
            .emc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative; z-index: 2; }
            .emc-month { font-size: 0.7rem; font-weight: 900; color: var(--text-3); letter-spacing: 1.5px; text-transform: uppercase; }
            .emc-status { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 30px; font-size: 0.7rem; font-weight: 800; }
            .emc-status.open { background: var(--off-white); color: var(--text-2); }
            .emc-status.certified { background: rgba(16, 185, 129, 0.1); color: #10b981; }
            
            .emc-body { margin-bottom: 32px; position: relative; z-index: 2; flex: 1; }
            .emc-title { font-size: 1.5rem; font-weight: 900; color: var(--text); margin-bottom: 12px; line-height: 1.3; letter-spacing: -0.5px; }
            .emc-desc { font-size: 0.95rem; color: var(--text-2); line-height: 1.6; }
            
            .emc-footer { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; padding-top: 20px; border-top: 1px solid var(--border); }
            .emc-meta { display: flex; gap: 16px; font-size: 0.85rem; font-weight: 700; color: var(--text-3); }
            .emc-btn { padding: 10px 24px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; transition: all 0.2s; }
            
            .exam-modern-card.is-certified { border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(to bottom right, var(--card-bg), rgba(16, 185, 129, 0.03)); }
            .emc-certified-bg { position: absolute; right: -30px; bottom: -30px; font-size: 10rem; opacity: 0.04; z-index: 1; pointer-events: none; transform: rotate(-15deg); }

            /* Exam UI Styles */
            .exam-app-container { min-height: 100vh; padding-bottom: 120px; }
            .exam-top-nav { 
                position: sticky; top: 0; z-index: 1000; 
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .etn-left { display: flex; align-items: center; gap: 30px; }
            .exit-btn { border: none; padding: 10px 20px; font-weight: 800; cursor: pointer; border-radius: 5px; }
            .exam-title-group h2 { margin: 0; font-size: 1.2rem; }
            .exam-label { font-size: 0.7rem; font-weight: 900; color: var(--accent); letter-spacing: 2px; }
            
            .pinyin-toggle-box { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 0.8rem; }
            
            .exam-progress-stats { min-width: 200px; }
            .prog-bar-container { height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
            .prog-bar-fill { height: 100%; background: #27ae60; transition: width 0.3s; }

            .exam-main-body { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
            .exam-mega-section { margin-bottom: 80px; }
            .ems-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
            .ems-num { width: 40px; height: 40px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 900; font-size: 1.2rem; }
            .ems-header h3 { font-size: 1.8rem; font-family: var(--font-zh); border-bottom: 4px solid var(--accent); }

            .ems-context { padding: 40px; margin-bottom: 40px; }
            .reading-passage { font-size: 1.4rem; line-height: 2.2; }
            
            .exam-rt { display: none; color: var(--accent); font-weight: 600; font-size: 0.8rem; }
            .exam-rt.show { display: block; }

            .eq-body { padding: 30px; }
            .eq-text { font-size: 1.25rem; margin-bottom: 25px; font-weight: 600; }
            
            .options-grid-premium { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .eq-option { 
                padding: 20px; border-radius: 12px;
                text-align: left; cursor: pointer; transition: all 0.2s; font-size: 1.1rem;
            }
            .eq-option:hover:not(:disabled) { border-color: var(--accent); opacity: 0.8; }
            .eq-option.correct { background: #e6fffa !important; border-color: #38b2ac !important; color: #234e52 !important; font-weight: 800; }
            .eq-option.incorrect { background: #fff5f5 !important; border-color: #f56565 !important; color: #742a2a !important; }

            .writing-canvas-box { 
                width: 300px; height: 300px; 
                margin: 0 auto 20px; position: relative; 
            }
            .canvas-writer, .canvas-freehand { position: absolute; inset: 0; width: 100%; height: 100%; }
            .canvas-controls { text-align: center; display: flex; justify-content: center; gap: 10px; }

            .exam-footer { 
                position: fixed; bottom: 0; left: 0; right: 0; 
                padding: 25px; text-align: center;
                box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
            }
            .btn-huge { padding: 20px 80px; font-size: 1.5rem; font-weight: 900; border-radius: 40px; }

            .score-grid { display: flex; justify-content: center; gap: 40px; margin: 30px 0; }
            .score-item { text-align: center; }
            .score-item .sv { font-size: 3.5rem; font-weight: 900; display: block; }
            .score-item .sl { font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; }

            .exam-result-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .exam-result-card { max-width: 500px; width: 100%; padding: 40px; border-radius: 20px; text-align: center; }

            @media (max-width: 768px) {
                .exam-hero { padding: 60px 20px 80px 20px; }
                .exam-hero-title { font-size: 2.8rem; }
                .level-track-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                .lth-progress { align-self: flex-start; }
                .options-grid-premium { grid-template-columns: 1fr; }
                .exam-top-nav { padding: 15px 20px; }
                .etn-center { display: none; }
            }
        `;
        document.head.appendChild(style);
    }
};
