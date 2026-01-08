// persistent-player.js - Global music player that persists across pages

class PersistentMusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 1;
        this.isUnlocked = localStorage.getItem('albumUnlocked') === 'true';
        
        this.init();
    }
    
    init() {
        this.createPlayerHTML();
        this.setupEventListeners();
        this.loadPlaylist();
        this.restorePlayerState();
    }
    
    createPlayerHTML() {
        const playerHTML = `
            <div class="persistent-player" id="persistentPlayer">
                <div class="player-container">
                    <!-- Left: Track Info -->
                    <div class="player-track-info">
                        <img src="album-art.png" alt="Album Art" class="player-album-art" id="playerAlbumArt">
                        <div class="player-track-details">
                            <div class="player-track-title" id="playerTrackTitle">Select a track</div>
                            <div class="player-track-artist" id="playerTrackArtist">24</div>
                        </div>
                    </div>
                    
                    <!-- Center: Controls -->
                    <div class="player-controls-center">
                        <div class="player-buttons">
                            <button class="player-btn player-btn-prev" id="playerPrev" title="Previous">
                                ◀
                            </button>
                            <button class="player-btn player-btn-play" id="playerPlayPause" title="Play">
                                ▶
                            </button>
                            <button class="player-btn player-btn-next" id="playerNext" title="Next">
                                â–¶
                            </button>
                        </div>
                        <div class="player-progress-container">
                            <span class="player-time" id="playerCurrentTime">0:00</span>
                            <div class="player-progress-bar" id="playerProgressBar">
                                <div class="player-progress-fill" id="playerProgressFill"></div>
                            </div>
                            <span class="player-time" id="playerDuration">0:00</span>
                        </div>
                    </div>
                    
                    <!-- Right: Volume & Actions -->
                    <div class="player-right-controls">
                        <div class="player-volume-container">
                            <span class="player-volume-icon" id="playerVolumeIcon">🔊</span>
                            <div class="player-volume-slider" id="playerVolumeSlider">
                                <div class="player-volume-fill" id="playerVolumeFill"></div>
                            </div>
                        </div>
                        <button class="player-queue-btn" id="playerQueueBtn">
                            Queue
                        </button>
                        <button class="player-close-btn" id="playerCloseBtn" title="Close Player">
                            ×
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Queue Sidebar -->
            <div class="player-queue-sidebar" id="playerQueueSidebar">
                <div class="queue-header">
                    <h3>Up Next</h3>
                    <button class="queue-close" id="queueClose">×</button>
                </div>
                <div class="queue-list" id="queueList">
                    <!-- Queue items will be added here -->
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', playerHTML);
    }
    
    setupEventListeners() {
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // Play/Pause
        document.getElementById('playerPlayPause').addEventListener('click', () => this.togglePlay());
        
        // Previous/Next
        document.getElementById('playerPrev').addEventListener('click', () => this.playPrevious());
        document.getElementById('playerNext').addEventListener('click', () => this.playNext());
        
        // Progress bar
        const progressBar = document.getElementById('playerProgressBar');
        progressBar.addEventListener('click', (e) => this.seek(e));
        
        // Volume
        document.getElementById('playerVolumeIcon').addEventListener('click', () => this.toggleMute());
        document.getElementById('playerVolumeSlider').addEventListener('click', (e) => this.changeVolume(e));
        
        // Queue
        document.getElementById('playerQueueBtn').addEventListener('click', () => this.toggleQueue());
        document.getElementById('queueClose').addEventListener('click', () => this.toggleQueue());
        
        // Close player
        document.getElementById('playerCloseBtn').addEventListener('click', () => this.closePlayer());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Save state before page unload
        window.addEventListener('beforeunload', () => this.savePlayerState());
    }
    
    async loadPlaylist() {
        try {
            // Try to load from API
            const API_URL = window.API_URL || 'http://localhost:5000/api/public';
            const response = await fetch(`${API_URL}/tracks`);
            
            if (response.ok) {
                const tracks = await response.json();
                this.playlist = tracks.sort((a, b) => a.trackNumber - b.trackNumber);
            } else {
                // Fallback to hardcoded data
                this.playlist = this.getHardcodedPlaylist();
            }
        } catch (error) {
            console.log('Using hardcoded playlist');
            this.playlist = this.getHardcodedPlaylist();
        }
        
        this.renderQueue();
    }
    
    getHardcodedPlaylist() {
        return [
            { trackNumber: 1, title: 'NAH!', audioFile: 'audio/track1.mp3', duration: '3:24' },
            { trackNumber: 2, title: 'PUNGUZA STRESS', audioFile: 'audio/track2.mp3', duration: '2:58' },
            { trackNumber: 3, title: 'NIKO FRESH', audioFile: 'audio/track3.mp3', duration: '3:12' },
            { trackNumber: 4, title: 'FASHION', audioFile: 'audio/track4.mp3', duration: '2:45' },
            { trackNumber: 5, title: 'FASTER,', audioFile: 'audio/track5.mp3', duration: '3:01' },
            { trackNumber: 6, title: 'LOVE', audioFile: 'audio/track6.mp3', duration: '3:30' },
            { trackNumber: 7, title: 'BOSSY', audioFile: 'audio/track7.mp3', duration: '2:52' },
            { trackNumber: 8, title: '???', audioFile: 'audio/bonus.mp3', duration: '3:45', isBonus: true }
        ];
    }
    
    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        const track = this.playlist[index];
        
        // Check if bonus track and not unlocked
        if (track.isBonus && !this.isUnlocked) {
            this.showUnlockMessage();
            return;
        }
        
        this.currentIndex = index;
        this.currentTrack = track;
        
        // Update UI
        document.getElementById('playerTrackTitle').textContent = track.title;
        document.getElementById('playerTrackArtist').textContent = '24';
        
        // Load and play audio
        this.audio.src = track.audioFile;
        this.audio.load();
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.showPlayer();
            this.updateQueueHighlight();
            document.body.classList.add('player-active');
        }).catch(err => {
            console.error('Playback error:', err);
        });
    }
    
    togglePlay() {
        if (!this.currentTrack) {
            // Play first track if none selected
            this.playTrack(0);
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        
        this.updatePlayButton();
    }
    
    playNext() {
        let nextIndex = this.currentIndex + 1;
        
        // Skip bonus track if not unlocked
        if (nextIndex < this.playlist.length && this.playlist[nextIndex].isBonus && !this.isUnlocked) {
            nextIndex++;
        }
        
        if (nextIndex >= this.playlist.length) {
            nextIndex = 0; // Loop to beginning
        }
        
        this.playTrack(nextIndex);
    }
    
    playPrevious() {
        // If more than 3 seconds played, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        let prevIndex = this.currentIndex - 1;
        
        if (prevIndex < 0) {
            prevIndex = this.playlist.length - 1;
        }
        
        // Skip bonus track if not unlocked
        if (this.playlist[prevIndex].isBonus && !this.isUnlocked) {
            prevIndex--;
            if (prevIndex < 0) prevIndex = this.playlist.length - 2;
        }
        
        this.playTrack(prevIndex);
    }
    
    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        document.getElementById('playerProgressFill').style.width = progress + '%';
        document.getElementById('playerCurrentTime').textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        document.getElementById('playerDuration').textContent = this.formatTime(this.audio.duration);
    }
    
    seek(e) {
        const progressBar = document.getElementById('playerProgressBar');
        const clickX = e.offsetX;
        const width = progressBar.offsetWidth;
        const percentage = clickX / width;
        
        this.audio.currentTime = percentage * this.audio.duration;
    }
    
    changeVolume(e) {
        const volumeSlider = document.getElementById('playerVolumeSlider');
        const clickX = e.offsetX;
        const width = volumeSlider.offsetWidth;
        const volume = clickX / width;
        
        this.audio.volume = volume;
        this.volume = volume;
        document.getElementById('playerVolumeFill').style.width = (volume * 100) + '%';
        this.updateVolumeIcon();
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.audio.volume = 0;
            document.getElementById('playerVolumeFill').style.width = '0%';
        } else {
            this.audio.volume = this.volume;
            document.getElementById('playerVolumeFill').style.width = (this.volume * 100) + '%';
        }
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        const icon = document.getElementById('playerVolumeIcon');
        if (this.audio.volume === 0) {
            icon.textContent = '🔇';
        } else if (this.audio.volume < 0.5) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '🔊';
        }
    }
    
    updatePlayButton() {
        const button = document.getElementById('playerPlayPause');
        button.textContent = this.isPlaying ? '⏸' : '▶';
        button.title = this.isPlaying ? 'Pause' : 'Play';
    }
    
    showPlayer() {
        document.getElementById('persistentPlayer').classList.add('active');
    }
    
    closePlayer() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('persistentPlayer').classList.remove('active');
        document.body.classList.remove('player-active');
    }
    
    toggleQueue() {
        document.getElementById('playerQueueSidebar').classList.toggle('active');
    }
    
    renderQueue() {
        const queueList = document.getElementById('queueList');
        queueList.innerHTML = this.playlist.map((track, index) => {
            // Hide bonus track if not unlocked
            if (track.isBonus && !this.isUnlocked) {
                return '';
            }
            
            return `
                <div class="queue-item ${this.currentIndex === index ? 'playing' : ''}" 
                     onclick="player.playTrack(${index})">
                    <div class="queue-item-number">${track.trackNumber}</div>
                    <div class="queue-item-info">
                        <div class="queue-item-title">${track.title}</div>
                        <div class="queue-item-duration">${track.duration || '0:00'}</div>
                    </div>
                    ${this.currentIndex === index ? '<span class="queue-item-playing-icon">♪</span>' : ''}
                </div>
            `;
        }).join('');
    }
    
    updateQueueHighlight() {
        const items = document.querySelectorAll('.queue-item');
        items.forEach((item, index) => {
            item.classList.toggle('playing', index === this.currentIndex);
        });
    }
    
    handleKeyboard(e) {
        // Space: Play/Pause
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            this.togglePlay();
        }
        
        // Arrow Right: Next track
        if (e.code === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            this.playNext();
        }
        
        // Arrow Left: Previous track
        if (e.code === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            this.playPrevious();
        }
        
        // Arrow Up: Volume up
        if (e.code === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            this.audio.volume = Math.min(1, this.audio.volume + 0.1);
            document.getElementById('playerVolumeFill').style.width = (this.audio.volume * 100) + '%';
            this.updateVolumeIcon();
        }
        
        // Arrow Down: Volume down
        if (e.code === 'ArrowDown' && e.ctrlKey) {
            e.preventDefault();
            this.audio.volume = Math.max(0, this.audio.volume - 0.1);
            document.getElementById('playerVolumeFill').style.width = (this.audio.volume * 100) + '%';
            this.updateVolumeIcon();
        }
    }
    
    showUnlockMessage() {
        alert('🔒 This is an exclusive bonus track! Sign up with your email to unlock full access.');
        // Could trigger the email modal here instead
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    savePlayerState() {
        const state = {
            currentIndex: this.currentIndex,
            currentTime: this.audio.currentTime,
            volume: this.volume,
            isPlaying: this.isPlaying
        };
        sessionStorage.setItem('playerState', JSON.stringify(state));
    }
    
    restorePlayerState() {
        const savedState = sessionStorage.getItem('playerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.volume = state.volume;
            this.audio.volume = state.volume;
            document.getElementById('playerVolumeFill').style.width = (state.volume * 100) + '%';
            
            if (state.currentIndex !== undefined && state.currentIndex >= 0) {
                this.playTrack(state.currentIndex);
                this.audio.currentTime = state.currentTime || 0;
                
                if (!state.isPlaying) {
                    this.audio.pause();
                    this.isPlaying = false;
                    this.updatePlayButton();
                }
            }
        }
    }
}

// Initialize player globally
let player;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    player = new PersistentMusicPlayer();
    
    // Expose play function globally for track pages
    window.playTrackInPlayer = (trackNumber) => {
        const index = player.playlist.findIndex(t => t.trackNumber === trackNumber);
        if (index !== -1) {
            player.playTrack(index);
        }
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistentMusicPlayer;
}
