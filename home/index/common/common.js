// 页面加载完成后执行通用基础逻辑
window.addEventListener('load', function () {
    // 1. 隐藏加载动画
    const loadingBox = document.getElementById('loading-box');
    setTimeout(() => {
        loadingBox.style.opacity = '0';
        setTimeout(() => {
            loadingBox.style.display = 'none';
        }, 500);
    }, 1000);

    // 2. 更新当前年份
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // 3. 卡片通用悬停效果（补充CSS过渡的交互）
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
    });
});