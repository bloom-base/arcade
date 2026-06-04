/**
 * coin-slot.js — Coin insertion animation for the arcade hub.
 *
 * Shows a coin sprite dropping into a slot with a "COIN ACCEPTED" flash,
 * accompanied by a retro cha-ching sound. Returns a Promise that resolves
 * once the animation completes so the caller can navigate to the game.
 *
 * Pattern: injects its own <style> + DOM, cleans up after each play.
 * Under 250 lines of CSS + JS combined.
 */

import { playCoin, isMuted } from './audio.js';

/* ── CSS (injected once) ─────────────────────────────── */
const STYLE_ID = 'coin-slot-style';

function ensureCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = /* css */ `
/* ── Full-screen overlay ─────────────────────────── */
.coin-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.82);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease-in;
}
.coin-overlay.coin-visible { opacity: 1; }

/* ── Slot graphic ────────────────────────────────── */
.coin-slot-graphic {
    position: relative;
    width: 80px;
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* The slot hole */
.coin-slot-hole {
    position: absolute;
    bottom: 0;
    width: 52px;
    height: 10px;
    border-radius: 5px;
    background: #111;
    border: 2px solid #555;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8),
                0 0 8px rgba(255,0,255,0.3);
}

/* The coin */
.coin-sprite {
    position: absolute;
    top: -40px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%,
        #ffd700 0%, #daa520 50%, #b8860b 100%);
    border: 2.5px solid #aa7700;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.6),
                inset 0 -2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: #8B6914;
    text-shadow: 0 1px 0 rgba(255,255,200,0.5);
    animation: coin-drop 0.5s cubic-bezier(0.55, 0, 0.85, 0.36) forwards;
}
.coin-sprite::after { content: 'A'; }

/* ── "COIN ACCEPTED" text ────────────────────────── */
.coin-accepted-text {
    margin-top: 28px;
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #0f0;
    text-shadow: 0 0 8px #0f0, 0 0 20px rgba(0,255,0,0.4);
    opacity: 0;
    animation: coin-text-appear 0.3s 0.42s ease-out forwards;
}

/* ── Full-screen flash ───────────────────────────── */
.coin-flash {
    position: fixed;
    inset: 0;
    z-index: 10001;
    background: rgba(0, 255, 0, 0.12);
    opacity: 0;
    pointer-events: none;
    animation: coin-flash-pulse 0.35s 0.40s ease-out forwards;
}

/* ── Keyframes ───────────────────────────────────── */
@keyframes coin-drop {
    0%   { top: -40px; opacity: 1; transform: rotateY(0deg); }
    40%  { transform: rotateY(180deg); }
    80%  { top: 118px; opacity: 1; transform: rotateY(360deg); }
    90%  { top: 118px; opacity: 0.7; transform: rotateY(360deg) scaleY(0.5); }
    100% { top: 124px; opacity: 0; transform: rotateY(360deg) scaleY(0.1); }
}

@keyframes coin-text-appear {
    0%   { opacity: 0; transform: translateY(8px); }
    50%  { opacity: 1; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(0); }
}

@keyframes coin-flash-pulse {
    0%   { opacity: 0; }
    30%  { opacity: 1; }
    100% { opacity: 0; }
}
`;
    document.head.appendChild(style);
}

/* ── Animation runner ────────────────────────────── */
let _playing = false;

/**
 * Play the coin-insert animation and sound.
 * Resolves after ~900ms when the full sequence finishes.
 *
 * @returns {Promise<void>}
 */
export function playCoinAnimation() {
    if (_playing) return Promise.resolve();
    _playing = true;

    ensureCSS();

    return new Promise(resolve => {
        /* Build DOM */
        const overlay = document.createElement('div');
        overlay.className = 'coin-overlay';
        overlay.innerHTML = `
            <div class="coin-slot-graphic">
                <div class="coin-sprite"></div>
                <div class="coin-slot-hole"></div>
            </div>
            <div class="coin-accepted-text">coin accepted</div>
        `;

        const flash = document.createElement('div');
        flash.className = 'coin-flash';

        document.body.appendChild(overlay);
        document.body.appendChild(flash);

        /* Trigger reflow, then show */
        requestAnimationFrame(() => {
            overlay.classList.add('coin-visible');
            if (!isMuted()) playCoin();
        });

        /* Clean up and resolve */
        setTimeout(() => {
            overlay.classList.remove('coin-visible');
            setTimeout(() => {
                overlay.remove();
                flash.remove();
                _playing = false;
                resolve();
            }, 150);
        }, 800);
    });
}
