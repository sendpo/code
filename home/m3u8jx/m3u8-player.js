const exampleUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
let art = null;
let isDarkMode = false;
document.getElementById('themeToggle').addEventListener('click', function() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    const icon = this.querySelector('i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon'
});

function createArtplayer(url) {
    if (art) {
        try {
            art.destroy()
        } catch (e) {
            console.error('Error destroying player:', e)
        }
        art = null
    }
    art = new Artplayer({
        container: '#playerContainer',
        url: url,
        type: 'm3u8',
        setting: true,
        autoplay: true,
        aspectRatio: true,
        pip: true,
        fullscreen: true,
        fullscreenWeb: true,
        playbackRate: true,
        plugins: [artplayerPluginHlsControl({
            quality: {
                setting: true,
                getName: (level) => `${level.height}P`,
                title: '清晰度',
                auto: '自动',
            },
            audio: {
                setting: true,
                getName: (track) => track.name,
                title: '音轨',
                auto: '自动',
            },
        }), ],
        customType: {
            m3u8: function(video, url, art) {
                if (Hls.isSupported()) {
                    if (art.hls) art.hls.destroy();
                    const hls = new Hls({
                        maxBufferLength: 30,
                        enableWorker: true,
                        backBufferLength: 30
                    });
                    hls.loadSource(url);
                    hls.attachMedia(video);
                    art.hls = hls;
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        console.log('HLS manifest parsed:', hls.levels);
                        art.notice.show('视频加载成功')
                    });
                    hls.on(Hls.Events.ERROR, function(event, data) {
                        console.warn('HLS error', data);
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    art.notice.show('网络错误，正在重试...');
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    art.notice.show('媒体错误，尝试恢复...');
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    art.notice.show('播放错误，请重试');
                                    break
                            }
                        }
                    })
                } else {
                    video.src = url
                }
            },
        },
    })
}
document.getElementById('loadBtn').addEventListener('click', function() {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
        art && art.notice.show('请输入 m3u8 地址');
        return
    }
    createArtplayer(url)
});
document.getElementById('playExample').addEventListener('click', function() {
    document.getElementById('urlInput').value = exampleUrl;
    createArtplayer(exampleUrl)
});
document.getElementById('urlInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const url = this.value.trim();
        if (url) createArtplayer(url)
    }
});
document.getElementById('urlInput').value = exampleUrl;
createArtplayer(exampleUrl);