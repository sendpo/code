// 全局变量
const API_KEY = 'DragonB5F24B43758599D5EA11384E7AECEEF7';
const API_BASE_URLS = {
  wyy: 'https://sdkapi.hhlqilongzhu.cn/api/dgMusic_wyy/',
  qq: 'https://sdkapi.hhlqilongzhu.cn/api/QQmusic/',
  kugou: 'https://sdkapi.hhlqilongzhu.cn/api/dgMusic_kugou/',
  kuwo: 'https://sdkapi.hhlqilongzhu.cn/api/dgMusic_kuwo/',
  migu: 'https://sdkapi.hhlqilongzhu.cn/api/dgMusic_migu/'
};
let currentSource = 'wyy';
let currentSong = null;
let searchResults = [];
let currentResultIndex = -1;
let searchQuery = ''; // 保存当前搜索关键词

// DOM元素（页面加载完成后获取）
let searchInput, searchBtn, sourceBtns, resultsSection, resultsList, resultsCount;
let noResults, loading, audioPlayer, playBtn, prevBtn, nextBtn, progressBar;
let progressSlider, currentTimeDisplay, totalTimeDisplay, volumeBtn, volumeBar;
let volumeSlider, songTitle, songArtist, albumCover, playerSection;

// 初始化事件监听
function initEventListeners() {
  // 搜索按钮点击
  searchBtn.addEventListener('click', performSearch);
  
  // 回车键搜索
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // 音乐源选择（含切换自动搜索逻辑）
  sourceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 更新按钮样式
      sourceBtns.forEach(b => {
        b.classList.remove('bg-primary', 'text-white', 'border-primary');
        b.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
      });
      btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
      btn.classList.add('bg-primary', 'text-white', 'border-primary');
      
      // 更新当前音乐源
      currentSource = btn.dataset.source;
      
      // 自动发起搜索（输入框有非空关键词时）
      const query = searchInput.value.trim();
      if (query) {
        performSearch();
      }
    });
  });
  
  // 播放/暂停按钮
  playBtn.addEventListener('click', togglePlay);
  
  // 上一曲/下一曲
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  
  // 音频进度更新
  audioPlayer.addEventListener('timeupdate', updateProgress);
  
  // 音频结束时自动播放下一曲
  audioPlayer.addEventListener('ended', playNext);
  
  // 进度条控制
  progressSlider.addEventListener('input', () => {
    const progress = parseInt(progressSlider.value);
    const currentTime = (progress / 100) * audioPlayer.duration;
    audioPlayer.currentTime = currentTime;
  });
  
  // 音量控制
  volumeSlider.addEventListener('input', () => {
    const volume = parseInt(volumeSlider.value) / 100;
    audioPlayer.volume = volume;
    volumeBar.style.width = `${volume * 100}%`;
    
    if (volume === 0) {
      volumeBtn.innerHTML = '<i class="fa fa-volume-off"></i>';
    } else {
      volumeBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
    }
  });
  
  // 静音按钮
  volumeBtn.addEventListener('click', toggleMute);
}

// 执行搜索（含输入框焦点管理）
async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  
  // 搜索后保持输入框焦点
  searchInput.focus();
  
  // 保存搜索关键词
  searchQuery = query;
  
  // 显示加载状态
  loading.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  noResults.classList.add('hidden');
  
  // 添加搜索按钮动画
  searchBtn.classList.add('pulse');
  setTimeout(() => {
    searchBtn.classList.remove('pulse');
  }, 2000);
  
  try {
    // 构建API URL
    const baseUrl = API_BASE_URLS[currentSource];
    const params = new URLSearchParams({
      key: API_KEY,
      type: 'json'
    });
    
    // 网易云使用gm参数，其他使用msg参数
    if (currentSource === 'wyy') {
      params.append('gm', query);
    } else {
      params.append('msg', query);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    // 发起请求
    const response = await fetch(url);
    const data = await response.json();
    
    // 处理搜索结果
    processSearchResults(data.data || []);
  } catch (error) {
    console.error('搜索出错:', error);
    loading.classList.add('hidden');
    noResults.classList.remove('hidden');
  }
}

