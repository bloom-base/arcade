/**
 * Difficulty Management Utility
 * Manages game difficulty settings across the arcade
 */

const DIFFICULTY_KEY = 'arcade_difficulty';
const DIFFICULTY_LEVELS = ['easy', 'normal', 'hard'];
const DEFAULT_DIFFICULTY = 'normal';

/**
 * Get the current difficulty level from localStorage
 * @returns {string} Current difficulty level ('easy', 'normal', or 'hard')
 */
export function getDifficulty() {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored && DIFFICULTY_LEVELS.includes(stored)) {
        return stored;
    }
    return DEFAULT_DIFFICULTY;
}

/**
 * Set the difficulty level in localStorage
 * @param {string} level - Difficulty level ('easy', 'normal', or 'hard')
 * @returns {boolean} True if successfully set, false otherwise
 */
export function setDifficulty(level) {
    if (!DIFFICULTY_LEVELS.includes(level)) {
        console.error(`Invalid difficulty level: ${level}`);
        return false;
    }
    localStorage.setItem(DIFFICULTY_KEY, level);
    return true;
}

/**
 * Get difficulty configuration for a specific game
 * @param {string} gameName - Name of the game ('snake', 'tetris', 'breakout', etc.)
 * @param {string} level - Optional difficulty level (defaults to current)
 * @returns {object} Configuration object for the game
 */
export function getDifficultyConfig(gameName, level = null) {
    const difficulty = level || getDifficulty();

    const configs = {
        snake: {
            easy: { speed: 120, growthRate: 1, scoreMultiplier: 1 },
            normal: { speed: 80, growthRate: 1, scoreMultiplier: 1.5 },
            hard: { speed: 50, growthRate: 1, scoreMultiplier: 2 }
        },
        tetris: {
            easy: { fallSpeed: 1000, lockDelay: 1000, scoreMultiplier: 1 },
            normal: { fallSpeed: 700, lockDelay: 700, scoreMultiplier: 1.5 },
            hard: { fallSpeed: 400, lockDelay: 400, scoreMultiplier: 2 }
        },
        breakout: {
            easy: { ballSpeed: 3, paddleWidth: 120, lives: 5, scoreMultiplier: 1 },
            normal: { ballSpeed: 5, paddleWidth: 100, lives: 3, scoreMultiplier: 1.5 },
            hard: { ballSpeed: 7, paddleWidth: 80, lives: 3, scoreMultiplier: 2 }
        },
        pong: {
            easy:   { ballSpeed: 4,   paddleSpeed: 4.8, paddleHeight: 90, accel: 1.03, maxSpeed: 12 },
            normal: { ballSpeed: 5,   paddleSpeed: 4.2, paddleHeight: 70, accel: 1.05, maxSpeed: 15 },
            hard:   { ballSpeed: 6.5, paddleSpeed: 3.6, paddleHeight: 55, accel: 1.07, maxSpeed: 18 },
        }
    };

    if (configs[gameName]) {
        return configs[gameName][difficulty];
    }

    // Default config for unknown games
    return {
        easy: { multiplier: 0.7, difficulty: 'easy' },
        normal: { multiplier: 1.0, difficulty: 'normal' },
        hard: { multiplier: 1.5, difficulty: 'hard' }
    }[difficulty];
}

/**
 * Get all available difficulty levels
 * @returns {string[]} Array of difficulty levels
 */
export function getDifficultyLevels() {
    return [...DIFFICULTY_LEVELS];
}

/**
 * Get a human-readable label for a difficulty level
 * @param {string} level - Difficulty level
 * @returns {string} Capitalized label
 */
export function getDifficultyLabel(level) {
    return level.charAt(0).toUpperCase() + level.slice(1);
}
