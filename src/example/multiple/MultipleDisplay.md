# MultipleDisplay

`#multiple` 路由对应的视图：root 全屏 → `grid(2×2)` 切 4 个 quadrant，每个 quadrant 有边框 + 标题 + demo 显示元素。窗口 resize 时整布局自动重算。

---

## 调用栈

### 挂载
```
URL → #multiple
  └─ RouteSwitch → case 'multiple' → <MultipleDisplay />
       └─ useEffect(() => { ... }, [])
            ├─ displayCleanups = []
            ├─ cleanupResize = null
            ├─ destroy = startPixiApp((proxy) => {
            │     const W = window.innerWidth
            │     const H = window.innerHeight
            │     const colors = [0xff6688, 0x66ff88, 0x6688ff, 0xffff66]
            │     const cols = 2, rows = 2
            │     │
            │     ├─ const root = proxy.createRegion({ x:0, y:0, width:W, height:H })
            │     ├─ const quadrants = root.grid({ rows, cols })    // [q0, q1, q2, q3]
            │     │
            │     ├─ quadrants.forEach((q, i) => {
            │     │     const color = colors[i]
            │     │     ├─ new PIXI.Graphics() → border
            │     │     ├─ new PIXI.Text() → title (`Window ${i+1}`)
            │     │     ├─ q.stage.addChild(border, title)
            │     │     ├─ q.onResize(b => {                       // 边框随 quadrant 缩放
            │     │     │     border.clear().rect(0, 0, b.width, b.height)
            │     │     │           .stroke({ width: 2, color, alpha: 0.6 })
            │     │     │  })
            │     │     └─ mountDisplays(q) → displayCleanups.push(cleanup)
            │     │  })
            │     │
            │     ├─ const layout = (W, H) => {
            │     │     root.setBounds({ x:0, y:0, width:W, height:H })
            │     │     quadrants.forEach((q, i) => {
            │     │       const row = Math.floor(i / cols), col = i % cols
            │     │       const qW = W / cols, qH = H / rows
            │     │       q.setBounds({ x: col*qW, y: row*qH, width: qW, height: qH })
            │     │     })
            │     │  }
            │     ├─ layout(W, H)                                   // 首次布局（触发 onResize 画边框）
            │     └─ cleanupResize = proxy.onWindowResize(
            │           () => layout(window.innerWidth, window.innerHeight)
            │        )
            │  })
            └─ return cleanup:
                 ├─ cleanupResize?.()
                 ├─ displayCleanups.forEach(c => c())
                 └─ destroy()
```

### 首次布局（为什么 border 在 mount 后立刻可见）
```
layout(W, H) 第一次跑
  └─ root.setBounds(...) → 不触发 onResize（root 没注册）
  └─ quadrants[0].setBounds({x:0,    y:0,    width:W/2, height:H/2})
       └─ 触发 onResize → border.clear().rect(0, 0, W/2, H/2).stroke(...)
  └─ quadrants[1].setBounds({x:W/2,  y:0,    width:W/2, height:H/2})
  └─ quadrants[2].setBounds({x:0,    y:H/2,  width:W/2, height:H/2})
  └─ quadrants[3].setBounds({x:W/2,  y:H/2,  width:W/2, height:H/2})
```

### 窗口 resize
```
window 'resize'
  └─ PixiApp 的 onResize → app.renderer.resize(W, H)            // 1. canvas 缩放
  └─ proxy.onWindowResize 的回调 → layout(W, H)                // 2. SubCanvas 重布
       └─ root.setBounds(...) + 4 个 quadrant.setBounds(...)     // 3. 触发各 quadrant onResize
            └─ border.redraw(b)                                   // 4. 边框重画
```

### 点击事件路由
```
用户在左上 quadrant 点击
  └─ window 'pointerdown'
       └─ proxy.routePointer
            └─ root.handlePointer
                 ├─ 命中（globalBounds = 全屏）
                 ├─ 递归 children：
                 │     quadrants[0].handlePointer
                 │       ├─ 命中（globalBounds = 左上半屏）
                 │       └─ 派发 onPress
                 │            ├─ mountDisplays 的 pressHandler    // 加 click ring
                 │            └─ (没有自己的 onPress 注册)
                 │       return true                              // 冒泡停止
                 └─ 父级 onPress 不会被触发
```

### 路由切走
```
URL 变 #single
  └─ React 卸载 <MultipleDisplay />
       └─ useEffect cleanup
            ├─ cleanupResize?.()         // 注销 resize 监听
            ├─ displayCleanups.forEach   // 4 个 mountDisplays cleanup
            │     └─ 各自清 crosshair/click ring
            └─ destroy()
                 └─ proxy.destroyAll()   // 销毁 root，级联销毁 4 个 quadrant
                      └─ quadrant.stage.destroy()    // 边框、标题、demo 全没了
```

