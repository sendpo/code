window.addEventListener('load', function () {
    const audioPlayer = document.getElementById('audio-player');
    const playerContainer = document.getElementById('player-container');
    const apiUrl = 'https://www.hhlqilongzhu.cn/api/wangyi_hot_review.php';
    let currentCover = null;
    let hasUserInteracted = false;

    async function getMusicData() {
        try {
            playerContainer.innerHTML = `<div class="player-loading"><i class="fas fa-spinner fa-spin"></i> 正在切换歌曲...</div>`;
            const response = await fetch(apiUrl);
            const musicData = await response.json();
            if (musicData.code !== 200 || !musicData.url) throw new Error('歌曲数据异常');

            playerContainer.innerHTML = `
                <div class="player-content">
                    <img src="${musicData.img}" alt="${musicData.song}" class="player-cover" id="current-cover">
                    <div class="player-info">
                        <div class="player-song">${musicData.song}</div>
                        <div class="player-singer">${musicData.singer}</div>
                        <div class="player-control-wrapper">
                            <div class="player-controls">
                                <button id="play-btn" class="player-btn"><i class="fas fa-play"></i></button>
                                <button id="pause-btn" class="player-btn" style="display: none;"><i class="fas fa-pause"></i></button>
                                <button id="next-btn" class="player-btn"><i class="fas fa-step-forward"></i></button>
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

            if (hasUserInteracted) {
                audioPlayer.play().catch(() => {});
            }

            initProgressDrag();

            document.getElementById('play-btn').onclick = () => {
                hasUserInteracted = true;
                audioPlayer.play();
                document.getElementById('play-btn').style.display = 'none';
                document.getElementById('pause-btn').style.display = 'flex';
            };
            document.getElementById('pause-btn').onclick = () => {
                audioPlayer.pause();
                document.getElementById('pause-btn').style.display = 'none';
                document.getElementById('play-btn').style.display = 'flex';
            };
            document.getElementById('next-btn').onclick = getMusicData;

        } catch (e) {
            playerContainer.innerHTML = `<div class="player-loading" style="color: var(--accent-color);"><i class="fas fa-exclamation-circle"></i> 歌曲加载失败：${e.message}</div>`;
        }
    }

    // ✅ 事件仅绑定一次
    audioPlayer.addEventListener('ended', () => {
        getMusicData(); // 自动播放下一首
    });
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.querySelector('.total-time-text').textContent = formatTime(audioPlayer.duration);
    });

    // 初始化
    getMusicData();
});
