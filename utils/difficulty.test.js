/**
 * Tests for difficulty.js utility
 * Run with: node --experimental-modules difficulty.test.js
 */

// Mock localStorage for Node.js environment
global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value;
    },
    clear() {
        this.store = {};
    }
};

import { getDifficulty, setDifficulty, getDifficultyConfig, getDifficultyLevels, getDifficultyLabel } from './difficulty.js';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        console.error(`  Expected: ${JSON.stringify(expected)}`);
        console.error(`  Got: ${JSON.stringify(actual)}`);
        testsFailed++;
    }
}

console.log('Running difficulty.js tests...\n');

// Test 1: Default difficulty
localStorage.clear();
assertEquals(getDifficulty(), 'normal', 'Default difficulty should be "normal"');

// Test 2: Set and get difficulty
setDifficulty('easy');
assertEquals(getDifficulty(), 'easy', 'Should store and retrieve "easy" difficulty');

setDifficulty('hard');
assertEquals(getDifficulty(), 'hard', 'Should store and retrieve "hard" difficulty');

// Test 3: Invalid difficulty
const result = setDifficulty('invalid');
assert(result === false, 'Should reject invalid difficulty levels');
assertEquals(getDifficulty(), 'hard', 'Difficulty should remain unchanged after invalid set');

// Test 4: Difficulty levels
const levels = getDifficultyLevels();
assertEquals(levels, ['easy', 'normal', 'hard'], 'Should return all difficulty levels');

// Test 5: Difficulty labels
assertEquals(getDifficultyLabel('easy'), 'Easy', 'Should capitalize "easy"');
assertEquals(getDifficultyLabel('normal'), 'Normal', 'Should capitalize "normal"');
assertEquals(getDifficultyLabel('hard'), 'Hard', 'Should capitalize "hard"');

// Test 6: Snake config
const snakeEasy = getDifficultyConfig('snake', 'easy');
assert(snakeEasy.speed === 120, 'Snake easy speed should be 120');
assert(snakeEasy.scoreMultiplier === 1, 'Snake easy multiplier should be 1');

const snakeHard = getDifficultyConfig('snake', 'hard');
assert(snakeHard.speed === 50, 'Snake hard speed should be 50');
assert(snakeHard.scoreMultiplier === 2, 'Snake hard multiplier should be 2');

// Test 7: Tetris config
const tetrisNormal = getDifficultyConfig('tetris', 'normal');
assert(tetrisNormal.fallSpeed === 700, 'Tetris normal fall speed should be 700');
assert(tetrisNormal.lockDelay === 700, 'Tetris normal lock delay should be 700');

// Test 8: Breakout config
const breakoutEasy = getDifficultyConfig('breakout', 'easy');
assert(breakoutEasy.paddleWidth === 120, 'Breakout easy paddle should be 120px');
assert(breakoutEasy.lives === 5, 'Breakout easy should have 5 lives');

const breakoutHard = getDifficultyConfig('breakout', 'hard');
assert(breakoutHard.paddleWidth === 80, 'Breakout hard paddle should be 80px');
assert(breakoutHard.ballSpeed === 7, 'Breakout hard ball speed should be 7');

// Test 9: Unknown game default config
const unknownGame = getDifficultyConfig('unknown', 'normal');
assert(unknownGame.multiplier === 1.0, 'Unknown game should get default config with multiplier 1.0');
assert(unknownGame.difficulty === 'normal', 'Unknown game should get difficulty property');

// Test 10: Current difficulty (without specifying level)
setDifficulty('easy');
const currentConfig = getDifficultyConfig('snake');
assert(currentConfig.speed === 120, 'Should use current difficulty when level not specified');

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed === 0) {
    console.log('✓ All tests passed!');
    process.exit(0);
} else {
    console.error('✗ Some tests failed');
    process.exit(1);
}
