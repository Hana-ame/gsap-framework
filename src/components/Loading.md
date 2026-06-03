# ui/Loading — `showLoading`

盖在某个 SubCanvas 上的 loading 遮罩：半透黑底 + 旋转 spinner + 文字。后台调用 / 异步操作时用。

---

## 调用栈

### 显示
```
showLoading(sc, opts?)
  ├─ overlay (半透黑 Graphics)   sc.stage.addChild
  ├─ spinner (旋转的 8 个点)     sc.stage.addChild
  ├─ label (文字 Text)           sc.stage.addChild
  └─ sc.ticker.add(tick)
       tick(delta):
         t += delta.deltaMS / 1000
         spinner.clear()
         for i in 0..8:
           a = i/8 * 2π - 2t
           spinner.circle(cos(a)*14, sin(a)*14, 3)
                   .fill({ color, alpha: (i+1)/8 })
```

### 隐藏
```
returned hide()
  ├─ sc.ticker.remove(tick)         // 停动画
  ├─ sc.stage.removeChild(overlay / spinner / label)
  └─ destroy 它们
```

---

## API

```ts
function showLoading(
  sc: SubCanvas,
  opts?: string | LoadingOptions
): () => void   // hide

interface LoadingOptions {
  text?: string;                // 默认 'Loading...'
  spinnerColor?: number;         // 默认 0xffffff
  showSpinner?: boolean;         // 默认 true；false = 纯文字+遮罩，无旋转动画
  overlayColor?: number;         // 默认 0x000000
  overlayAlpha?: number;         // 默认 0.5
}
```

- `sc` — 盖在哪个 SubCanvas 上（一般是 root 或某个 panel）
- 返回 hide 函数，**必须调**否则 ticker 回调永远跑

---

## 使用

### 基础
```ts
const hide = showLoading(root, 'Loading inventory...');
fetch('/api/inventory').then((data) => {
  refreshUI(data);
  hide();
});
```

### 自定义颜色
```ts
const hide = showLoading(root, {
  text: 'Connecting...',
  spinnerColor: 0x00ff88,
  overlayAlpha: 0.7,
});
```

### 字符串简写
```ts
showLoading(root, 'Loading...');    // 等价于 { text: 'Loading...' }
```

### 失败处理
```ts
const hide = showLoading(root, 'Loading...');
try {
  await fetchData();
} catch (err) {
  console.error(err);
  showToast(root, 'Failed: ' + err.message);   // 假设有 toast 组件
} finally {
  hide();   // 一定要在 finally 调
}
```

### 多个 loading 叠加
每个 `showLoading` 都是独立的，hide 只关自己那一个：
```ts
const hideA = showLoading(panelA, 'A...');
const hideB = showLoading(panelB, 'B...');
// ...
hideA();
hideB();
```

---

## 应用范围

适合：
- **WebSocket 握手** / 鉴权等待
- **HTTP fetch 后台 API**
- **游戏场景加载**（纹理 / 模型 / 关卡）
- **保存到云端**（后台上传）
- **AI 决策**（NPC 思考中）

不适合：
- **长任务（>10s）** — 用户看不到进度；要做进度条用 `ProgressBar`
- **可取消的等待** — 当前没有 cancel 按钮；要就加 `onCancel` 回调
- **非阻塞通知** — 遮罩挡住整个 panel；非阻塞用 `Toast` / `Notification`
- **热重载**（npm run dev 时） — Vite 自己有

---

## 注意事项

1. **hide 一定要调** — 否则 `sc.ticker` 上的 `tick` 永远跑（每帧调 spinner.clear + 8 次 circle.fill）。React 里用 `useEffect` + `try/finally`。
2. **遮罩盖住 sc 的所有内容** — 包括 sc 自己的 listeners；用户没法在 loading 时操作。**后台调用必须能取消或超时**，否则 UX 卡死。
3. **spinner 中心是 sc.bounds 中心** — `sc.bounds.width / 2` + `sc.bounds.height / 2 - 10`（文字在 spinner 下方 18px）。bounds 变了 spinner 不自动跟 — 用 `setBounds` 触发 `onResize` 重新定位。
4. **alpha 0.5 默认** — 后面的 PIXI 内容透出来；游戏场景里可能闪烁，调高（比如 0.8）就稳。
5. **文字是单行** — 太长会自动换行但不会截断；建议 < 30 字符。
6. **8 个点的 spinner** — 旋转速度 `t * 2` rad/s（每帧 delta/1000 秒）— 改 `t * 2` 调速度。
7. **destroy 顺序** — `sc.ticker.remove(tick)` 在 removeChild 之前 — 否则下一帧 tick 还会跑（虽然 clear 是空的，但浪费）。
8. **EventBus 集成** — 复杂场景下推荐 `proxy.bus.emit('loading:start', { scope: 'inventory' })` / `'loading:end'`，多个组件统一响应。当前 showLoading 不用 bus，自己管理生命周期。
9. **未来后台**：可以把 showLoading 包成 `await withLoading(sc, async () => { return await fetch(...); })` — Promise 包装；要做就放 `src/api/withLoading.ts`。
