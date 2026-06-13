/* ── Marquee Ticker ─────────────────────────────────────────
   Scrolling LED-style text display for the game hub.
   Shows game-specific tips that cycle and scroll horizontally.
   ──────────────────────────────────────────────────────────── */

const GAME_TIPS = {
    'megamix':        ['10 MICROGAMES — SURVIVE THEM ALL!', 'SPEED INCREASES EVERY ROUND', 'ONE LIFE — MAKE IT COUNT', 'REACT FAST OR LOSE IT ALL'],
    'snake':          ['AVOID YOUR OWN TAIL!', 'EAT THE RED SQUARES TO GROW', 'USE ARROW KEYS TO MOVE', 'LONGER SNAKE = BIGGER SCORE'],
    'tetris':         ['CLEAR 4 LINES AT ONCE FOR A TETRIS!', 'USE UP ARROW TO ROTATE PIECES', 'PLAN AHEAD — SPEED INCREASES', 'HOLD DOWN TO DROP FASTER'],
    'breakout':       ['BOUNCE THE BALL OFF YOUR PADDLE', 'ANGLE CHANGES WITH PADDLE HIT POSITION', 'CLEAR ALL BRICKS TO WIN', 'DON\'T LET THE BALL DROP!'],
    'pong':           ['PLAYER 1: W/S KEYS — PLAYER 2: ARROW KEYS', 'FIRST TO 10 POINTS WINS', 'BALL SPEEDS UP ON PADDLE HITS', 'AIM FOR THE EDGES!'],
    'othello':        ['OUTFLANK YOUR OPPONENT TO FLIP TILES', 'CORNERS ARE KEY — GRAB THEM EARLY', 'THINK SEVERAL MOVES AHEAD', 'CONTROL THE EDGES TO DOMINATE'],
    'solitaire':      ['BUILD FOUNDATIONS ACE TO KING', 'ALTERNATE RED AND BLACK IN COLUMNS', 'REVEAL HIDDEN CARDS STRATEGICALLY', 'MOVE KINGS TO EMPTY COLUMNS'],
    'simon':          ['WATCH THE PATTERN — THEN REPEAT IT', 'EACH ROUND ADDS ONE MORE STEP', 'LISTEN TO THE TONES FOR CLUES', 'HOW FAR CAN YOUR MEMORY GO?'],
    'whack-a-mole':   ['CLICK MOLES BEFORE THEY HIDE!', 'SPEED UP AS YOU SCORE MORE', 'QUICK REFLEXES WIN THE DAY', 'DON\'T MISS — EVERY MOLE COUNTS'],
    'minesweeper':    ['RIGHT-CLICK TO FLAG MINES', 'NUMBERS SHOW ADJACENT MINE COUNT', 'START WITH CORNERS — FEWER NEIGHBORS', 'USE LOGIC, NOT LUCK'],
    'flappy-bird':    ['TAP OR CLICK TO FLAP', 'STEADY RHYTHM BEATS PANIC TAPPING', 'PIPES GET TIGHTER — STAY FOCUSED', 'ONE TOUCH KEEPS YOU AIRBORNE'],
    'tower-defense':  ['PLACE TOWERS TO BLOCK THE HORDE', 'UPGRADE TOWERS FOR MORE POWER', 'MIX TOWER TYPES FOR BEST RESULTS', 'GUARD THE PATH — DON\'T LET THEM THROUGH'],
    'excitebike':     ['HIT RAMPS FOR BIG AIR!', 'WATCH YOUR HEAT GAUGE', 'LEAN FORWARD ON JUMPS TO LAND CLEAN', 'RACE AGAINST THE CLOCK'],
    'asteroids':      ['ROTATE WITH ARROW KEYS, THRUST TO MOVE', 'SHOOT SPACE ROCKS WITH SPACEBAR', 'BIG ROCKS SPLIT INTO SMALL ONES', 'WATCH OUT FOR WRAPAROUND!'],
    'frogger':        ['HOP ACROSS TRAFFIC SAFELY', 'RIDE LOGS AND TURTLES ACROSS WATER', 'TURTLES DIVE — DON\'T STAY TOO LONG', 'FILL ALL 5 HOME SPOTS TO WIN'],
    'contra':         ['RUN AND GUN — NEVER STOP MOVING', 'POWER-UPS BOOST YOUR FIREPOWER', 'JUMP AND SHOOT AT THE SAME TIME', 'WATCH FOR ENEMY PATTERNS'],
    'space-invaders': ['SHOOT THE DESCENDING ALIENS', 'HIDE BEHIND SHIELDS FOR COVER', 'CLEAR A WAVE TO EARN BONUS POINTS', 'THE MYSTERY SHIP IS WORTH BIG POINTS'],
    'memory':         ['FLIP CARDS TO FIND MATCHING PAIRS', 'REMEMBER POSITIONS — FEWER MOVES = BETTER', 'START FROM THE EDGES AND WORK IN', 'CONCENTRATION IS YOUR SUPERPOWER'],
    'wordle':         ['GUESS THE 5-LETTER WORD IN 6 TRIES', 'GREEN = RIGHT LETTER, RIGHT SPOT', 'YELLOW = RIGHT LETTER, WRONG SPOT', 'START WITH VOWEL-HEAVY WORDS'],
};

/* Fallback tips when no specific game is hovered */
const DEFAULT_TIPS = [
    'INSERT COIN — SELECT YOUR GAME!',
    'HOVER A GAME FOR PRO TIPS',
    '19 CLASSIC GAMES AND COUNTING',
    'CHASE THE HIGH SCORE!',
    'CHOOSE YOUR DIFFICULTY — EASY, NORMAL, OR HARD',
];

