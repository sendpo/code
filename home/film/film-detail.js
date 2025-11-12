let art;
let currentPage = 1;
const pageSize = 30;
let totalPages = 1;
let allEpisodes = [];
let movieData = null; // 存储影片数据，用于重新加载

document.addEventListener("DOMContentLoaded", () => {
  movieData = localStorage.getItem('currentMovie');
  if (!movieData) return showError();
  movieData = JSON.parse(movieData);
  renderMovieDetail(movieData);
  bindCollapseEvents();
  bindRetryEvent();
});

function renderMovieDetail(movie) {
  document.getElementById('moviePoster').src = movie.pic || "https://picsum.photos/400/600?grayscale&blur=2";
  document.getElementById('movieTitle').textContent = movie.name || "未知影片";
  document.getElementById('movieArea').textContent = movie.area || "未知";
  document.getElementById('movieLang').textContent = movie.lang || "未知";
  document.getElementById('movieYear').textContent = movie.year || "未知";
  document.getElementById('movieClass').textContent = movie.type_name || "未知";
  document.getElementById('movieActor').textContent = movie.actor || "未知";
  document.getElementById('movieDirector').textContent = movie.director || "未知";
  document.getElementById('movieScore').textContent = movie.score || "暂无";
  document.getElementById('movieRemarks').textContent = movie.update_info || "未知";
  document.getElementById('movieContent').innerHTML = movie.content || "暂无简介";

  document.title = `${movie.name || '未知影片'} - 影视资源库`;

  const playUrls = parsePlayUrls(movie.play_url);
  renderEpisodeList(playUrls);
  if (playUrls.length > 0) initArtPlayer(playUrls[0].url);

  document.getElementById('movieDetail').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
}

function parsePlayUrls(str) {
  if (!str || str === "0") return [];
  return str.split("#").map((item) => {
    const [name, url] = item.split("$");
    return { name: name || "未知", url };
  });
}

function calculateTotalPages(list) {
  return Math.ceil(list.length / pageSize);
}

function renderPagination() {
  const paginationEl = document.getElementById('pagination');
  paginationEl.innerHTML = '';
  if (totalPages <= 1) return;
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  const prevBtn = document.createElement('button');
  prevBtn.className = `
    px-2 py-1.5 rounded-lg border w-10 text-center text-xs leading-none
    ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'play-btn-hover border-gray-300 text-gray-700'}
  `;
  prevBtn.textContent = '<';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPageEpisodes();
    }
  };
  paginationEl.appendChild(prevBtn);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `
      px-2 py-1.5 rounded-lg border w-20 text-center text-xs leading-none
      ${i === currentPage ? 'episode-active' : 'play-btn-hover border-gray-300 text-gray-700'}
    `;
    pageBtn.textContent = `${(i - 1) * pageSize + 1}-${Math.min(i * pageSize, allEpisodes.length)}`;
    pageBtn.onclick = () => {
      currentPage = i;
      renderCurrentPageEpisodes();
    };
    paginationEl.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = `
    px-2 py-1.5 rounded-lg border w-10 text-center text-xs leading-none
    ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'play-btn-hover border-gray-300 text-gray-700'}
  `;
  nextBtn.textContent = '>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPageEpisodes();
    }
  };
  paginationEl.appendChild(nextBtn);
}

function renderCurrentPageEpisodes() {
  const container = document.getElementById('episodeList');
  container.innerHTML = '';
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, allEpisodes.length);
  const currentEpisodes = allEpisodes.slice(startIndex, endIndex);

  if (!currentEpisodes.length) {
    container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4 text-sm">暂无播放源</div>';
    return;
  }

  currentEpisodes.forEach((episode, index) => {
    const btn = document.createElement('button');
    const globalIndex = startIndex + index;
    btn.className = `play-btn-hover px-2 py-1.5 rounded-lg border text-sm ${globalIndex === 0 ? 'episode-active' : 'border-gray-300 text-gray-700'}`;
    btn.textContent = episode.name;
    btn.onclick = () => {
      document.querySelectorAll('#episodeList button').forEach(b => b.classList.remove('episode-active'));
      btn.classList.add('episode-active');
      setVideo(episode.url);
    };
    container.appendChild(btn);
  });
  renderPagination();
}

function renderEpisodeList(list) {
  allEpisodes = list;
  totalPages = calculateTotalPages(list);
  currentPage = 1;
  renderCurrentPageEpisodes();
}

function initArtPlayer(url) {
  const loadingEl = document.getElementById('videoLoading');
  loadingEl.classList.remove('hidden');

  art = new Artplayer({
    container: "#playerContainer",
    url,
    autoplay: false,
    theme: "#165DFF",
    pip: true,
    fullscreen: true,
    autoSize: false, // 禁用自动缩放
    playbackRate: true,
    setting: true,
    mutex: true,
    fullscreenWeb: true,
    customType: {
      m3u8: (video, url) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          video.src = url;
        }
      },
    },
  });

  art.on("ready", () => loadingEl.classList.add('hidden'));
  art.on("error", () => {
    loadingEl.classList.add('hidden');
    alert('视频加载失败，请尝试其他集数');
  });
}

function setVideo(url) {
  if (!art) initArtPlayer(url);
  else {
    art.switchUrl(url);
    document.getElementById('videoLoading').classList.remove('hidden');
  }
}

function bindCollapseEvents() {
  document.querySelectorAll('.toggle-collapse').forEach(btn => {
    btn.addEventListener('click', function() {
      const target = this.previousElementSibling;
      target.classList.toggle('expanded');
      this.innerHTML = target.classList.contains('expanded')
        ? '<i class="fa fa-angle-up"></i>'
        : '<i class="fa fa-angle-down"></i>';
    });
  });
}

// 绑定重新加载事件
function bindRetryEvent() {
  document.getElementById('retryBtn').addEventListener('click', () => {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    // 重新渲染影片详情
    setTimeout(() => {
      if (movieData) {
        renderMovieDetail(movieData);
      } else {
        showError();
      }
    }, 500);
  });
}

function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('movieDetail').classList.add('hidden');
}