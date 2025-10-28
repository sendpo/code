const apiNames = ["Playm3u8解析", "PlayerJY解析", "m1907解析", "咸鱼云解析", "虾米解析", "夜幕解析", "8090g解析"];
const encodedApis = ["aHR0cHM6Ly93d3cucGxheW0zdTguY24vamlleGkucGhwP3VybD0=", "aHR0cHM6Ly9qeC5haWRvdWVyLm5ldC8/dXJsPQ==", "aHR0cHM6Ly96MS5tMTkwNy5jbi8/ang9", "aHR0cHM6Ly9qeC54eW1wNC5jYy8/dXJsPQ==", "aHR0cHM6Ly9qeC54bWZsdi5jb20vP3VybD0=", "aHR0cHM6Ly93d3cueWVtdS54eXovP3VybD0=", "aHR0cHM6Ly9qeC44MDkwZy5jb20vP3VybD0="];

function populateApis() {
    const sel = document.getElementById('api');
    sel.innerHTML = '';
    for (let i = 0; i < encodedApis.length; i++) {
        try {
            const decoded = atob(encodedApis[i]);
            const opt = document.createElement('option');
            opt.value = decoded;
            opt.textContent = apiNames[i] || decoded;
            sel.appendChild(opt)
        } catch (e) {
            console.warn('api decode failed for index', i, e)
        }
    }
}

function play() {
    const input = document.getElementById('url');
    const apiSelect = document.getElementById('api');
    const iframe = document.getElementById('player');
    const loading = document.getElementById('loading');
    let vidUrl = input.value.trim();
    if (!vidUrl) {
        alert('请输入视频页面或视频链接');
        input.focus();
        return
    }
    const apiBase = apiSelect.value || apiSelect.options[0] ? .value;
    if (!apiBase) {
        alert('未找到可用解析接口');
        return
    }
    const target = apiBase + encodeURIComponent(vidUrl);
    loading.classList.add('active');
    iframe.src = target;
    iframe.onload = function() {
        setTimeout(() => loading.classList.remove('active'), 400)
    };
    const timeoutId = setTimeout(() => {
        loading.classList.remove('active');
        console.info('iframe load timeout — 若页面没有显示，请尝试在新窗口打开：', target)
    }, 12000);
    iframe.addEventListener('load', () => clearTimeout(timeoutId), {
        once: true
    })
}
document.addEventListener('DOMContentLoaded', () => {
    populateApis();
    const input = document.getElementById('url');
    const btn = document.getElementById('playBtn');
    btn.addEventListener('click', play);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') play()
    });
    input.focus()
});