/**
 * Arcade Cabinet Bezel – decorative frame around every game viewport.
 *
 * Usage (inside any game's <script type="module">):
 *   import { initBezel } from '../../utils/arcade-bezel.js';
 *   initBezel();                       // auto-detects title from #title or <title>
 *   initBezel({ title: 'PONG' });      // explicit override
 *
 * What it does:
 *   1. Wraps #game-wrap in a .cab-bezel container (if not already wrapped).
 *   2. Adds a lit marquee header showing the game title.
 *   3. Adds a decorative coin-slot / insert-coin footer strip.
 *   4. Applies a beveled 3-D border with rounded corners.
 *   5. Fully responsive — shrinks gracefully on small screens.
 *
 * The bezel sits *behind* the CRT overlay (z-index 100) and game-over
 * overlay (z-index 200), so it never interferes with gameplay.
 *
 * localStorage key: 'arcade_bezel' (default: enabled)
 */

/* ── private state ──────────────────────────────── */
let _inited = false;

/* ── CSS ────────────────────────────────────────── */
const STYLE_ID = 'arcade-bezel-style';

const CSS = `
/* ── Bezel wrapper ──────────────────────────────── */
.cab-bezel {
  --bezel-radius: 18px;
  --bezel-border: 6px;
  --bezel-color-light: #5a5a6e;
  --bezel-color-mid:   #33334a;
  --bezel-color-dark:  #1a1a2e;
  --bezel-highlight:   rgba(255,255,255,0.08);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: var(--bezel-radius);
  background: linear-gradient(
    160deg,
    var(--bezel-color-light) 0%,
    var(--bezel-color-mid)   35%,
    var(--bezel-color-dark)  100%
  );
  border: var(--bezel-border) solid var(--bezel-color-mid);
  border-top-color: var(--bezel-color-light);
  border-left-color: var(--bezel-color-light);
  border-bottom-color: #111;
  border-right-color: #111;
  box-shadow:
    /* outer glow */
    0 0 30px rgba(0,0,0,0.6),
    /* inner 3-D highlight */
    inset 0  2px 0 var(--bezel-highlight),
    inset  2px 0 0 var(--bezel-highlight),
    /* bottom shadow for depth */
    0 8px 24px rgba(0,0,0,0.5);
  padding: 0;
  margin: 0.5rem auto;
  max-width: calc(100vw - 1rem);
  overflow: visible;
}

/* ── Corner bolts ───────────────────────────────── */
.cab-bezel::before,
.cab-bezel::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #888, #333);
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5);
  z-index: 5;
  pointer-events: none;
}
.cab-bezel::before { top: 8px; left: 8px; }
.cab-bezel::after  { top: 8px; right: 8px; }

/* bottom bolts via the coin-slot strip */
.cab-coin::before,
.cab-coin::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #888, #333);
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5);
  z-index: 5;
  pointer-events: none;
}
.cab-coin::before { bottom: 8px; left: 8px; }
.cab-coin::after  { bottom: 8px; right: 8px; }

/* ── Marquee header ─────────────────────────────── */
.cab-marquee {
  width: 100%;
  text-align: center;
  padding: 0.6rem 1.2rem 0.35rem;
  border-radius: var(--bezel-radius) var(--bezel-radius) 0 0;
  background: linear-gradient(
    180deg,
    #1e0a3c 0%,
    #0d0d2b 100%
  );
  border-bottom: 3px solid #000;
  box-shadow:
    inset 0 -2px 8px rgba(0,0,0,0.5),
    inset 0  1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}

/* rainbow backlight glow behind the title text */
.cab-marquee::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 70% 100% at 50% 80%,
    rgba(168,85,247,0.25) 0%,
    rgba(236,72,153,0.12) 40%,
    transparent 70%
  );
  pointer-events: none;
}

.cab-marquee-title {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.55rem, 2.5vw, 0.85rem);
  letter-spacing: 0.3em;
  color: #f0abfc;
  text-shadow:
    0 0 6px  rgba(240,171,252,0.7),
    0 0 20px rgba(168,85,247,0.5);
  position: relative;
  z-index: 1;
  text-transform: uppercase;
}

/* ── Screen inset ───────────────────────────────── */
.cab-screen {
  background: #000;
  border: 3px solid #111;
  border-top-color: #000;
  border-left-color: #000;
  border-bottom-color: #222;
  border-right-color: #222;
  box-shadow:
    inset 0 0 20px rgba(0,0,0,0.9),
    inset 0 0  4px rgba(0,0,0,1);
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Coin-slot footer strip ─────────────────────── */
.cab-coin {
  width: 100%;
  padding: 0.45rem 1rem;
  border-radius: 0 0 var(--bezel-radius) var(--bezel-radius);
  background: linear-gradient(
    0deg,
    var(--bezel-color-dark) 0%,
    var(--bezel-color-mid)  100%
  );
  border-top: 2px solid #000;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  position: relative;
}

/* coin slot graphic */
.cab-coin-slot {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cab-coin-hole {
  width: 28px;
  height: 6px;
  border-radius: 3px;
  background: #111;
  border: 1.5px solid #444;
  border-top-color: #222;
  border-bottom-color: #666;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
}

.cab-coin-label {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.3rem, 1.2vw, 0.42rem);
  color: #888;
  letter-spacing: 0.15em;
  text-shadow: 0 1px 0 #000;
  white-space: nowrap;
}

/* blinking dot on the coin area */
.cab-coin-led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 4px #ef4444, 0 0 8px rgba(239,68,68,0.4);
  animation: _bezel_blink 1.4s ease-in-out infinite;
}

@keyframes _bezel_blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 500px) {
  .cab-bezel {
    --bezel-radius: 12px;
    --bezel-border: 4px;
  }
  .cab-marquee { padding: 0.4rem 0.6rem 0.25rem; }
  .cab-coin    { padding: 0.3rem 0.6rem; }
  .cab-bezel::before, .cab-bezel::after,
  .cab-coin::before,  .cab-coin::after {
    width: 7px; height: 7px;
  }
}
`;

