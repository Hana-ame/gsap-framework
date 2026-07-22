// Example: Launcher UI for browsing and selecting examples from the gallery
// NOTE: new example entries go at the END of the APPS array — do not insert in the middle
import { useEffect, useState } from 'react';

interface AppEntry {
  route: string;
  label: string;
  hint: string;
  glyph: string;
  accent: string;
}

const APPS: AppEntry[] = [
  { route: 'screen-size', label: 'Screen Size', hint: 'viewport + device info', glyph: '\u29D6', accent: '#4a6a6a' },
  { route: 'window-mobile', label: 'Window Mobile', hint: 'adaptive stack + confirms', glyph: '\u25EB', accent: '#3a4a6a' },
  { route: 'single', label: 'Single', hint: 'full viewport canvas', glyph: '\u25A3', accent: '#5a3a6a' },
  { route: 'multiple', label: 'Multiple', hint: '2x2 quadrant grid', glyph: '\u229E', accent: '#3a6a5a' },
  { route: 'window', label: 'Window', hint: 'draggable windows + chat', glyph: '\u25A2', accent: '#6a5a3a' },
  { route: 'pixi-confirm', label: 'Pixi Confirm', hint: 'pixi confirm with buttons', glyph: '!', accent: '#4a6a4a' },
  { route: 'component-window', label: 'Component: Window', hint: 'createWindow + 3 drag modes', glyph: '\u25A2', accent: '#6a3a4a' },
  { route: 'component-confirm', label: 'Component: Confirm', hint: 'createConfirm variants', glyph: '?', accent: '#4a3a6a' },
  { route: 'component-image', label: 'Component: Image', hint: 'createLoadingImage + states', glyph: '\u25A3', accent: '#3a5a6a' },
  { route: 'component-loading', label: 'Component: Loading', hint: 'showLoading + custom color', glyph: '\u21BB', accent: '#5a6a3a' },
  { route: 'component-bus', label: 'Component: Bus', hint: 'EventBus pub-sub', glyph: '\u21C4', accent: '#3a6a4a' },
  { route: 'component-scrollable', label: 'Component: Scrollable', hint: 'wheel / drag / touch / scrollbar', glyph: '\u21F5', accent: '#6a4a3a' },
  { route: 'component-clickable-image', label: 'Component: ClickableImage', hint: 'click zoom / double-click / drag pan', glyph: '\u2316', accent: '#3a6a6a' },
  { route: 'component-scrollable-image', label: 'Component: ScrollableImage', hint: 'scrollable gallery + fullscreen viewer', glyph: '\u29C9', accent: '#5a3a5a' },
  { route: 'component-picture-drag', label: 'Component: PictureDrag', hint: 'draggable picture + click position via bus', glyph: '\u29D6', accent: '#4a5a3a' },
  { route: 'component-video-player', label: 'Component: VideoPlayer', hint: '4K video player + controls bar + progress seek', glyph: '\u25B6', accent: '#3a4a6a' },
  { route: 'component-video-player-dom', label: 'Component: VideoPlayer (DOM)', hint: 'native <video controls>, no PIXI, zero bugs', glyph: '\u25A0', accent: '#4a6a4a' },
  { route: 'component-cutscene', label: 'Component: Cutscene', hint: 'click-to-play full-screen video + fade in/out + skip', glyph: '\u29D6', accent: '#6a4a3a' },
  { route: 'component-cutscene-minimal', label: 'Component: Cutscene (Minimal)', hint: 'sanity test: single raw PIXI.App + <video> + Sprite, no SubCanvas', glyph: '\u25CF', accent: '#7a5a4a' },
  { route: 'component-2048', label: 'Component: 2048', hint: 'swipe-to-merge tile game, customizable 3-10 rows/cols', glyph: '2', accent: '#3a5a4a' },
  { route: 'component-conway', label: "Component: Conway's", hint: 'Game of Life: pure PIXI UI, random/clear/step/play, customizable grid + speed', glyph: '\u2756', accent: '#4a3a6a' },
  { route: 'component-avd', label: 'Component: AVD', hint: 'Visual Novel dialogue: textbox + portraits + typewriter + fade in/out + speed + CJK/English + inline images, auto-wrap', glyph: '\u2756', accent: '#3a6a4a' },
  { route: 'component-life-map', label: 'Component: Life Map', hint: 'Conway on big toroidal world, Google-Maps-style mouse-drag panning, click to toggle cell', glyph: '\u29C9', accent: '#3a4a6a' },
  { route: 'component-gsap', label: 'Component: GSAP', hint: 'GSAP animation showcase — box position/scale/rotation/alpha/timeline', glyph: '\u25C7', accent: '#4a6a8a' },
  { route: 'component-infinite', label: 'Component: InfiniteCanvas', hint: 'InfiniteCanvas — chunked grid, drag pan, zoom in/out, decelerate', glyph: '\u2316', accent: '#6a4a6a' },
  { route: 'component-registry', label: 'Component: Factories', hint: 'createWindow / createConfirm / createScrollable — direct factory calls', glyph: '\u229E', accent: '#4a6a5a' },
  { route: 'component-multi-window', label: 'Stress: MultiWindow', hint: '12+ draggable windows — test drag + z-order', glyph: '\u25A6', accent: '#6a4a3a' },
  { route: 'component-window-canvas', label: 'Window + InfiniteCanvas', hint: 'InfiniteCanvas inside a draggable window — SubCanvas nests anything', glyph: '\u25A8', accent: '#3a5a6a' },
  { route: 'component-fullscreen', label: 'Component: Fullscreen', hint: 'FullscreenManager — click/dblclick/drag/close', glyph: '\u2316', accent: '#5a3a6a' },
  { route: 'component-ui-helpers', label: 'Component: UI Helpers', hint: 'makeButton + makeStepper + textPresets', glyph: '\u2699', accent: '#3a6a5a' },
  { route: 'component-text-input', label: 'Component: TextInput', hint: 'canvas text input — text/password/maxLength/placeholder', glyph: '\u270E', accent: '#4a5a6a' },
  { route: 'component-layers', label: 'Component: Layers', hint: 'LayerManager — named layers, z-order, show/hide, alpha, front/back', glyph: '\u25A6', accent: '#5a4a6a' },
  { route: 'component-audio-viz', label: 'Component: Audio Viz', hint: 'audio frequency visualization', glyph: '\u266B', accent: '#6a4a5a' },
  { route: 'component-backend-controlled', label: 'Component: Backend', hint: 'backend-driven UI via MockBackend commands', glyph: '\u21BA', accent: '#3a4a6a' },
  { route: 'component-breakout', label: 'Component: Breakout', hint: 'breakout / arkanoid game', glyph: '\u25A0', accent: '#4a6a3a' },
  { route: 'component-clock', label: 'Component: Clock', hint: 'analog clock with smooth tick', glyph: '\u25CB', accent: '#5a6a4a' },
  { route: 'component-colony', label: 'Component: Colony', hint: 'tile-based colony builder with flora', glyph: '\u2663', accent: '#2a5a2a' },
  { route: 'component-drawing', label: 'Component: Drawing', hint: 'freehand drawing on canvas', glyph: '\u270E', accent: '#5a4a6a' },
  { route: 'component-filters', label: 'Component: Filters', hint: 'PIXI filters showcase — blur, glow, displacement, color matrix', glyph: '\u25C8', accent: '#4a6a8a' },
  { route: 'component-minesweeper', label: 'Component: Minesweeper', hint: 'classic minesweeper game', glyph: '\u2622', accent: '#4a4a3a' },
  { route: 'component-particle-rain', label: 'Component: Particle Rain', hint: 'falling particle system with GSAP', glyph: '\u2601', accent: '#3a6a6a' },
  { route: 'component-snake', label: 'Component: Snake', hint: 'classic snake game, keyboard controls', glyph: '\u25B3', accent: '#3a5a3a' },
  { route: 'component-starfield', label: 'Component: Starfield', hint: 'parallax starfield with mouse tracking', glyph: '\u2605', accent: '#4a4a6a' },
  { route: 'component-tetris', label: 'Component: Tetris', hint: 'classic tetris game, keyboard controls', glyph: '\u25A0', accent: '#5a3a3a' },
  { route: 'component-tutorial', label: 'Component: Tutorial', hint: 'heavily-commented walkthrough: SubCanvas, GSAP, InfiniteCanvas, EventBus, Registry', glyph: '\u2753', accent: '#4a6a6a' },
  { route: 'component-tutorial-ic-br', label: 'Component: Tutorial IC BR', hint: 'tutorial copy with InfiniteCanvas at bottom-right', glyph: '\u2198', accent: '#4a6a6a' },
  { route: 'component-tutorial-gsap-ic', label: 'Component: Tutorial GSAP+IC', hint: 'tutorial variant: full-demo IC, GSAP buttons animate pan/zoom', glyph: '\u25C7', accent: '#4a6a8a' },
  { route: 'component-ic-chunks', label: 'Component: IC Chunks', hint: 'InfiniteCanvas — define per-chunk content (colors/shapes/labels)', glyph: '\u25F0', accent: '#3a6a5a' },
  { route: 'component-typing-effect', label: 'Component: Typing Effect', hint: 'typewriter text animation', glyph: '\u270D', accent: '#4a6a4a' },
  { route: 'component-waves', label: 'Component: Waves', hint: 'interactive waveform visualization', glyph: '\u2248', accent: '#3a6a8a' },
  { route: 'component-demo', label: 'Component: Demo', hint: 'draggable SubCanvas + colored blocks + text + click tint', glyph: '\u25A3', accent: '#4a3a8a' },
  { route: 'component-demo-anywhere', label: 'Component: Demo Anywhere', hint: 'same but dragMode=anywhere — click colored blocks to also drag', glyph: '\u25A3', accent: '#3a6a8a' },
  { route: 'component-wm-adapter', label: 'Component: WM Adapter', hint: 'WindowManagerAdapter — backend window lifecycle', glyph: '\u25A2', accent: '#2a5a6a' },
  { route: 'component-stream-adapter', label: 'Component: Stream Adapter', hint: 'ContentChannelAdapter — streamed chunk assembly', glyph: '\u21C9', accent: '#2a6a5a' },
  { route: 'component-wm-multi', label: 'Component: WM Multi', hint: 'WindowManagerAdapter — 12 backend-driven windows', glyph: '\u25A6', accent: '#2a4a6a' },
  { route: 'component-wm-canvas', label: 'Component: WM Canvas', hint: 'WindowManagerAdapter — InfiniteCanvas inside backend window', glyph: '\u25A8', accent: '#2a6a4a' },
  { route: 'component-ecosystem', label: 'Component: Ecosystem', hint: 'food chain — grass, herbivores, carnivores on infinite canvas', glyph: '\u29C9', accent: '#2a5a3a' },
  { route: 'component-ecosystem-py', label: 'Component: Ecosystem (Python)', hint: 'ecosystem via Python backend + WebSocket', glyph: '\u29C9', accent: '#3a2a6a' },
  { route: 'component-framework-test', label: 'Framework Test', hint: 'verify auto-cleanup, isDragHandle, DirtyPropagator, ZOrder overflow', glyph: '\u2699', accent: '#884422' },
  { route: 'component-avd-choices', label: 'Component: AVD Choices', hint: 'Visual Novel with branching: multi-choice → different endings (3 paths)', glyph: '\u2756', accent: '#1a4a2a' },
  { route: 'component-window-ref', label: 'WindowBorder + LayoutGroup', hint: '参考框架验证：窗口 resize 重绘、LayoutGroup 自动排列、gown.js 模式', glyph: '\u25A8', accent: '#4a7aff' },
  { route: 'component-rts', label: 'RTS (Broken Arrow)', hint: '2-player RTS: select units, right-click move, AI opponent', glyph: '\u2694', accent: '#6a3a2a' },
  { route: 'component-avd-dom-minimal', label: 'AVD DOM 最小示例', hint: '纯 DOM 视觉小说：打字机、分支、GSAP 动画，无 PIXI canvas', glyph: '\u2756', accent: '#1a3a2a' },
  { route: 'component-avd-vn', label: 'VN 中间格式 + InputRemapper', hint: 'KAG→中间JSON→Player + 键盘重映射。演示完整 VN 管线', glyph: '\u29C9', accent: '#2a3a5a' },
  { route: 'img-00-native', label: 'Img 00: Native <img>', hint: '纯原生 HTML Image — 无 PIXI', glyph: '0', accent: '#5a3a4a' },
  { route: 'img-01-canvas2d', label: 'Img 01: Canvas2D', hint: 'HTMLImage → Canvas2D → Texture.from', glyph: '1', accent: '#4a5a3a' },
  { route: 'img-02-image-element', label: 'Img 02: Image Element', hint: 'new Image() → Texture.from(imgElement)', glyph: '2', accent: '#3a5a5a' },
  { route: 'img-03-image-bitmap', label: 'Img 03: ImageBitmap', hint: 'fetch → createImageBitmap → Texture.from', glyph: '3', accent: '#5a4a3a' },
  { route: 'img-04-assets-load', label: 'Img 04: Assets.load', hint: 'PIXI.Assets.load(url) 标准加载', glyph: '4', accent: '#3a4a6a' },
  { route: 'img-05-assets-init', label: 'Img 05: Assets.init+load', hint: '先 init 再 load', glyph: '5', accent: '#4a3a5a' },
  { route: 'img-06-texture-from-cached', label: 'Img 06: Tex.from cached', hint: 'Assets.load → Texture.from 缓存命中', glyph: '6', accent: '#5a5a3a' },
  { route: 'img-07-sprite-from', label: 'Img 07: Sprite.from(url)', hint: 'Sprite.from(url) — 预期失败', glyph: '7', accent: '#6a3a3a' },
  { route: 'img-08-texture-from-raw', label: 'Img 08: Tex.from(raw)', hint: 'Texture.from(url) 直接 — 预期失败', glyph: '8', accent: '#3a6a3a' },
  { route: 'img-09-assets-preload', label: 'Img 09: Assets preload', hint: 'Promise.all → 全部预加载 → 点切换', glyph: '9', accent: '#4a4a6a' },
  { route: 'step-01-dom-text', label: 'Step 01: DomText', hint: '纯 DomText 文字渲染 — 最基本测试', glyph: 'A', accent: '#3a5a6a' },
  { route: 'step-02-dom-dialogue', label: 'Step 02: DomDialogueBox', hint: '对话框背景 + DomText 一次性显示', glyph: '\u2756', accent: '#3a6a5a' },
  { route: 'step-03-dom-typing', label: 'Step 03: DomTypingEngine', hint: '打字机逐字显示', glyph: '\u270D', accent: '#4a6a4a' },
  { route: 'step-04-dom-layer', label: 'Step 04: DomLayer', hint: 'DomLayer 工厂方法创建组件', glyph: '\u25A3', accent: '#4a5a6a' },
  { route: 'step-05-dom-avd', label: 'Step 05: AvdController DOM', hint: 'AvdController 完整 DOM 模式 + 状态推进', glyph: '\u2756', accent: '#1a4a2a' },
  { route: 'step-hd2-01-sprite', label: 'HD2 Step 01: Sprite', hint: '最小：preload + Sprite 显示一张CG', glyph: '1', accent: '#8a4a6a' },
  { route: 'step-hd2-02-subcanvas', label: 'HD2 Step 02: SubCanvas', hint: 'Texture.from + 点击切换多张图片', glyph: '2', accent: '#7a4a5a' },
  { route: 'step-hd2-03-avd-bare', label: 'HD2 Step 03: AVD Bare', hint: 'AVD + Texture.from 更新 Sprite', glyph: '3', accent: '#6a4a6a' },
  { route: 'step-hd2-04-avd-full', label: 'HD2 Step 04: AVD Full', hint: 'AVD + 渐变背景 + CG + backlog', glyph: '4', accent: '#5a4a7a' },
  { route: 'component-avd-hd2', label: 'AVD: HD2 正常位', hint: '城2F：欧派斯基回想(正常位/女仆服)', glyph: '\u2665', accent: '#6a3a4a' },
  { route: 'component-avd-he1', label: 'AVD: HE1 洗脑', hint: 'Bad End 洗脑结局 — 记忆消除・人格改变', glyph: '\u2622', accent: '#4a3a6a' },
  { route: 'component-avd-he2', label: 'AVD: HE2 骑乘位', hint: 'Bad End 续 — 骑乘位・魔力容器', glyph: '\u25C7', accent: '#5a3a5a' },
  { route: 'component-avd-hf1', label: 'AVD: HF1 正常位', hint: '欧派斯基的奴隶结局', glyph: '\u2606', accent: '#3a4a6a' },
  { route: 'component-avd-hg1', label: 'AVD: HG1 乱交', hint: '居民结局 乱交', glyph: '\u2735', accent: '#4a5a3a' },
  { route: 'component-avd-t1', label: 'AVD: T1 自慰', hint: '伊露的自慰场景', glyph: '\u2665', accent: '#5a3a5a' },
  { route: 'component-avd-t21', label: 'AVD: T21 胸揉(通常)', hint: '西区：胸揉(通常服)', glyph: '\u2665', accent: '#5a4a6a' },
  { route: 'component-avd-t22', label: 'AVD: T22 胸揉(色情)', hint: '西区：胸揉(色情服)', glyph: '\u2665', accent: '#5a4a7a' },
  { route: 'component-avd-t22inran', label: 'AVD: T22 胸揉(淫乱)', hint: '西区：胸揉(色情服/淫乱)', glyph: '\u2665', accent: '#5a4a8a' },
  { route: 'component-avd-t3', label: 'AVD: T3 性骚扰', hint: '胸揉+金项圈奴隶契约', glyph: '\u2665', accent: '#5a4a5a' },
  { route: 'component-avd-ha1', label: 'AVD: HA1 自慰1', hint: '旅馆：自慰(通常服)', glyph: '\u2665', accent: '#6a4a5a' },
  { route: 'component-avd-ha2', label: 'AVD: HA2 自慰2', hint: '旅馆：自慰', glyph: '\u2665', accent: '#7a4a5a' },
  { route: 'component-avd-ha3', label: 'AVD: HA3 自慰3', hint: '旅馆：自慰', glyph: '\u2665', accent: '#6a5a4a' },
  { route: 'component-avd-hb1', label: 'AVD: HB1 忠诚自慰1', hint: '忠诚：自慰(通常服)', glyph: '\u2665', accent: '#5a5a4a' },
  { route: 'component-avd-hb2', label: 'AVD: HB2 忠诚自慰2', hint: '忠诚：自慰', glyph: '\u2665', accent: '#5a6a4a' },
  { route: 'component-avd-hbstart', label: 'AVD: HB开始', hint: '忠诚：自慰开始', glyph: '\u2665', accent: '#4a5a5a' },
  { route: 'component-avd-hc1', label: 'AVD: HC1 窥视', hint: '西区：窥视(色情服)', glyph: '\u2665', accent: '#5a5a6a' },
  { route: 'component-avd-hc3', label: 'AVD: HC3 贫乳手交', hint: '西区：乳交口交', glyph: '\u2665', accent: '#4a5a5a' },
  { route: 'component-avd-hd1', label: 'AVD: HD1 贫乳手交', hint: '城2F：欧派斯基回想(口交/女仆服)', glyph: '\u2665', accent: '#5a4a6a' },
  { route: 'component-avd-hd3', label: 'AVD: HD3 骑乘位', hint: '城2F：欧派斯基回想(骑乘位/女仆服)', glyph: '\u2665', accent: '#4a5a6a' },
  // new example entries go here — append to end, do not insert in the middle
  { route: 'step-mc-01-sprite', label: 'MC Step 01: Sprite', hint: 'ex.moonchan.xyz via Vite proxy + Sprite', glyph: 'M', accent: '#4a8a6a' },
  { route: 'step-mc-02-subcanvas', label: 'MC Step 02: SubCanvas', hint: 'ex.moonchan.xyz via proxy + 点击切换全部CG', glyph: 'C', accent: '#4a7a8a' },
  { route: 'step-mc-03-avd-bare', label: 'MC Step 03: AVD Bare', hint: 'ex.moonchan.xyz + AVD bare', glyph: 'B', accent: '#4a6a8a' },
  { route: 'step-mc-04-avd-full', label: 'MC Step 04: AVD Full', hint: 'ex.moonchan.xyz + 渐层背景 + AVD', glyph: 'F', accent: '#4a5a8a' },
  { route: 'step-mc-05-dom', label: 'MC Step 05: DOM Image', hint: '纯 DOM <img> 无 PixiJS', glyph: 'D', accent: '#3a8a8a' },
  { route: 'step-mc-06-canvas2d', label: 'MC Step 06: Canvas2D', hint: 'Canvas2D renderer 回避 WebGL CORS', glyph: 'C', accent: '#3a7a7a' },
  { route: 'step-mc-07-fetch-blob', label: 'MC Step 07: Fetch+Blob', hint: 'fetch→blob→objectURL 懒加载', glyph: 'B', accent: '#3a6a7a' },
  { route: 'step-mc-08-assets', label: 'MC Step 08: Assets API', hint: 'PixiJS Assets.load 通过 Vite proxy', glyph: 'A', accent: '#3a5a7a' },
  { route: 'step-mc-09-dom-avd', label: 'MC Step 09: DOM AVD', hint: '純 DOM AvdController + DomTexture 绕过 CORS', glyph: 'D', accent: '#2a8a6a' },
  { route: 'step-mc-10-dom-avd', label: 'MC Step 10: DOM AVD', hint: '純 DOM AvdController + DomTexture (独立注册)', glyph: 'D', accent: '#2a9a7a' },
  { route: 'step-06-mixed-layer', label: 'Step 06: Mixed Layer', hint: 'DOM + Pixi 图层前后排列', glyph: '\u25A6', accent: '#5a3a8a' },
  { route: 'component-avd-ha1-dom', label: 'AVD DOM: HA1 自慰1', hint: '旅馆自慰(通常服) · 纯 DOM', glyph: '\u2665', accent: '#4a8a5a' },
  { route: 'component-avd-ha2-dom', label: 'AVD DOM: HA2 自慰2', hint: '旅馆自慰 · 纯 DOM', glyph: '\u2665', accent: '#4a8a6a' },
  { route: 'component-avd-ha3-dom', label: 'AVD DOM: HA3 自慰3', hint: '旅馆自慰 · 纯 DOM', glyph: '\u2665', accent: '#4a8a7a' },
  { route: 'component-avd-hbstart-dom', label: 'AVD DOM: HB开始', hint: '忠诚自慰开始 · 纯 DOM', glyph: '\u2665', accent: '#5a8a4a' },
  { route: 'component-avd-hb1-dom', label: 'AVD DOM: HB1 忠诚自慰1', hint: '忠诚自慰(通常服) · 纯 DOM', glyph: '\u2665', accent: '#5a9a4a' },
  { route: 'component-avd-hb2-dom', label: 'AVD DOM: HB2 忠诚自慰2', hint: '忠诚自慰 · 纯 DOM', glyph: '\u2665', accent: '#5aaa4a' },
  { route: 'component-avd-t21-dom', label: 'AVD DOM: T21 胸揉', hint: '西区胸揉(通常服) · 纯 DOM', glyph: '\u2665', accent: '#6a8a4a' },
  { route: 'component-avd-t22-dom', label: 'AVD DOM: T22 胸揉(色情)', hint: '西区胸揉(色情服) · 纯 DOM', glyph: '\u2665', accent: '#6a9a4a' },
  { route: 'component-avd-t22inran-dom', label: 'AVD DOM: T22 胸揉(淫乱)', hint: '西区胸揉(淫乱) · 纯 DOM', glyph: '\u2665', accent: '#6aaa4a' },
  { route: 'component-avd-hc1-dom', label: 'AVD DOM: HC1 窥视', hint: '西区窥视(色情服) · 纯 DOM', glyph: '\u2665', accent: '#4a6a8a' },
  { route: 'component-avd-hc3-dom', label: 'AVD DOM: HC3 贫乳手交', hint: '西区乳交口交 · 纯 DOM', glyph: '\u2665', accent: '#4a7a8a' },
  { route: 'component-avd-t3-dom', label: 'AVD DOM: T3 性骚扰', hint: '胸揉+金项圈奴隶契约 · 纯 DOM', glyph: '\u2665', accent: '#5a5a9a' },
  { route: 'component-avd-hd1-dom', label: 'AVD DOM: HD1 贫乳手交', hint: '城2F口交(女仆服) · 纯 DOM', glyph: '\u2665', accent: '#6a4a8a' },
  { route: 'component-avd-hd2-dom', label: 'AVD DOM: HD2 正常位', hint: '城2F正常位(女仆服) · 纯 DOM', glyph: '\u2665', accent: '#7a4a8a' },
  { route: 'component-avd-hd3-dom', label: 'AVD DOM: HD3 骑乘位', hint: '城2F骑乘位(女仆服) · 纯 DOM', glyph: '\u2665', accent: '#8a4a8a' },
  { route: 'component-avd-he1-dom', label: 'AVD DOM: HE1 洗脑', hint: '洗脑结局 · 纯 DOM', glyph: '\u2622', accent: '#6a3a5a' },
  { route: 'component-avd-he2-dom', label: 'AVD DOM: HE2 骑乘位', hint: '欧派斯基败北结局 · 纯 DOM', glyph: '\u25C7', accent: '#7a3a5a' },
  { route: 'component-avd-hf1-dom', label: 'AVD DOM: HF1 正常位', hint: '欧派斯基的奴隶结局 · 纯 DOM', glyph: '\u2606', accent: '#5a3a7a' },
  { route: 'component-avd-hg1-dom', label: 'AVD DOM: HG1 乱交', hint: '居民结局 · 纯 DOM', glyph: '\u2735', accent: '#6a4a5a' },
  { route: 'component-avd-t1-dom', label: 'AVD DOM: T1 自慰', hint: '伊露的自慰场景 · 纯 DOM', glyph: '\u2665', accent: '#7a3a6a' },
  { route: 'component-ex-ha11-dom', label: 'EX: HA11 茶羅井敗北', hint: 'RJ01222693 · 勇者敗北 · 纯 DOM', glyph: '\u2665', accent: '#3a7a5a' },
  { route: 'component-ex-ha12-dom', label: 'EX: HA12 詩保洗脳失敗', hint: 'RJ01222693 · 洗脳失敗オナニー · 纯 DOM', glyph: '\u2665', accent: '#3a7a6a' },
  { route: 'component-ex-hb11-dom', label: 'EX: HB11 洗脳', hint: 'RJ01222693 · 洗脳 · 纯 DOM', glyph: '\u2665', accent: '#3a7a7a' },
  { route: 'component-ex-hb12-dom', label: 'EX: HB12 忠誠Wフェラ', hint: 'RJ01222693 · 忠誠Wフェラ · 纯 DOM', glyph: '\u2665', accent: '#3a8a5a' },
  { route: 'component-ex-t1-dom', label: 'EX: T1 有理紗', hint: 'RJ01222693 · 有理紗 · 纯 DOM', glyph: '\u2665', accent: '#4a7a5a' },
  { route: 'component-ex-t2-dom', label: 'EX: T2 詩保', hint: 'RJ01222693 · 詩保 · 纯 DOM', glyph: '\u2665', accent: '#4a7a6a' },
  { route: 'component-ex-ha21-dom', label: 'EX: HA21 教皇敗北', hint: 'RJ01222693 · 教皇敗北 · 纯 DOM', glyph: '\u2665', accent: '#4a7a7a' },
  { route: 'component-ex-ha22-dom', label: 'EX: HA22 教皇Wフェラ', hint: 'RJ01222693 · 教皇Wフェラ · 纯 DOM', glyph: '\u2665', accent: '#4a8a4a' },
  { route: 'component-ex-ha23-dom', label: 'EX: HA23 セイレア', hint: 'RJ01222693 · セイレア · 纯 DOM', glyph: '\u2665', accent: '#5a7a5a' },
  { route: 'component-ex-ha24-dom', label: 'EX: HA24 有理紗正常位', hint: 'RJ01222693 · 有理紗正常位 · 纯 DOM', glyph: '\u2665', accent: '#5a7a6a' },
  { route: 'component-ex-ha25-dom', label: 'EX: HA25 詩保正常位', hint: 'RJ01222693 · 詩保正常位 · 纯 DOM', glyph: '\u2665', accent: '#5a7a7a' },
  { route: 'component-ex-ha26-dom', label: 'EX: HA26 奉仕', hint: 'RJ01222693 · 奉仕 · 纯 DOM', glyph: '\u2665', accent: '#5a8a5a' },
  { route: 'component-ex-hb21-dom', label: 'EX: HB21 洗脳', hint: 'RJ01222693 · 洗脳 · 纯 DOM', glyph: '\u2665', accent: '#3a6a7a' },
  { route: 'component-ex-hb22-dom', label: 'EX: HB22 洗脳', hint: 'RJ01222693 · 洗脳 · 纯 DOM', glyph: '\u2665', accent: '#3a6a8a' },
  { route: 'component-ex-hb23-dom', label: 'EX: HB23 セイレア', hint: 'RJ01222693 · セイレア · 纯 DOM', glyph: '\u2665', accent: '#3a7a8a' },
  { route: 'component-ex-hb24-dom', label: 'EX: HB24 洗脳', hint: 'RJ01222693 · 洗脳 · 纯 DOM', glyph: '\u2665', accent: '#3a8a7a' },
  { route: 'component-ex-t21-dom', label: 'EX: T21 対魔忍', hint: 'RJ01222693 · 対魔忍 · 纯 DOM', glyph: '\u2665', accent: '#4a6a7a' },
  { route: 'component-ex-t22-dom', label: 'EX: T22 対魔忍', hint: 'RJ01222693 · 対魔忍 · 纯 DOM', glyph: '\u2665', accent: '#4a7a8a' },
  { route: 'component-ex-hc1-dom', label: 'EX: HC1 対魔忍', hint: 'RJ01222693 · 対魔忍 · 纯 DOM', glyph: '\u2665', accent: '#5a6a7a' },
  { route: 'component-ex-hc2-dom', label: 'EX: HC2 対魔忍', hint: 'RJ01222693 · 対魔忍 · 纯 DOM', glyph: '\u2665', accent: '#5a7a8a' },
  { route: 'component-ex-t3-dom', label: 'EX: T3 対魔忍', hint: 'RJ01222693 · 対魔忍 · 纯 DOM', glyph: '\u2665', accent: '#3a5a8a' },
  { route: 'component-ex-hd1-dom', label: 'EX: HD1 堕落', hint: 'RJ01222693 · 堕落 · 纯 DOM', glyph: '\u2665', accent: '#4a5a8a' },
  { route: 'component-ex-hd2-dom', label: 'EX: HD2 ファタ堕ち', hint: 'RJ01222693 · ファタ堕ち · 纯 DOM', glyph: '\u2665', accent: '#5a5a8a' },
  { route: 'component-ex-hd3-dom', label: 'EX: HD3 洗脳ガウ', hint: 'RJ01222693 · 洗脳ガウも · 纯 DOM', glyph: '\u2665', accent: '#6a5a8a' },
  { route: 'component-ex-he1-dom', label: 'EX: HE1 忠誠ガウ', hint: 'RJ01222693 · 忠誠ガウも · 纯 DOM', glyph: '\u2665', accent: '#7a5a8a' },
];

