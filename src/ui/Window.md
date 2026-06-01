# Window (HTML)

`src/ui/Window.tsx` — React 组件，做「多窗口 UI」的兼容层。每个人都能用、都依赖的稳定 API 表面；内部实现可换。

PIXI 那个 `createWindow` 还在 `src/ui/PixiWindow.ts`，是另一套（PIXI 容器），跟这个不冲突。

## Versioning

```
export const WINDOW_API_VERSION = '0.1.0';
```

DOM 上挂 `data-window-version={WINDOW_API_VERSION}`。版本号是 API 兼容性的承诺 — 改了 props/行为就 bump。

## Call Stack

```
<Window id title initial w h draggable closable zIndex onFocus onClose>
  ├─ <div root  data-window-id  data-window-version>   ← onPointerDown → onFocus
  │   ├─ <div titleBar  cursor:grab  touchAction:none>  ← onPointerDown/Move/Up/Cancel
  │   │   ├─ <span>{title}</span>
  │   │   └─ {closable && <button>×</button>}
  │   └─ <div content  flex:1  position:relative>      ← children 渲染在这
  │       └─ {children}                                ← 自己挂 click 监听
  └─ </div>
```

每个 Window 实例有独立的 `useState(pos)` + `useRef(drag)`。setPointerCapture 让 drag 事件只走 title bar，不会泄漏到其他 Window 或 children 的 canvas。

## API

```ts
type WindowProps = {
  id?: string;                  // 自动生成 'w1', 'w2', ...
  title?: ReactNode;            // 标题栏文字
  initial?: { x: number; y: number };  // 初始位置
  width: number | string;
  height: number | string;
  draggable?: boolean;          // 默认 true
  closable?: boolean;           // 默认 false
  zIndex?: number;              // 父级管理（见下）
  onFocus?: () => void;         // 任何 pointerdown 触发（包括 content）
  onClose?: () => void;         // 点 × 触发；不传则内部 setClosed(true)
  className?: string;
  style?: CSSProperties;        // 覆盖默认
  children?: ReactNode;
};
```

无 imperative ref。状态全在内部；外部靠 callback（onFocus / onClose）感知。

## Z-Order 模式

Window 不自带 stacking。父级管 `focusedId` state，传 `zIndex` 下去：

```tsx
const [focused, setFocused] = useState<string | null>(null);

<Window id="a" zIndex={focused === 'a' ? 10 : 1} onFocus={() => setFocused('a')}>
  ...
</Window>
<Window id="b" zIndex={focused === 'b' ? 10 : 1} onFocus={() => setFocused('b')}>
  ...
</Window>
```

drag / 点 content / 点 title bar 都会触发 onFocus → 父级 bump zIndex → 当前 Window 浮到顶。这是修复「点 B 响应 A」的关键。

## Usage — two-3d 例

```tsx
const [focused, setFocused] = useState<string | null>(null);
useEffect(() => {
  const canvasA = ref.current!.querySelector<HTMLCanvasElement>('canvas[data-3d="a"]')!;
  const canvasB = ref.current!.querySelector<HTMLCanvasElement>('canvas[data-3d="b"]')!;
  const a = mountTorusScene(canvasA);
  const b = mountIcoScene(canvasB);
  // 每窗口独立 click（不跨窗口）
  canvasA.addEventListener('click', () => a.setColor(Math.random() * 0xffffff));
  canvasB.addEventListener('click', () => b.setColor(Math.random() * 0xffffff));
  return () => { a.destroy(); b.destroy(); };
}, []);

return (
  <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
    <Window id="a" title="A · TorusKnot" initial={{x:24,y:32}} width={320} height={260}
            zIndex={focused === 'a' ? 10 : 1} onFocus={() => setFocused('a')}>
      <canvas data-3d="a" style={{width:'100%',height:'100%'}} />
    </Window>
    <Window id="b" title="B · Icosahedron" initial={{x:360,y:96}} width={320} height={260}
            zIndex={focused === 'b' ? 10 : 1} onFocus={() => setFocused('b')}>
      <canvas data-3d="b" style={{width:'100%',height:'100%'}} />
    </Window>
  </div>
);
```

## Scope

- ✅ Drag (title bar, pointer capture, position state)
- ✅ Z-order via parent `zIndex` prop + `onFocus` callback
- ✅ Close (× button, onClose callback or internal hide)
- ✅ Focus on any pointerdown（包括 children canvas）
- ❌ Resize（未做；后续可加 `resizable` prop）
- ❌ Min/Max（未做）
- ❌ Snap to edges（未做）
- ❌ Keyboard focus / Tab order（未做）

## Notes

### 为什么不用 Context 做 z-order
- Context 会让 Window 隐式依赖一个 Provider
- 父级显式管 zIndex 更可调试（React DevTools 里能看到 prop）
- 多 z-order 策略（focus-based / drag-based / manual）以后好加：换 onFocus 实现就行

### 为什么 onPointerDown 触发 onFocus 在 root
- 不光 drag（title bar）要 focus
- 点 content（包括里面的 canvas）也要 focus，不然点下面那层窗口的可见部分会响应错
- 这是修「点 B 响应 A」的关键

### 为什么 drag 用 setPointerCapture
- 用户拖出 title bar 边界后事件还能继续
- 不冒泡到 parent 或 sibling 的 Window
- 跟 PIXI 的 GameWindow drag（`src/ui/PixiWindow.ts`）的语义一致

### 为什么 children 自己挂 click
- Window 不假设 children 是什么（canvas / div / iframe）
- 把 click 决策权留给父级 / children
- 父级 useEffect 拿 `ref.current.querySelector(...)` 加 listener

### 已知 limitation
- 没 `useImperativeHandle`，外部不能 `.focus()` / `.close()` 调方法
- 没 transition 动画（dragging / closing 都是硬切）
- 没 bounds clamp（用户能把窗口拖出视口外）
- 父级如果忘了传 zIndex，所有窗口 zIndex=auto，DOM 顺序决定堆叠
