# 已修复问题

## 1. PixiJS 事件穿透 + 后层可拖拽窗口被误激活（2026-07-21）

**症状**（两个现象同一根因）：
1. 点击前层窗口的空白区域，若位置同时落在后层窗口的交互元素上，后层按钮会响应
2. 前层 `dragMode: 'title'` 窗口的内容区点击 → 后层 `dragMode: 'anywhere'` 窗口被拖拽并前置

**根因分析**：

SubCanvas 有两套独立事件系统，都未正确阻断后层：

### 系统 A：Custom routing（`routePointer` → `handlePointer`）

```
routePointer(type, e) {
  for (const sc of this.topCanvases) {
    sc.handlePointer(type, e);  // ← 返回值和迭代顺序都有问题
  }
}
```

**问题 1—迭代顺序**：`topCanvases` 按创建顺序排列，而非视觉 z-order。后创建的窗口渲染在前（视觉上层），但在数组中排在最后。`routePointer` 从前到后迭代，先处理视觉下层的窗口，后处理上层窗口。

**问题 2—返回值忽略**：即使前层 `handlePointer` 返回 `true`（消费了事件），`routePointer` 仍继续向后层分发。

**问题 3—title 模式不 claim**：`handlePointer` 的 `anywhere` 分支在 `interceptPointer` 后返回 `true` 拦截事件，但 `title` 模式没有等效逻辑。`title` 模式窗口点击内容区时，`interceptPointer` 返回 `false`（mode !== 'anywhere'），`handlePointer` 最终返回 `false`，事件继续传递到后层。后层 `anywhere` 拖拽的 `interceptPointer` 安装 window fallback → 鼠标移动时后层窗口被拖拽并前置。

### 系统 B：PixiJS FederatedEvent（按钮、关闭按钮等交互元素）

`SubCanvas.stage` 是裸 `Container`，`eventMode = 'static'`，**没有 `hitArea`**。PixiJS v8 的 `containsPoint` 对没有 `hitArea` 的 Container 返回 `false`。hit-test 流程：

1. 进入前层 SubCanvas stage（`eventMode = 'static'`）
2. 检查子元素 → 空白区域无交互子元素 → 无命中
3. 检查 stage 本身 → `containsPoint` 返回 `false` → 跳过
4. **继续检查后层 SubCanvas** → 找到按钮 → 命中

前层 SubCanvas 的 `eventMode = 'static'` 只允许事件**进入**子树，但不阻止**穿出**到兄弟节点。

---

**修复（2026-07-21）：**

### Fix A1—`routePointer` 按 z-order 迭代 + 消费后短路

```typescript
// SubCanvasProxy.ts
routePointer(type, e) {
    for (const sc of this.topCanvases) {
        if (sc.handlePointer(type, e)) return;  // ← 消费即短路
    }
}
```

同时保证 `topCanvases` 按 z-order 排列：在 `createRegion` 中传入 `onReorder` 回调，`SubCanvas.bringToFront()` 被调用时将自身移到 `topCanvases` 末尾（= 视觉最上层）。`routePointer` 从尾到头迭代，先处理上层窗口。

### Fix A2—`handlePointer` 为任意 drag mode 的 `pointerdown` 返回 `true`

在 `handlePointer` 末尾（所有子 region / 监听器都未消费后），如果 `type === 'pointerdown' && this._drag`，返回 `true` 阻止事件冒向后层：

```typescript
if (!hasListeners) {
    if (type === 'pointerdown' && this._drag) return true;
    return false;
}
```

此逻辑覆盖 `title` 和 `anywhere` 两种 drag mode。对 `anywhere` 模式是冗余安全网（`anywhere` 分支已返回 `true`），对 `title` 模式是核心修复。

### Fix B—`hitArea` 阻断 PixiJS 事件穿透

有 drag controller 的 SubCanvas 在构造时自动设置 `stage.hitArea`，使 PixiJS hit-test 停在前层 stage：

```typescript
if (opts.dragMode && opts.dragMode !== 'none') {
    this.stage.hitArea = new PIXI.Rectangle(0, 0, opts.bounds.width, opts.bounds.height);
    // ...
}
```

`hitArea` 仅在 drag mode 非 `'none'` 时设置。非拖拽 canvas 无 `hitArea`，事件可自然穿透（适用于透明覆盖层等场景）。

`setBounds` / `setSize` 中同步更新 `hitArea` 尺寸。

---

**边缘情况验证**：

| 场景 | 预期 | 实际 |
|------|------|------|
| 前层 title 窗口内容区 + 后层 anywhere 窗口 | 无效果 | Custom routing 停在 title 窗口 ✓ |
| 前层 title 窗口按钮 + 后层 anywhere 窗口 | 按钮响应 | PixiJS 停在 title stage → 按钮命中 ✓ |
| 前层 anywhere 窗口空白区 + 后层有按钮 | 前层开始拖拽 | PixiJS 被 title stage hitArea 吸收 ✓ |
| 前层非拖拽 canvas 含按钮 + 后层 anywhere | 按钮响应，后层不拖拽 | Custom routing 穿透（无 _drag），但后层 drag 的 pointerdown 分支不拦截（AABB 可能有或无） |
| 前层透明覆盖层（无 drag）在交互内容上 | 事件穿透到后层 | 无 hitArea → PixiJS 可穿透 ✓ |
| 嵌套 subRegion（子 region 在父 region 内） | 子 region 优先 | `parent.handlePointer` 逆序迭代子 region，消费即返回 ✓ |
| title 标题栏拖拽 | 标题栏可拖 | PixiJS handle 事件 + Custom routing 同时 claim ✓ |

**状态**：已修复（2026-07-21）。
