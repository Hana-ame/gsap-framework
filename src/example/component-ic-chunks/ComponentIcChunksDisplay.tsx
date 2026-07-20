// Example: Infinite canvas chunk-based tile loading
// Example: Infinite canvas chunk-based tile loading
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, type SubCanvasProxy, type Chunk } from '@framework';
import { makeButton } from '@components';

// ============================================================
//  InfiniteCanvas — 定义每个 chunk 里画什么
//  ============================================================
//  核心思路：
//    InfiniteCanvas 把无限世界切成固定大小的格子（chunk），
//    只在视口附近加载/卸载 chunk，适合大世界/地图场景。
//
//  你需要做的只有一件事：
//    在 chunkCreate 回调里往 chunk.container 加 PIXI 对象。
//    chunk 的 container 已经摆好在世界坐标 (cx*size, cy*size) 处，
//    你只用关心格子内部的相对坐标 (0,0)~(size,size)。
// ============================================================

// ------ 1. chunk 参数 ------
// 每个 chunk 是 120×120 世界单位
const CHUNK = 120;

// 8 色调色板，用 (cx + cy) 取模分配，相邻 chunk 颜色不同
const PALETTE = [
  0x2a1a3a, 0x1a2a3a, 0x1a3a2a, 0x3a2a1a,
  0x2a2a4a, 0x2a4a2a, 0x4a2a2a, 0x3a3a1a,
];

function chunkColor(cx: number, cy: number): number {
  return PALETTE[((cx + cy) % 8 + 8) % 8];
}

// ------ 2. 画每个 chunk 的内容 ------
// 这个函数在 chunkCreate 中被调用。
// chunk.container 已经位于世界坐标 (cx*size, cy*size)，
// 我们只需在 (0,0)~(size,size) 范围内绘制。
function drawChunkContent(chunk: Chunk, size: number) {
  // --- 2a. 背景色块 ---
  // 每个 chunk 一个带 1px 边框的矩形
  const color = chunkColor(chunk.cx, chunk.cy);
  const bg = new PIXI.Graphics()
    .rect(2, 2, size - 4, size - 4)        // 留 2px 边距，避免相邻 chunk 边框重叠
    .fill({ color })
    .stroke({ width: 1, color: 0xffffff, alpha: 0.08 });
  chunk.container.addChild(bg);

  // --- 2b. 中心装饰形状 ---
  // 根据 (cx, cy) 的哈希值选三种形状之一：
  //   圆、矩形、五角星
  // 这样视觉上每个 chunk 可区分
  const centerX = size / 2;
  const centerY = size / 2;
  const shape = new PIXI.Graphics();
  const s = size * 0.25;                   // 形状尺寸 = chunk 的 1/4
  const r = (chunk.cx * 1.7 + chunk.cy * 2.3) % 3;
  if (r < 1) {
    shape.circle(centerX, centerY, s).fill({ color: 0xffffff, alpha: 0.12 });
  } else if (r < 2) {
    shape.rect(centerX - s / 2, centerY - s / 2, s, s).fill({ color: 0xffffff, alpha: 0.10 });
  } else {
    shape.star(centerX, centerY, 5, s, s * 0.4).fill({ color: 0xffffff, alpha: 0.10 });
  }
  chunk.container.addChild(shape);

  // --- 2c. 坐标标签 ---
  // 左上角显示 (cx, cy) 方便调试
  const label = new PIXI.Text({
    text: `${chunk.cx},${chunk.cy}`,
    style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' },
  });
  label.alpha = 0.5;
  label.x = 6;
  label.y = 6;
  chunk.container.addChild(label);
}

// ============================================================
//  3. React 组件：挂载时启动 PIXI + InfiniteCanvas
//  ============================================================
export function ComponentIcChunksDisplay() {
  const countRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      // --- 3a. 创建主区域与侧边栏 ---
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // 左侧按钮面板（不拦截拖拽事件）
      const panel = root.createRegion(
        { x: 12, y: 12, width: 140, height: 200 },
        { dragMode: 'none' },
      );

      // 右侧画布区（clipToBounds 裁剪超出部分）
      const canvas = root.createRegion(
        { x: 160, y: 12, width: window.innerWidth - 172, height: window.innerHeight - 24 },
        { dragMode: 'none', clipToBounds: true },
      );

      // --- 3b. 创建 InfiniteCanvas ---
      // 关键参数说明：
      //   chunkSize      — 每个格子的像素尺寸（世界单位）
      //   preloadMargin  — 视口外预加载几圈 chunk（越大越不卡边缘，但耗内存）
      //   chunkCreate    — 新 chunk 进入预加载区时调用，你在这里填充内容
      //   chunkDestroy   — chunk 离开预加载区时调用，你在这里清理
      //   decelerate     — 惯性滑动（松手后继续滑一段）
      const ic = new InfiniteCanvas({
        parent: canvas,
        viewport: { x: 0, y: 0, width: canvas.bounds.width, height: canvas.bounds.height },
        chunkSize: CHUNK,
        preloadMargin: 1,                           // 预加载视口外 1 圈
        chunkCreate: (chunk: Chunk) => drawChunkContent(chunk, CHUNK),
        chunkDestroy: (chunk: Chunk) => { chunk.container.destroy({ children: true }); },
        decelerate: true,
        minZoom: 0.2,
        maxZoom: 8,
        onDrag: () => {
          if (countRef.current) countRef.current.textContent = `chunks: ${ic.loadedChunkCount}`;
        },
      });

      // --- 3c. 右下角显示当前加载的 chunk 数量 ---
      const countEl = document.createElement('div');
      countEl.style.cssText = 'position:fixed;bottom:12px;right:12px;color:#667;font:12px monospace;pointer-events:none';
      countEl.textContent = `chunks: ${ic.loadedChunkCount}`;
      document.body.appendChild(countEl);
      countRef.current = countEl;

      // --- 3d. 控制按钮 ---
      let btnY = 4;
      const addBtn = (label: string, color: number, onClick: () => void) => {
        const btn = makeButton(label, 130, 28, onClick, color);
        btn.x = 5;
        btn.y = btnY;
        panel.stage.addChild(btn);
        btnY += 34;
      };

      // zoom + / - 以视口中心为锚点缩放
      addBtn('zoom +', 0x1a2a3a, () => {
        ic.setZoom(ic.zoom * 1.5, canvas.bounds.width / 2, canvas.bounds.height / 2);
      });
      addBtn('zoom -', 0x2a1a3a, () => {
        ic.setZoom(ic.zoom / 1.5, canvas.bounds.width / 2, canvas.bounds.height / 2);
      });
      // 复位：回到原点，缩放 1x
      addBtn('reset', 0x2a3a1a, () => {
        ic.panTo(0, 0);
        ic.setZoom(1, canvas.bounds.width / 2, canvas.bounds.height / 2);
      });
      // 跳到世界坐标 (2,3) 处的 chunk 中心
      addBtn('center (2,3)', 0x3a2a1a, () => {
        ic.centerOn(CHUNK * 2 + CHUNK / 2, CHUNK * 3 + CHUNK / 2);
      });

      // --- 3e. 清理 ---
      return () => {
        ic.destroy();
        countEl.remove();
      };
    });

    return () => stop();
  }, []);

  return null;
}

// ============================================================
//  页面 meta（标题 / 描述 / theme-color）
//  ============================================================
ComponentIcChunksDisplay.head = {
  title: 'IC Chunks',
  description: 'InfiniteCanvas — define per-chunk content with colors, shapes, and labels.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
