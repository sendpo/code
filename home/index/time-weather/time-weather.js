// 页面加载完成后执行时间与天气逻辑
window.addEventListener('load', function () {
    // 1. 实时更新时间显示
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN');
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        document.getElementById('current-time').textContent = timeStr;
        document.getElementById('current-date').textContent = dateStr;
    }
    updateTime(); // 初始执行一次
    setInterval(updateTime, 1000); // 每秒更新一次

    // 2. 获取并显示天气（使用第三方API）
    async function getWeather() {
        // API密钥（实际项目建议替换为自己的密钥）
        const amap_key = "6d15c068d27df6c6db96b8dad0184362";
        const mxnzp_app_id = "gopqiqfgjtpiyfeh";
        const mxnzp_app_secret = "cngzTkhrTXdxTStySWphY0ZuM2FtQT09";

        try {
            // 第一步：通过IP获取城市ID
            const ipRes = await fetch(`https://www.mxnzp.com/api/ip/self?app_id=${mxnzp_app_id}&app_secret=${mxnzp_app_secret}`);
            const ipData = await ipRes.json();
            if (ipData.code !== 1) throw new Error("定位失败");

            // 第二步：通过城市ID获取天气
            const cityCode = ipData.data.cityId;
            const weaRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${amap_key}&city=${cityCode}&extensions=base`);
            const weaData = await weaRes.json();

            if (weaData.status !== "1" || !weaData.lives?.length) throw new Error("天气接口错误");
            const weather = weaData.lives[0];
            // 渲染天气信息
            document.getElementById("weather-text").innerHTML =
                `${weather.province} ${weather.city} ${weather.weather}，${weather.temperature}°C　${weather.winddirection}${weather.windpower}级　湿度${weather.humidity}%`;
        } catch (err) {
            console.error("天气获取失败：", err);
            document.getElementById("weather-text").textContent = "天气获取失败";
        }
    }
    getWeather(); // 初始执行一次
    setInterval(getWeather, 10 * 60 * 1000); // 每10分钟更新一次
});