/* ── helpers ────────────────────────────────────── */
function _injectCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function _detectTitle() {
  const el = document.getElementById('title');
  if (el) return el.textContent.trim();
  return document.title.replace(/\s*[|–-]\s*arcade.*/i, '').trim() || 'ARCADE';
}

/* ── public API ─────────────────────────────────── */

/**
 * Wrap #game-wrap in a decorative arcade cabinet bezel.
 * Safe to call multiple times (idempotent).
 *
 * @param {Object} [opts]
 * @param {string} [opts.title]  – marquee text (auto-detected if omitted)
 */
export function initBezel(opts = {}) {
  if (_inited) return;

  const wrap = document.getElementById('game-wrap');
  if (!wrap) return;                       // graceful no-op for atypical layouts

  _inited = true;
  _injectCSS();

  const title = opts.title || _detectTitle();

  /* ── build bezel structure ────────────── */
  const bezel   = document.createElement('div');
  bezel.className = 'cab-bezel';

  // marquee
  const marquee = document.createElement('div');
  marquee.className = 'cab-marquee';
  marquee.innerHTML = `<span class="cab-marquee-title">${title}</span>`;

  // screen inset (will hold the original #game-wrap contents)
  const screen = document.createElement('div');
  screen.className = 'cab-screen';

  // coin strip
  const coin = document.createElement('div');
  coin.className = 'cab-coin';
  coin.innerHTML = `
    <span class="cab-coin-led"></span>
    <span class="cab-coin-slot">
      <span class="cab-coin-hole"></span>
      <span class="cab-coin-label">INSERT COIN</span>
    </span>
    <span class="cab-coin-led"></span>
  `;

  /* ── re-parent ────────────────────────── */
  // Insert bezel where #game-wrap is, then move game-wrap inside screen.
  wrap.parentNode.insertBefore(bezel, wrap);
  screen.appendChild(wrap);
  bezel.appendChild(marquee);
  bezel.appendChild(screen);
  bezel.appendChild(coin);
}
