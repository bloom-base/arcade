/**
 * audio.js — Retro chiptune sound effects for the arcade hub.
 *
 * Uses Web Audio API to generate short 8-bit beeps and boops.
 * All sounds are under 200ms and use square/triangle waves for
 * an authentic retro feel.
 *
 * Sound preference is persisted in localStorage under 'arcade_sound'.
 */

const STORAGE_KEY = 'arcade_sound';

/* ── Safe storage wrapper ─────────────────────────────── */
const _mem = new Map();

function _storageAvailable() {
    try {
        const k = '__audio_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch { return false; }
}

const _useLocal = _storageAvailable();

function _getItem(key) {
    if (_useLocal) {
        try { return localStorage.getItem(key); } catch { /* fall through */ }
    }
    return _mem.get(key) ?? null;
}

function _setItem(key, value) {
    if (_useLocal) {
        try { localStorage.setItem(key, value); return; } catch { /* fall through */ }
    }
    _mem.set(key, value);
}

/* ── Mute state ───────────────────────────────────────── */
let _muted = _getItem(STORAGE_KEY) === 'muted';

/** Returns true if sound is currently muted. */
export function isMuted() {
    return _muted;
}

/** Toggle mute on/off. Returns the new muted state. */
export function toggleMute() {
    _muted = !_muted;
    _setItem(STORAGE_KEY, _muted ? 'muted' : 'unmuted');
    return _muted;
}

/* ── AudioContext singleton ────────────────────────────── */
let _ctx = null;

function ctx() {
    if (!_ctx) {
        try {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch { return null; }
    }
    return _ctx;
}

/* ── Core tone player ─────────────────────────────────── */
/**
 * Play a single tone.
 * @param {number}  freq      Frequency in Hz
 * @param {number}  duration  Duration in seconds (keep under 0.2)
 * @param {string}  type      OscillatorType: 'square', 'triangle', 'sawtooth'
 * @param {number}  volume    Gain 0–1 (default 0.12)
 * @param {number}  delay     Start offset in seconds (default 0)
 */
function tone(freq, duration, type = 'square', volume = 0.12, delay = 0) {
    if (_muted) return;
    const c = ctx();
    if (!c) return;
    try {
        const osc  = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = type;
        const t = c.currentTime + delay;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t);
        osc.stop(t + duration + 0.02);
    } catch (_) {}
}

/* ── Public sound effects ─────────────────────────────── */

/**
 * Short upward blip — played on hover over game tiles.
 * ~80ms, quiet, square wave.
 */
export function playHover() {
    tone(660, 0.06, 'square', 0.07);
}

/**
 * Two-tone select beep — played on click / navigation.
 * ~120ms total, square wave rising pitch.
 */
export function playSelect() {
    tone(440, 0.07, 'square', 0.10);
    tone(880, 0.08, 'square', 0.10, 0.06);
}

/**
 * Soft boop — played on UI button presses (back, difficulty, etc).
 * ~60ms, triangle wave for a rounder feel.
 */
export function playBoop() {
    tone(330, 0.06, 'triangle', 0.10);
}

/**
 * Navigate / confirm — a brighter three-note chirp.
 * ~150ms, used for the "SELECT GAME" button.
 */
export function playConfirm() {
    tone(523, 0.05, 'square', 0.10);
    tone(659, 0.05, 'square', 0.10, 0.05);
    tone(784, 0.07, 'square', 0.10, 0.10);
}
