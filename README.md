# arcade

Retro browser games built by agents, dreamed up by humans.

Tetris, snake, breakout — and whatever you think of next. Suggest a game and watch it get built.

## Games

- **Pong** - Classic two-player paddle game with retro sound effects

## Features

### 🔊 Retro Sound System

All games feature authentic retro arcade sound effects using the Web Audio API:

- **Sine wave beeps** for that classic arcade feel
- **Mute/unmute toggle** with speaker icon (🔊/🔇)
- **Persistent preferences** via localStorage
- **Short, punchy sounds** (50-200ms) that won't annoy

### Sound Events

The sound system includes predefined sounds for common game events:

- `bounce` - Paddle hits, ball bounces (440 Hz, 50ms)
- `wallHit` - Wall collisions (330 Hz, 50ms)
- `score` - Point scored (660 Hz, 100ms)
- `gameOver` - End of game (220 Hz, 200ms)
- `eat` - Food/item collected (550 Hz, 80ms)
- `lineClear` - Line cleared in Tetris (880 Hz, 150ms)
- `rotate` - Piece rotation (400 Hz, 40ms)
- `move` - Movement sound (350 Hz, 30ms)

## Adding a New Game

1. **Create game directory**: `games/your-game/`
2. **Build your game**: Use vanilla HTML/CSS/JS
3. **Add sound effects**:

```javascript
// Include the sound system
<script src="../../sound.js"></script>

// Initialize in your game
const sound = new SoundSystem();

// Add mute toggle button
<button id="soundToggle" onclick="toggleSound()">🔊</button>

function toggleSound() {
    sound.toggle();
    updateSoundButton();
}

// Play sounds on events
sound.play('bounce');  // Ball hits paddle
sound.play('score');   // Player scores
```

4. **Register in script.js**:

```javascript
const games = [
    {
        name: 'Your Game',
        description: 'Game description',
        path: 'games/your-game/index.html',
        players: '1-2 players',
        difficulty: 'Medium'
    }
];
```

## Sound System API

```javascript
const sound = new SoundSystem();

// Play a sound
sound.play('bounce');

// Toggle mute/unmute
sound.toggle(); // Returns new muted state (true/false)

// Check if muted
sound.isMuted(); // Returns boolean

// Set mute state
sound.setMuted(true);  // Mute
sound.setMuted(false); // Unmute
```

## Development

Run tests:
```bash
node sound.test.js
```

The project uses:
- Pure vanilla JavaScript (no build step)
- Web Audio API for sound
- Canvas API for game rendering
- localStorage for preferences

## Deployment

Auto-deploys to Fly.io on merge to main. The app serves on port 8080.

## Contributing

Games should:
- Use the shared sound system for consistency
- Include a mute button in the top corner
- Be playable in modern browsers
- Follow the retro arcade aesthetic
