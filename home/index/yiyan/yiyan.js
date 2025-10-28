// 一言语录逻辑
document.addEventListener("DOMContentLoaded", () => {
  const quoteText = document.getElementById("quote-text");
  const quoteContainer = document.getElementById("quote");
  const apiUrl = "https://www.hhlqilongzhu.cn/api/yiyan.php";

  async function loadQuote() {
    try {
      quoteText.textContent = "加载中...";
      const response = await fetch(apiUrl + "?t=" + Date.now());
      if (!response.ok) throw new Error("请求失败");
      const text = await response.text();
      quoteText.textContent = text.trim() || "获取语录失败。";
    } catch (err) {
      quoteText.textContent = "加载失败，请点击重试。";
      console.error("一言加载错误:", err);
    }
  }

  // 页面加载时获取一次
  loadQuote();

  // 点击刷新语录
  quoteContainer.addEventListener("click", loadQuote);
});
