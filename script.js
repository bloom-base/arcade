// Arcade games registry
const games = [
    {
        name: 'Pong',
        description: 'Classic two-player paddle game',
        path: 'games/pong/index.html',
        players: '2 players',
        difficulty: 'Easy'
    }
];

// Render games grid
function renderGames() {
    const gamesContainer = document.getElementById('games-grid');
    if (!gamesContainer) return;

    gamesContainer.innerHTML = games.map(game => `
        <a href="${game.path}" class="game-card">
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            <div class="game-meta">
                <span>${game.players}</span>
                <span>${game.difficulty}</span>
            </div>
        </a>
    `).join('');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGames);
} else {
    renderGames();
}