// 处理搜索结果（含下载按钮）
function processSearchResults(results) {
  loading.classList.add('hidden');
  
  if (results.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  
  // 保存搜索结果
  searchResults = results;
  
  // 显示结果区域
  resultsSection.classList.remove('hidden');
  resultsCount.textContent = `${results.length}首`;
  resultsList.innerHTML = '';
  
  // 生成结果列表
  results.forEach((item, index) => {
    // 根据不同音乐源解析数据
    let title, singer, cover;
    switch(currentSource) {
      case 'wyy':
      case 'kugou':
      case 'migu':
        title = item.title;
        singer = item.singer;
        cover = item.cover || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        break;
      case 'kuwo':
        title = item.songname;
        singer = item.singer;
        cover = item.pic || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        if(cover && !cover.startsWith('http')) cover = `https://${cover}`;
        break;
      case 'qq':
        title = item.song_title;
        singer = item.song_singer;
        cover = item.song_pic || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        if(cover && !cover.startsWith('http')) cover = `https://${cover}`;
        break;
    }
    
    // 创建结果项
    const resultItem = document.createElement('div');
    resultItem.className = 'music-card rounded-xl p-4';
    resultItem.innerHTML = `
      <div class="flex items-center">
        <div class="w-14 h-14 rounded-lg overflow-hidden mr-4 flex-shrink-0">
          <img src="${cover}" alt="${title}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-800 mb-1 line-clamp-1">${title}</h3>
          <p class="text-gray-600 text-sm line-clamp-1">${singer}</p>
        </div>
        <!-- 播放按钮 -->
        <button class="play-song-btn p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors mr-2" 
                data-index="${index}">
          <i class="fa fa-play play-icon"></i>
        </button>
        <!-- 下载按钮 -->
        <button class="download-song-btn p-3 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors" 
                data-index="${index}">
          <i class="fa fa-download"></i>
        </button>
      </div>
    `;
    
    resultsList.appendChild(resultItem);
    
    // 播放事件绑定
    resultItem.querySelector('.play-song-btn').addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      playSong(index);
    });
    
    // 下载事件绑定
    resultItem.querySelector('.download-song-btn').addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      downloadSong(index);
    });
  });
}

// 播放歌曲
async function playSong(index) {
  currentResultIndex = index;
  const song = searchResults[index];
  
  if (!song) {
    alert('未找到歌曲信息');
    return;
  }
  
  try {
    // 构建播放API URL
    const baseUrl = API_BASE_URLS[currentSource];
    const params = new URLSearchParams({
      key: API_KEY,
      type: 'json',
      n: song.n || song.song_mid || song.id || ''
    });
    
    // 适配不同音乐源参数
    if (currentSource === 'wyy') {
      params.append('gm', searchQuery);
    } else {
      params.append('msg', searchQuery);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    // 发起请求
    const response = await fetch(url);
    const data = await response.json();
    
    // 解析播放数据
    let songData, musicUrl, coverUrl;
    switch(currentSource) {
      case 'wyy':
      case 'kugou':
      case 'migu':
        songData = data;
        musicUrl = songData.music_url;
        coverUrl = songData.cover || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        break;
      case 'kuwo':
        songData = data;
        musicUrl = songData.flac_url || songData.mp3_url;
        coverUrl = songData.cover || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        break;
      case 'qq':
        songData = data.data;
        musicUrl = songData.music_url;
        coverUrl = songData.cover || 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
        break;
    }
    
    if (!musicUrl) {
      alert('无法获取播放链接');
      return;
    }
    
    // 更新当前歌曲信息
    currentSong = {
      title: getSongTitle(songData),
      artist: getSongArtist(songData),
      cover: coverUrl,
      url: musicUrl
    };
    
    // 更新UI
    updatePlayerUI();
    
    // 播放音乐
    audioPlayer.src = currentSong.url;
    audioPlayer.play();
    playBtn.innerHTML = '<i class="fa fa-pause"></i>';
    
    // 添加旋转动画
    document.getElementById('album-cover').classList.add('playing');
    
  } catch (error) {
    console.error('播放出错:', error);
    alert('播放失败，请尝试其他歌曲');
  }
}

// 下载歌曲函数
async function downloadSong(index) {
  const song = searchResults[index];
  if (!song) {
    alert('未找到歌曲信息，无法下载');
    return;
  }

  // 显示下载中状态
  const downloadBtn = document.querySelector(`.download-song-btn[data-index="${index}"]`);
  const originalHtml = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
  downloadBtn.disabled = true;

  try {
    // 构建下载API URL
    const baseUrl = API_BASE_URLS[currentSource];
    const params = new URLSearchParams({
      key: API_KEY,
      type: 'json',
      n: song.n || song.song_mid || song.id || ''
    });

    // 适配不同音乐源参数
    if (currentSource === 'wyy') {
      params.append('gm', searchQuery);
    } else {
      params.append('msg', searchQuery);
    }

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    // 解析下载链接
    let downloadUrl, songTitle, songArtist;
    switch(currentSource) {
      case 'wyy':
      case 'kugou':
      case 'migu':
        downloadUrl = data.music_url;
        songTitle = data.title;
        songArtist = data.singer;
        break;
      case 'kuwo':
        downloadUrl = data.flac_url || data.mp3_url;
        songTitle = data.song_name;
        songArtist = data.song_singer;
        break;
      case 'qq':
        downloadUrl = data.data?.music_url;
        songTitle = data.data?.song_name;
        songArtist = data.data?.song_singer;
        break;
    }

    // 校验下载链接
    if (!downloadUrl || downloadUrl.includes('null') || !downloadUrl.startsWith('http')) {
      throw new Error('无法获取有效下载链接，该歌曲可能受版权保护');
    }

    // 触发浏览器下载
    const aTag = document.createElement('a');
    aTag.href = downloadUrl;
    aTag.download = `${songTitle || '未知歌曲'} - ${songArtist || '未知歌手'}.mp3`;
    aTag.style.display = 'none';
    document.body.appendChild(aTag);
    aTag.click();
    document.body.removeChild(aTag);

    alert(`下载已触发：${songTitle || '未知歌曲'}`);

  } catch (error) {
    console.error('下载失败:', error);
    alert(`下载失败：${error.message}`);
  } finally {
    // 恢复下载按钮状态
    downloadBtn.innerHTML = originalHtml;
    downloadBtn.disabled = false;
  }
}

// 获取歌曲标题
function getSongTitle(songData) {
  switch(currentSource) {
    case 'wyy':
    case 'kugou':
    case 'migu':
      return songData.title;
    case 'kuwo':
      return songData.song_name;
    case 'qq':
      return songData.song_name;
    default:
      return '未知歌曲';
  }
}

// 获取歌曲歌手
function getSongArtist(songData) {
  switch(currentSource) {
    case 'wyy':
    case 'kugou':
    case 'migu':
      return songData.singer;
    case 'kuwo':
      return songData.song_singer;
    case 'qq':
      return songData.song_singer;
    default:
      return '未知艺术家';
  }
}

// 更新播放器UI
function updatePlayerUI() {
  if (!currentSong) return;
  
  songTitle.textContent = currentSong.title;
  songArtist.textContent = currentSong.artist;
  
  albumCover.src = currentSong.cover;
  albumCover.alt = currentSong.title;
  albumCover.onerror = function() {
    this.src = 'https://p.sda1.dev/28/c198cf6d1b1a8ba794af07cdaf330d18/music.jpg';
  };
  
  // 显示播放器
  playerSection.classList.remove('translate-y-full');
}

// 切换播放/暂停
function togglePlay() {
  if (!audioPlayer.src) return;
  
  if (audioPlayer.paused) {
    audioPlayer.play();
    playBtn.innerHTML = '<i class="fa fa-pause"></i>';
    document.getElementById('album-cover').classList.add('playing');
  } else {
    audioPlayer.pause();
    playBtn.innerHTML = '<i class="fa fa-play"></i>';
    document.getElementById('album-cover').classList.remove('playing');
  }
}

// 播放上一曲
function playPrevious() {
  if (searchResults.length === 0) return;
  
  let index = currentResultIndex - 1;
  if (index < 0) index = searchResults.length - 1;
  
  playSong(index);
}

// 播放下一曲
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
  
  // 更新进度条
  const progress = (currentTime / duration) * 100;
  progressBar.style.width = `${progress}%`;
  progressSlider.value = progress;
  
  // 更新时间显示
  currentTimeDisplay.textContent = formatTime(currentTime);
  totalTimeDisplay.textContent = formatTime(duration);
}

