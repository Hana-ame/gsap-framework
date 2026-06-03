# SubCanvasProxy

`PIXI.Application` 之上的薄壳 — 跟踪所有顶层 `SubCanvas`，把窗口事件路由到命中的那个。

---

## 调用栈

### 创建
```
startPixiApp(onReady)
  └─ app.init({...})                               // 异步
       └─ onReady(proxy)
            └─ new SubCanvasProxy({ app })
                 └─ topCanvases = []               // 跟踪所有 createRegion 的产物
```
只有 `startPixiApp` 构造 `SubCanvasProxy` — 用户代码不直接 `new`。

### 创建顶层 canvas
```
proxy.createRegion(bounds)
  └─ new SubCanvas({
       rootApp: this.app,
       bounds,
       parent: null,                               // 顶层没有 parent
       onDestroy: () => topCanvases.splice(idx, 1) // 自摘除
     })
  └─ topCanvases.push(sc)
```

### 事件路由
```
window.addEventListener('pointerX', PixiAppHandler)
  └─ proxy.routePointer(type, e)
       └─ for sc of topCanvases: sc.handlePointer(type, e)
            └─ 命中检测 + 递归 children + 派发到 listeners
```
**注意**：`routePointer` 对所有顶层 canvas 都调用 `handlePointer`，但每个 `handlePointer` 内部只在自己 globalBounds 内才处理，**因此多顶层 canvas 互不干扰**。命中检测在每个 canvas 内部独立做。

### 销毁
```
proxy.destroyAll()
  └─ for sc of [...topCanvases]: sc.destroy()      // 拷贝后遍历（destroy 会改 topCanvases）
  └─ topCanvases = []

proxy.onWindowResize(fn)
  └─ window.addEventListener('resize', fn)
  └─ return () => window.removeEventListener('resize', fn)   // cleanup
```

---

## API

### 属性
| 属性 | 类型 | 说明 |
|---|---|---|
| `canvas` | `HTMLCanvasElement` | → `app.canvas` |
| `ticker` | `PIXI.Ticker` | → `app.ticker` |
| `renderer` | `PIXI.Renderer` | → `app.renderer` |
| `stage` | `PIXI.Container` | → `app.stage`（主 stage，所有顶层 canvas 挂在这里） |
| `bus` | `EventBus` | 共享 pub-sub，跨 SubCanvas 通信 + 后台事件入口 |

### 方法
```ts
createRegion(bounds: Rect): SubCanvas               // 顶层 canvas；只调一次为多个子级
getTopCanvases(): SubCanvas[]                       // 浅拷贝
routePointer(type, e: PointerEvent): void           // 内部用，不要手动调
destroyAll(): void                                  // 销毁所有顶层 canvas
onWindowResize(fn: () => void): () => void         // 包装 window.resize；返回 cleanup
```

### 拿到 proxy 的唯一方式
`startPixiApp(onReady)` 的 `onReady(proxy)` 回调是唯一获取 `SubCanvasProxy` 的入口。所有使用都必须在这个回调里。

---

## 使用

### 配合 startPixiApp
```ts
import { startPixiApp } from '../pixi/PixiApp';

useEffect(() => {
  const destroy = startPixiApp((proxy) => {
    const W = window.innerWidth, H = window.innerHeight;
    const sc = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
    sc.stage.addChild(new PIXI.Graphics().rect(0, 0, W, H).fill(0x00ff00));
  });
  return destroy;
}, []);
```

### 多顶层 + resize
```ts
const destroy = startPixiApp((proxy) => {
  const a = proxy.createRegion({ x: 0,   y: 0, width: 200, height: 100 });
  const b = proxy.createRegion({ x: 0,   y: 100, width: 200, height: 100 });

  // a 和 b 互不重叠，事件按命中分发
  a.onPress((e) => console.log('A', e.x, e.y));
  b.onPress((e) => console.log('B', e.x, e.y));

  // a 移动
  const cleanup = proxy.onWindowResize(() => {
    a.setBounds({ x: 0, y: 0, width: 200, height: 100 });
  });
  // ...
  return cleanup;  // 注意：startPixiApp 的 onReady 不需要 return 值；cleanup 由外层 useEffect 拿
});
```

### 嵌套子级
```ts
const destroy = startPixiApp((proxy) => {
  const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
  // root 是顶层；root.createSubRegion 出来的全是 root 的 children
  const children = [0,1,2,3].map(i => root.createSubRegion({ x: col*i, y: row*i, width: W/2, height: H/2 }));
  // children 不出现在 topCanvases 里 — 只 root 在
  // 销毁时 root.destroy() 会级联销毁 children
});
```

---

## 应用范围

适合：
- **任何"一个 PIXI 应用 + 多逻辑画布"** — 多窗口编辑器、关卡编辑器、组件化游戏场景
- **快速原型**：写一个 `onReady` 回调就能摆 N 个区域，所有事件路由自动处理
- **不想要 react-router 的多视图路由** — 顶层 canvas 本身就是一个视图

不适合：
- **多 PIXI.Application**（每个 canvas 独立 WebGL 上下文）— 那是 `startPixiApp` 调用多次的事
- **需要 z-order 的悬浮 UI**（弹窗、tooltip）— `topCanvases` 是数组，遍历顺序 = 命中顺序；要换 z-order 要手动调 `addChildAt` / `setChildIndex`
- **canvas 之间共享 GPU 资源 / RenderTexture** — 跨 canvas 的 render texture 需要走 `app.renderer.generateTexture`，不是 SubCanvas 关心的事

---

## 注意事项

1. **proxy 由 `startPixiApp` 拥有**：不要自己 `new SubCanvasProxy`。
2. **onReady 是异步回调**：`app.init()` 之后才触发。如果在 unmount 之后才 onReady，外部 `displayCleanups` 数组的清理会漏，**事件路由也就漏清理**（race condition）。生产代码里要么 `useRef` 标记 `mounted` 守住 onReady 后的副作用，要么用 `AbortController`。
3. **`createRegion` 只能造顶层**：嵌套子级用 `SubCanvas.createSubRegion / divide / grid`。
4. **`routePointer` 是内部 API**：PixiApp 已经统一监听 `window` 上的 pointer 事件，**不要自己再 addEventListener**，否则事件会被处理两次。
5. **`onWindowResize` 的 cleanup 一定要调**：否则路由切换时旧的 listener 永远活着，每次 resize 都会执行旧的 `layout`（闭包持有的旧 root 已经 destroy 也不致命，但浪费）。
6. **`getTopCanvases()` 返回浅拷贝**：遍历中增删安全。
7. **`destroyAll()` 用拷贝后遍历**：因为 `sc.destroy()` 会通过 `onDestroy` 回调摘除自己，直接 `for...of topCanvases` 会漏。
