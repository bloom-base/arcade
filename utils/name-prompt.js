/**
 * name-prompt.js — Retro arcade-style name input overlay.
 *
 * Shows a "ENTER YOUR NAME" prompt when a player achieves a high score.
 * Returns a Promise that resolves with the player name (3-10 chars)
 * or 'Anonymous' if cancelled / left blank.
 *
 * Usage:
 *   import { promptForName } from './name-prompt.js';
 *   const name = await promptForName(rank);   // rank 1-5
 */

const PROMPT_ID = '_np_overlay';
const STYLE_ID  = '_np_style';

const CSS = `
@keyframes _np_flash {
    0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(250,204,21,.8), 0 0 40px rgba(250,204,21,.3); }
    50%      { opacity: 0.3; text-shadow: 0 0 6px rgba(250,204,21,.2); }
}
@keyframes _np_slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
}
@keyframes _np_cursor {
    0%, 100% { border-color: #22d3ee; }
    50%      { border-color: transparent; }
}

#${PROMPT_ID} {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.94);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 250;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    font-family: 'Press Start 2P', monospace;
    gap: 0;
}
#${PROMPT_ID}.show {
    opacity: 1;
    pointer-events: auto;
}

#${PROMPT_ID} ._np_rank {
    font-size: clamp(0.5rem, 2vw, 0.75rem);
    color: #facc15;
    letter-spacing: 0.15em;
    margin-bottom: 1.5rem;
    animation: _np_flash 0.8s ease-in-out infinite;
}

#${PROMPT_ID} ._np_title {
    font-size: clamp(0.55rem, 2.2vw, 0.85rem);
    color: #22d3ee;
    letter-spacing: 0.12em;
    margin-bottom: 2rem;
    text-shadow: 0 0 12px rgba(34,211,238,.4);
    animation: _np_slideUp 0.4s ease-out both;
}

#${PROMPT_ID} ._np_input {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.7rem, 2.8vw, 1.1rem);
    color: #22d3ee;
    background: rgba(10, 10, 20, 0.8);
    border: 2px solid #22d3ee;
    border-radius: 0;
    padding: 0.6em 0.8em;
    text-align: center;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    width: min(280px, 80vw);
    outline: none;
    caret-color: #22d3ee;
    animation: _np_slideUp 0.4s ease-out 0.1s both;
    box-shadow: 0 0 15px rgba(34,211,238,.2), inset 0 0 10px rgba(34,211,238,.1);
}
#${PROMPT_ID} ._np_input::placeholder {
    color: #335;
    letter-spacing: 0.15em;
}
#${PROMPT_ID} ._np_input:focus {
    box-shadow: 0 0 25px rgba(34,211,238,.4), inset 0 0 15px rgba(34,211,238,.15);
}

#${PROMPT_ID} ._np_hint {
    font-size: clamp(0.28rem, 1vw, 0.38rem);
    color: #555;
    margin-top: 1rem;
    letter-spacing: 0.08em;
    animation: _np_slideUp 0.4s ease-out 0.2s both;
}

#${PROMPT_ID} ._np_btn {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.4rem, 1.6vw, 0.6rem);
    color: #facc15;
    background: transparent;
    border: 2px solid #facc15;
    padding: 0.7em 1.5em;
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: all 0.2s ease;
    margin-top: 1.5rem;
    animation: _np_slideUp 0.4s ease-out 0.3s both;
}
#${PROMPT_ID} ._np_btn:hover,
#${PROMPT_ID} ._np_btn:focus {
    background: #facc15;
    color: #0a0a0a;
    box-shadow: 0 0 20px rgba(250,204,21,.5);
    outline: none;
}

#${PROMPT_ID} ._np_skip {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.28rem, 1vw, 0.38rem);
    color: #444;
    background: transparent;
    border: none;
    cursor: pointer;
    margin-top: 1rem;
    letter-spacing: 0.06em;
    transition: color 0.15s;
    animation: _np_slideUp 0.4s ease-out 0.4s both;
}
#${PROMPT_ID} ._np_skip:hover { color: #888; }
`;

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

/**
 * Show the name prompt overlay.
 * @param {number} [rank=1]  The rank achieved (1-5), used for display text.
 * @returns {Promise<string>} Resolves with the player name or 'Anonymous'.
 */
export function promptForName(rank = 1) {
    injectStyle();

    return new Promise((resolve) => {
        // Remove any existing prompt
        const old = document.getElementById(PROMPT_ID);
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = PROMPT_ID;

        const rankText = rank === 1 ? '★ NEW HIGH SCORE! ★' : `★ TOP ${rank} SCORE! ★`;

        overlay.innerHTML = `
            <div class="_np_rank">${rankText}</div>
            <div class="_np_title">ENTER YOUR NAME</div>
            <input class="_np_input" type="text" maxlength="10" placeholder="AAA" autocomplete="off" spellcheck="false">
            <div class="_np_hint">3-10 CHARACTERS</div>
            <button class="_np_btn">OK</button>
            <button class="_np_skip">SKIP</button>
        `;

        document.body.appendChild(overlay);

        const input   = overlay.querySelector('._np_input');
        const okBtn   = overlay.querySelector('._np_btn');
        const skipBtn = overlay.querySelector('._np_skip');

        function finish(val) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            const name = (val && val.trim()) ? val.trim().slice(0, 10) : 'Anonymous';
            resolve(name);
        }

        okBtn.addEventListener('click', () => finish(input.value));
        skipBtn.addEventListener('click', () => finish(''));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finish(input.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finish('');
            }
        });

        // Show with transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('show');
                input.focus();
            });
        });
    });
}
