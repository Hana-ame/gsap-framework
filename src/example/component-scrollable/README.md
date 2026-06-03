# ComponentScrollableDisplay

Showcase for `createScrollable()` from `components/Scrollable.ts`. Three scrollable panels demonstrating vertical, horizontal, and no-scrollbar variants.

## Panels

| Panel    | Direction   | Scrollbar | Behavior                          |
|----------|-------------|-----------|-----------------------------------|
| top-left | vertical    | visible   | 50 text lines, wheel/drag/touch   |
| top-right| horizontal  | visible   | 20 color cards, wheel/drag        |
| bottom   | vertical    | hidden    | 30 items, wheel/drag, no bar      |

## API

```ts
createScrollable(parent: SubCanvas, opts: ScrollableOptions): Scrollable

interface ScrollableOptions {
  width: number;
  height: number;
  direction?: 'vertical' | 'horizontal';  // default 'vertical'
  scrollbar?: boolean;                     // default true
  accept?: { x?: number; y?: number };     // initial scroll offset
}

interface Scrollable {
  readonly stage: PIXI.Container;     // 根容器（eventMode='static'）
  readonly content: PIXI.Container;   // 内容容器（masked, 用户 addChild 到这里）
  readonly bounds: { width: number; height: number };
  scrollTo(x: number, y: number): void;    // 跳到指定位置
  scrollBy(dx: number, dy: number): void;  // 相对滚动
  recalc(): void;          // 重算内容尺寸（content 变化后调用）
  destroy(): void;
  readonly destroyed: boolean;
}
```

## Interaction

- **wheel**: 滚轮滚动（垂直方向）
- **drag**: 按住面板拖拽滚动（含 threshold=2px 防误触）
- **touch**: 触摸拖拽（同 drag 路径）
- **scrollbar**: 垂直/水平条指示当前滚动位置，仅内容超界时可见
