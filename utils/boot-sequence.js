/**
 * boot-sequence.js — Retro arcade cabinet power-on animation.
 *
 * Displays a CRT boot screen with scanlines, letter-by-letter "ARCADE" text,
 * diagnostic messages, and a loading bar before fading to the hub.
 *
 * Only plays once per browser session (sessionStorage).
 * Click anywhere or press any key to skip instantly.
 */

const SESSION_KEY = 'arcade_boot_done';

/**
 * Play a short 8-bit power-on beep sequence using Web Audio API.
 * Uses the same AudioContext pattern as utils/audio.js.
 */
function playBootBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const c = new AudioCtx();

        const beep = (freq, start, dur, type = 'square', vol = 0.08) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain);
            gain.connect(c.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, c.currentTime + start);
            gain.gain.setValueAtTime(vol, c.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
            osc.start(c.currentTime + start);
            osc.stop(c.currentTime + start + dur + 0.02);
        };

        // Rising power-on chirp
        beep(220, 0,    0.08, 'square',   0.06);
        beep(330, 0.08, 0.08, 'square',   0.07);
        beep(440, 0.16, 0.08, 'square',   0.08);
        beep(660, 0.24, 0.12, 'square',   0.09);
        beep(880, 0.36, 0.18, 'triangle', 0.07);
    } catch (_) {}
}

/**
 * Check if the user has muted sound in audio.js preferences.
 */
function isSoundMuted() {
    try {
        return localStorage.getItem('arcade_sound') === 'muted';
    } catch { return false; }
}

/**
 * Inject the boot-screen DOM and CSS, then animate.
 * Returns a Promise that resolves when the animation is done or skipped.
 */
