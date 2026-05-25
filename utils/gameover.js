/**
 * gameover.js — Reusable Game Over overlay for the arcade.
 *
 * Displays a retro-styled full-screen overlay with:
 * - Flashing pixelated "GAME OVER" text
 * - Final score with difficulty badge
 * - High score comparison (auto-saves & checks rank)
 * - SPACE / click to restart
 *
 * Usage:
 *   import { showGameOver, hideGameOver } from '../../utils/gameover.js';
 *
 *   showGameOver({
 *       score:      1200,
 *       game:       'breakout',
 *       difficulty: 'hard',       // 'easy' | 'normal' | 'hard'
 *       onRestart:  () => { ... },
 *       title:      'GAME OVER',  // optional, default "GAME OVER"
 *       subtitle:   '',           // optional extra line (e.g. "PLAYER 1 WINS!")
 *       muted:      false,        // optional, suppress high-score chime
 *   });
 */

import { saveScore, getScores, playHighScoreChime, showHighScoreBanner } from './scores.js';

/* ── Constants ────────────────────────────────────────── */

const OVERLAY_ID  = '_go_overlay';
const STYLE_ID    = '_go_style';

const DIFF_COLORS = {
    easy:   '#22c55e',
    normal: '#facc15',
    hard:   '#ef4444',
};

const DIFF_MULTIPLIERS = {
    easy:   '1×',
    normal: '1.5×',
    hard:   '2×',
};

/* ── State ────────────────────────────────────────────── */

let _onRestart  = null;
let _bound      = false;   // keyboard listener attached?
let _visible    = false;

/* ── CSS (injected once) ──────────────────────────────── */

const CSS = `
@keyframes _go_flash {
    0%, 100% { opacity: 1; text-shadow: 0 0 30px rgba(239,68,68,.9), 0 0 60px rgba(239,68,68,.4); }
    50%      { opacity: 0.15; text-shadow: 0 0 8px rgba(239,68,68,.3); }
}
@keyframes _go_pulse {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
}
@keyframes _go_slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}
@keyframes _go_stampIn {
    0%   { transform: scale(2.5); opacity: 0; }
    60%  { transform: scale(0.9); opacity: 1; }
    80%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
}

#${OVERLAY_ID} {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
    font-family: 'Press Start 2P', monospace;
    gap: 0;
}
#${OVERLAY_ID}.show {
    opacity: 1;
    pointer-events: auto;
}

#${OVERLAY_ID} ._go_title {
    font-size: clamp(1.2rem, 5vw, 2.4rem);
    color: #ef4444;
    letter-spacing: 0.15em;
    animation: _go_flash 0.7s ease-in-out infinite, _go_stampIn 0.5s ease-out both;
    margin-bottom: 1.5rem;
    text-align: center;
    line-height: 1.4;
    image-rendering: pixelated;
}

#${OVERLAY_ID} ._go_subtitle {
    font-size: clamp(0.5rem, 2vw, 0.85rem);
    color: #e879f9;
    letter-spacing: 0.1em;
    margin-bottom: 2rem;
    text-shadow: 0 0 12px rgba(232,121,249,.5);
    animation: _go_slideUp 0.5s ease-out 0.3s both;
}

#${OVERLAY_ID} ._go_score_block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
    animation: _go_slideUp 0.5s ease-out 0.4s both;
}

#${OVERLAY_ID} ._go_score_label {
    font-size: clamp(0.4rem, 1.5vw, 0.6rem);
    color: #888;
    letter-spacing: 0.2em;
    text-transform: uppercase;
}

#${OVERLAY_ID} ._go_score_value {
    font-size: clamp(1rem, 4vw, 2rem);
    color: #facc15;
    text-shadow: 0 0 20px rgba(250,204,21,.6), 0 0 40px rgba(250,204,21,.3);
    letter-spacing: 0.08em;
}

#${OVERLAY_ID} ._go_diff_badge {
    display: inline-block;
    font-size: clamp(0.35rem, 1vw, 0.5rem);
    padding: 0.25em 0.7em;
    border-radius: 3px;
    border: 1px solid;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 1rem;
    animation: _go_slideUp 0.5s ease-out 0.5s both;
}

#${OVERLAY_ID} ._go_highscore {
    font-size: clamp(0.4rem, 1.5vw, 0.55rem);
    color: #22d3ee;
    letter-spacing: 0.08em;
    margin-bottom: 2rem;
    text-shadow: 0 0 10px rgba(34,211,238,.4);
    animation: _go_slideUp 0.5s ease-out 0.55s both;
    min-height: 1.2em;
}

#${OVERLAY_ID} ._go_newbest {
    color: #facc15;
    animation: _go_flash 0.9s ease-in-out infinite;
}

#${OVERLAY_ID} ._go_restart_btn {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.45rem, 1.8vw, 0.7rem);
    color: #22d3ee;
    background: transparent;
    border: 2px solid #22d3ee;
    padding: 0.8em 1.8em;
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: all 0.2s ease;
    animation: _go_slideUp 0.5s ease-out 0.65s both;
    text-transform: uppercase;
}
#${OVERLAY_ID} ._go_restart_btn:hover,
#${OVERLAY_ID} ._go_restart_btn:focus {
    background: #22d3ee;
    color: #0a0a0a;
    box-shadow: 0 0 20px rgba(34,211,238,.5), 0 0 40px rgba(34,211,238,.2);
    outline: none;
}

#${OVERLAY_ID} ._go_hint {
    font-size: clamp(0.3rem, 1vw, 0.45rem);
    color: #555;
    margin-top: 1rem;
    letter-spacing: 0.05em;
    animation: _go_pulse 2s ease-in-out infinite;
    animation-delay: 1s;
    opacity: 0;
}

#${OVERLAY_ID} ._go_back {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.35rem, 1.2vw, 0.5rem);
    color: #555;
    background: transparent;
    border: 1px solid #333;
    padding: 0.6em 1.2em;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: all 0.2s ease;
    text-decoration: none;
    margin-top: 0.8rem;
    animation: _go_slideUp 0.5s ease-out 0.75s both;
}
#${OVERLAY_ID} ._go_back:hover {
    color: #aaa;
    border-color: #666;
}
`;

