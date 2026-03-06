/**
 * Retro Arcade Sound System
 * Simple Web Audio API-based sound generator for retro arcade games
 * Uses sine waves to create classic beep sounds
 * 
 * Usage:
 *   const sound = new SoundSystem();
 *   sound.play('bounce');
 *   sound.toggle(); // mute/unmute
 */

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.muted = localStorage.getItem('arcadeSoundMuted') === 'true';
        
        // Sound profiles: [frequency, duration, type]
        this.sounds = {
            bounce: { freq: 440, duration: 50, type: 'sine' },
            wallHit: { freq: 330, duration: 50, type: 'sine' },
            score: { freq: 660, duration: 100, type: 'sine' },
            gameOver: { freq: 220, duration: 200, type: 'sine' },
            eat: { freq: 550, duration: 80, type: 'sine' },
            lineClear: { freq: 880, duration: 150, type: 'sine' },
            rotate: { freq: 400, duration: 40, type: 'sine' },
            move: { freq: 350, duration: 30, type: 'sine' },
        };
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported', e);
            }
        }
    }

    /**
     * Play a sound by name
     * @param {string} soundName - Name of the sound from this.sounds
     */
    play(soundName) {
        if (this.muted || !this.sounds[soundName]) {
            return;
        }

        this.init();
        if (!this.audioContext) {
            return;
        }

        const sound = this.sounds[soundName];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.freq, this.audioContext.currentTime);

        // Envelope: quick fade in/out to avoid clicks
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + sound.duration / 1000);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration / 1000);
    }

    /**
     * Toggle mute/unmute
     * @returns {boolean} New muted state
     */
    toggle() {
        this.muted = !this.muted;
        localStorage.setItem('arcadeSoundMuted', this.muted.toString());
        return this.muted;
    }

    /**
     * Get current mute state
     * @returns {boolean} True if muted
     */
    isMuted() {
        return this.muted;
    }

    /**
     * Set mute state
     * @param {boolean} muted - Desired mute state
     */
    setMuted(muted) {
        this.muted = muted;
        localStorage.setItem('arcadeSoundMuted', this.muted.toString());
    }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundSystem;
}
