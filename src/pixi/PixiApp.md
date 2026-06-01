# PixiApp — `startPixiApp`

启动一个 `PIXI.Application`、挂到 `<body>`、建一个 `SubCanvasProxy`、把窗口事件统一转发。

---

## 调用栈

### 启动
```
startPixiApp(onReady?)
  ├─ const app = new PIXI.Application()
  ├─ const proxy = null                            // 延迟到 init 后
  ├─ window.addEventListener('resize', onResize)   // 只调 app.renderer.resize
  ├─ for type in POINTER_TYPES:
  │    window.addEventListener(type, makePointerHandler(type))   // 4 个事件
  └─ app.init({ width, height, backgroundColor, antialias, resolution, autoDensity })
       .then(() => {
         ├─ canvas.style.position = 'fixed'; ...
         ├─ document.body.appendChild(canvas)
         ├─ mounted = true
         ├─ proxy = new SubCanvasProxy({ app })
         └─ onReady?.(proxy)                        // 用户拿到 proxy 写自己的画布
       })
       .catch(err => console.error('Pixi 初始化失败:', err))

  return () => destroyFn
```

### 窗口 resize
```
window 'resize' event
  └─ onResize()
       └─ if (mounted) app.renderer.resize(window.innerWidth, window.innerHeight)
```
**只 resize 渲染器**。**不**触发任何 `SubCanvas` 的 `onResize` — 那是你自己通过 `proxy.onWindowResize` 做的事。

### 指针事件
```
window 'pointerdown'/'move'/'up'/'leave' event
  └─ makePointerHandler(type)(e)
       ├─ if (!proxy) return                        // 还没初始化完
       ├─ if (e.target !== proxy.canvas) return     // 事件来自非 canvas（DOM 元素）
       └─ proxy.routePointer(type, e)               // 派发到命中的 SubCanvas
```
**`e.target !== proxy.canvas` 的过滤**：保证只有落在 canvas 区域的事件才路由 — 如果用户在 canvas 外（比如 React 后续添加的 DOM 元素）点击，直接忽略。

### 销毁
```
destroyFn()
  ├─ for type in POINTER_TYPES:
  │    window.removeEventListener(type, makePointerHandler(type))
  ├─ window.removeEventListener('resize', onResize)
  ├─ proxy?.destroyAll()                           // 销毁所有 SubCanvas
  ├─ if (mounted) document.body.removeChild(canvas)
  └─ app.destroy(true, { children: true, texture: true })
       // 第一个 true = removeView（重复无害）
       // 第二个 = 销毁子容器 + 纹理
```

---

## API

```ts
function startPixiApp(onReady?: (proxy: SubCanvasProxy) => void): () => void
```

- **入参**：`onReady(proxy)` — `app.init()` 完成后触发，是唯一拿到 `SubCanvasProxy` 的地方
- **返回**：`destroy` 函数 — 调它会清理事件、销毁所有 canvas、销毁 PIXI 应用
- **副作用**：把 canvas 挂到 `document.body`（position: fixed; 100vw × 100vh）

---

## 使用

### React useEffect
```ts
useEffect(() => {
  const destroy = startPixiApp((proxy) => {
    const W = window.innerWidth, H = window.innerHeight;
    const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
    const g = new PIXI.Graphics().rect(0, 0, W, H).fill(0x112233);
    root.stage.addChild(g);
  });
  return destroy;
}, []);
```

### 嵌套 PIXI
- 不支持 — 第二次 `startPixiApp` 会创建新的 `PIXI.Application`，但 canvas 会堆在 body 上覆盖。新应用的 z-order 由 DOM 顺序决定。
- 真要多个独立 PIXI 应用，请自己管理，不要走 startPixiApp。

### 复用 onReady 之外的逻辑
```ts
const destroy = startPixiApp((proxy) => {
  // 这里的代码只在 init 后跑一次
  setupScenes(proxy);
});

// 想在路由切换时也重新执行 setupScenes：
useEffect(() => { /* 上面这个 useEffect */ }, [route]);
```

---

## 应用范围

适合：
- **整个应用就是一张 PIXI 画布**（编辑器、画板、可视化、像素游戏）— startPixiApp 一次
- **路由切换的每个视图都用自己的 PIXI 场景** — 每个 Display 组件自己 `useEffect(() => startPixiApp(...), [])`，React 卸载时自动 cleanup
- **想在 PIXI 里画 React 组件以外的东西**（图形密集、动画密集）— 用 canvas 不用 React DOM

不适合：
- **多 React 组件各自画 PIXI 画布** — 同上会堆叠；用路由隔离
- **需要在 canvas 之上叠 HTML 控件**（按钮、输入框）— 那是另一个 DOM 层，会被 `e.target !== proxy.canvas` 过滤掉点击事件。绕过方案：自己加点击转发到 PIXI
- **SSR / 非浏览器环境** — `window` / `document.body` 都不存在；用 `import.meta.env.SSR` 守护

---

## 注意事项

1. **`init` 是异步**：onReady 之后才创建 proxy。同步代码里访问 `proxy` 是 null。
2. **canvas 挂在 body 末尾**：在 `index.css` 里设的 `#root` 样式不会影响它。
3. **`resolution` 和 `devicePixelRatio` 联动**：`autoDensity: true` 让 canvas CSS 尺寸 = 物理像素 / DPR，PIXI 自动处理高 DPI。
4. **`app.destroy(true, { children: true, texture: true })`** — 第一个 `true` 是 `RendererDestroyOptions` 的 `removeView`（虽然上面已经手动 removeChild 了，重复无害）；第二个是 `DestroyOptions`（销毁子级 + 纹理）。**v8.18 仍然支持这个签名**，不要写成 `app.destroy({ removeView: true })` 单参（那也行但要确保 canvas 不会泄露）。
5. **多次 startPixiApp 不会报错** — 但会有多个 canvas 叠在一起，且 `document.body.removeChild` 也只能摘掉最后一个。建议在路由组件里一个 `useEffect` 调一次。
6. **race condition**：onReady 可能在 React unmount 之后才到，那时 proxy 创建出来但 destroyFn 已被调。生产代码务必在 onReady 里用 `mounted` flag 守护。
7. **`POINTER_TYPES` 顺序不影响** — 注册了 4 种事件（down/move/up/leave），命中检测在 SubCanvas 内部做。
8. **不要在 onReady 外调用 `proxy`** — `proxy` 是 `let` 变量，作用域在 startPixiApp 闭包里，外部拿不到。
