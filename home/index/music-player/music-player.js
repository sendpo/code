// 页面加载完成后执行音乐播放器逻辑
window.addEventListener('load', function () {
// 音乐播放器核心逻辑（优化版，首次点击播放后自动播放后续歌曲）
const audioPlayer = document.getElementById('audio-player');
const playerContainer = document.getElementById('player-container');
const apiUrl = 'https://www.hhlqilongzhu.cn/api/wangyi_hot_review.php';
let isDragging = false;
let lastVolume = 0.7; // 初始音量
let currentCover = null;
let hasUserInteracted = false; // 标记用户是否点击过播放

// 格式化时间：秒 → 分:秒
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// 更新进度条
function updateProgress() {
    if (!audioPlayer.duration || isDragging) return;
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    const progressPlayed = document.querySelector('.progress-played');
    const progressHandle = document.querySelector('.progress-handle');
    const currentTimeEl = document.querySelector('.current-time-text');
    const totalTimeEl = document.querySelector('.total-time-text');

    progressPlayed.style.width = `${progressPercent}%`;
    progressHandle.style.left = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
    if (progressPercent > 0) progressHandle.style.display = 'block';
}

// 拖动进度条
function initProgressDrag() {
    const progressContainer = document.querySelector('.progress-container');
    const progressPlayed = document.querySelector('.progress-played');
    const progressHandle = document.querySelector('.progress-handle');

    progressContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        progressHandle.style.cursor = 'grabbing';
        updateProgressByClick(e);
        if (audioPlayer.paused && currentCover) currentCover.classList.remove('playing');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateProgressByClick(e);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            progressHandle.style.cursor = 'grab';
            if (!audioPlayer.paused && currentCover) currentCover.classList.add('playing');
            if (!audioPlayer.paused) audioPlayer.play();
        }
    });

    function updateProgressByClick(e) {
        const containerRect = progressContainer.getBoundingClientRect();
        let progressPercent = (e.clientX - containerRect.left) / containerRect.width;
        progressPercent = Math.max(0, Math.min(1, progressPercent));
        progressPlayed.style.width = `${progressPercent * 100}%`;
        progressHandle.style.left = `${progressPercent * 100}%`;
        audioPlayer.currentTime = progressPercent * audioPlayer.duration;
        const currentTimeEl = document.querySelector('.current-time-text');
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

// 初始化音量控制
function initVolumeControl() {
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeTooltip = document.querySelector('.volume-tooltip');

    audioPlayer.volume = lastVolume;
    volumeSlider.value = lastVolume * 100;
    volumeTooltip.setAttribute('data-volume', Math.round(lastVolume * 100));
    updateVolumeIcon();

    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value / 100;
        audioPlayer.volume = volume;
        lastVolume = volume;
        const volumePercent = Math.round(volume * 100);
        volumeTooltip.setAttribute('data-volume', volumePercent);
        updateVolumeIcon();
    });

    volumeIcon.addEventListener('click', () => {
        if (audioPlayer.volume > 0) {
            lastVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeTooltip.setAttribute('data-volume', 0);
        } else {
            audioPlayer.volume = lastVolume;
            volumeSlider.value = lastVolume * 100;
            volumeTooltip.setAttribute('data-volume', Math.round(lastVolume * 100));
        }
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        if (audioPlayer.volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute volume-icon';
        } else if (audioPlayer.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down volume-icon';
        } else {
            volumeIcon.className = 'fas fa-volume-up volume-icon';
        }
    }

    audioPlayer.addEventListener('volumechange', () => {
        volumeSlider.value = audioPlayer.volume * 100;
        const volumePercent = Math.round(audioPlayer.volume * 100);
        volumeTooltip.setAttribute('data-volume', volumePercent);
        updateVolumeIcon();
    });
}

// 封面旋转控制
function controlCoverRotation(isPlaying) {
    if (!currentCover) return;
    if (isPlaying) currentCover.classList.add('playing');
    else currentCover.classList.remove('playing');
}

// 获取音乐数据
async function getMusicData() {
    try {
        playerContainer.innerHTML = `
            <div class="player-loading">
                <i class="fas fa-spinner fa-spin"></i> 正在切换歌曲...
            </div>
        `;

        const response = await fetch(apiUrl);
        const musicData = await response.json();
        if (musicData.code !== 200 || !musicData.url) throw new Error('歌曲数据异常');

        playerContainer.innerHTML = `
            <div class="player-content">
                <img src="${musicData.img}" alt="${musicData.song} 封面" class="player-cover" id="current-cover">
                <div class="player-info">
                    <div class="player-song">${musicData.song}</div>
                    <div class="player-singer">${musicData.singer}</div>
                    <div class="player-control-wrapper">
                        <div class="player-controls">
                            <button id="play-btn" class="player-btn"><i class="fas fa-play"></i></button>
                            <button id="pause-btn" class="player-btn" style="display: none;"><i class="fas fa-pause"></i></button>
                            <button id="next-btn" class="player-btn"><i class="fas fa-step-forward"></i></button>
                        </div>
                        <div class="volume-control">
                            <i id="volume-icon" class="fas fa-volume-up volume-icon"></i>
                            <div class="volume-tooltip">
                                <input type="range" id="volume-slider" min="0" max="100" value="70" class="volume-slider">
                            </div>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-played"></div>
                        <div class="progress-handle"></div>
                    </div>
                    <div class="progress-time">
                        <span class="current-time-text">0:00</span>
                        <span class="total-time-text">0:00</span>
                    </div>
                    <a href="${musicData.link}" target="_blank" class="player-link">
                        <i class="fab fa-napster"></i> 前往网易云音乐查看
                    </a>
                </div>
            </div>
        `;

        currentCover = document.getElementById('current-cover');
        audioPlayer.src = musicData.url;

        // 仅在用户已交互后自动播放
        if (hasUserInteracted) {
            audioPlayer.play().then(() => {
                document.getElementById('play-btn').style.display = 'none';
                document.getElementById('pause-btn').style.display = 'flex';
                controlCoverRotation(true);
            }).catch(() => {});
        }

        initProgressDrag();
        initVolumeControl();

        // 播放按钮
        document.getElementById('play-btn').addEventListener('click', () => {
            hasUserInteracted = true; // 用户首次点击
            audioPlayer.play();
            document.getElementById('play-btn').style.display = 'none';
            document.getElementById('pause-btn').style.display = 'flex';
            controlCoverRotation(true);
        });

        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => {
            audioPlayer.pause();
            document.getElementById('pause-btn').style.display = 'none';
            document.getElementById('play-btn').style.display = 'flex';
            controlCoverRotation(false);
        });

        // 下一曲（自动播放）
        document.getElementById('next-btn').addEventListener('click', () => {
            if (currentCover) currentCover.classList.remove('playing');
            getMusicData();
        });

        // 绑定音频事件
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            document.querySelector('.total-time-text').textContent = formatTime(audioPlayer.duration);
        });
        audioPlayer.addEventListener('ended', () => {
            controlCoverRotation(false);
            getMusicData(); // 自动播放下一首
        });
        audioPlayer.addEventListener('pause', () => controlCoverRotation(false));
        audioPlayer.addEventListener('play', () => controlCoverRotation(true));

    } catch (error) {
        playerContainer.innerHTML = `
            <div class="player-loading" style="color: var(--accent-color);">
                <i class="fas fa-exclamation-circle"></i> 歌曲加载失败：${error.message}
            </div>
        `;
        console.error('音乐获取失败：', error);
    }
}

// 初始化
getMusicData();

});