// 格式化时间（秒 -> mm:ss）
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 切换静音
function toggleMute() {
  audioPlayer.muted = !audioPlayer.muted;
  
  if (audioPlayer.muted) {
    volumeBtn.innerHTML = '<i class="fa fa-volume-off"></i>';
    volumeBar.style.width = '0%';
    volumeSlider.value = 0;
  } else {
    volumeBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
    volumeBar.style.width = `${audioPlayer.volume * 100}%`;
    volumeSlider.value = audioPlayer.volume * 100;
  }
}

// 初始化（页面加载完成后执行）
function init() {
  // 获取DOM元素
  searchInput = document.getElementById('search-input');
  searchBtn = document.getElementById('search-btn');
  sourceBtns = document.querySelectorAll('.source-btn');
  resultsSection = document.getElementById('results-section');
  resultsList = document.getElementById('results-list');
  resultsCount = document.getElementById('results-count');
  noResults = document.getElementById('no-results');
  loading = document.getElementById('loading');
  audioPlayer = document.getElementById('audio-player');
  playBtn = document.getElementById('play-btn');
  prevBtn = document.getElementById('prev-btn');
  nextBtn = document.getElementById('next-btn');
  progressBar = document.getElementById('progress-bar');
  progressSlider = document.getElementById('progress-slider');
  currentTimeDisplay = document.getElementById('current-time');
  totalTimeDisplay = document.getElementById('total-time');
  volumeBtn = document.getElementById('volume-btn');
  volumeBar = document.getElementById('volume-bar');
  volumeSlider = document.getElementById('volume-slider');
  songTitle = document.getElementById('song-title');
  songArtist = document.getElementById('song-artist');
  albumCover = document.querySelector('#album-cover img');
  playerSection = document.getElementById('player-section');
  
  // 初始化事件监听
  initEventListeners();
  
  // 设置初始音量
  audioPlayer.volume = 0.75;
  volumeBar.style.width = '75%';
  
  // 设置默认选中的音乐源
  sourceBtns[0].classList.add('bg-primary', 'text-white', 'border-primary');
  sourceBtns[0].classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);