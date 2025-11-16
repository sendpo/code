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
      // 处理海报
      const posterEl = document.getElementById('moviePoster');
      if (movie.pic) {
        posterEl.src = movie.pic;
        posterEl.style.display = 'block';
      } else {
        posterEl.style.display = 'none';
      }

      // 处理标题
      const titleEl = document.getElementById('movieTitle');
      if (movie.name) {
        titleEl.textContent = movie.name;
        titleEl.style.display = 'block';
        document.title = `${movie.name} - 影视资源库`;
      } else {
        titleEl.style.display = 'none';
        document.title = '影视资源库';
      }

      // 处理地区
      const areaEl = document.getElementById('movieArea');
      const areaContainer = document.getElementById('areaContainer');
      if (movie.area) {
        areaEl.textContent = movie.area;
        areaContainer.style.display = 'block';
      } else {
        areaContainer.style.display = 'none';
      }

      // 处理语言
      const langEl = document.getElementById('movieLang');
      const langContainer = document.getElementById('langContainer');
      if (movie.lang) {
        langEl.textContent = movie.lang;
        langContainer.style.display = 'block';
      } else {
        langContainer.style.display = 'none';
      }

      // 处理年份
      const yearEl = document.getElementById('movieYear');
      const yearContainer = document.getElementById('yearContainer');
      if (movie.year) {
        yearEl.textContent = movie.year;
        yearContainer.style.display = 'block';
      } else {
        yearContainer.style.display = 'none';
      }

      // 处理类型
      const classEl = document.getElementById('movieClass');
      const classContainer = document.getElementById('classContainer');
      if (movie.type_name) {
        classEl.textContent = movie.type_name;
        classContainer.style.display = 'block';
      } else {
        classContainer.style.display = 'none';
      }

      // 处理主演
      const actorEl = document.getElementById('movieActor');
      const actorContainer = document.getElementById('actorContainer');
      if (movie.actor) {
        actorEl.textContent = movie.actor;
        actorContainer.style.display = 'flex';
      } else {
        actorContainer.style.display = 'none';
      }

      // 处理导演
      const directorEl = document.getElementById('movieDirector');
      const directorContainer = document.getElementById('directorContainer');
      if (movie.director) {
        directorEl.textContent = movie.director;
        directorContainer.style.display = 'flex';
      } else {
        directorContainer.style.display = 'none';
      }

      // 处理评分
      const scoreEl = document.getElementById('movieScore');
      const scoreContainer = document.getElementById('scoreContainer');
      if (movie.score) {
        scoreEl.textContent = movie.score;
        scoreContainer.style.display = 'block';
      } else {
        scoreContainer.style.display = 'none';
      }

      // 处理更新信息
      const remarksEl = document.getElementById('movieRemarks');
      const remarksContainer = document.getElementById('remarksContainer');
      if (movie.update_info) {
        remarksEl.textContent = movie.update_info;
        remarksContainer.style.display = 'block';
      } else {
        remarksContainer.style.display = 'none';
      }

      // 处理剧情简介
      const contentEl = document.getElementById('movieContent');
      const contentCard = document.getElementById('contentCard');
      if (movie.content) {
        contentEl.innerHTML = movie.content;
        contentCard.style.display = 'block';
      } else {
        contentCard.style.display = 'none';
      }

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
        btn.addEventListener('click', function () {
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