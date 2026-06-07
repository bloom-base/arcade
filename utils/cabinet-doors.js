/**
 * cabinet-doors.js — Arcade cabinet door open animation.
 *
 * Shows two cabinet doors that swing outward to reveal the game screen,
 * accompanied by a subtle creak sound. Returns a Promise that resolves
 * once the animation completes so the caller can navigate.
 *
 * Pattern: injects persistent <style>, creates/removes DOM per play.
 * Same approach as coin-slot.js.
 */

import { playCreak, isMuted } from './audio.js';

/* ── CSS (injected once) ─────────────────────────────── */
const STYLE_ID = 'cabinet-doors-style';

function ensureCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = /* css */ `
/* ── Backdrop ───────────────────────────────────── */
.cab-door-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10002;
    background: #000;
    opacity: 0;
    transition: opacity 0.2s ease-in;
    pointer-events: none;
}
.cab-door-backdrop.cab-door-active { opacity: 1; }

/* ── Door container ─────────────────────────────── */
.cab-door-wrap {
    position: fixed;
    inset: 0;
    z-index: 10003;
    display: flex;
    pointer-events: none;
    perspective: 1200px;
}

/* ── Shared door styles ─────────────────────────── */
.cab-door {
    flex: 1;
    position: relative;
    background: linear-gradient(180deg,
        #1a1a2e 0%, #16213e 40%, #0f3460 100%);
    border: 2px solid #333;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.6),
                inset 0 0 8px rgba(100,100,180,0.1);
    overflow: hidden;
}

/* Decorative panel lines */
.cab-door::before {
    content: '';
    position: absolute;
    top: 10%;
    bottom: 10%;
    width: 60%;
    border: 2px solid rgba(100, 100, 180, 0.15);
    border-radius: 4px;
}
.cab-door-left::before  { right: 12%; }
.cab-door-right::before { left: 12%; }

/* Metallic edge strip on the opening side */
.cab-door::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(180deg,
        #666 0%, #888 30%, #555 60%, #777 100%);
    box-shadow: 0 0 6px rgba(150,150,200,0.2);
}
.cab-door-left::after  { right: 0; }
.cab-door-right::after { left: 0; }

/* ── Handle / lock detail ───────────────────────── */
.cab-door-handle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 48px;
    border-radius: 3px;
    background: linear-gradient(180deg, #999 0%, #666 100%);
    box-shadow: 0 0 4px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.2);
}
.cab-door-left  .cab-door-handle { right: 18px; }
.cab-door-right .cab-door-handle { left: 18px; }

/* ── Swing animation ────────────────────────────── */
.cab-door-left {
    transform-origin: left center;
    transform: rotateY(0deg);
}
.cab-door-right {
    transform-origin: right center;
    transform: rotateY(0deg);
}

.cab-door-active .cab-door-left {
    animation: _cabdoor_swing_left 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}
.cab-door-active .cab-door-right {
    animation: _cabdoor_swing_right 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

@keyframes _cabdoor_swing_left {
    0%   { transform: rotateY(0deg); }
    100% { transform: rotateY(-105deg); }
}
@keyframes _cabdoor_swing_right {
    0%   { transform: rotateY(0deg); }
    100% { transform: rotateY(105deg); }
}

/* ── Reveal glow from behind doors ──────────────── */
.cab-door-glow {
    position: fixed;
    inset: 0;
    z-index: 10001;
    background: radial-gradient(ellipse at center,
        rgba(0, 255, 255, 0.08) 0%,
        rgba(0, 0, 0, 0) 70%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s 0.2s ease-out;
}
.cab-door-active ~ .cab-door-glow { opacity: 1; }
`;
    document.head.appendChild(style);
}

/* ── Animation runner ────────────────────────────── */
let _playing = false;

/**
 * Play the cabinet door open animation and sound.
 * Resolves after ~750ms when doors are fully open.
 *
 * @returns {Promise<void>}
 */
export function playCabinetDoors() {
    if (_playing) return Promise.resolve();
    _playing = true;

    ensureCSS();

    return new Promise(resolve => {
        /* Build DOM */
        const backdrop = document.createElement('div');
        backdrop.className = 'cab-door-backdrop';

        const wrap = document.createElement('div');
        wrap.className = 'cab-door-wrap';
        wrap.innerHTML = `
            <div class="cab-door cab-door-left">
                <div class="cab-door-handle"></div>
            </div>
            <div class="cab-door cab-door-right">
                <div class="cab-door-handle"></div>
            </div>
        `;

        const glow = document.createElement('div');
        glow.className = 'cab-door-glow';

        document.body.appendChild(backdrop);
        document.body.appendChild(wrap);
        document.body.appendChild(glow);

        /* Trigger reflow, then start */
        requestAnimationFrame(() => {
            backdrop.classList.add('cab-door-active');
            wrap.classList.add('cab-door-active');
            if (!isMuted()) playCreak();
        });

        /* Resolve after doors fully open, then clean up */
        setTimeout(() => {
            _playing = false;
            resolve();
            /* Leave DOM in place — navigation is about to happen,
               so the open doors persist as the page unloads.
               If navigation is cancelled, clean up after a beat. */
            setTimeout(() => {
                backdrop.remove();
                wrap.remove();
                glow.remove();
            }, 600);
        }, 700);
    });
}
