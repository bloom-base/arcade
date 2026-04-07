/**
 * scores.js — Shared high-score persistence for the arcade hub.
 *
 * localStorage key : 'arcade_scores'
 * Structure        : { [game]: [{ score, difficulty, timestamp }, ...] }
 * Max per game     : 5 entries, sorted highest-first.
 */

const STORAGE_KEY  = 'arcade_scores';
const MAX_PER_GAME = 5;

/* ── Safe storage wrapper ─────────────────────────────── */
// Falls back to in-memory storage when localStorage is blocked
// (e.g. cross-origin iframes in Firefox).

const _mem = new Map();

function _storageAvailable() {
    try {
        const k = '__storage_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch { return false; }
}

const _useLocal = _storageAvailable();

function _getItem(key) {
    if (_useLocal) {
        try { return localStorage.getItem(key); }
        catch { /* fall through */ }
    }
    return _mem.get(key) ?? null;
}

function _setItem(key, value) {
    if (_useLocal) {
        try { localStorage.setItem(key, value); return; }
        catch { /* fall through */ }
    }
    _mem.set(key, value);
}

function _removeItem(key) {
    if (_useLocal) {
        try { localStorage.removeItem(key); return; }
        catch { /* fall through */ }
    }
    _mem.delete(key);
}

/* ── Storage helpers ───────────────────────────────────── */

function load() {
    try { return JSON.parse(_getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
}

function persist(data) {
    _setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ── Public API ────────────────────────────────────────── */

/**
 * Get the top-5 entries for a single game.
 * @param {string} game
 * @returns {{ score:number, difficulty:string, timestamp:number }[]}
 */
export function getScores(game) {
    return (load()[game] || []).slice(0, MAX_PER_GAME);
}

/**
 * Get every game's entries (for the leaderboard widget).
 * @returns {Object}
 */
export function getAllScores() {
    return load();
}

/**
 * Submit a score.  Keeps only the top-5 per game.
 * @param {string} game
 * @param {number} score  – ignored if ≤ 0
 * @param {string} difficulty – 'easy' | 'normal' | 'hard'
 * @returns {number} 1-based rank if the score made the top-5, otherwise 0
 */
export function saveScore(game, score, difficulty) {
    if (!score || score <= 0) return 0;

    const all     = load();
    const entries = all[game] || [];
    const entry   = { score, difficulty, timestamp: Date.now() };

    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);

    const top5 = entries.slice(0, MAX_PER_GAME);
    all[game]  = top5;
    persist(all);

    // indexOf uses reference equality — finds the exact new object
    const idx = top5.indexOf(entry);
    return idx >= 0 ? idx + 1 : 0;
}

/**
 * Wipe all scores from localStorage.
 */
export function clearAllScores() {
    _removeItem(STORAGE_KEY);
}

/* ── Celebration helpers ────────────────────────────────── */

/**
 * Play a short retro arpeggio chime.
 * @param {boolean} [muted=false]  Pass the game's own muted flag.
 */
export function playHighScoreChime(muted = false) {
    if (muted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Rising arpeggio: C5 → E5 → G5 → C6
        const notes = [
            { freq: 523,  start: 0.00, dur: 0.13 },
            { freq: 659,  start: 0.12, dur: 0.13 },
            { freq: 784,  start: 0.24, dur: 0.13 },
            { freq: 1047, start: 0.36, dur: 0.30 },
        ];
        for (const { freq, start, dur } of notes) {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0.16, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur + 0.05);
        }
    } catch (_) {}
}

/**
 * Inject a flashing "NEW HIGH SCORE!" banner into the current page.
 * Auto-removes after 2.8 s.
 * @param {number} rank  1 = first place, 2-5 = other top-5 positions
 */
export function showHighScoreBanner(rank) {
    // Remove any stale banner
    const old = document.getElementById('_hs_banner');
    if (old) old.remove();

    // Inject keyframe animation once per page load
    if (!document.getElementById('_hs_style')) {
        const style = document.createElement('style');
        style.id = '_hs_style';
        style.textContent = `
            @keyframes _hs_flash {
                0%,100% { opacity:1;   text-shadow:0 0 24px rgba(250,204,21,.9),0 0 48px rgba(250,204,21,.4); }
                50%     { opacity:0.2; text-shadow:0 0  6px rgba(250,204,21,.3); }
            }
        `;
        document.head.appendChild(style);
    }

    const label  = rank === 1 ? '✦ NEW HIGH SCORE! ✦' : `✦ TOP ${rank} SCORE! ✦`;
    const banner = document.createElement('div');
    banner.id    = '_hs_banner';
    banner.textContent = label;

    Object.assign(banner.style, {
        position:      'fixed',
        top:           '36%',
        left:          '50%',
        transform:     'translateX(-50%)',
        fontFamily:    "'Press Start 2P', monospace",
        fontSize:      'clamp(0.65rem, 2.5vw, 1rem)',
        color:         '#facc15',
        zIndex:        '9999',
        pointerEvents: 'none',
        whiteSpace:    'nowrap',
        letterSpacing: '0.08em',
        animation:     '_hs_flash 0.45s ease-in-out infinite',
    });

    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2800);
}
