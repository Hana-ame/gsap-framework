import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import {
  startPixiApp,
  gsap,
  InfiniteCanvas,
  EventBus,
  createComponent,
  makeButton,
  type SubCanvasProxy,
  type Chunk,
} from '../../framework';

// ============================================================
//  ████████ 教程：从零搭建 GSAP Framework
//  ============================================================
//  本文件是框架的入门教程，涵盖了所有核心概念。
//  每段代码上方都有注释说明"在做什么"和"为什么"。
//
//  用浏览器打开后输入 #component-tutorial 即可运行。
//  建议配合 SPEC.md 的「二次开发指南」一起阅读。
// ============================================================

export function ComponentTutorialIcBrDisplay() {
  // ----- React 部分：管理 PIXI 的生命周期 -----
  // 框架的每个 example 都是一个 React 组件。
  // useEffect 在组件挂载时启动 PIXI，返回的清理函数在卸载时销毁。
  useEffect(() => {

    // -------------------- 第 1 步：启动 PIXI --------------------
    // startPixiApp 是框架的入口。
    // 它会异步初始化 PIXI.Application，创建 canvas 挂到 body 上，
    // 然后调用回调函数 onReady(proxy)。
    //
    // proxy 是 SubCanvasProxy —— 整个应用的根管理器。
    // 通过 proxy 可以访问：
    //   - proxy.renderer  → PIXI.Renderer
    //   - proxy.ticker    → PIXI.Ticker
    //   - proxy.bus       → EventBus（全局发布订阅）
    //   - proxy.canvas    → HTMLCanvasElement
    //
    // startPixiApp 返回一个 stop 函数，调用它时会销毁所有内容。

    const stop = startPixiApp((proxy: SubCanvasProxy) => {

      // ==========================================================
      //  第 2 步：创建根区域（Root Region）
      //  ==========================================================
      // SubCanvas 是框架的核心概念——它是 canvas 上的一个矩形区域，
      // 拥有自己的 PIXI.Container（stage）、边界（bounds）、事件路由和生命周期。
      //
      // createRegion 在 proxy 上创建一个根级 SubCanvas。
      // 参数是位置和大小（相对于 canvas 左上角）。
      //
      // 之后所有的 UI 元素都要 addChild 到某个 SubCanvas 的 stage 上。

      const root = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // ==========================================================
      //  第 3 步：创建子区域（Sub Region）
      //  ==========================================================
      // 一个 SubCanvas 可以递归创建子 SubCanvas。
      // 子区域的位置是相对于父区域的。
      //
      // 这里我们创建两个子区域：
      //   左侧面板（panel）—— 放按钮
      //   右侧画布（canvas）—— 放演示内容

      const panel = root.createRegion(
        { x: 12, y: 12, width: 190, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      const panelBg = new PIXI.Graphics()
        .roundRect(0, 0, 190, window.innerHeight - 24, 8)
        .fill({ color: 0x14141f, alpha: 0.9 })
        .stroke({ width: 1, color: 0x2a2a3a });
      panelBg.eventMode = 'none';
      panel.stage.addChild(panelBg);

      const panelTitle = new PIXI.Text({
        text: 'Tutorial',
        style: { fontSize: 12, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      panelTitle.x = 10;
      panelTitle.y = 6;
      panelTitle.eventMode = 'none';
      panel.stage.addChild(panelTitle);

      const demo = root.createRegion(
        { x: 210, y: 12, width: window.innerWidth - 222, height: window.innerHeight - 24 },
        { dragMode: 'none' },
      );

      // ==========================================================
      //  第 4 步：添加 PIXI 对象
      //  ==========================================================
      // 任何 PIXI 显示对象都可以 addChild 到 SubCanvas 的 stage 上。
      // 这里我们创建一个蓝色的方块，用它来做各种演示。

      const box = new PIXI.Graphics();
      box.eventMode = 'none';
      box.x = 240;
      box.y = 60;

      const drawBox = (color: number) => {
        box.clear().roundRect(-40, -40, 80, 80, 8).fill({ color });
      };
      drawBox(0x4488ff);

      demo.stage.addChild(box);      // ← 所有内容必须加到一个 SubCanvas 的 stage 上

      // ==========================================================
      //  第 5 步：工具函数 —— 添加按钮
      //  ==========================================================
      // makeButton 是框架提供的 UI 辅助函数，创建简单按钮。
      // 也可以直接用 PIXI.Graphics + PIXI.Text 自己画。

      let btnY = 30;
      const addBtn = (label: string, onClick: () => void) => {
        const btn = makeButton(label, 170, 28, onClick, 0x1a1a2e);
        btn.x = 10;
        btn.y = btnY;
        panel.stage.addChild(btn);
        btnY += 34;
      };

      // ==========================================================
      //  第 6 步：GSAP 动画
      //  ==========================================================
      // 框架集成了 GSAP 3.15，PixiPlugin 已预注册。
      // 这样就可以用 gsap.to 直接动画化 PIXI 对象的属性。
      //
      // 关键 API: gsap.to(target, { pixi: { x, y, scale, alpha, rotation, tint } })
      // 注意：pixi: { rotation } 使用「度」作为单位（因为 PixiPlugin 做了转换）
      //       如果直接用 rotation 属性（不通过 pixi: {}），单位是弧度。
      //
      // GSAP 统一管理动画循环，不再需要手写 PIXI.Ticker 或 rAF。
      // 框架的所有动画组件（FullscreenManager、Loading、Avd）都已迁移到 GSAP。

      let currentTween: gsap.core.Tween | gsap.core.Timeline | null = null;
      const killCurrent = () => { currentTween?.kill(); currentTween = null; };

      // --- 6a. 基础 tween ---
      // gsap.to() 创建一个补间动画，从当前值运动到目标值。

      addBtn('→ x: 400', () => {
        killCurrent();
        //                        ↓ 目标对象（可以直接是 PIXI 对象）
        //                        ↓      ↓ pixi: {} 属性由 PixiPlugin 处理
        currentTween = gsap.to(box, {
          pixi: { x: 400 },       // x 从当前位置 → 400
          duration: 0.6,           // 持续 0.6 秒
          ease: 'power2.out',      // 缓动函数（GSAP 内置数十种）
        });
      });

      addBtn('← x: 200', () => {
        killCurrent();
        currentTween = gsap.to(box, { pixi: { x: 200 }, duration: 0.6, ease: 'power2.out' });
      });

      // --- 6b. 缩放 ---
      // 注意这里直接操作了 box.scale，没有用 pixi: {}。
      // 两种方式效果一样，但 pixi: { scale } 更简洁。

      addBtn('scale 1.5', () => {
        killCurrent();
        currentTween = gsap.to(box.scale, { x: 1.5, y: 1.5, duration: 0.4, ease: 'back.out(2)' });
      });

      addBtn('scale 0.5', () => {
        killCurrent();
        currentTween = gsap.to(box.scale, { x: 0.5, y: 0.5, duration: 0.4, ease: 'back.out(2)' });
      });

      // --- 6c. 旋转 ---
      // 重要：GSAP 的 PixiPlugin 把 rotation 解释为角度（0-360）。
      // 如果用 gsap.to(box, { rotation: ... }) 绕过 PixiPlugin，单位是弧度。
      //
      // '+=<n>' 是 GSAP 的 relative 语法：在现有值基础上增加。
      // 这样每次点击都会继续转一圈，而不是固定在 2π。

      addBtn('spin 360°', () => {
        killCurrent();
        //      ↓ 直接操作 box.rotation（弧度），没走 pixi: {}
        currentTween = gsap.to(box, {
          rotation: `+=${Math.PI * 2}`,  // relative，在当前基础上再加 360°
          duration: 0.8,
          ease: 'power4.out',
        });
      });

      // --- 6d. 透明度 ---

      addBtn('fade out', () => {
        killCurrent();
        currentTween = gsap.to(box, { pixi: { alpha: 0.2 }, duration: 0.5, ease: 'power2.out' });
      });

      addBtn('fade in', () => {
        killCurrent();
        currentTween = gsap.to(box, { pixi: { alpha: 1 }, duration: 0.5, ease: 'power2.out' });
      });

      // --- 6e. Timeline（连续动画序列） ---
      // gsap.timeline() 创建一条时间线，可以用 .to() 链式添加动画。
      // 默认前一个动画结束后自动开始下一个。
      // 可以用 '-=0.2' 让下一个动画提前 0.2 秒开始（重叠）。
      // 可以用 '+=0.5' 在动画之间插入 0.5 秒空白。

      addBtn('bounce', () => {
        killCurrent();
        const tl = gsap.timeline();
        tl.to(box, { pixi: { y: 400 }, duration: 0.5, ease: 'power2.in' });   // 掉下去
        tl.to(box, { pixi: { y: 200 }, duration: 0.6, ease: 'bounce.out' });  // 弹回来
        //                                                                 ↑ GSAP 内置弹跳缓动
        currentTween = tl;
      });

      // --- 6f. Tint（颜色） ---
      // pixi: { tint } 改变 PIXI 对象的色调。
      // 结合 yoyo: true 和 repeat 可以实现脉冲效果。

      addBtn('color pulse', () => {
        gsap.to(box, {
          pixi: { tint: 0xff4488 },
          duration: 0.3,
          yoyo: true,         // 动画完成后反向播放
          repeat: 3,          // 重复 3 次（共 4 次：正向+反向+正向+反向）
          ease: 'power1.inOut',
        });
      });

      // --- 6g. Timeline 综合演示 ---

      addBtn('timeline demo', () => {
        killCurrent();
        const tl = gsap.timeline();
        tl.to(box, { pixi: { x: 400, scale: 1.3 }, duration: 0.4, ease: 'power2.out' });
        tl.to(box, { rotation: Math.PI, duration: 0.3, ease: 'power2.out' });          // 弧度
        tl.to(box, { pixi: { x: 200, y: 300, scale: 0.7 }, duration: 0.4, ease: 'power2.out' });
        tl.to(box, { rotation: 0, pixi: { scale: 1 }, duration: 0.3, ease: 'back.out(2)' });
        tl.to(box, { pixi: { y: 200 }, duration: 0.3, ease: 'power2.out' });
        currentTween = tl;
      });

      // --- 6h. 清理 ---
      // gsap.killTweensOf(target) 中断目标对象上的所有动画。
      // 在组件销毁时一定要调用，否则 GSAP 会持有对已销毁 PIXI 对象的引用。

      addBtn('kill all', () => {
        gsap.killTweensOf(box);
        gsap.killTweensOf(box.scale);
      });

      addBtn('reset', () => {
        gsap.killTweensOf(box);
        gsap.killTweensOf(box.scale);
        box.x = 200;
        box.y = 200;
        box.scale.set(1);
        box.rotation = 0;
        box.alpha = 1;
        drawBox(0x4488ff);
      });

      // ==========================================================
      //  第 7 步：EventBus（发布订阅）
      //  ==========================================================
      // EventBus 是框架内置的发布订阅系统，用于组件间解耦通信。
      // proxy.bus 是全局共享的 bus 实例。
      //
      // 模式：bus.on('事件名', 处理函数) → 返回 unsubscribe 函数
      //       bus.emit('事件名', 数据)
      //
      // 事件名约定：namesapce:action（如 'fullscreen:show'）

      const bus = proxy.bus as EventBus;

      // 用一个计数器展示 bus 通信
      let busCount = 0;
      const busLabel = new PIXI.Text({
        text: 'EventBus counter: 0',
        style: { fontSize: 13, fill: 0x88cc88, fontFamily: 'monospace' },
      });
      busLabel.x = 240;
      busLabel.y = 270;
      root.stage.addChild(busLabel);

      // 订阅 tutorial:increment 事件
      const unsub = bus.on('tutorial:increment', (payload: { step: number }) => {
        busCount += payload.step;
        busLabel.text = `EventBus counter: ${busCount}`;
      });

      addBtn('bus +1', () => {
        bus.emit('tutorial:increment', { step: 1 });  // 谁都可以 emit
      });

      // 注意：组件销毁时记得 unsubscribe
      // 这里我们把 unsub 存起来，在 useEffect 的 cleanup 中调用

      // ==========================================================
      //  第 8 步：InfiniteCanvas（无限画布）
      //  ==========================================================
      // InfiniteCanvas 是框架的插件化无限拖拽 + 缩放组件。
      // 适合地图、大图浏览、节点编辑器等场景。
      //
      // 核心概念：
      //   - chunk：将世界划分为固定大小的块（tile），按需加载/卸载
      //   - 插件系统：通过 InfiniteCanvasPlugin 扩展行为
      //   - 内置 DeceleratePlugin（惯性减速）
      //
      // 这里创建一个独立的 InfiniteCanvas 展示其效果。

      // 先创建一个 SubCanvas 来放置 InfiniteCanvas
      const IC_W = 300, IC_H = 260;
      const icRegion = root.createRegion(
        { x: window.innerWidth - IC_W - 16, y: window.innerHeight - IC_H - 16, width: IC_W, height: IC_H },
        { dragMode: 'none', clipToBounds: true },
      );

      const icBorder = new PIXI.Graphics()
        .rect(0, 0, IC_W, IC_H)
        .stroke({ width: 1, color: 0x3a4a5a });
      const icLabel = new PIXI.Text({
        text: '▼ InfiniteCanvas',
        style: { fontSize: 11, fill: 0x6688aa, fontFamily: 'monospace' },
      });
      icLabel.x = 8;
      icLabel.y = -18;
      icRegion.stage.addChild(icBorder, icLabel);

      const CHUNK = 80;
      const ic = new InfiniteCanvas({
        parent: icRegion,
        viewport: { x: 0, y: 0, width: IC_W, height: IC_H },
        chunkSize: CHUNK,
        preloadMargin: 2,                                        // 预加载 2 圈
        chunkCreate: (chunk: Chunk) => {
          // 每次进入视口范围内的新 chunk 都会调用 chunkCreate
          // chunk 暴露：
          //   chunk.cx, chunk.cy     → chunk 坐标（格子索引）
          //   chunk.wx, chunk.wy     → chunk 世界坐标（像素）
          //   chunk.container        → 这个 chunk 的 PIXI.Container
          const g = new PIXI.Graphics()
            .rect(0, 0, CHUNK, CHUNK)
            .fill({ color: 0x1a2a3a })
            .stroke({ width: 1, color: 0x2a3a4a });
          const t = new PIXI.Text({
            text: `${chunk.cx},${chunk.cy}`,
            style: { fontSize: 10, fill: 0x556677, fontFamily: 'monospace' },
          });
          t.x = 4;
          t.y = 4;
          chunk.container.addChild(g, t);
        },
        chunkDestroy: (chunk: Chunk) => {
          // chunk 离开视口时调用，清理资源
          chunk.container.destroy({ children: true });
        },
        decelerate: true,                                        // 启用惯性
        minZoom: 0.3,
        maxZoom: 5,
      });

      // InfiniteCanvas 的方法：
      //   panBy(dx, dy)        → 平移（自动除以 zoom）
      //   panTo(x, y)          → 跳到世界坐标
      //   setZoom(z, cx?, cy?) → 缩放（保持 (cx,cy) 下的世界点不变）
      //   screenToWorld(sx,sy) → 屏幕坐标 → 世界坐标
      //   worldToScreen(wx,wy) → 世界坐标 → 屏幕坐标

      addBtn('IC +zoom', () => {
        ic.setZoom(ic.zoom * 1.4, IC_W / 2, IC_H / 2);
      });
      addBtn('IC reset', () => {
        ic.panTo(0, 0);
        ic.setZoom(1, IC_W / 2, IC_H / 2);
      });

      // ==========================================================
      //  第 9 步：Component Registry（组件注册表）
      //  ==========================================================
      // 框架提供了 registerComponent / createComponent 统一工厂 API。
      // 已注册的类型：'window' / 'confirm' / 'scrollable'
      //
      // createComponent(type, opts) 返回 { type, stage, destroy, destroyed }
      // 适合通过配置或 JSON 动态创建组件。

      addBtn('reg window', () => {
        const win = createComponent('window', {
          parent: root,
          title: 'Registry Window',
          x: 250 + Math.random() * 80,
          y: 370 + Math.random() * 60,
          width: 250,
          height: 180,
        });
        const txt = new PIXI.Text({
          text: 'createComponent(\'window\')\nworks via registry adapter',
          style: { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' },
        });
        txt.x = 14;
        txt.y = 14;
        win.stage.addChild(txt);
      });

      addBtn('reg confirm', () => {
        // createComponent 是泛型函数，需要显式泛型参数才能正确推导选项类型
        createComponent<import('../../framework').ComponentOptions & { title: string; message?: string }>('confirm', {
          parent: root,
          title: 'Confirm via Registry',
          message: 'Created with createComponent(\'confirm\')',
          x: 280 + Math.random() * 80,
          y: 400 + Math.random() * 60,
          width: 320,
          height: 160,
        });
      });

      // ==========================================================
      //  第 10 步：信息提示
      //  ==========================================================

      const info = new PIXI.Text({
        text: '点击左侧按钮尝试各项功能',
        style: { fontSize: 12, fill: 0x556688, fontFamily: 'monospace' },
      });
      info.x = 220;
      info.y = root.bounds.height - 24;
      root.stage.addChild(info);

      // ==========================================================
      //  第 11 步：清理
      //  ==========================================================
      // startPixiApp 的回调可以返回一个清理函数。
      // 它在 PIXI 应用停止时调用。
      //
      // 这里我们不需要额外的清理逻辑，因为 startPixiApp 自动
      // 调用 proxy.destroyAll()。但 GSAP 的 tween 需要手动 kill。

      return () => {
        gsap.killTweensOf(box);
        gsap.killTweensOf(box.scale);
        unsub();          // ← EventBus 取消订阅
        currentTween?.kill();
      };
    });

    // ----- React 清理 -----
    // useEffect 返回的函数在组件卸载时执行。
    // 这里调用 stop() 销毁整个 PIXI 应用。
    return () => {
      stop();
    };
  }, []);

  // ----- React 渲染 -----
  // 这个组件在 PIXI canvas 之上渲染一个提示条。
  return (
    <div className="tutorial-hint">
      <style>{css}</style>
      📖 Tutorial · 每个按钮对应一个框架概念，详细注释在源码中
    </div>
  );
}

const css = `
.tutorial-hint {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: rgba(10,10,20,0.85);
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: monospace;
  font-size: 0.75rem;
  color: #88aacc;
}
`;

// 这个 head 属性被 Launcher 用来展示路由信息
ComponentTutorialIcBrDisplay.head = {
  title: '📖 Tutorial IC BR',
  description:
    'Tutorial with InfiniteCanvas positioned at the bottom-right corner.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
