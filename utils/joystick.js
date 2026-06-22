/**
 * joystick.js — Retro arcade joystick HUD overlay.
 *
 * Displays a pixel-art joystick and action buttons in the bottom-right
 * corner of the game viewport.  The joystick ball tilts in real time as
 * the player presses arrow keys or WASD, and the action buttons glow
 * when Space / Enter are held.
 *
 * The overlay uses pointer-events: none so it never blocks game input.
 * Preference is persisted in localStorage under 'arcade_joystick'.
 *
 * Usage (in any game):
 *   import { initJoystick } from '../../utils/joystick.js';
 *   initJoystick();
 */

const STORAGE_KEY = 'arcade_joystick';

/* ── Safe localStorage wrapper ────────────────────────── */
const _mem = new Map();

function _storageOk() {
    try {
        const k = '__joy_test__';
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
let _inited = false;
let _enabled = true;
let _el = null;         // root container
let _style = null;      // injected <style>
let _ball = null;       // joystick ball element
let _btnA = null;       // action button A
let _btnB = null;       // action button B

// Track which directions are currently held
const _dirs = { up: false, down: false, left: false, right: false };
let _action1 = false;   // space
let _action2 = false;   // enter

/* ── CSS ──────────────────────────────────────────────── */
const CSS = `
/* Joystick HUD container */
.joy-hud {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    z-index: 45;
    pointer-events: none;
    opacity: 0.55;
    transition: opacity 0.3s ease;
    font-family: 'Press Start 2P', monospace;
}
.joy-hud:hover,
.joy-hud.joy-active {
    opacity: 0.85;
}

/* ── Joystick base ── */
.joy-base {
    width: 52px;
    height: 52px;
    position: relative;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 45%, #333 0%, #1a1a1a 70%, #111 100%);
    border: 2px solid #444;
    box-shadow: 0 2px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.05);
}

/* Stick shaft */
.joy-shaft {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 6px;
    height: 20px;
    margin-left: -3px;
    margin-top: -18px;
    background: linear-gradient(90deg, #555, #777, #555);
    border-radius: 2px;
    transform-origin: bottom center;
    transition: transform 0.08s ease-out;
}

/* Ball top */
.joy-ball {
    position: absolute;
    top: -10px;
    left: 50%;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #f55, #c00 60%, #900 100%);
    box-shadow: 0 0 4px rgba(255,0,0,0.3), inset 0 -2px 3px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.25);
}

/* Directional tilt states */
.joy-shaft.joy-up    { transform: rotate3d(1, 0, 0,  18deg); }
.joy-shaft.joy-down  { transform: rotate3d(1, 0, 0, -18deg); }
.joy-shaft.joy-left  { transform: rotate3d(0, 0, 1,  15deg); }
.joy-shaft.joy-right { transform: rotate3d(0, 0, 1, -15deg); }

/* Diagonal combos */
.joy-shaft.joy-up.joy-left    { transform: rotate3d(1, -1, 0, 18deg); }
.joy-shaft.joy-up.joy-right   { transform: rotate3d(1,  1, 0, 18deg); }
.joy-shaft.joy-down.joy-left  { transform: rotate3d(-1, 1, 0, 18deg); }
.joy-shaft.joy-down.joy-right { transform: rotate3d(-1,-1, 0, 18deg); }

/* ── Action buttons ── */
.joy-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 4px;
}

.joy-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5px;
    color: #888;
    transition: box-shadow 0.08s ease, border-color 0.08s ease, background 0.08s ease;
}

.joy-btn-a {
    background: radial-gradient(circle at 40% 35%, #4af, #1a7ae6 60%, #1058a0 100%);
    box-shadow: 0 0 2px rgba(50,150,255,0.2);
}
.joy-btn-b {
    background: radial-gradient(circle at 40% 35%, #fa4, #e6a01a 60%, #a07010 100%);
    box-shadow: 0 0 2px rgba(255,180,50,0.2);
}

/* Glow when pressed */
.joy-btn-a.joy-pressed {
    border-color: #6cf;
    box-shadow: 0 0 8px rgba(50,150,255,0.8), 0 0 16px rgba(50,150,255,0.4);
    background: radial-gradient(circle at 40% 35%, #7cf, #4af 60%, #2090e6 100%);
}
.joy-btn-b.joy-pressed {
    border-color: #fc6;
    box-shadow: 0 0 8px rgba(255,180,50,0.8), 0 0 16px rgba(255,180,50,0.4);
    background: radial-gradient(circle at 40% 35%, #fc7, #fa4 60%, #e6b020 100%);
}

/* Label under each button */
.joy-btn-label {
    position: absolute;
    font-size: 4px;
    color: #666;
    letter-spacing: 0.5px;
    bottom: -8px;
    text-align: center;
    width: 30px;
    left: 50%;
    margin-left: -15px;
}
.joy-btn { position: relative; }

/* ── Direction indicators (tiny dots on the base) ── */
.joy-dir {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #333;
    border: 1px solid #444;
    transition: background 0.1s, box-shadow 0.1s;
}
.joy-dir.joy-lit {
    background: #4f4;
    box-shadow: 0 0 4px rgba(80,255,80,0.6);
}
.joy-dir-up    { top: 3px;  left: 50%; margin-left: -3px; }
.joy-dir-down  { bottom: 3px; left: 50%; margin-left: -3px; }
.joy-dir-left  { left: 3px; top: 50%; margin-top: -3px; }
.joy-dir-right { right: 3px; top: 50%; margin-top: -3px; }

/* ── Hide on very small screens ── */
@media (max-width: 500px) {
    .joy-hud { display: none; }
}
`;

/* ── DOM Construction ─────────────────────────────────── */
function _buildDOM() {
    const hud = document.createElement('div');
    hud.className = 'joy-hud';

    // Joystick
    const base = document.createElement('div');
    base.className = 'joy-base';

    // Direction indicator dots
    ['up', 'down', 'left', 'right'].forEach(d => {
        const dot = document.createElement('div');
        dot.className = `joy-dir joy-dir-${d}`;
        dot.dataset.dir = d;
        base.appendChild(dot);
    });

    const shaft = document.createElement('div');
    shaft.className = 'joy-shaft';

    const ball = document.createElement('div');
    ball.className = 'joy-ball';
    shaft.appendChild(ball);
    base.appendChild(shaft);
    hud.appendChild(base);

    // Buttons
    const btns = document.createElement('div');
    btns.className = 'joy-buttons';

    const btnA = document.createElement('div');
    btnA.className = 'joy-btn joy-btn-a';
    btnA.innerHTML = '<span style="font-size:6px;color:#fff;text-shadow:0 0 2px rgba(0,0,0,0.5)">A</span>';
    const lblA = document.createElement('div');
    lblA.className = 'joy-btn-label';
    lblA.textContent = 'SPACE';
    btnA.appendChild(lblA);

    const btnB = document.createElement('div');
    btnB.className = 'joy-btn joy-btn-b';
    btnB.innerHTML = '<span style="font-size:6px;color:#fff;text-shadow:0 0 2px rgba(0,0,0,0.5)">B</span>';
    const lblB = document.createElement('div');
    lblB.className = 'joy-btn-label';
    lblB.textContent = 'ENTER';
    btnB.appendChild(lblB);

    btns.appendChild(btnA);
    btns.appendChild(btnB);
    hud.appendChild(btns);

    return { hud, shaft, btnA, btnB };
}

/* ── Update visuals ───────────────────────────────────── */
function _update() {
    if (!_el) return;

    const shaft = _el.querySelector('.joy-shaft');
    if (!shaft) return;

    // Update shaft tilt classes
    shaft.classList.toggle('joy-up', _dirs.up);
    shaft.classList.toggle('joy-down', _dirs.down);
    shaft.classList.toggle('joy-left', _dirs.left);
    shaft.classList.toggle('joy-right', _dirs.right);

    // Update direction indicator dots
    _el.querySelectorAll('.joy-dir').forEach(dot => {
        dot.classList.toggle('joy-lit', _dirs[dot.dataset.dir]);
    });

    // Update action buttons
    if (_btnA) _btnA.classList.toggle('joy-pressed', _action1);
    if (_btnB) _btnB.classList.toggle('joy-pressed', _action2);

    // Active state for opacity boost
    const anyActive = _dirs.up || _dirs.down || _dirs.left || _dirs.right || _action1 || _action2;
    _el.classList.toggle('joy-active', anyActive);
}

/* ── Key mapping ──────────────────────────────────────── */
function _keyToDir(key) {
    switch (key) {
        case 'ArrowUp':    case 'w': case 'W': return 'up';
        case 'ArrowDown':  case 's': case 'S': return 'down';
        case 'ArrowLeft':  case 'a': case 'A': return 'left';
        case 'ArrowRight': case 'd': case 'D': return 'right';
        default: return null;
    }
}

function _onKeyDown(e) {
    if (!_enabled) return;
    const dir = _keyToDir(e.key);
    if (dir) { _dirs[dir] = true; _update(); return; }
    if (e.key === ' ' || e.code === 'Space') { _action1 = true; _update(); }
    if (e.key === 'Enter') { _action2 = true; _update(); }
}

function _onKeyUp(e) {
    if (!_enabled) return;
    const dir = _keyToDir(e.key);
    if (dir) { _dirs[dir] = false; _update(); return; }
    if (e.key === ' ' || e.code === 'Space') { _action1 = false; _update(); }
    if (e.key === 'Enter') { _action2 = false; _update(); }
}

/* ── Visibility ───────────────────────────────────────── */
function _show() {
    if (_el) _el.style.display = '';
}

function _hide() {
    if (_el) _el.style.display = 'none';
}

/* ── Public API ────────────────────────────────────────── */

/** Returns true if the joystick HUD is currently enabled. */
export function isJoystickEnabled() {
    const v = _get(STORAGE_KEY);
    return v === null ? true : v === '1';
}

/** Toggle the joystick HUD on/off. */
export function toggleJoystick() {
    _enabled = !_enabled;
    _set(STORAGE_KEY, _enabled ? '1' : '0');
    if (_enabled) _show(); else _hide();
    return _enabled;
}

/**
 * Initialise the joystick HUD overlay.
 * Safe to call multiple times — only the first call creates DOM.
 */
export function initJoystick() {
    if (_inited) return;
    _inited = true;

    _enabled = isJoystickEnabled();

    // Inject CSS once
    _style = document.createElement('style');
    _style.textContent = CSS;
    document.head.appendChild(_style);

    // Build DOM
    const { hud, shaft, btnA, btnB } = _buildDOM();
    _el = hud;
    _ball = shaft;
    _btnA = btnA;
    _btnB = btnB;
    document.body.appendChild(hud);

    if (!_enabled) _hide();

    // Listen for keyboard input (capture phase so we see it before games)
    window.addEventListener('keydown', _onKeyDown, true);
    window.addEventListener('keyup', _onKeyUp, true);

    // Reset all keys when window loses focus
    window.addEventListener('blur', () => {
        _dirs.up = _dirs.down = _dirs.left = _dirs.right = false;
        _action1 = _action2 = false;
        _update();
    });
}
