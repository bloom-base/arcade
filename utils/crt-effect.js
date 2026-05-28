/**
 * crt-effect.js — Reusable CRT scan-line overlay for the arcade.
 *
 * Adds an authentic retro CRT monitor effect: horizontal scan lines,
 * a subtle screen flicker, and a soft vignette glow.  The overlay uses
 * pointer-events: none so it never blocks game interaction.
 *
 * Preference is persisted in localStorage under 'arcade_crt'.
 *
 * Usage (in any game):
 *   import { initCRT } from '../../utils/crt-effect.js';
 *   initCRT();                       // apply with default settings
 *   initCRT({ flicker: false });     // scan lines only, no flicker
 *
 * Hub toggle:
 *   import { isCRTEnabled, toggleCRT } from '../../utils/crt-effect.js';
 *   btn.addEventListener('click', toggleCRT);
 */

const STORAGE_KEY = 'arcade_crt';

/* ── Safe localStorage wrapper ────────────────────────── */
const _mem = new Map();

function _storageOk() {
    try {
        const k = '__crt_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch { return false; }
}

const _useLocal = _storageOk();

function _get(key) {
    if (_useLocal) {
        try { return localStorage.getItem(key); } catch { /* fall through */ }
    }
    return _mem.get(key) ?? null;
}

function _set(key, val) {
    if (_useLocal) {
        try { localStorage.setItem(key, val); } catch { /* fall through */ }
    }
    _mem.set(key, val);
}

/* ── State ────────────────────────────────────────────── */
let _overlay = null;   // the injected DOM element
let _inited = false;

/* ── Public API ───────────────────────────────────────── */

/**
 * Is the CRT effect currently enabled?
 * Defaults to true (on) if no preference is stored.
 */
export function isCRTEnabled() {
    const v = _get(STORAGE_KEY);
    return v === null ? true : v === '1';
}

/**
 * Toggle the CRT effect on/off.  Returns the new state (true = on).
 */
export function toggleCRT() {
    const next = !isCRTEnabled();
    _set(STORAGE_KEY, next ? '1' : '0');
    _applyVisibility();
    return next;
}

/**
 * Initialise the CRT overlay.  Safe to call more than once; subsequent
 * calls are no-ops.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.flicker=true]  Enable subtle brightness flicker.
 */
export function initCRT(opts = {}) {
    if (_inited) return;
    _inited = true;

    const flicker = opts.flicker !== false;

    _injectCSS(flicker);
    _injectOverlay();
    _applyVisibility();
}

/* ── Internal helpers ─────────────────────────────────── */

function _applyVisibility() {
    if (!_overlay) return;
    _overlay.style.display = isCRTEnabled() ? '' : 'none';
}

function _injectCSS(flicker) {
    if (document.getElementById('crt-effect-style')) return;

    const style = document.createElement('style');
    style.id = 'crt-effect-style';
    style.textContent = `
/* ── CRT scan-line overlay ──────────────────────────── */
.crt-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 100;
}

/* Scan lines */
.crt-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 3px,
        rgba(0, 0, 0, 0.08) 3px,
        rgba(0, 0, 0, 0.08) 4px
    );
    pointer-events: none;
}

/* Vignette — darkens edges for a CRT-tube look */
.crt-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        ellipse at center,
        transparent 60%,
        rgba(0, 0, 0, 0.35) 100%
    );
    pointer-events: none;
}

${flicker ? `
/* Subtle brightness flicker */
@keyframes crt-flicker {
    0%   { opacity: 1; }
    5%   { opacity: 0.98; }
    10%  { opacity: 1; }
    40%  { opacity: 0.97; }
    44%  { opacity: 1; }
    80%  { opacity: 0.98; }
    84%  { opacity: 1; }
    100% { opacity: 1; }
}

.crt-overlay {
    animation: crt-flicker 4s infinite;
}
` : ''}
`;

    document.head.appendChild(style);
}

function _injectOverlay() {
    if (document.querySelector('.crt-overlay')) {
        _overlay = document.querySelector('.crt-overlay');
        return;
    }
    _overlay = document.createElement('div');
    _overlay.className = 'crt-overlay';
    document.body.appendChild(_overlay);
}
