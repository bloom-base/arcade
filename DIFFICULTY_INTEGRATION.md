# Difficulty System Integration Guide

This guide shows how to integrate the difficulty system into arcade games.

## Quick Start

```javascript
import { getDifficulty, getDifficultyConfig } from './utils/difficulty.js';

// Get the current difficulty level
const difficulty = getDifficulty(); // Returns 'easy', 'normal', or 'hard'

// Get game-specific configuration
const config = getDifficultyConfig('snake');
// Returns: { speed: 120, growthRate: 1, scoreMultiplier: 1 } for easy
```

## Available Functions

### `getDifficulty()`
Returns the current difficulty level from localStorage.

**Returns:** `'easy' | 'normal' | 'hard'`

**Example:**
```javascript
const currentLevel = getDifficulty(); // 'normal'
```

### `setDifficulty(level)`
Sets the difficulty level in localStorage (typically called from the hub).

**Parameters:**
- `level` (string): 'easy', 'normal', or 'hard'

**Returns:** `boolean` - true if successful, false if invalid level

**Example:**
```javascript
setDifficulty('hard'); // true
```

### `getDifficultyConfig(gameName, level?)`
Gets game-specific difficulty configuration.

**Parameters:**
- `gameName` (string): Name of the game ('snake', 'tetris', 'breakout', etc.)
- `level` (string, optional): Specific level, or uses current difficulty if omitted

**Returns:** Configuration object specific to the game

**Example:**
```javascript
const config = getDifficultyConfig('tetris', 'hard');
// Returns: { fallSpeed: 400, lockDelay: 400, scoreMultiplier: 2 }
```

## Pre-configured Games

### Snake
```javascript
const config = getDifficultyConfig('snake');
// Easy:   { speed: 120, growthRate: 1, scoreMultiplier: 1 }
// Normal: { speed: 80, growthRate: 1, scoreMultiplier: 1.5 }
// Hard:   { speed: 50, growthRate: 1, scoreMultiplier: 2 }
```

### Tetris
```javascript
const config = getDifficultyConfig('tetris');
// Easy:   { fallSpeed: 1000, lockDelay: 1000, scoreMultiplier: 1 }
// Normal: { fallSpeed: 700, lockDelay: 700, scoreMultiplier: 1.5 }
// Hard:   { fallSpeed: 400, lockDelay: 400, scoreMultiplier: 2 }
```

### Breakout
```javascript
const config = getDifficultyConfig('breakout');
// Easy:   { ballSpeed: 3, paddleWidth: 120, lives: 5, scoreMultiplier: 1 }
// Normal: { ballSpeed: 5, paddleWidth: 100, lives: 3, scoreMultiplier: 1.5 }
// Hard:   { ballSpeed: 7, paddleWidth: 80, lives: 3, scoreMultiplier: 2 }
```

## Complete Integration Example

Here's a complete example of integrating difficulty into a Snake game:

```javascript
import { getDifficulty, getDifficultyConfig } from './utils/difficulty.js';

class SnakeGame {
    constructor() {
        // Get difficulty configuration
        const config = getDifficultyConfig('snake');

        // Use config values
        this.speed = config.speed;
        this.scoreMultiplier = config.scoreMultiplier;
        this.difficulty = getDifficulty();

        this.setupGame();
        this.displayDifficulty();
    }

    displayDifficulty() {
        // Show difficulty in corner during gameplay
        const difficultyLabel = document.createElement('div');
        difficultyLabel.className = 'difficulty-indicator';
        difficultyLabel.textContent = `Difficulty: ${this.difficulty.toUpperCase()}`;
        difficultyLabel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        `;
        document.body.appendChild(difficultyLabel);
    }

    gameLoop() {
        // Use this.speed for game timing
        setTimeout(() => {
            this.update();
            this.render();
            this.gameLoop();
        }, this.speed);
    }

    calculateScore(baseScore) {
        // Apply difficulty multiplier to score
        return Math.floor(baseScore * this.scoreMultiplier);
    }
}

// Initialize game
const game = new SnakeGame();
```

## Adding a New Game

To add difficulty support for a new game, update `utils/difficulty.js`:

```javascript
// In getDifficultyConfig() function, add your game to the configs object:
const configs = {
    // ... existing games ...

    mygame: {
        easy: {
            enemySpeed: 2,
            enemyCount: 3,
            playerHealth: 100,
            scoreMultiplier: 1
        },
        normal: {
            enemySpeed: 4,
            enemyCount: 5,
            playerHealth: 75,
            scoreMultiplier: 1.5
        },
        hard: {
            enemySpeed: 6,
            enemyCount: 8,
            playerHealth: 50,
            scoreMultiplier: 2
        }
    }
};
```

## Difficulty Guidelines

When configuring difficulty for a new game:

### Easy Mode
- 30-40% slower than normal
- Larger targets/hit boxes
- More lives/health
- More forgiving mechanics
- Score multiplier: 1.0x

### Normal Mode
- Baseline/balanced gameplay
- Default settings
- Standard arcade experience
- Score multiplier: 1.5x

### Hard Mode
- 40-50% faster than normal
- Smaller targets/hit boxes
- Same or fewer lives than normal
- More challenging mechanics
- Score multiplier: 2.0x

## Displaying Difficulty in Games

Always show the current difficulty during gameplay. Example CSS:

```css
.difficulty-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
```

## Persistence

The difficulty setting is automatically persisted to `localStorage` with the key `arcade_difficulty`. Games don't need to manage this themselves—just import and use the utility functions.

## Testing

Run the test suite to verify the difficulty system:

```bash
node utils/difficulty.test.js
```

This ensures all difficulty configurations are working correctly.
