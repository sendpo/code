let currentSource = "wyy",
    currentSong = null,
    searchResults = [],
    currentResultIndex = -1,
    searchQuery = "",
    // DOM元素
    searchInput,
    searchBtn,
    sourceBtns,
    resultsSection,
    resultsList,
    resultsCount,
    noResults,
    loading,
    audioPlayer,
    playBtn,
    prevBtn,
    nextBtn,
    progressBar,
    progressSlider,
    currentTimeDisplay,
    totalTimeDisplay,
    volumeBtn,
    volumeBar,
    volumeSlider,
    songTitle,
    songArtist,
    albumCover,
    playerSection;

// 初始化事件监听
function initEventListeners() {
    // 搜索按钮点击
    searchBtn.addEventListener("click", performSearch);
    // 回车键搜索
    searchInput.addEventListener("keypress", e => {
        if (e.key === "Enter") performSearch();
    });
    // 音乐源切换
    sourceBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // 更新按钮样式
            sourceBtns.forEach(b => {
                b.classList.remove("bg-primary", "text-white", "border-primary");
                b.classList.add("bg-white", "text-gray-700", "border-gray-200");
            });
            btn.classList.remove("bg-white", "text-gray-700", "border-gray-200");
            btn.classList.add("bg-primary", "text-white", "border-primary");
            // 切换源并重新搜索（如果有关键词）
            currentSource = btn.dataset.source;
            const query = searchInput.value.trim();
            if (query) performSearch();
        });
    });
    // 播放/暂停
    playBtn.addEventListener("click", togglePlay);
    // 上一曲/下一曲
    prevBtn.addEventListener("click", playPrevious);
    nextBtn.addEventListener("click", playNext);
    // 进度更新
    audioPlayer.addEventListener("timeupdate", updateProgress);
    // 播放结束自动下一曲
    audioPlayer.addEventListener("ended", playNext);
    // 进度条拖动
    progressSlider.addEventListener("input", () => {
        const value = parseInt(progressSlider.value);
        const time = value / 100 * audioPlayer.duration;
        audioPlayer.currentTime = time;
    });
    // 音量调节
    volumeSlider.addEventListener("input", () => {
        const volume = parseInt(volumeSlider.value) / 100;
        audioPlayer.volume = volume;
        volumeBar.style.width = `${100 * volume}%`;
        volumeBtn.innerHTML = volume === 0 
            ? '<i class="fa fa-volume-off"></i>' 
            : '<i class="fa fa-volume-up"></i>';
    });
    // 静音切换
    volumeBtn.addEventListener("click", toggleMute);
}

// 执行搜索
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // 更新状态
    searchInput.focus();
    searchQuery = query;
    loading.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    noResults.classList.add("hidden");
    searchBtn.classList.add("pulse");
    setTimeout(() => searchBtn.classList.remove("pulse"), 2000);

    try {
        // 调用PHP代理
        const proxyUrl = `music_proxy.php?source=${currentSource}&action=search&query=${encodeURIComponent(query)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "搜索失败");
        }
        processSearchResults(data.data);
    } catch (error) {
        console.error("搜索出错:", error);
        loading.classList.add("hidden");
        noResults.classList.remove("hidden");
    }
}

// 处理搜索结果
function processSearchResults(songs) {
    loading.classList.add("hidden");
    if (songs.length === 0) {
        return noResults.classList.remove("hidden");
    }

    // 保存结果并渲染
    searchResults = songs;
    resultsSection.classList.remove("hidden");
    resultsCount.textContent = `${songs.length}首`;
    resultsList.innerHTML = "";

    songs.forEach((song, index) => {
        const songEl = document.createElement("div");
        songEl.className = "music-card rounded-xl p-4 hover:shadow-md transition-shadow";
        songEl.innerHTML = `
            <div class="flex items-center">
                <div class="w-14 h-14 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                    <img src="${song.cover}" alt="${song.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-800 mb-1 line-clamp-1">${song.title}</h3>
                    <p class="text-gray-600 text-sm line-clamp-1">${song.artist}</p>
                </div>
                <button class="play-song-btn p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors mr-2" data-index="${index}">
                    <i class="fa fa-play"></i>
                </button>
                <button class="download-song-btn p-3 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors" data-index="${index}">
                    <i class="fa fa-download"></i>
                </button>
            </div>
        `;
        resultsList.appendChild(songEl);

        // 绑定播放/下载事件
        songEl.querySelector(".play-song-btn").addEventListener("click", () => playSong(index));
        songEl.querySelector(".download-song-btn").addEventListener("click", () => downloadSong(index));
    });
}

// 播放歌曲
async function playSong(index) {
    currentResultIndex = index;
    const song = searchResults[index];
    if (!song) return alert("未找到歌曲信息");

    try {
        // 调用PHP代理获取播放链接
        const proxyUrl = `music_proxy.php?source=${currentSource}&action=getUrl&query=${encodeURIComponent(searchQuery)}&id=${song.id}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "获取播放链接失败");
        }

        // 更新当前歌曲并播放
        currentSong = data.data;
        updatePlayerUI();
        audioPlayer.src = currentSong.url;
        audioPlayer.play();
        playBtn.innerHTML = '<i class="fa fa-pause"></i>';
        document.getElementById("album-cover").classList.add("playing");
    } catch (error) {
        console.error("播放出错:", error);
        alert(`播放失败：${error.message}`);
    }
}