function accentToText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#0a0a14' : '#e6e6f0';
}

export function LauncherDisplay() {
  const [filter, setFilter] = useState('');
  const [now, setNow] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const q = filter.trim().toLowerCase();
  const visible = q
    ? APPS.filter(
        (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q) || a.route.includes(q),
      )
    : APPS;

  return (
    <div className="launcher-root">
      <style>{launcherCss}</style>
      <header className="launcher-header">
        <div className="launcher-title-row">
          <h1 className="launcher-title">subcanvas</h1>
          <span className="launcher-clock">{now}</span>
        </div>
        <div className="launcher-filter-row">
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={`filter ${APPS.length} routes\u2026`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="launcher-filter"
            aria-label="Filter routes"
          />
          <span className="launcher-count">{visible.length}/{APPS.length}</span>
        </div>
      </header>

      <main className="launcher-grid" role="list">
        {visible.map((app) => (
          <button
            key={app.route}
            type="button"
            role="listitem"
            onClick={() => {
              window.location.hash = `#${app.route}`;
            }}
            className="launcher-tile"
            style={{
              background: `linear-gradient(160deg, ${app.accent} 0%, #0a0a14 130%)`,
              borderColor: app.accent,
              color: accentToText(app.accent),
            }}
          >
            <span className="launcher-glyph" aria-hidden>
              {app.glyph}
            </span>
            <span className="launcher-label">{app.label}</span>
            <span className="launcher-hint">{app.hint}</span>
            <span className="launcher-route" aria-hidden>
              #{app.route}
            </span>
          </button>
        ))}
        {visible.length === 0 && (
          <div className="launcher-empty">no routes match &ldquo;{filter}&rdquo;</div>
        )}
      </main>

      <footer className="launcher-footer">
        {q ? `filter: ${filter}` : 'tap a tile to launch'}
      </footer>
    </div>
  );
}

const launcherCss = `
.launcher-root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0a0a14;
  color: #e6e6f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding-top: var(--safe-top, 0px);
  padding-bottom: var(--safe-bottom, 0px);
  padding-left: var(--safe-left, 0px);
  padding-right: var(--safe-right, 0px);
  overflow: hidden;
}
.launcher-header {
  flex: 0 0 auto;
  padding: 16px;
  border-bottom: 1px solid #1a1a2a;
}
.launcher-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.launcher-title {
  font-size: 1.6rem;
  margin: 0;
  color: #88aaff;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.launcher-clock {
  font-size: 0.75rem;
  opacity: 0.55;
}
.launcher-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.launcher-filter {
  flex: 1;
  background: #14141f;
  border: 1px solid #2a2a3a;
  color: #e6e6f0;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.9rem;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.launcher-filter:focus {
  border-color: #4a6a9a;
  background: #18182a;
}
.launcher-count {
  font-size: 0.8rem;
  opacity: 0.6;
  min-width: 4ch;
  text-align: right;
}
.launcher-grid {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  align-content: start;
}
@media (min-width: 600px) {
  .launcher-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 16px;
  }
}
.launcher-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 14px;
  min-height: 110px;
  border: 1px solid;
  border-radius: 10px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 80ms ease, box-shadow 120ms ease;
  overflow: hidden;
}
.launcher-tile:active {
  transform: scale(0.97);
}
.launcher-tile:focus-visible {
  outline: 2px solid #88aaff;
  outline-offset: 2px;
}
.launcher-glyph {
  font-size: 1.4rem;
  line-height: 1;
  margin-bottom: 6px;
  opacity: 0.9;
}
.launcher-label {
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.launcher-hint {
  font-size: 0.75rem;
  opacity: 0.75;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-word;
  max-width: 100%;
}
.launcher-route {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 0.65rem;
  opacity: 0.45;
}
.launcher-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px 12px;
  opacity: 0.6;
  font-size: 0.9rem;
}
.launcher-footer {
  flex: 0 0 auto;
  padding: 8px 16px;
  font-size: 0.7rem;
  text-align: center;
  opacity: 0.55;
  border-top: 1px solid #1a1a2a;
}
`;

LauncherDisplay.head = {
  title: 'subcanvas — examples',
  description: 'Launcher home — tile grid of all SubCanvas examples.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