---

## API

```ts
export function MultipleDisplay(): null
```

- **无 props**
- **返回 `null`** — PIXI 渲染，不输出 React DOM
- **副作用**：
  - 启动一个 `PIXI.Application`
  - 创建 1 个 root SubCanvas + 4 个 quadrant SubCanvas
  - 4 个 window 事件 + 1 个 resize 监听

---

## 使用

### 改网格规格
```ts
const cols = 3, rows = 2;
const quadrants = root.grid({ rows, cols, gap: 8 });
// 同步改 colors 数组长度
const colors = [0xff6688, 0x66ff88, 0x6688ff, 0xffff66, 0x66ffff, 0xff66ff];
// 同步改 layout 里的 qW/qH
```

### 改边框颜色 / 粗细
```ts
q.onResize((b) => {
  border.clear()
        .rect(0, 0, b.width, b.height)
        .stroke({ width: 4, color: 0xffffff, alpha: 0.9 });
});
```

### 改标题位置（左上 → 居中）
```ts
q.onResize((b) => {
  // 假设 title 已存在
  title.x = (b.width - title.width) / 2;
  title.y = (b.height - title.height) / 2;
});
```

### 不要 border / title（只留 displays）
```tsx
quadrants.forEach((q) => {
  // 删掉 border/title 那两段
  displayCleanups.push(mountDisplays(q));
});
```

### 不等分（自定义行高 / 列宽）
```ts
const quadrants = root.divide({ direction: 'horizontal', ratios: [0.3, 0.7] })
                       .flatMap((row) => row.divide({ direction: 'vertical', ratios: [0.5, 0.5] }));
// 现在是 2 行 × 2 列，但行高 30/70，列宽 50/50
```

### 关闭 resize 响应
```ts
// 删掉
//   layout(W, H)
//   cleanupResize = proxy.onWindowResize(...)
// 首次创建时的 bounds 一直不变；窗口 resize 时 quadrant 不会跟着缩
```

---

## 应用范围

适合：
- **多面板并列**（编辑器多文档、仪表盘、监控大屏 2×2）
- **游戏地图分块渲染**（可视区分成 4 块分别 update）
- **多对比视图**（同一组数据 4 种可视化并排）
- **教学 / demo**（一个页面看 4 个不同 PIXI 效果）

不适合：
- **悬浮 / 拖动 / z-order**（4 个 quadrant 固定位置固定大小）
- **重叠 quadrant**（grid 不支持；用 `createSubRegion` 手动指定）
- **非整除网格**（grid 强行均分；用 `divide`）
- **响应式断点**（"宽屏 4 列，窄屏 2 列"）— 当前的 layout 函数是均分；要做断点就在 layout 里 `if (W > 1000) cols = 4; else cols = 2;` 重新调用 `quadrants.forEach((q, i) => { ... })` 算 setBounds 参数

---

## 注意事项

1. **首次 `layout(W, H)` 必须调** — 不调的话 quadrant 的 bounds 是 grid 创建时的（也是 W, H 但要再确认）；调了之后 border onResize 才会首次触发画出边框。
2. **`q.setBounds` 在 `onResize` 之前还是之后** — 顺序是 `q.setBounds` → 触发 `onResize`。回调里读 `b.width` 是新值（setBounds 传进来的）；读 `q.bounds` 也已经是新值。
3. **grid 创建的 quadrant 在 root.children 数组里** — 销毁时 root.destroy() 级联销毁 quadrant；不需要手动 `forEach quadrant.destroy()`。
4. **`proxy.onWindowResize` 必须在 layout 之后注册** — 顺序反了会怎样？先注册后 layout → 第一次 resize 时 `layout` 才被定义（其实在同一个闭包里，引用早就存在了）。无所谓；当前代码顺序是安全的。
5. **`cleanupResize?.()` 一定要调** — 不调的话切路由时旧的 listener 永远活着，每次 resize 都会调旧 layout（闭包持有的 root 已 destroy，会 throw 或静默失败）。
6. **mounted flag / AbortController** — 同 SingleDisplay：onReady 异步，如果 unmount 之后才到，cleanup 漏，泄露。
7. **quadrant.border 是闭包** — `q.onResize(b => border.clear()...)` 里的 border 引用是 `forEach` 当次迭代的；如果换成 `for (let i = 0; ...; i++)` 写法要小心 `let` vs `const`。
8. **4 个 mountDisplays cleanup 在 destroy 之前** — 同 SingleDisplay：先清内容再 destroy app，否则 ticker 销毁后 cleanup 移除 ticker 回调可能报错。
