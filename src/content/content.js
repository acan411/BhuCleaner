/* BHuCleaner — 知乎页面逻辑
 * 1) 读取设置，把开关属性写到 <html>，CSS 负责实际样式
 * 2) 设置变更时实时同步，无需刷新
 * 3) 观察动态插入的节点，给广告卡片补标记（CSS 无法处理"父容器含广告"的场景）
 */
(() => {
  'use strict';

  const DEFAULTS = { hideAds: true, widen: true, slimNav: true };
  const ATTR_HIDE = 'data-zc-hide-ads';
  const ATTR_WIDEN = 'data-zc-widen';
  const ATTR_SLIM = 'data-zc-slim-nav';
  const MARK = 'data-zc-hidden';

  // 能判定为广告的"信号"节点
  const AD_SIGNAL =
    '[data-za-module="AdItem"],[data-za-detail-view-path="广告"],[data-ad-id],' +
    '[class*="advert" i],[class*="sponsor" i]';

  // 需要整体隐藏的宿主容器
  const AD_HOST =
    '.TopstoryItem,.Card,.KfeCollection,[data-za-module],[class*="PcTopFeedBanner" i]';

  // 直接移除的广告容器：隐藏后仍占位的横幅
  const AD_REMOVE = '[class*="PcTopFeedBanner" i]';

  // 右侧栏容器：滚动后内联 position 会变，必须用类名而不是样式定位
  const SIDEBAR = '.css-18888ld,[class*="GlobalSideBar" i]';

  const html = document.documentElement;
  const pending = new Set();
  let timer = 0;

  function markNode(el) {
    const host = el.closest(AD_HOST) || el;
    if (host.getAttribute(MARK) !== '1') host.setAttribute(MARK, '1');
  }

  function markAds(scope) {
    if (!(scope instanceof Element) && scope !== document) return;
    if (!html.hasAttribute(ATTR_HIDE)) return;
    if (scope instanceof Element && scope.matches(AD_SIGNAL)) markNode(scope);
    scope.querySelectorAll(AD_SIGNAL).forEach(markNode);
  }

  function clearMarks() {
    document.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
  }

  // 直接删除广告容器，避免留下占位空白
  function removeAds(scope) {
    if (!html.hasAttribute(ATTR_HIDE)) return;
    if (!(scope instanceof Element) && scope !== document) return;
    if (scope instanceof Element && scope.matches(AD_REMOVE)) scope.remove();
    scope.querySelectorAll(AD_REMOVE).forEach((el) => el.remove());

    // 信息流广告卡：删除包含广告图的整张卡片，而不是只删图片
    scope.querySelectorAll('.AdvertImg').forEach((img) => {
      const host = img.closest('.Card,.TopstoryItem');
      (host || img).remove();
    });
  }

  // 右侧栏整列删除（仅加宽开启时）
  function removeSidebar() {
    if (!html.hasAttribute(ATTR_WIDEN)) return;
    document.querySelectorAll(SIDEBAR).forEach((el) => el.remove());
  }

  function apply(settings) {
    const hideAds = !!settings.hideAds;
    html.toggleAttribute(ATTR_HIDE, hideAds);
    html.toggleAttribute(ATTR_WIDEN, !!settings.widen);
    html.toggleAttribute(ATTR_SLIM, !!settings.slimNav);

    if (hideAds) {
      markAds(document);
      removeAds(document);
    } else {
      clearMarks();
    }
    removeSidebar();
  }

  function flush() {
    timer = 0;
    const nodes = Array.from(pending);
    pending.clear();
    nodes.forEach((node) => {
      markAds(node);
      removeAds(node);
    });
    removeSidebar();
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(flush, 100);
  }

  const observer = new MutationObserver((records) => {
    if (!html.hasAttribute(ATTR_HIDE) && !html.hasAttribute(ATTR_WIDEN)) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) pending.add(node);
      }
    }
    if (pending.size) schedule();
  });

  // 先用默认值同步打属性，避免首帧闪烁；storage 返回后再按真实设置校正
  apply(DEFAULTS);
  observer.observe(document, { childList: true, subtree: true });

  chrome.storage.sync.get(DEFAULTS, apply);

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get(DEFAULTS, apply);
  });
})();
