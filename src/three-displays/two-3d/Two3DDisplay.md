# Two3DDisplay

`#two-3d` — 两个独立 three.js 窗口并排，用 EventBus 跨窗口同步。验证 shell 能在同一屏渲染多个 3D 上下文。

## Call Stack

```
RouteSwitch (switch route)
  └─ Two3DDisplay  (useEffect mount)
      ├─ makeScene (canvas A)  → 独立的 WebGLRenderer / Scene / Camera / OrbitControls
      │   └─ attachMesh (TorusKnot)
      ├─ makeScene (canvas B)  → 独立 WebGL context
      │   └─ attachMesh (Icosahedron)
      └─ EventBus (本地实例) — 跨窗口 click → 状态变更
          ├─ 'pick-color' → A.setColor + B.setColor
          └─ 'rotate-a'   → A.setRotation
```

每个 canvas 有自己的 `WebGLRenderer`，所以两个 GL context 完全独立（互不阻塞）。ResizeObserver 监听 canvas 父尺寸变化，调 `renderer.setSize(w,h,false)` + `camera.aspect` 同步。

## API

无 props，无 ref forwarding。组件自管生命周期。

## Usage

```ts
import { Two3DDisplay } from './three-displays/two-3d/Two3DDisplay';

// 在 RouteSwitch 中
switch (route) {
  case 'two-3d': return <Two3DDisplay />;
}
```

访问 `#two-3d` 看两个窗口。点 A → 随机色同步两窗；点 B → A 的 TorusKnot 转到随机角度。OrbitControls 拖动相机。

## Scope

- 只演示「多 3D 上下文共存」 + 「EventBus 跨窗口」
- **不**用 PIXI SubCanvas（HTML overlay 在 PIXI 框架上很麻烦，HTML-only 更直观）
- 不演示 draggable / resizable（用户没要求；后续可加）
- 不演示 WebGL context 共享（性能极限场景；本 demo 独立 context 已够用）

## Notes

### 为什么不用 PIXI SubCanvas
PIXI 是单 canvas，要把 3D scene 塞进 PIXI container 必须走 shared WebGL context。`start3DApp.md` 记录了这个模式（`getContext share` + `clearBeforeRender:false` + `resetState`），但实现起来：
- PIXI v8 的 `Application.renderer` 在 WebGL/WebGPU 模式下行为不同，shared context 容易踩坑
- HTML 窗口在游戏 UI 里更通用（CSS 可控、字体、滚动条、a11y）
- 内存：每个独立 WebGL context ~50MB，2 个还行（mobile 注意）

### EventBus 是本地实例
- 不挂 `proxy.bus`（因为没启动 PIXI app）
- `new EventBus()` + `on/emit`，退出时 `on` 返回的 cleanup 调一次
- 命名约定：`pick-color` / `rotate-a` kebab-case

### Resize 处理
- `canvas.clientWidth/clientHeight` 跟随 flex 布局变化
- `renderer.setSize(w,h,false)` 第三个参数 `false` = 不改 canvas style，让 CSS 控布局；只改 canvas 内部 buffer 尺寸
- 父 div 用 `minHeight:0` 否则 flex 子项不会缩

### Click vs drag 区分
- `OrbitControls` 拦了 pointerdown/up 内部的拖动逻辑
- 但 click 事件还是会冒泡到 canvas（drag 距离 < 5px）
- 现在没做区分；拖完也算一次 click。如果要严格区分，加 pointerdown/up 时间+距离判断

### Disposal 链（必须按顺序）
1. `cancelAnimationFrame` 停 tick
2. `ResizeObserver.disconnect` 停观察
3. `controls.dispose()` 释放 OrbitControls
4. `scene.traverse` 释放所有 `geometry` + `material`
5. `renderer.dispose()` 释放 WebGL state

顺序反了会泄漏（controls 内部的 listener 还在 observe canvas，会回调已 dispose 的 scene）。

### 已知限制
- mobile 上 2 个 WebGL context 可能 OOM
- 没有 WebGL context-lost 处理（生产环境需要）
- 没有 LOD，两个 mesh 都是固定几何
- 没有触摸手势支持（OrbitControls 桌面端 touch OK，但需要 pointer 事件 fallback）
