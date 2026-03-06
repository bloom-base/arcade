/**
 * Tests for the SoundSystem
 * Run with: node sound.test.js
 */

// Mock localStorage for Node.js environment
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    clear() {
        this.data = {};
    }
};

// Mock Web Audio API
global.window = {
    AudioContext: class MockAudioContext {
        constructor() {
            this.currentTime = 0;
            this.destination = {};
        }
        createOscillator() {
            return {
                type: 'sine',
                frequency: {
                    setValueAtTime: () => {}
                },
                connect: () => {},
                start: () => {},
                stop: () => {}
            };
        }
        createGain() {
            return {
                gain: {
                    setValueAtTime: () => {},
                    linearRampToValueAtTime: () => {}
                },
                connect: () => {}
            };
        }
    }
};

// Load the SoundSystem
const SoundSystem = require('./sound.js');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('✓', message);
        testsPassed++;
    } else {
        console.error('✗', message);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        console.log('✓', message);
        testsPassed++;
    } else {
        console.error('✗', message);
        console.error(`  Expected: ${expected}, Got: ${actual}`);
        testsFailed++;
    }
}

// Clear localStorage before tests
localStorage.clear();

console.log('\n=== Running SoundSystem Tests ===\n');

// Test 1: Constructor initializes properly
console.log('Test 1: Constructor');
const sound1 = new SoundSystem();
assert(sound1.audioContext === null, 'AudioContext starts as null');
assert(sound1.isMuted() === false, 'Default mute state is false');
assert(typeof sound1.sounds === 'object', 'Sounds object exists');

// Test 2: Sound profiles are defined
console.log('\nTest 2: Sound profiles');
assert(sound1.sounds.bounce !== undefined, 'bounce sound exists');
assert(sound1.sounds.wallHit !== undefined, 'wallHit sound exists');
assert(sound1.sounds.score !== undefined, 'score sound exists');
assert(sound1.sounds.gameOver !== undefined, 'gameOver sound exists');
assert(sound1.sounds.eat !== undefined, 'eat sound exists');
assert(sound1.sounds.lineClear !== undefined, 'lineClear sound exists');

// Test 3: Toggle mute
console.log('\nTest 3: Toggle mute');
const sound2 = new SoundSystem();
const muted1 = sound2.toggle();
assert(muted1 === true, 'First toggle mutes');
assert(sound2.isMuted() === true, 'isMuted returns true after toggle');
const muted2 = sound2.toggle();
assert(muted2 === false, 'Second toggle unmutes');
assert(sound2.isMuted() === false, 'isMuted returns false after second toggle');

// Test 4: localStorage persistence
console.log('\nTest 4: localStorage persistence');
localStorage.clear();
const sound3 = new SoundSystem();
sound3.toggle(); // Mute
assertEquals(localStorage.getItem('arcadeSoundMuted'), 'true', 'Muted state saved to localStorage');

const sound4 = new SoundSystem(); // New instance
assert(sound4.isMuted() === true, 'Muted state persisted to new instance');

// Test 5: setMuted method
console.log('\nTest 5: setMuted method');
localStorage.clear();
const sound5 = new SoundSystem();
sound5.setMuted(true);
assert(sound5.isMuted() === true, 'setMuted(true) works');
assertEquals(localStorage.getItem('arcadeSoundMuted'), 'true', 'setMuted saves to localStorage');

sound5.setMuted(false);
assert(sound5.isMuted() === false, 'setMuted(false) works');
assertEquals(localStorage.getItem('arcadeSoundMuted'), 'false', 'setMuted updates localStorage');

// Test 6: init creates AudioContext
console.log('\nTest 6: AudioContext initialization');
const sound6 = new SoundSystem();
assert(sound6.audioContext === null, 'AudioContext null before init');
sound6.init();
assert(sound6.audioContext !== null, 'AudioContext created after init');

// Test 7: play method doesn't throw
console.log('\nTest 7: play method');
const sound7 = new SoundSystem();
sound7.init();
try {
    sound7.play('bounce');
    console.log('✓ play(\'bounce\') does not throw');
    testsPassed++;
} catch (e) {
    console.error('✗ play(\'bounce\') threw error:', e.message);
    testsFailed++;
}

// Test 8: play doesn't play when muted
console.log('\nTest 8: Muted playback');
const sound8 = new SoundSystem();
sound8.setMuted(true);
sound8.init();
try {
    sound8.play('score'); // Should not play anything
    console.log('✓ play() doesn\'t throw when muted');
    testsPassed++;
} catch (e) {
    console.error('✗ play() threw error when muted:', e.message);
    testsFailed++;
}

// Test 9: Invalid sound name doesn't throw
console.log('\nTest 9: Invalid sound handling');
const sound9 = new SoundSystem();
sound9.init();
try {
    sound9.play('nonExistentSound');
    console.log('✓ play() handles invalid sound names gracefully');
    testsPassed++;
} catch (e) {
    console.error('✗ play() threw error on invalid sound:', e.message);
    testsFailed++;
}

// Results
console.log('\n=== Test Results ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed!\n');
    process.exit(0);
} else {
    console.log(`\n✗ ${testsFailed} test(s) failed\n`);
    process.exit(1);
}
