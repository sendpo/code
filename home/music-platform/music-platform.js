let currentSource = "wyy",
    currentSong = null,
    searchResults = [],
    currentResultIndex = -1,
    searchQuery = "",
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
    searchBtn.addEventListener("click", performSearch);

    searchInput.addEventListener("keypress", e => {
        if (e.key === "Enter") performSearch();
    });

    sourceBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            sourceBtns.forEach(b => {
                b.classList.remove("bg-primary", "text-white", "border-primary");
                b.classList.add("bg-white", "text-gray-700", "border-gray-200");
            });

            btn.classList.remove("bg-white", "text-gray-700", "border-gray-200");
            btn.classList.add("bg-primary", "text-white", "border-primary");

            currentSource = btn.dataset.source;
            const query = searchInput.value.trim();
            if (query) performSearch();
        });
    });

    playBtn.addEventListener("click", togglePlay);
    prevBtn.addEventListener("click", playPrevious);
    nextBtn.addEventListener("click", playNext);

    audioPlayer.addEventListener("timeupdate", updateProgress);
    audioPlayer.addEventListener("ended", playNext);

    progressSlider.addEventListener("input", () => {
        const v = parseInt(progressSlider.value);
        audioPlayer.currentTime = (v / 100) * audioPlayer.duration;
    });

    volumeSlider.addEventListener("input", () => {
        const volume = parseInt(volumeSlider.value) / 100;
        audioPlayer.volume = volume;
        volumeBar.style.width = `${volume * 100}%`;
        volumeBtn.innerHTML = volume === 0
            ? '<i class="fa fa-volume-off"></i>'
            : '<i class="fa fa-volume-up"></i>';
    });

    volumeBtn.addEventListener("click", toggleMute);
}


// 执行搜索
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    searchQuery = query;
    loading.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    noResults.classList.add("hidden");

    searchBtn.classList.add("pulse");
    setTimeout(() => searchBtn.classList.remove("pulse"), 2000);

    try {
        // 🔥 替换为真实搜索接口
        const proxyUrl =
            `http://movieapi.sendpo.cn/music/music_search.php?source=${currentSource}&action=search&query=${encodeURIComponent(query)}`;

        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "搜索失败");

        processSearchResults(data.data);

    } catch (error) {
        console.error("搜索错误:", error);
        loading.classList.add("hidden");
        noResults.classList.remove("hidden");
    }
}


// 渲染搜索结果
function processSearchResults(songs) {
    loading.classList.add("hidden");

    if (!songs || songs.length === 0) {
        noResults.classList.remove("hidden");
        return;
    }

    searchResults = songs;

    resultsSection.classList.remove("hidden");
    resultsCount.textContent = `${songs.length}首`;
    resultsList.innerHTML = "";

    songs.forEach((song, index) => {
        const el = document.createElement("div");
        el.className = "music-card rounded-xl p-4 hover:shadow-md transition-shadow";
        el.innerHTML = `
            <div class="flex items-center">
                <div class="w-14 h-14 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                    <img src="${song.cover}" class="w-full h-full object-cover">
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
        resultsList.appendChild(el);

        el.querySelector(".play-song-btn").addEventListener("click", () => playSong(index));
        el.querySelector(".download-song-btn").addEventListener("click", () => downloadSong(index));
    });
}


// 播放歌曲
async function playSong(index) {
    currentResultIndex = index;
    const song = searchResults[index];
    if (!song) return alert("未找到歌曲信息");

    try {
        // 🔥 使用你提供的真实 getUrl 结构
        const proxyUrl =
            `http://movieapi.sendpo.cn/music/music_search.php?source=migu&action=getUrl&query=${encodeURIComponent(searchQuery)}&n=1`;

        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "播放链接获取失败");

        currentSong = data.data;

        updatePlayerUI();

        audioPlayer.src = currentSong.url;
        audioPlayer.play();
        playBtn.innerHTML = '<i class="fa fa-pause"></i>';
        document.getElementById("album-cover").classList.add("playing");

    } catch (e) {
        console.error(e);
        alert("播放失败：" + e.message);
    }
}


// 下载歌曲
async function downloadSong(index) {
    const song = searchResults[index];
    if (!song) return;

    const btn = document.querySelector(`.download-song-btn[data-index="${index}"]`);
    const old = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const proxyUrl =
            `http://movieapi.sendpo.cn/music/music_search.php?source=migu&action=getUrl&query=${encodeURIComponent(searchQuery)}&n=1`;

        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        const { url, title, artist } = data.data;

        const a = document.createElement("a");
        a.href = url;
        a.download = `${title} - ${artist}.mp3`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (e) {
        alert("下载失败：" + e.message);
    } finally {
        btn.innerHTML = old;
        btn.disabled = false;
    }
}


// 更新播放器 UI
function updatePlayerUI() {
    if (!currentSong) return;

    songTitle.textContent = currentSong.title;
    songArtist.textContent = currentSong.artist;

    albumCover.src = currentSong.cover;
    albumCover.onerror = function () {
        this.src = "https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg";
    };

    playerSection.classList.remove("translate-y-full");
}


// 播放 / 暂停
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


function playPrevious() {
    if (!searchResults.length) return;
    let i = currentResultIndex - 1;
    if (i < 0) i = searchResults.length - 1;
    playSong(i);
}

function playNext() {
    if (!searchResults.length) return;
    let i = currentResultIndex + 1;
    if (i >= searchResults.length) i = 0;
    playSong(i);
}


// 进度条更新
function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    if (isNaN(duration)) return;

    const p = (currentTime / duration) * 100;
    progressBar.style.width = `${p}%`;
    progressSlider.value = p;

    currentTimeDisplay.textContent = formatTime(currentTime);
    totalTimeDisplay.textContent = formatTime(duration);
}


// 格式化 mm:ss
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}


// 静音切换
function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    if (audioPlayer.muted) {
        volumeBtn.innerHTML = '<i class="fa fa-volume-off"></i>';
        volumeBar.style.width = "0%";
        volumeSlider.value = 0;
    } else {
        const v = audioPlayer.volume;
        volumeBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
        volumeBar.style.width = `${v * 100}%`;
        volumeSlider.value = v * 100;
    }
}


// 初始化
function init() {
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

    initEventListeners();

    audioPlayer.volume = 0.75;
    volumeBar.style.width = "75%";

    sourceBtns[0].classList.add("bg-primary", "text-white", "border-primary");
}

document.addEventListener("DOMContentLoaded", init);