// 下载歌曲
async function downloadSong(index) {
    const song = searchResults[index];
    if (!song) return alert("未找到歌曲信息，无法下载");

    const downloadBtn = document.querySelector(`.download-song-btn[data-index="${index}"]`);
    const originalHtml = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    downloadBtn.disabled = true;

    try {
        // 调用PHP代理获取下载链接
        const proxyUrl = `music_proxy.php?source=${currentSource}&action=getUrl&query=${encodeURIComponent(searchQuery)}&id=${song.id}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "获取下载链接失败");
        }

        // 触发下载
        const { url, title, artist } = data.data;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title} - ${artist}.mp3`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert(`下载已触发：${title}`);
    } catch (error) {
        console.error("下载失败:", error);
        alert(`下载失败：${error.message}`);
    } finally {
        downloadBtn.innerHTML = originalHtml;
        downloadBtn.disabled = false;
    }
}

// 更新播放器UI
function updatePlayerUI() {
    if (!currentSong) return;
    songTitle.textContent = currentSong.title;
    songArtist.textContent = currentSong.artist;
    albumCover.src = currentSong.cover;
    albumCover.alt = currentSong.title;
    // 封面加载失败时用默认图
    albumCover.onerror = function() {
        this.src = "https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg";
    };
    playerSection.classList.remove("translate-y-full");
}

// 播放/暂停切换
function togglePlay() {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.innerHTML = '<i class="fa fa-pause"></i>';
        document.getElementById("album-cover").classList.add("playing");
    } else {
        audioPlayer.pause();
        playBtn.innerHTML = '<i class="fa fa-play"></i>';
        document.getElementById("album-cover").classList.remove("playing");
    }
}

// 上一曲
function playPrevious() {
    if (searchResults.length === 0) return;
    let index = currentResultIndex - 1;
    if (index < 0) index = searchResults.length - 1;
    playSong(index);
}

// 下一曲
function playNext() {
    if (searchResults.length === 0) return;
    let index = currentResultIndex + 1;
    if (index >= searchResults.length) index = 0;
    playSong(index);
}

// 更新进度条
function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    if (isNaN(duration)) return;

    const percent = (currentTime / duration) * 100;
    progressBar.style.width = `${percent}%`;
    progressSlider.value = percent;
    currentTimeDisplay.textContent = formatTime(currentTime);
    totalTimeDisplay.textContent = formatTime(duration);
}

// 格式化时间（秒 -> mm:ss）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// 静音切换
function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    if (audioPlayer.muted) {
        volumeBtn.innerHTML = '<i class="fa fa-volume-off"></i>';
        volumeBar.style.width = "0%";
        volumeSlider.value = 0;
    } else {
        volumeBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
        const volume = audioPlayer.volume;
        volumeBar.style.width = `${100 * volume}%`;
        volumeSlider.value = 100 * volume;
    }
}

// 初始化
function init() {
    // 获取DOM元素
    searchInput = document.getElementById("search-input");
    searchBtn = document.getElementById("search-btn");
    sourceBtns = document.querySelectorAll(".source-btn");
    resultsSection = document.getElementById("results-section");
    resultsList = document.getElementById("results-list");
    resultsCount = document.getElementById("results-count");
    noResults = document.getElementById("no-results");
    loading = document.getElementById("loading");
    audioPlayer = document.getElementById("audio-player");
    playBtn = document.getElementById("play-btn");
    prevBtn = document.getElementById("prev-btn");
    nextBtn = document.getElementById("next-btn");
    progressBar = document.getElementById("progress-bar");
    progressSlider = document.getElementById("progress-slider");
    currentTimeDisplay = document.getElementById("current-time");
    totalTimeDisplay = document.getElementById("total-time");
    volumeBtn = document.getElementById("volume-btn");
    volumeBar = document.getElementById("volume-bar");
    volumeSlider = document.getElementById("volume-slider");
    songTitle = document.getElementById("song-title");
    songArtist = document.getElementById("song-artist");
    albumCover = document.querySelector("#album-cover img");
    playerSection = document.getElementById("player-section");

    // 初始化事件
    initEventListeners();
    // 默认音量75%
    audioPlayer.volume = 0.75;
    volumeBar.style.width = "75%";
    // 默认选中网易云音乐
    sourceBtns[0].classList.add("bg-primary", "text-white", "border-primary");
    sourceBtns[0].classList.remove("bg-white", "text-gray-700", "border-gray-200");
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);