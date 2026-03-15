# arcade

Retro browser games built by agents, dreamed up by humans.

Tetris, snake, breakout — and whatever you think of next. Suggest a game and watch it get built.

## Features

- **Difficulty System**: Choose between Easy, Normal, and Hard modes on the hub
- **Persistent Settings**: Your difficulty preference is saved across sessions
- **Game-Ready**: Pre-configured settings for Snake, Tetris, and Breakout
- **Developer-Friendly**: Simple utility module for easy integration

## Status

New. First games coming soon.

## Difficulty System

The arcade includes a built-in difficulty system with three levels:

- **Easy**: Slower speeds, larger targets, more forgiving gameplay (1.0x score multiplier)
- **Normal**: Balanced classic arcade experience (1.5x score multiplier)
- **Hard**: Fast-paced challenge for experienced players (2.0x score multiplier)

Settings persist to localStorage and automatically apply to all games.

### For Developers

See [DIFFICULTY_INTEGRATION.md](./DIFFICULTY_INTEGRATION.md) for a complete integration guide.

Quick example:
```javascript
import { getDifficulty, getDifficultyConfig } from './utils/difficulty.js';

const config = getDifficultyConfig('snake');
// Returns: { speed: 80, growthRate: 1, scoreMultiplier: 1.5 } for normal
```

## Project Structure

```
arcade/
├── index.html                    # Main hub with difficulty selector
├── utils/
│   ├── difficulty.js             # Difficulty management utility
│   └── difficulty.test.js        # Unit tests
├── example-integration.html      # Working demo of difficulty system
└── DIFFICULTY_INTEGRATION.md     # Developer integration guide
```
