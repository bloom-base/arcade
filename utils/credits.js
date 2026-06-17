/**
 * credits.js — Arcade cabinet credit/coin counter display.
 *
 * Displays a retro 7-segment LED counter (0–99) on the hub.
 * Credits are earned by completing games and spent to start new ones.
 *
 * localStorage key: 'arcade_credits'
 */

const STORAGE_KEY = 'arcade_credits';
const SCORE_SNAPSHOT_KEY = 'arcade_credits_snapshot';

/* ── Safe storage wrapper ─────────────────────────────── */
const _mem = new Map();

function _storageAvailable() {
    try {
        const k = '__credits_test__';
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

/* ── Credit state ─────────────────────────────────────── */
let _credits = Math.min(99, Math.max(0, parseInt(_getItem(STORAGE_KEY), 10) || 0));

/** Get current credit count. */
export function getCredits() {
    return _credits;
}

/** Add one credit (capped at 99). Returns new count. */
export function addCredit() {
    _credits = Math.min(99, _credits + 1);
    _setItem(STORAGE_KEY, String(_credits));
    _updateDisplay();
    return _credits;
}

/** Use one credit. Returns true if successful (had credits), false otherwise. */
export function useCredit() {
    if (_credits <= 0) return false;
    _credits = Math.max(0, _credits - 1);
    _setItem(STORAGE_KEY, String(_credits));
    _updateDisplay();
    return true;
}

/** Take a snapshot of scores count so we can detect new scores on return. */
export function snapshotScores() {
    try {
        const raw = _getItem('arcade_scores');
        const all = raw ? JSON.parse(raw) : {};
        let total = 0;
        for (const k in all) total += all[k].length;
        _setItem(SCORE_SNAPSHOT_KEY, String(total));
    } catch { /* ignore */ }
}

/** Check if new scores appeared since last snapshot. */
export function hasNewScores() {
    try {
        const prev = parseInt(_getItem(SCORE_SNAPSHOT_KEY), 10) || 0;
        const raw = _getItem('arcade_scores');
        const all = raw ? JSON.parse(raw) : {};
        let total = 0;
        for (const k in all) total += all[k].length;
        return total > prev;
    } catch { return false; }
}

/* ── 7-Segment LED display ────────────────────────────── */

/*
  Each digit is rendered as 7 CSS segments (a-g):

       aaa
      f   b
      f   b
       ggg
      e   c
      e   c
       ddd

  Segment map: which segments are on for each digit 0-9.
*/
const SEG_MAP = {
    0: 'abcdef',
    1: 'bc',
    2: 'abdeg',
    3: 'abcdg',
    4: 'bcfg',
    5: 'acdfg',
    6: 'acdefg',
    7: 'abc',
    8: 'abcdefg',
    9: 'abcdfg',
};

let _displayEl = null;
let _digit0 = null;   // tens digit
let _digit1 = null;   // ones digit

/**
 * Create the credit counter DOM element.
 * Returns the container element to be inserted into the page.
 */
export function createCreditDisplay() {
    if (_displayEl) return _displayEl;

    _displayEl = document.createElement('div');
    _displayEl.className = 'credit-display';
    _displayEl.innerHTML = `
        <div class="credit-panel">
            <span class="credit-label">CREDIT</span>
            <div class="credit-digits">
                <div class="seg-digit" id="creditDigit0"></div>
                <div class="seg-digit" id="creditDigit1"></div>
            </div>
        </div>
    `;

    _digit0 = _displayEl.querySelector('#creditDigit0');
    _digit1 = _displayEl.querySelector('#creditDigit1');

    // Build segment spans inside each digit
    [_digit0, _digit1].forEach(d => {
        'abcdefg'.split('').forEach(seg => {
            const span = document.createElement('span');
            span.className = `seg seg-${seg}`;
            d.appendChild(span);
        });
    });

    _updateDisplay();
    return _displayEl;
}

/** Update the digit display to match current _credits. */
function _updateDisplay() {
    if (!_digit0 || !_digit1) return;
    const tens = Math.floor(_credits / 10);
    const ones = _credits % 10;
    _setDigit(_digit0, tens);
    _setDigit(_digit1, ones);

    // Pulse animation on change
    _displayEl.classList.remove('credit-bump');
    void _displayEl.offsetWidth;  // force reflow
    if (_credits > 0) _displayEl.classList.add('credit-bump');
}

function _setDigit(el, num) {
    const on = SEG_MAP[num] || '';
    el.querySelectorAll('.seg').forEach(s => {
        const seg = s.className.replace('seg seg-', '');
        s.classList.toggle('on', on.includes(seg));
    });
}