/* ── DOM helpers ──────────────────────────────────────── */

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

function getOrCreateOverlay() {
    let el = document.getElementById(OVERLAY_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = OVERLAY_ID;
        document.body.appendChild(el);
    }
    return el;
}

/* ── Keyboard handler ─────────────────────────────────── */

function onKey(e) {
    if (!_visible) return;
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        doRestart();
    }
}

function doRestart() {
    if (!_visible) return;
    hideGameOver();
    if (typeof _onRestart === 'function') _onRestart();
}

/* ── Public API ───────────────────────────────────────── */

/**
 * Show the Game Over overlay.
 *
 * @param {Object}   opts
 * @param {number}   opts.score       Final score to display
 * @param {string}   opts.game        Game identifier (for score saving)
 * @param {string}   [opts.difficulty] 'easy' | 'normal' | 'hard'
 * @param {Function} [opts.onRestart] Callback when player chooses to restart
 * @param {string}   [opts.title]     Override title text (default "GAME OVER")
 * @param {string}   [opts.subtitle]  Extra line below title
 * @param {boolean}  [opts.muted]     Suppress high-score chime
 */
export function showGameOver(opts = {}) {
    const {
        score      = 0,
        game       = '',
        difficulty = 'normal',
        onRestart  = null,
        title      = 'GAME OVER',
        subtitle   = '',
        muted      = false,
    } = opts;

    injectStyle();

    /* ── Save score & determine rank ─────────────────── */
    let rank      = 0;
    let bestScore = 0;

    if (game && score > 0) {
        // Check existing best before saving
        const existing = getScores(game);
        bestScore = existing.length > 0 ? existing[0].score : 0;

        rank = saveScore(game, score, difficulty);

        if (rank > 0) {
            playHighScoreChime(muted);
            showHighScoreBanner(rank);
        }
    }

    /* ── Build high-score message ────────────────────── */
    let hsHTML = '';
    if (game && score > 0) {
        if (rank === 1 && score > bestScore) {
            hsHTML = `<span class="_go_newbest">★ NEW PERSONAL BEST! ★</span>`;
        } else if (rank > 0) {
            hsHTML = `#${rank} TOP SCORE!`;
        } else {
            hsHTML = `BEST: ${bestScore.toLocaleString()} PTS`;
        }
    }

    /* ── Difficulty badge ────────────────────────────── */
    const diffColor = DIFF_COLORS[difficulty] || DIFF_COLORS.normal;
    const diffMult  = DIFF_MULTIPLIERS[difficulty] || '';

    /* ── Render ──────────────────────────────────────── */
    const overlay = getOrCreateOverlay();
    overlay.innerHTML = `
        <div class="_go_title">${title}</div>
        ${subtitle ? `<div class="_go_subtitle">${subtitle}</div>` : ''}
        <div class="_go_score_block">
            <div class="_go_score_label">FINAL SCORE</div>
            <div class="_go_score_value">${score.toLocaleString()}</div>
        </div>
        ${difficulty ? `
            <div class="_go_diff_badge" style="color:${diffColor};border-color:${diffColor};">
                ${difficulty.toUpperCase()} ${diffMult}
            </div>
        ` : ''}
        <div class="_go_highscore">${hsHTML}</div>
        <button class="_go_restart_btn">PLAY AGAIN</button>
        <div class="_go_hint">PRESS SPACE TO RESTART</div>
        <a class="_go_back" href="../../index.html#games">← BACK TO ARCADE</a>
    `;

    /* ── Bind events ─────────────────────────────────── */
    _onRestart = onRestart;
    _visible   = true;

    overlay.querySelector('._go_restart_btn').addEventListener('click', doRestart);

    if (!_bound) {
        document.addEventListener('keydown', onKey);
        _bound = true;
    }

    // Show with a tiny delay so the CSS transition fires
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    });
}

/**
 * Hide the Game Over overlay.
 * Called automatically on restart, but can be called manually.
 */
export function hideGameOver() {
    _visible = false;
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.classList.remove('show');
        // Clean up innerHTML after transition
        setTimeout(() => {
            if (!_visible) overlay.innerHTML = '';
        }, 500);
    }
}
