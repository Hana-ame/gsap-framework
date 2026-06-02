# Displays — `mountDisplays`

往任何 `SubCanvas` 上挂两个最常见的 demo 元素：**十字准星**（跟随鼠标）和**点击圆环**（点击扩散动画）。给 `MultipleDisplay` / `SingleDisplay` 共用。

---

## 调用栈

### 挂载
```
mountDisplays(sc)
  ├─ new PIXI.Graphics()  → crosshair（横竖两条线 + 坐标文本）
  ├─ new PIXI.Container() → clickLayer（所有点击圆环 + 标签的容器，方便清空）
  ├─ new PIXI.Text()      → moveText ("move: (x, y)")
  ├─ new PIXI.Text()      → clickCountText ("clicks: N")
  ├─ sc.stage.addChild(crosshair / clickLayer / moveText / clickCountText)
  ├─ sc.onMove(handler)    // 鼠标动 → 画十字 + 更新文本
  └─ sc.onPress(handler)   // 点击 → 加圆环 + 标签 + 注册 ticker 动画
```

### 鼠标移动
```
SubCanvas 'pointermove' event
  └─ moveHandler(e)
       ├─ crosshair.clear()
       │     .moveTo(x-10, y).lineTo(x+10, y)
       │     .moveTo(x, y-10).lineTo(x, y+10)
       │     .stroke({ width: 1, color: 0x00ff00, alpha: 0.8 })
       └─ moveText.text = `move: (${x.toFixed(0)}, ${y.toFixed(0)})`
```
每帧重画（不缓存） — 因为坐标实时变。

### 点击
```
SubCanvas 'pointerdown' event
  └─ pressHandler(e)
       ├─ clickCount += 1
       ├─ new PIXI.Graphics()  → ring（圆环）
       ├─ new PIXI.Text()      → label（"#N (x, y)"）
       ├─ clickLayer.addChild(ring, label)
       └─ const tick = (delta) => {                          // 动画
            t += delta.deltaMS / 700
            if (t >= 1) { sc.ticker.remove(tick); return }
            const r = 6 + t * 26, a = 1 - t
            ring.clear().setStrokeStyle({ width: 2, color, alpha: a })
                   .circle(x, y, r).stroke()
          }
       sc.ticker.add(tick)                                   // 订阅 ticker
       clickCountText.text = `clicks: ${clickCount}`
```

### 卸载
```
returned cleanup
  ├─ sc.stage.removeChild(crosshair / clickLayer / moveText / clickCountText)
  ├─ crosshair.destroy()
  ├─ clickLayer.destroy({ children: true })                  // 顺带销毁所有 ring/label
  ├─ moveText.destroy()
  └─ clickCountText.destroy()
```
**注意**：`cleanup` **不**调 `sc.ticker.remove(tick)` — 销毁 `sc` 时 PIXI.Ticker 会自动清理所有回调（`ticker.destroy()` 在 `app.destroy()` 里被调），所以没问题。

---

## API

```ts
function mountDisplays(sc: SubCanvas): () => void
```

- **入参**：任何 `SubCanvas`（顶层、嵌套都行）
- **返回**：cleanup 函数；调它会从 stage 摘下所有元素并 destroy
- **副作用**：
  - 加 4 个子对象到 `sc.stage`
  - 注册 2 个事件监听（onMove / onPress）
  - 点击时给 `sc.ticker` 加 1 个动画回调（700ms 后自动 remove 自己）

---

## 使用

### 在 SingleDisplay 里
```ts
const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
const cleanup = mountDisplays(root);
// useEffect cleanup 时调 cleanup()
```

### 在 MultipleDisplay 里（每个 quadrant 都挂）
```ts
const cells = root.grid({ rows: 2, cols: 2 });
cells.forEach((c) => {
  // ... 自己的 border / title
  const cleanup = mountDisplays(c);
  displayCleanups.push(cleanup);   // 收集起来统一清理
});
```

### 自定义点击颜色
当前硬编码 0xff00ff（紫红）+ 0x00ff00（绿）。要改：
- 改 `Displays.ts` 里的 `0xff00ff` / `0x00ff00` 字面量
- 或 fork 出自己的版本接受颜色参数

### 移除某一部分
- 想要不要点击圆环？删掉 pressHandler 那段
- 想要不要坐标文本？删掉 moveText / clickCountText
- 想要不要十字？删掉 crosshair

---

## 应用范围

适合：
- **快速验证 SubCanvas 事件路由是否工作** — 任何 SubCanvas 上挂一个就能看到点击和移动
- **调试嵌套区域** — 哪个 quadrant 收到事件一目了然
- **demo / 教学** — 展示容器的事件模型

不适合：
- **生产 UI** — 颜色、字号、动画曲线都是 demo 风格
- **需要持久化** — 不存 localStorage；刷新就没了
- **触摸 / 多点触控** — 当前只看 pointerdown/move，pinch / swipe 没处理
- **键盘事件** — 完全不涉及键盘

---

## 注意事项

1. **cleanup 不取消 ticker 回调**：依赖 `sc.destroy()` → `app.destroy()` → `ticker.destroy()` 的链清理。**如果你只 cleanup 不 destroy，会内存泄露**。MultipleDisplay 的 useEffect 里 `displayCleanups.forEach(c => c()); destroy();` 顺序是对的（先清 display，再 destroy app）。
2. **clickLayer 销毁时 `{ children: true }`**：会顺带销毁所有 ring / label — 否则 orphan Graphics / Text 会泄露。
3. **坐标精度**：`x.toFixed(0)` — 整数像素。视觉上够了；精细到小数点后两位的话改 `.toFixed(2)`。
4. **动画 700ms**：`t += delta.deltaMS / 700` — 700ms 内 r 从 6 涨到 32，alpha 从 1 减到 0。改 `700` 调速度。
5. **`sc.ticker.add(tick)` 不是 `addOnce`**：每帧调，回调内自己判断 `t >= 1` 时 `remove`。**没有 ticker.remove 就会一直跑**，直到 sc 销毁。
6. **没有 throttle / debounce**：移动事件每像素触发，crosshair 每帧 `clear() + stroke()`。PIXI 渲染很快没问题；低端设备可能掉帧。
7. **crosshair / clickLayer / moveText / clickCountText 没有 z-order 保证**：按 `addChild` 顺序渲染 — 文本在最上，crosshair 第二，clickLayer 垫底（垫底是对的，否则 clickLayer 的 ring 会盖住坐标）。
8. **mouseout 不清 crosshair**：mouseleave 后十字光标残留最后一个位置。要清就再加 `sc.onLeave(() => crosshair.clear())`。