let _styleInjected = false;
let _tickerEl = null;
let _trackEl = null;
let _currentKey = null;
let _animId = null;
let _tipIndex = 0;
let _scrollPos = 0;
let _tipWidth = 0;
let _containerWidth = 0;
let _activeText = '';
let _nextText = '';
let _canvas = null;
let _ctx = null;
let _dpr = 1;

/* ── CSS ──────────────────────────────────────────────── */
function _injectCSS() {
    if (_styleInjected) return;
    _styleInjected = true;
    const s = document.createElement('style');
    s.textContent = `
        .ticker-wrap {
            position: relative;
            width: 100%;
            max-width: 660px;
            margin: 0 auto 1.2rem;
            height: 28px;
            background: #0a0a0a;
            border: 1px solid #1a1a2e;
            border-radius: 4px;
            overflow: hidden;
            box-shadow:
                inset 0 1px 4px rgba(0,0,0,0.7),
                0 0 6px rgba(255,0,255,0.08);
        }
        /* LED dot-grid overlay */
        .ticker-wrap::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
                repeating-linear-gradient(
                    90deg,
                    transparent 0px,
                    transparent 2px,
                    rgba(0,0,0,0.35) 2px,
                    rgba(0,0,0,0.35) 3px
                ),
                repeating-linear-gradient(
                    0deg,
                    transparent 0px,
                    transparent 2px,
                    rgba(0,0,0,0.35) 2px,
                    rgba(0,0,0,0.35) 3px
                );
            z-index: 2;
            pointer-events: none;
        }
        /* Subtle edge fade */
        .ticker-wrap::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg,
                #0a0a0a 0%, transparent 8%,
                transparent 92%, #0a0a0a 100%);
            z-index: 3;
            pointer-events: none;
        }
        .ticker-canvas {
            display: block;
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
        }
        @media (max-width: 480px) {
            .ticker-wrap { height: 24px; }
        }
    `;
    document.head.appendChild(s);
}

/* ── Measure text width using the canvas ctx ──────── */
function _measureText(text) {
    return _ctx ? _ctx.measureText(text).width : text.length * 10;
}

/* ── Pick next tip string ─────────────────────────── */
function _nextTip(key) {
    const tips = GAME_TIPS[key] || DEFAULT_TIPS;
    _tipIndex = (_tipIndex + 1) % tips.length;
    return tips[_tipIndex];
}

/* ── Build the separator + double-buffer text ─────── */
function _buildScrollText(key) {
    const tips = GAME_TIPS[key] || DEFAULT_TIPS;
    _tipIndex = 0;
    /* Join all tips with diamond separator for seamless loop */
    const sep = '  ◆  ';
    const joined = tips.join(sep) + sep;
    return joined;
}

/* ── Render a frame ───────────────────────────────── */
function _renderFrame() {
    if (!_ctx) return;

    const w = _canvas.width;
    const h = _canvas.height;
    _ctx.clearRect(0, 0, w, h);

    /* Draw scrolling text */
    const textW = _measureText(_activeText);

    /* Draw text at current scroll position, plus a repeated copy */
    _ctx.fillStyle = '#ff44cc';
    _ctx.shadowColor = '#ff00ff';
    _ctx.shadowBlur = 4 * _dpr;
    const y = h / 2;

    const pos = _scrollPos;
    _ctx.fillText(_activeText, pos, y);
    _ctx.fillText(_activeText, pos + textW, y);

    /* Reset once the first copy scrolls fully off */
    if (pos <= -textW) {
        _scrollPos += textW;
    }
}

/* ── Animation loop ───────────────────────────────── */
const SCROLL_SPEED = 1.2; /* px per frame at 1x DPR */

function _animate() {
    _scrollPos -= SCROLL_SPEED * _dpr;
    _renderFrame();
    _animId = requestAnimationFrame(_animate);
}

/* ── Public API ───────────────────────────────────── */

/**
 * Create the ticker element and return it (call once).
 * Caller inserts it into the DOM wherever desired.
 */
export function createTicker() {
    _injectCSS();

    const wrap = document.createElement('div');
    wrap.className = 'ticker-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'ticker-canvas';
    wrap.appendChild(canvas);

    _tickerEl = wrap;
    _canvas = canvas;

    return wrap;
}

/**
 * Start (or restart) the ticker animation.
 * Call after the element is in the DOM so sizing works.
 */
export function startTicker(gameKey) {
    if (!_canvas) return;

    /* Size canvas to container */
    const rect = _tickerEl.getBoundingClientRect();
    _dpr = window.devicePixelRatio || 1;
    _canvas.width = rect.width * _dpr;
    _canvas.height = rect.height * _dpr;

    _ctx = _canvas.getContext('2d');
    const fontSize = Math.round((_canvas.height * 0.52));
    _ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    _ctx.textBaseline = 'middle';

    _currentKey = gameKey || null;
    _activeText = _buildScrollText(_currentKey);
    _scrollPos = _canvas.width;          /* start off-screen right */
    _tipIndex = 0;

    /* Stop any existing loop */
    if (_animId) cancelAnimationFrame(_animId);
    _animate();
}

/**
 * Switch tips to a different game (smooth transition).
 */
export function setGame(gameKey) {
    if (gameKey === _currentKey) return;
    _currentKey = gameKey || null;
    _activeText = _buildScrollText(_currentKey);
    _scrollPos = _canvas.width;          /* reset to start off-right */
    _tipIndex = 0;
}

/**
 * Reset to default (no game) tips.
 */
export function clearGame() {
    setGame(null);
}
