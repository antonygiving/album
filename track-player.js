// Audio player elements
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const progressBar = document.querySelector('.progress-bar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const previewNotice = document.getElementById('previewNotice');

// Check if user has unlocked
const isUnlocked = localStorage.getItem('albumUnlocked') === 'true';
const PREVIEW_DURATION = 30; // seconds

// This function is the key to making your site dynamic.
async function fetchAllTrackData() {
    // In a real dynamic site, you would fetch this data from an API.
    // const response = await fetch('https://your-api.com/tracks');
    // const data = await response.json();
    // return data;

    // For now, to keep the site working, we'll return the original hardcoded data.
    console.log("Fetching track data...");
    try {
        const response = await fetch('/api/tracks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tracksArray = await response.json();
        const tracksObject = tracksArray.reduce((acc, track) => {
            acc[track.id] = track;
            return acc;
        }, {});
        return tracksObject;
    } catch (error) {
        console.error('Error fetching track data:', error);
        return {};
    }
}

function loadTrackData(currentTrack, trackId, allTracks) {
    if (!currentTrack) {
        window.location.href = 'index.html';
        return;
    }

    // Update page content
    document.title = `${currentTrack.title} - 24`;
    document.getElementById('trackNumber').textContent = trackId.toString().padStart(2, '0');
    document.getElementById('trackTitle').textContent = currentTrack.title;
    document.getElementById('playerTrackTitle').textContent = currentTrack.title;
    document.getElementById('trackStory').textContent = currentTrack.story;
    
    // Update streaming links
    document.getElementById('spotifyLink').href = currentTrack.spotify;
    document.getElementById('appleMusicLink').href = currentTrack.appleMusic;
    document.getElementById('youtubeLink').href = currentTrack.youtube;
    
    // Set audio source
    // NOTE: In production, replace with actual audio file paths
    // audioPlayer.src = currentTrack.audioFile;
    
    // Hide preview notice if unlocked
    if (isUnlocked) {
        previewNotice.style.display = 'none';
    }
    
    // Setup track navigation
    setupTrackNavigation(trackId, allTracks);
}

// Setup track navigation
function setupTrackNavigation(trackId, allTracks) {
    const prevTrack = document.getElementById('prevTrack');
    const nextTrack = document.getElementById('nextTrack');
    const totalTracks = Object.keys(allTracks).length;
    
    if (trackId > 1) {
        const prevTrackData = allTracks[trackId - 1];
        prevTrack.href = `track.html?id=${trackId - 1}`;
        prevTrack.querySelector('.nav-track-title').textContent = prevTrackData.title;
        prevTrack.style.display = 'flex';
    } else {
        prevTrack.style.display = 'none';
    }
    
    // Check if there is a next track
    if (trackId < totalTracks) {
        const nextTrackData = allTracks[trackId + 1];
        nextTrack.href = `track.html?id=${trackId + 1}`;
        nextTrack.querySelector('.nav-track-title').textContent = nextTrackData.title;
        nextTrack.style.display = 'flex';
    } else {
        nextTrack.style.display = 'none';
    }
}

// Play/Pause
playBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = '⏸';
    } else {
        audioPlayer.pause();
        playBtn.textContent = '▶';
    }
});

// Previous track
prevBtn.addEventListener('click', () => { 
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = parseInt(urlParams.get('id'));
    if (trackId > 1) { 
        window.location.href = `track.html?id=${trackId - 1}`; 
    } 
});

// Next track
nextBtn.addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = parseInt(urlParams.get('id'));
    const allTracks = await fetchAllTrackData();
    const totalTracks = Object.keys(allTracks).length;
    if (trackId < totalTracks) {
        window.location.href = `track.html?id=${trackId + 1}`;
    }
});

// Update progress bar
audioPlayer.addEventListener('timeupdate', () => {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    // Enforce 30-second preview if not unlocked
    if (!isUnlocked && current >= PREVIEW_DURATION) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playBtn.textContent = '▶';
        showEmailModal();
        return;
    }
    
    if (duration) {
        const progressPercent = (current / duration) * 100;
        progress.style.width = progressPercent + '%';
        
        currentTimeEl.textContent = formatTime(current);
        durationEl.textContent = formatTime(duration);
    }
});

// Click on progress bar to seek
progressBar.addEventListener('click', (e) => {
    if (!isUnlocked) {
        // Only allow seeking within preview duration
        const clickPosition = e.offsetX / progressBar.offsetWidth;
        const seekTime = clickPosition * audioPlayer.duration;
        
        if (seekTime <= PREVIEW_DURATION) {
            audioPlayer.currentTime = seekTime;
        }
    } else {
        const clickPosition = e.offsetX / progressBar.offsetWidth;
        audioPlayer.currentTime = clickPosition * audioPlayer.duration;
    }
});

// Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// When audio ends
audioPlayer.addEventListener('ended', () => {
    playBtn.textContent = '▶';
    audioPlayer.currentTime = 0;
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        playBtn.click();
    } else if (e.code === 'ArrowLeft') {
        audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
        const maxTime = isUnlocked ? audioPlayer.duration : PREVIEW_DURATION;
        audioPlayer.currentTime = Math.min(maxTime, audioPlayer.currentTime + 5);
    }
});

// Main initialization function
async function initializePlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = parseInt(urlParams.get('id'));

    if (!trackId) {
        window.location.href = 'index.html'; // No ID, go home
        return;
    }

    try {
        const allTracks = await fetchAllTrackData();
        const currentTrack = allTracks[trackId];
        loadTrackData(currentTrack, trackId, allTracks);
    } catch (error) {
        console.error("Failed to load track data:", error);
        document.querySelector('.track-container').innerHTML = '<div class="glass-card" style="padding: 40px; text-align: center;"><h2>Error loading track</h2><p>Please try again later.</p></div>';
    }
}

// Start the player when the page is ready
document.addEventListener('DOMContentLoaded', initializePlayer);

// Note for developer: 
// In production, you'll need to:
// 1. Replace trackData with actual API calls or database queries
// 2. Add actual audio files to the /audio directory
// 3. Integrate with email service (Mailchimp, ConvertKit, etc.)
// 4. Add proper error handling for missing files
// 5. Consider adding a loading state while audio loads
