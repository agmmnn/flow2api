const DEFAULTS = {
  routeKey: "",
  clientLabel: "",
  serverUrl: "ws://127.0.0.1:8000/captcha_ws"
};

function $(id) {
  return document.getElementById(id);
}

function showStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message;
  status.style.color = isError ? "#b91c1c" : "#065f46";
}

function loadSettings() {
  chrome.storage.local.get(DEFAULTS, (stored) => {
    $("routeKey").value = stored.routeKey || "";
    $("clientLabel").value = stored.clientLabel || "";
    $("serverUrl").value = stored.serverUrl || DEFAULTS.serverUrl;
  });
}

function saveSettings() {
  const routeKey = $("routeKey").value.trim();
  const clientLabel = $("clientLabel").value.trim();
  const serverUrl = $("serverUrl").value.trim() || DEFAULTS.serverUrl;

  if (!serverUrl.startsWith("ws://") && !serverUrl.startsWith("wss://")) {
    showStatus("WebSocket URL 必须以 ws:// 或 wss:// 开头", true);
    return;
  }

  chrome.storage.local.set({ routeKey, clientLabel, serverUrl }, () => {
    if (chrome.runtime.lastError) {
      showStatus(chrome.runtime.lastError.message || "保存失败", true);
      return;
    }
    showStatus("已保存，后台连接会自动重连");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  $("saveBtn").addEventListener("click", saveSettings);
});
