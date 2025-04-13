/* This page will be updated to allow easier link to backend */

document.addEventListener('DOMContentLoaded', () => {
    const playerApp = document.getElementById('player-app');
    const playPauseButton = document.getElementById('play-pause-button');
    const volumeButton = document.getElementById('volume-button');
    const volumeSlider = document.getElementById('volume-slider');
    const progressBar = document.getElementById('progress-bar');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressBarHandle = document.getElementById('progress-bar-handle');
    const currentTimeDisplay = document.getElementById('current-time');
    const totalDurationDisplay = document.getElementById('total-duration');
    const audioElement = document.getElementById('audio-player-element');
    const appMainBackground = document.querySelector('.app-main-background');

    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    const viewStationsButton = document.getElementById('view-stations-button');
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseButton = document.getElementById('sidebar-close-button');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const stationItems = document.querySelectorAll('.station-item');

    let isPlaying = false;
    let currentVolume = 0.8;

    let audioContext;
    let analyser;
    let source;
    let dataArray;
    let visualizerRafId = null;

    function initAudioContext() {
        if (!audioElement) return;
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                source = audioContext.createMediaElementSource(audioElement);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.8;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
            } catch (e) {
                 console.error("Web Audio API setup failed:", e);
                 return;
            }
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.error("AudioContext resume failed:", e));
        }
    }

    function visualizeBackground() {
        if (!analyser || !dataArray || !audioElement || audioElement.paused || !appMainBackground) {
             if (visualizerRafId) {
                 cancelAnimationFrame(visualizerRafId);
                 visualizerRafId = null;
                 if (appMainBackground) {
                     appMainBackground.style.setProperty('--bg-react-opacity', '0.1');
                     appMainBackground.style.setProperty('--bg-react-scale', '1');
                     appMainBackground.style.setProperty('--bg-react-brightness', '1');
                 }
             }
             return;
        }

        visualizerRafId = requestAnimationFrame(visualizeBackground);

        analyser.getByteFrequencyData(dataArray);

        const bufferLength = analyser.frequencyBinCount;

        const bassEndIndex = Math.floor(100 / (audioContext.sampleRate / 2 / bufferLength));
        let bassSum = 0;
        for (let i = 0; i < bassEndIndex; i++) {
            bassSum += dataArray[i];
        }
        let bassAverage = bassEndIndex > 0 ? bassSum / bassEndIndex : 0;

        const midsStartIndex = Math.floor(400 / (audioContext.sampleRate / 2 / bufferLength));
        const midsEndIndex = Math.floor(2000 / (audioContext.sampleRate / 2 / bufferLength));
        let midsSum = 0;
        let midsCount = 0;
        for (let i = midsStartIndex; i < midsEndIndex; i++) {
            midsSum += dataArray[i];
            midsCount++;
        }
        let midsAverage = midsCount > 0 ? midsSum / midsCount : 0;

        let normalizedBass = Math.min(1, bassAverage / 160);
        let normalizedMids = Math.min(1, midsAverage / 100);

        let targetOpacity = 0.15 + normalizedBass * 0.5;
        let targetScale = 1 + normalizedBass * 0.08;
        let targetBrightness = 1 + normalizedMids * 0.4;

        appMainBackground.style.setProperty('--bg-react-opacity', targetOpacity.toFixed(2));
        appMainBackground.style.setProperty('--bg-react-scale', targetScale.toFixed(3));
        appMainBackground.style.setProperty('--bg-react-brightness', targetBrightness.toFixed(2));
    }

    function togglePlayPause() {
        if (!audioElement) return;
        if (audioElement.paused || audioElement.ended) {
            initAudioContext();
             if (!audioContext) {
                console.error("Audio context not available.");
                return;
            }
            audioElement.play().then(() => {
                isPlaying = true;
                updatePlayPauseButton();
                if (!visualizerRafId) {
                     visualizeBackground();
                }
            }).catch(error => {
                console.error("Playback failed:", error);
                isPlaying = false;
                updatePlayPauseButton();
            });
        } else {
            audioElement.pause();
            isPlaying = false;
            updatePlayPauseButton();
        }
    }

    function updatePlayPauseButton() {
        if (!playPauseButton) return;
        const icon = playPauseButton.querySelector('i');
        if (!icon) return;
        if (isPlaying) {
            icon.classList.remove('fa-play'); icon.classList.add('fa-pause');
            playPauseButton.setAttribute('aria-label', 'Pause');
        } else {
            icon.classList.remove('fa-pause'); icon.classList.add('fa-play');
            playPauseButton.setAttribute('aria-label', 'Play');
        }
    }

    function handleVolumeChange(event) {
        if (!audioElement) return;
        currentVolume = parseFloat(event.target.value);
        audioElement.volume = currentVolume;
        updateVolumeIcon();
    }

     function updateVolumeIcon() {
        if (!volumeButton) return;
        const volumeIcon = volumeButton.querySelector('i');
         if (!volumeIcon) return;
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-off', 'fa-volume-mute');
        if (currentVolume === 0) {
            volumeIcon.classList.add('fa-volume-off');
        } else if (currentVolume < 0.5) {
            volumeIcon.classList.add('fa-volume-down');
        } else {
            volumeIcon.classList.add('fa-volume-up');
        }
    }

    function updateProgressUI() {
        if (!audioElement || !progressBarFill || !progressBarHandle || !currentTimeDisplay || !totalDurationDisplay) return;

        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;

        if (!isNaN(duration) && duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            progressBarFill.style.width = `${progressPercent}%`;
            progressBarHandle.style.left = `${progressPercent}%`;
            totalDurationDisplay.textContent = formatTime(duration);
        } else {
             progressBarFill.style.width = '0%';
             progressBarHandle.style.left = '0%';
             totalDurationDisplay.textContent = '0:00';
        }
        currentTimeDisplay.textContent = formatTime(currentTime);
    }

     function formatTime(seconds) {
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const paddedSecs = String(secs).padStart(2, '0');
        return `${minutes}:${paddedSecs}`;
    }

    function handleProgressBarClick(event) {
        if (!audioElement || isNaN(audioElement.duration) || audioElement.duration <= 0) return;

        const progressBarRect = progressBar.getBoundingClientRect();
        const clickPositionX = event.clientX - progressBarRect.left;
        const progressBarWidth = progressBarRect.width;
        if (progressBarWidth <= 0) return;

        const seekRatio = Math.max(0, Math.min(1, clickPositionX / progressBarWidth));
        const seekTime = seekRatio * audioElement.duration;

        audioElement.currentTime = seekTime;
        updateProgressUI();
    }

    function handleAudioEnded() {
        isPlaying = false;
        updatePlayPauseButton();
        if(audioElement) audioElement.currentTime = 0;
        updateProgressUI();
        if (visualizerRafId) {
            cancelAnimationFrame(visualizerRafId);
            visualizerRafId = null;
            if (appMainBackground) {
                appMainBackground.style.setProperty('--bg-react-opacity', '0.1');
                appMainBackground.style.setProperty('--bg-react-scale', '1');
                appMainBackground.style.setProperty('--bg-react-brightness', '1');
            }
        }
    }

     function handleAudioPause() {
        if (visualizerRafId) {
            cancelAnimationFrame(visualizerRafId);
            visualizerRafId = null;
            if (appMainBackground) {
                appMainBackground.style.setProperty('--bg-react-opacity', '0.1');
                appMainBackground.style.setProperty('--bg-react-scale', '1');
                appMainBackground.style.setProperty('--bg-react-brightness', '1');
            }
        }
    }

    function handleAudioPlay() {
       if (!visualizerRafId && analyser) {
           visualizeBackground();
       }
   }

    function handleMetadataLoaded() {
         if (audioElement && !isNaN(audioElement.duration)) {
             updateProgressUI();
         } else {
            updateProgressUI(0, 0);
         }
    }

    function openSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.add('is-open');
            sidebarOverlay.classList.add('is-open');
            document.body.classList.add('sidebar-active');
        }
    }

    function closeSidebar() {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.remove('is-open');
            sidebarOverlay.classList.remove('is-open');
            document.body.classList.remove('sidebar-active');
        }
    }

    if (playPauseButton) playPauseButton.addEventListener('click', togglePlayPause);
    if (volumeSlider) volumeSlider.addEventListener('input', handleVolumeChange);
    if (progressBar) progressBar.addEventListener('click', handleProgressBarClick);

    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateProgressUI);
        audioElement.addEventListener('loadedmetadata', handleMetadataLoaded);
        audioElement.addEventListener('ended', handleAudioEnded);
        audioElement.addEventListener('pause', handleAudioPause);
        audioElement.addEventListener('play', handleAudioPlay);

        if (volumeSlider) {
             audioElement.volume = parseFloat(volumeSlider.value);
             currentVolume = audioElement.volume;
        } else {
            audioElement.volume = 0.8;
            currentVolume = 0.8;
        }
    }

    if (sidebarToggleButton) sidebarToggleButton.addEventListener('click', openSidebar);
    if (viewStationsButton) viewStationsButton.addEventListener('click', openSidebar);
    if (sidebarCloseButton) sidebarCloseButton.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    stationItems.forEach(item => {
        item.addEventListener('click', () => {
            const stationName = item.querySelector('.station-name').textContent;
            console.log(`Station clicked: ${stationName}`);
            closeSidebar();
        });
    });

    console.log("Player Frontend Initialized (with Audio & Visualizer)");
    if(volumeButton) updateVolumeIcon();
    handleMetadataLoaded();

});