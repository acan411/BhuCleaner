/* BHuCleaner — popup 开关
 * 只维护一个 settings 对象，写入 chrome.storage.sync 后 content script 立即生效。
 */
const DEFAULTS = { hideAds: true, widen: true, slimNav: true };
const KEYS = ['hideAds', 'widen', 'slimNav'];
const status = document.getElementById('status');

chrome.storage.sync.get(DEFAULTS, (settings) => {
  KEYS.forEach((key) => {
    document.getElementById(key).checked = !!settings[key];
  });
});

KEYS.forEach((key) => {
  document.getElementById(key).addEventListener('change', (event) => {
    chrome.storage.sync.set({ [key]: event.target.checked }, () => {
      if (chrome.runtime.lastError) {
        status.textContent = '保存失败，请重试';
        return;
      }
      status.textContent = '已保存';
    });
  });
});
