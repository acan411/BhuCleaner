# BHuCleaner

知乎网页版体验优化扩展（Edge / Chromium，Manifest V3）。

主要解决两件事：页面上的浮动广告、滥用位，以及默认内容区太窄不适合宽屏。所有处理只在本机生效，不联网、不上传任何数据。

## 功能

| 开关 | 默认 | 作用 |
| --- | --- | --- |
| 隐藏浮动广告 | 开 | 隐藏/删除信息流广告卡、顶部品牌横幅、盐言作者卡片、右栏广告位 |
| 加宽内容区 | 开 | 删除右侧栏，主栏放宽到 1440px（94vw 上限），小屏自动回退 |
| 精简界面元素 | 开 | 去掉顶部导航入口（专栏/圈子/AI Works/故事）、搜索框、发帖卡片、私信入口；消息与创作中心图标靠右贴近头像 |

实现要点：

- CSS 负责静态样式，JS 负责"父容器含广告"这类 CSS 表达不了的场景；
- 启动时先按默认值同步写入 `html[data-zc-*]` 属性，再读 `chrome.storage.sync` 校正，避免首屏闪烁；
- `MutationObserver` 监听新增节点，100ms 防抖批量处理懒加载内容。

## 目录结构

```
BHuCleaner/
├─ manifest.json            MV3 清单（权限：storage + *.zhihu.com）
├─ icons/                   16/32/48/128 图标
└─ src/
   ├─ content/
   │  ├─ content.css        广告隐藏、加宽、导航精简规则
   │  └─ content.js         属性开关、storage 同步、动态节点清理
   └─ popup/
      ├─ popup.html
      ├─ popup.css
      └─ popup.js
```

## 本地加载调试

1. 打开 `edge://extensions`，开启"开发人员模式"；
2. 点击"加载解压缩的扩展"，选择 `BHuCleaner` 目录；
3. 修改代码后，在扩展页点该扩展的"重新加载"，再对知乎页面按 `Ctrl+F5`；
4. 调试：页面逻辑用目标页 DevTools，popup 右键"检查"单独调试。

> 只刷新页面不会加载新代码，改完必须先重新加载扩展。

## 维护说明

知乎大量使用哈希类名（如 `css-18888ld`、`css-o9g3k`），改版后会失效。定位与修复方式：

1. DevTools 选中失效元素，查看其语义类名优先（`TopstorySideBar`、`WriteArea`、`PcTopFeedBanner` 等较稳定）；
2. 广告相关规则集中在 `content.css` 顶部区块与 `content.js` 的三个常量：`AD_SIGNAL`（广告信号）、`AD_HOST`（宿主容器）、`AD_REMOVE`（整块删除）；
3. 右栏定位在 `content.js` 的 `SIDEBAR`，已改为类名匹配而不是 `position: sticky` 样式匹配。

## 隐私

- 仅申请 `storage` 权限与 `*://*.zhihu.com/*` 主机权限；
- 设置保存在浏览器本地 `chrome.storage.sync`，不发送到任何服务器；
- 不注入远程脚本，不收集页面内容。
