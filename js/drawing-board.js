/**
 * drawing-board.js
 * A non-intrusive controller for HanziWriter and a freehand canvas.
 */

window.DrawingBoard = (() => {
    let state = {
        mode: 'guided', // 'guided' or 'freehand'
        penOnly: false,
        strokeWidth: 4,
        hanzi: '',
        hw: null,
        canvas: null,
        ctx: null,
        isDrawing: false,
        lastPos: null,
        container: null,
        writerTarget: null,
        theme: 'light'
    };

    function init(writerTargetId, canvasId, hanzi) {
        state.writerTarget = document.getElementById(writerTargetId);
        state.canvas = document.getElementById(canvasId);
        if (!state.writerTarget || !state.canvas) return;

        state.hanzi = hanzi;
        state.theme = document.documentElement.getAttribute('data-theme') || 'light';
        state.strokeColor = state.theme === 'dark' ? '#e8e4df' : '#2C3E50';
        state.outlineColor = state.theme === 'dark' ? '#333333' : '#EAEAEA';

        state.ctx = state.canvas.getContext('2d');
        
        // Ensure canvas is correctly sized
        resizeCanvas();

        // Initialize HanziWriter
        initHanziWriter();

        // Canvas events
        state.canvas.onpointerdown = handlePointerDown;
        state.canvas.onpointermove = handlePointerMove;
        state.canvas.onpointerup = handlePointerUp;
        state.canvas.onpointercancel = handlePointerUp;

        // Auto-resize handling
        window.removeEventListener('resize', resizeCanvas);
        window.addEventListener('resize', resizeCanvas);
        
        // Synchronize UI
        syncUI();
        
        // Initial visibility
        setMode(state.mode);
    }

    function syncUI() {
        const modeSelects = document.querySelectorAll('select[onchange*="DrawingBoard.setMode"]');
        modeSelects.forEach(s => s.value = state.mode);

        const penControls = [document.getElementById('pen-controls'), document.getElementById('app-pen-controls')];
        penControls.forEach(c => {
            if (c) c.style.display = state.mode === 'freehand' ? 'flex' : 'none';
        });

        const penOnlyChecks = document.querySelectorAll('input[onchange*="DrawingBoard.setPenOnly"]');
        penOnlyChecks.forEach(c => c.checked = state.penOnly);

        const widthSliders = document.querySelectorAll('input[oninput*="DrawingBoard.setPenWidth"]');
        widthSliders.forEach(s => s.value = state.strokeWidth);
    }

    function initHanziWriter() {
        if (typeof HanziWriter === 'undefined' || !state.writerTarget) return;
        state.writerTarget.innerHTML = '';
        
        const rect = state.writerTarget.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height) - 20;
        
        state.hw = HanziWriter.create(state.writerTarget.id, state.hanzi, {
            width: size > 0 ? size : 280,
            height: size > 0 ? size : 280,
            padding: 10,
            showCharacter: false,
            showOutline: true,
            strokeAnimationSpeed: 1.5,
            delayBetweenStrokes: 50,
            strokeColor: state.strokeColor,
            outlineColor: state.outlineColor,
            highlightColor: '#C0392B',
            drawingWidth: 15
        });

        if (state.mode === 'guided') {
            state.hw.quiz();
        }
    }

    function resizeCanvas() {
        if (!state.canvas) return;
        const rect = state.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Match logical size to container
        state.canvas.style.width = rect.width + 'px';
        state.canvas.style.height = rect.height + 'px';
        
        // Match internal buffer to physical pixels for precision
        state.canvas.width = rect.width * dpr;
        state.canvas.height = rect.height * dpr;
        
        // Scale context to match logical coordinates
        state.ctx.scale(dpr, dpr);
        
        clearFreehand();
    }

    function setMode(mode) {
        state.mode = mode;
        if (!state.canvas) return;

        if (mode === 'guided') {
            state.canvas.style.display = 'none';
            state.canvas.style.pointerEvents = 'none';
            if (state.hw) {
                state.hw.showOutline();
                state.hw.quiz();
            }
        } else {
            state.canvas.style.display = 'block';
            state.canvas.style.pointerEvents = 'auto';
            state.canvas.style.zIndex = '10'; // Ensure it's on top
            if (state.hw) {
                state.hw.cancelQuiz();
            }
        }
        syncUI();
    }

    function animate() {
        if (state.hw) {
            state.hw.cancelAnimation();
            state.hw.animateCharacter();
        }
    }

    function reset() {
        clearFreehand();
        initHanziWriter();
    }

    function clearFreehand() {
        if (!state.ctx) return;
        const dpr = window.devicePixelRatio || 1;
        state.ctx.clearRect(0, 0, state.canvas.width / dpr, state.canvas.height / dpr);
    }

    let frameId = null;
    let points = [];

    function handlePointerDown(e) {
        if (state.mode !== 'freehand') return;
        if (state.penOnly && e.pointerType !== 'pen') return;
        state.isDrawing = true;
        state.lastPos = getPos(e);
        state.canvas.setPointerCapture(e.pointerId);
        
        points = [state.lastPos];
        
        state.ctx.beginPath();
        state.ctx.lineCap = 'round';
        state.ctx.lineJoin = 'round';
        state.ctx.strokeStyle = state.strokeColor;
        state.ctx.lineWidth = state.strokeWidth;
        state.ctx.moveTo(state.lastPos.x, state.lastPos.y);

        if (!frameId) {
            frameId = requestAnimationFrame(drawFrame);
        }
    }

    function handlePointerMove(e) {
        if (!state.isDrawing) return;
        if (state.penOnly && e.pointerType !== 'pen') return;
        
        // Use coalesced events for highest possible fidelity (sampling between frames)
        if (e.getCoalescedEvents) {
            const events = e.getCoalescedEvents();
            for (const ev of events) {
                points.push(getPos(ev));
            }
        } else {
            points.push(getPos(e));
        }

        // Optional: predicted events for "zero" latency feel on tablets
        if (e.getPredictedEvents) {
            // We don't push them to 'points' permanently because they change,
            // but for simple line drawing, just using coalesced is usually enough.
        }
    }

    function drawFrame() {
        if (points.length > 1) {
            state.ctx.beginPath();
            state.ctx.lineWidth = state.strokeWidth;
            state.ctx.lineCap = 'round';
            state.ctx.lineJoin = 'round';
            state.ctx.strokeStyle = state.strokeColor;
            
            state.ctx.moveTo(state.lastPos.x, state.lastPos.y);
            
            for (let i = 1; i < points.length; i++) {
                state.ctx.lineTo(points[i].x, points[i].y);
                state.lastPos = points[i];
            }
            state.ctx.stroke();
            points = [state.lastPos];
        }
        
        if (state.isDrawing) {
            frameId = requestAnimationFrame(drawFrame);
        } else {
            frameId = null;
        }
    }

    function handlePointerUp(e) {
        if (state.isDrawing) {
            // Draw any remaining points
            const currentPos = getPos(e);
            points.push(currentPos);
            drawFrame();
        }
        state.isDrawing = false;
        if (state.canvas && e.pointerId) {
            try { state.canvas.releasePointerCapture(e.pointerId); } catch(err) {}
        }
    }

    function getPos(e) {
        const rect = state.canvas.getBoundingClientRect();
        // Accounting for CSS transforms/scaling to fix the "above the pen" offset
        const scaleX = state.canvas.offsetWidth / rect.width;
        const scaleY = state.canvas.offsetHeight / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function open(text) {
        if (!text) return;
        
        // Filter out non-Chinese characters for guided writing but keep track of indices
        const textArray = text.split('');
        const characters = [];
        textArray.forEach((char, index) => {
            const code = char.charCodeAt(0);
            if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)) {
                characters.push({ char, originalIndex: index });
            }
        });
        
        if (characters.length === 0) return;
        
        let currentIndex = 0;
        
        const renderModal = () => {
            const activeCharObj = characters[currentIndex];
            const Modal = window.Modal;
            if (!Modal) return;

            Modal.show(`
                <button class="modal-close" onclick="Modal.hide()">✕</button>
                <div style="text-align:center; padding:10px">
                    <h3 style="margin-bottom:12px">Writing Practice</h3>
                    <div style="font-size:1.4rem; margin-bottom:24px; color:var(--text); font-family:var(--font-zh); letter-spacing:2px">
                        ${textArray.map((c, i) => {
                            const isActive = activeCharObj && activeCharObj.originalIndex === i;
                            return `<span style="${isActive ? 'color:var(--accent); font-weight:900; border-bottom:3px solid var(--accent); padding-bottom:2px' : ''}">${c}</span>`;
                        }).join('')}
                    </div>
                    
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px">
                        <div style="display:flex; justify-content:space-between; width:100%; max-width:320px; gap:10px">
                            <select class="input input-sm" style="width:auto; height:36px; background:var(--card-bg); color:var(--text); border-color:var(--border)" onchange="DrawingBoard.setMode(this.value)">
                                <option value="guided">Guided</option>
                                <option value="freehand">Freehand</option>
                            </select>
                            <div class="flex gap-8">
                                <button class="btn btn-ghost btn-sm" onclick="DrawingBoard.animate()">Animate</button>
                                <button class="btn btn-ghost btn-sm" onclick="DrawingBoard.reset()">Reset</button>
                            </div>
                        </div>
                        
                        <div class="canvas-container" style="width:300px; height:300px; background:var(--off-white); border:2px dashed var(--border); border-radius:var(--radius); position:relative; overflow:hidden">
                            <div id="modal-hanzi-writer" style="width:100%; height:100%"></div>
                            <canvas id="modal-freehand-canvas" style="position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; display:none"></canvas>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; width:100%; max-width:320px; align-items:center">
                            <button class="btn btn-secondary btn-sm" ${currentIndex === 0 ? 'disabled' : ''} onclick="window._prevChar()">← Previous</button>
                            <div style="font-weight:700; color:var(--text-3)">${currentIndex + 1} / ${characters.length}</div>
                            <button class="btn btn-secondary btn-sm" ${currentIndex === characters.length - 1 ? 'disabled' : ''} onclick="window._nextChar()">Next →</button>
                        </div>
                    </div>
                </div>
            `);
            
            setTimeout(() => {
                init('modal-hanzi-writer', 'modal-freehand-canvas', activeCharObj.char);
            }, 100);
        };
        
        window._nextChar = () => { if (currentIndex < characters.length - 1) { currentIndex++; renderModal(); } };
        window._prevChar = () => { if (currentIndex > 0) { currentIndex--; renderModal(); } };
        
        renderModal();
    }

    return {
        init,
        reset,
        animate,
        setMode,
        open,
        setPenOnly: (v) => { state.penOnly = v; },
        setPenWidth: (v) => { state.strokeWidth = parseInt(v); },
        getState: () => state
    };
})();
