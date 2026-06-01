# SingleDisplay

`#single` 路由对应的视图：一个全屏 SubCanvas + 标题 + demo 显示元素。

---

## 调用栈

### 挂载
```
URL → #single
  └─ RouteSwitch
       └─ case 'single': return <SingleDisplay />
            └─ useEffect(() => { ... }, [])
                 ├─ displayCleanups = []                   // 收集 cleanup
                 ├─ cleanupResize = null                  // resize 注销函数
                 ├─ destroy = startPixiApp((proxy) => {
                 │     const W = window.innerWidth
                 │     const H = window.innerHeight
                 │     const root = proxy.createRegion({ x:0, y:0, width:W, height:H })
                 │     ├─ new PIXI.Text() → title         // "single window — full viewport"
                 │     ├─ root.stage.addChild(title)
                 │     ├─ mountDisplays(root)              // 加 crosshair + click ring
                 │     │   └─ 返回 cleanup → displayCleanups.push(...)
                 │     └─ cleanupResize = proxy.onWindowResize(() => {
                 │           root.setBounds({ x:0, y:0, width:innerWidth, height:innerHeight })
                 │        })
                 │  })
                 └─ return cleanup 函数：
                      ├─ cleanupResize?.()                 // 注销 resize 监听
                      ├─ displayCleanups.forEach(c => c())  // 清 crosshair/click
                      └─ destroy()                         // 销毁 PIXI.Application
            return null                                     // 组件本身不渲染 JSX
```

### 窗口 resize
```
window 'resize' event
  └─ proxy.onWindowResize 的回调
       └─ root.setBounds({ x:0, y:0, width:W, height:H })
            ├─ this._bounds = bounds
            ├─ this.stage.position.set(0, 0)              // (0,0) 不变
            └─ resizeListeners.forEach(fn)                // 暂时没有 onResize 注册
```
**没有 onResize 回调注册** — 因为标题在 (12, 12) 局部坐标，不需要随窗口变化；crosshair 是 per-event 的；click ring 是 per-click 的。

### 路由切走
```
URL 变成 #multiple
  └─ RouteSwitch 重渲
       └─ 返回 <MultipleDisplay />（不同组件类型）
            └─ React 卸载 <SingleDisplay />
                 └─ useEffect cleanup（同上）
                      └─ PIXI 整个销毁
```

### 鼠标移动 / 点击
```
用户在 canvas 上动鼠标
  └─ window 'pointermove'
       └─ proxy.routePointer → root.handlePointer
            └─ 命中（globalBounds = 整个 viewport）→ 派发 onMove
                 └─ mountDisplays 注册的 moveHandler
                      ├─ 画十字光标
                      └─ 更新坐标文本
```

---

## API

```ts
export function SingleDisplay(): null
```

- **无 props**
- **返回 `null`** — 真正的画面是 PIXI canvas（由 `startPixiApp` 挂到 body），不是 React DOM
- **副作用**：
  - 启动一个 `PIXI.Application`
  - 在 body 末尾 append 一个 `<canvas>`（fixed, 100vw × 100vh）
  - 注册 4 个 window 事件（pointerdown/move/up/leave） + 1 个 resize 监听

---

## 使用

### 直接渲染（一般不这么用）
```tsx
import { SingleDisplay } from './displays/single/SingleDisplay';
<SingleDisplay />
```
但要保证没有其他 PIXI 实例在跑（不然 canvas 叠加）。

### 改标题
```tsx
// SingleDisplay.tsx
const title = new PIXI.Text({
  text: '新标题',
  style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' },
});
```

### 加更多元素
在 `mountDisplays(root)` 之后加：
```tsx
const myShape = new PIXI.Graphics().rect(0, 0, 100, 100).fill(0xff0000);
root.stage.addChild(myShape);
// 注意：resize 时 (100, 100) 大小不变。要响应 resize：
// root.onResize(b => myShape.clear().rect(0, 0, b.width / 2, b.height / 2).fill(0xff0000));
```

### 自定义清理
```tsx
useEffect(() => {
  const myResource = ...;
  const destroy = startPixiApp((proxy) => {
    // ... 用 myResource
  });
  return () => {
    myResource.release();
    destroy();
  };
}, []);
```

---

## 应用范围

适合：
- **整页一个 PIXI 场景**（编辑器主视图、画板、游戏主场景）
- **全屏背景**（渐变、shader、粒子）
- **路由的"默认页"**（DEFAULT_ROUTE 就用这个）

不适合：
- **页面里既要 PIXI 又要 React DOM**（按钮、菜单）— canvas 是 fixed 在 body 上，会盖在 React 之上；要共存得用 position: relative 的容器
- **多 PIXI 场景**（同屏多个独立渲染）— 用 `#multiple` 或拆成更多路由
- **需要从外部控制 PIXI 状态** — 组件没有 callback props；要的话自己包一层

---

## 注意事项

1. **返回 `null`** — 组件本身不画任何东西；PIXI canvas 在 body 末尾。React DevTools 里 `<SingleDisplay />` 是空的（截图看不到东西）。
2. **canvas 100vw × 100vh** — 永远全屏，**不受 React 父容器约束**。如果你把 `<SingleDisplay />` 包在 `<div style={{ width: 500 }}>` 里，PIXI 仍然全屏。
3. **resize 时不调 `app.renderer.resize`** — 由 `PixiApp` 自己的 onResize 处理（`app.renderer.resize` 自动跟 window.innerWidth/Height）。
4. **标题位置 (12, 12) 固定** — 不会随窗口变大而"居中"。要居中得注册 `root.onResize` 算 `(b.width - title.width) / 2`。
5. **`mountDisplays` 的 cleanup 在 destroy 之前调** — 顺序很重要：先清 demo 内容，再销毁 app。如果反过来，destroy 销毁 ticker 之后，`mountDisplays` 的 cleanup 不会移除 ticker 回调（虽然 ticker 已被销毁，无害）。
6. **没有 AbortController / mounted flag** — 如果 `onReady` 在 React unmount 之后才到，cleanup 不调，新 PIXI 不会被销毁，**会内存泄露**。生产代码务必加 mounted flag 守护。
7. **不导出 props** — 要 props 化就改成 `SingleDisplay({ title }: { title: string })`，title 用 useState 传到 PIXI Text。