function runBootSequence() {
    return new Promise(resolve => {
        // Inject CSS
        const style = document.createElement('style');
        style.id = 'boot-sequence-style';
        style.textContent = `
            #boot-screen {
                position: fixed;
                inset: 0;
                z-index: 10000;
                background: #000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Press Start 2P', monospace;
                overflow: hidden;
                cursor: pointer;
            }
            #boot-screen.fade-out {
                opacity: 0;
                transition: opacity 0.4s ease-out;
                pointer-events: none;
            }

            /* Scanline overlay */
            #boot-screen::before {
                content: '';
                position: absolute;
                inset: 0;
                background: repeating-linear-gradient(
                    to bottom,
                    transparent 0px,
                    transparent 3px,
                    rgba(0,0,0,0.25) 3px,
                    rgba(0,0,0,0.25) 4px
                );
                pointer-events: none;
                z-index: 1;
            }

            /* Vignette */
            #boot-screen::after {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%);
                pointer-events: none;
                z-index: 1;
            }

            .boot-content {
                position: relative;
                z-index: 2;
                text-align: center;
                color: #33ff33;
            }

            /* ARCADE title */
            .boot-title {
                font-size: clamp(2rem, 8vw, 4rem);
                letter-spacing: 0.3em;
                margin-bottom: 2rem;
                display: flex;
                justify-content: center;
                gap: 0.1em;
            }

            .boot-letter {
                opacity: 0;
                text-shadow:
                    0 0 8px #33ff33,
                    0 0 20px #33ff33,
                    0 0 40px #00cc00,
                    0 0 80px #009900;
                animation: letterIn 0.15s ease-out forwards;
                display: inline-block;
            }

            @keyframes letterIn {
                0%   { opacity: 0; transform: scale(1.6) translateY(-8px); filter: brightness(3); }
                60%  { opacity: 1; transform: scale(1.0) translateY(0);    filter: brightness(1.8); }
                100% { opacity: 1; transform: scale(1.0) translateY(0);    filter: brightness(1); }
            }

            /* Diagnostic lines */
            .boot-diag {
                font-size: clamp(0.35rem, 1.5vw, 0.55rem);
                color: #33ff33;
                margin-top: 1.5rem;
                text-align: left;
                min-width: min(340px, 80vw);
                line-height: 2;
            }

            .boot-diag-line {
                opacity: 0;
                white-space: nowrap;
                overflow: hidden;
            }

            .boot-diag-line.show {
                opacity: 1;
            }

            .boot-diag-line .ok {
                color: #00ff88;
            }

            /* Progress bar */
            .boot-progress-wrap {
                margin-top: 1.2rem;
                width: min(340px, 80vw);
                height: 8px;
                border: 1px solid #33ff33;
                border-radius: 1px;
                overflow: hidden;
                opacity: 0;
            }
            .boot-progress-wrap.show { opacity: 1; }

            .boot-progress-bar {
                height: 100%;
                width: 0%;
                background: #33ff33;
                box-shadow: 0 0 6px #33ff33;
                transition: width 0.6s ease-in-out;
            }

            /* Skip hint */
            .boot-skip {
                position: absolute;
                bottom: 1.5rem;
                font-size: 0.35rem;
                color: #555;
                letter-spacing: 0.15em;
                z-index: 2;
                animation: blink-skip 1.5s step-end infinite;
            }

            @keyframes blink-skip {
                0%, 100% { opacity: 1; }
                50%      { opacity: 0; }
            }

            /* Initial fade-in of the whole screen */
            #boot-screen {
                animation: bootFadeIn 0.3s ease-out;
            }

            @keyframes bootFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Build DOM
        const screen = document.createElement('div');
        screen.id = 'boot-screen';
        screen.innerHTML = `
            <div class="boot-content">
                <div class="boot-title" id="bootTitle"></div>
                <div class="boot-diag" id="bootDiag"></div>
                <div class="boot-progress-wrap" id="bootProgressWrap">
                    <div class="boot-progress-bar" id="bootProgressBar"></div>
                </div>
            </div>
            <div class="boot-skip">CLICK OR PRESS ANY KEY TO SKIP</div>
        `;
        document.body.appendChild(screen);

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.remove();
                style.remove();
                resolve();
            }, 420);
        };

        // Skip handlers
        screen.addEventListener('click', finish, { once: true });
        const keySkip = () => { finish(); document.removeEventListener('keydown', keySkip); };
        document.addEventListener('keydown', keySkip);

        // Run the animation timeline
        const TITLE = 'ARCADE';
        const titleEl = document.getElementById('bootTitle');
        const diagEl = document.getElementById('bootDiag');
        const progWrap = document.getElementById('bootProgressWrap');
        const progBar = document.getElementById('bootProgressBar');

        const diagLines = [
            'SYSTEM BOOT v1.0',
            'INITIALIZING GAMES...',
            'ROM CHECK ........... <span class="ok">OK</span>',
            'AUDIO SUBSYSTEM ..... <span class="ok">OK</span>',
            'CRT DISPLAY ......... <span class="ok">OK</span>',
            'ALL SYSTEMS READY',
        ];

        // Build diag lines (hidden)
        diagLines.forEach(text => {
            const div = document.createElement('div');
            div.className = 'boot-diag-line';
            div.innerHTML = text;
            diagEl.appendChild(div);
        });

        const allDiagEls = diagEl.querySelectorAll('.boot-diag-line');
        let step = 0;
        const timers = [];

        const at = (ms, fn) => { timers.push(setTimeout(() => { if (!done) fn(); }, ms)); };

        // Play sound at start (unless muted)
        if (!isSoundMuted()) {
            at(100, playBootBeep);
        }

        // Letter-by-letter ARCADE title
        TITLE.split('').forEach((ch, i) => {
            at(200 + i * 130, () => {
                const span = document.createElement('span');
                span.className = 'boot-letter';
                span.style.animationDelay = '0s';
                span.textContent = ch;
                titleEl.appendChild(span);
            });
        });

        // Diagnostic messages
        const diagStart = 200 + TITLE.length * 130 + 200;
        diagLines.forEach((_, i) => {
            at(diagStart + i * 280, () => {
                allDiagEls[i].classList.add('show');
                step = i + 1;
            });
        });

        // Progress bar
        const progStart = diagStart + 200;
        at(progStart, () => {
            progWrap.classList.add('show');
        });
        at(progStart + 100, () => { progBar.style.width = '35%'; });
        at(progStart + 500, () => { progBar.style.width = '70%'; });
        at(progStart + 900, () => { progBar.style.width = '100%'; });

        // Auto-finish
        const totalTime = diagStart + diagLines.length * 280 + 600;
        at(totalTime, finish);
    });
}

/**
 * Initialize the boot sequence.
 * Skips if already played this session or returning from a game.
 * Call this before the hub's main init code; await the returned promise.
 *
 * @returns {Promise<void>}
 */
export async function initBoot() {
    // Skip if already played this session
    try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}

    // Skip if returning from a game (hash navigation)
    if (location.hash === '#games') return;

    // Mark as played
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}

    // Hide the hub screens during boot
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => { s.style.visibility = 'hidden'; });

    await runBootSequence();

    // Restore hub screens
    screens.forEach(s => { s.style.visibility = ''; });
}
