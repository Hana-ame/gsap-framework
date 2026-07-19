import * as PIXI from 'pixi.js';

/* ===================================================
 * SubCanvas －画布分区系统
 *
 * 每个 SubCanvas 对应一块矩形区域，有独立的：
 *   - PIXI.Container（stage）— 内容挂载点
 *   - 事件路由（pointerdown/move/up/tap）
 *   - 拖拽行为（标题栏 / 任意位置 / 禁用）
 *   - 生命周期（创建 / resize / destroy）
 *
 * 类比 DOM 的 <div>，但在 Canvas 上实现。
 * 支持递归嵌套，事件自动路由到正确的 region 内，
 * 坐标已转换成 region-local，不需手算 getLocalPosition。
 * =================================================== */

/* ---- 基础类型定义 ---- */

/** 矩形区域 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 框架内统一的 pointer 事件类型（5 种） */
export type SubPointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointerleave' | 'tap';

/**
 * 框架内统一的 pointer 事件对象。
 * `x/y` 是 region-local 坐标，`globalX/globalY` 是 client 坐标。
 */
export interface SubPointerEvent {
  type: SubPointerType;
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  originalEvent: PointerEvent;
}

type Listener = (e: SubPointerEvent) => void;

/** 拖拽模式：标题栏 / 任意位置 / 禁用 */
export type SubDragMode = 'title' | 'anywhere' | 'none';

/** SubCanvas 构造选项 */
export interface SubCanvasOptions {
  rootApp: PIXI.Application;
  bounds: Rect;
  parent?: SubCanvas | null;
  clipToBounds?: boolean;
  dragMode?: SubDragMode;
  dragBounds?: () => Rect | null;
  dragBringToFront?: boolean;
  tapThreshold?: number;
  onDragStart?: (e: { x: number; y: number }) => void;
  onDrag?: (e: { x: number; y: number }) => void;
  onDragEnd?: (e: { x: number; y: number }) => void;
  onDestroy?: () => void;
}

/* ---- 拖拽系统 ---- */

/** 用于标记可拖拽的 Container（标题栏），避免事件冲突 */
const DRAG_HANDLE_LABEL = 'subcanvas-drag-handle';

/** 拖拽回调集。由 dragMode 决定安装方式 */
type DragHandlers = {
  onStart?: (p: { x: number; y: number }) => void;
  onDrag?: (p: { x: number; y: number }) => void;
  onEnd?: (p: { x: number; y: number }) => void;
  getBounds?: () => Rect | null;
  bringToFront: boolean;
};

/* ===================================================
 * SubCanvas 类
 * =================================================== */
export class SubCanvas {
  /** PIXI 容器——所有内容添加到这里 */
  readonly stage: PIXI.Container;
  /** 父区域（null 表示 root） */
  readonly parent: SubCanvas | null;
  /** 共享的 PIXI Application */
  readonly rootApp: PIXI.Application;

  private _bounds: Rect;
  /** 子 SubCanvas 列表 */
  private _subRegions: SubCanvas[] = [];
  /** 框架内事件监听器（onPress/onMove/onRelease/onTap） */
  private listeners: Map<SubPointerType, Set<Listener>> = new Map();
  /** resize 回调 */
  private resizeListeners: Set<(bounds: Rect) => void> = new Set();
  private _destroyed = false;
  /** setBounds 重入保护 */
  private _syncing = false;
  /** clipToBounds 遮罩 Graphics */
  private _mask: PIXI.Graphics | null = null;
  /** 拦截事件用的透明容器（dragMode === 'anywhere' 时创建） */
  private _bg: PIXI.Container | null = null;
  /** 已安装拖拽的 handle 容器 */
  private _dragHandles: WeakSet<PIXI.Container> = new WeakSet();
  /** dragMode 回调集 */
  private _dragHandlers: DragHandlers | null = null;
  /** 每个 handle 的清理函数索引（用于 removeChild 时解绑事件） */
  private _perHandleCleanups: Map<PIXI.Container, () => void> = new Map();
  /** 判定 tap 的移动阈值（px） */
  private _tapThreshold: number;
  /** pointerdown 的起始位置，用于区分 tap 和 drag */
  private _pressStart: { x: number; y: number; clientX: number; clientY: number } | null = null;
  private _pressMoved = false;
  private onDestroy: () => void;

  constructor(opts: SubCanvasOptions) {
    this.rootApp = opts.rootApp;
    this._bounds = opts.bounds;
    this.parent = opts.parent ?? null;
    this.onDestroy = opts.onDestroy ?? (() => {});
    this._tapThreshold = opts.tapThreshold ?? 4;

    /* 创建 stage，定位到 bounds 的 (x, y) */
    this.stage = new PIXI.Container();
    this.stage.position.set(opts.bounds.x, opts.bounds.y);

    /* clipToBounds：用 Graphics mask 裁剪内容 */
    if (opts.clipToBounds) {
      this._mask = new PIXI.Graphics();
      this.stage.addChild(this._mask);
      this.stage.mask = this._mask;
      this.updateMask();
    }

    /* 挂到父级 stage 或 rootApp.stage */
    if (this.parent) {
      this.parent.stage.addChild(this.stage);
    } else {
      this.rootApp.stage.addChild(this.stage);
    }

    /* 初始化拖拽系统 */
    if (opts.dragMode && opts.dragMode !== 'none') {
      this._dragHandlers = {
        onStart: opts.onDragStart,
        onDrag: opts.onDrag,
        onEnd: opts.onDragEnd,
        getBounds: opts.dragBounds,
        bringToFront: opts.dragBringToFront !== false,
      };
      /* dragMode === 'anywhere' 时创建一个透明层拦截全区域事件 */
      if (opts.dragMode === 'anywhere') {
        this._ensureDragBg();
      }
      /* 已有的 handle 容器（如已完成 addChild 的标题栏）也要安装拖拽 */
      for (const child of this.stage.children) {
        if (child.label === DRAG_HANDLE_LABEL && !this._dragHandles.has(child)) {
          this._dragHandles.add(child);
          this._installDragOnHandle(child);
        }
      }
    }
  }

  /* ---- 属性访问器 ---- */

  get bounds(): Rect {
    return this._bounds;
  }

  /** 递归累加父级的坐标，得到相对根应用 stage 的全局矩形 */
  get globalBounds(): Rect {
    if (!this.parent) return { ...this._bounds };
    const pg = this.parent.globalBounds;
    return {
      x: pg.x + this._bounds.x,
      y: pg.y + this._bounds.y,
      width: this._bounds.width,
      height: this._bounds.height,
    };
  }

  get ticker(): PIXI.Ticker {
    return this.rootApp.ticker;
  }

  get renderer(): PIXI.Renderer {
    return this.rootApp.renderer;
  }

  get canvas(): HTMLCanvasElement {
    return this.rootApp.canvas as HTMLCanvasElement;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get subRegions(): readonly SubCanvas[] {
    return this._subRegions;
  }

  /* ---- 事件绑定（快捷方法） ---- */

  onPress(fn: Listener): this {
    return this.addListener('pointerdown', fn);
  }

  onMove(fn: Listener): this {
    return this.addListener('pointermove', fn);
  }

  onRelease(fn: Listener): this {
    return this.addListener('pointerup', fn);
  }

  onLeave(fn: Listener): this {
    return this.addListener('pointerleave', fn);
  }

  onTap(fn: Listener): this {
    return this.addListener('tap', fn);
  }

  offPointer(type: SubPointerType, fn: Listener): this {
    this.listeners.get(type)?.delete(fn);
    return this;
  }

  onResize(fn: (bounds: Rect) => void): this {
    this.resizeListeners.add(fn);
    return this;
  }

  /* ---- 位置 / 大小变更 ---- */

  /** 设置位置 + 大小。触发 mask 更新、resize 回调 */
  setBounds(bounds: Rect): void {
    if (this._destroyed) return;
    /* _syncing 防止递归（setBounds 内调 resizeListeners，listener 可能又调 setBounds） */
    this._syncing = true;
    this._bounds = bounds;
    this.stage.position.set(bounds.x, bounds.y);
    this._syncing = false;
    this.updateMask();
    this.updateBgHitArea();
    this.resizeListeners.forEach((fn) => fn(bounds));
  }

  /** 仅设置位置（不动 size），不触发 resize 回调 */
  setPosition(x: number, y: number): void {
    if (this._destroyed) return;
    this._syncing = true;
    this._bounds = { ...this._bounds, x, y };
    this.stage.position.set(x, y);
    this._syncing = false;
  }

  /** 仅设置大小（不动位置） */
  setSize(width: number, height: number): void {
    if (this._destroyed) return;
    this._bounds = { ...this._bounds, width, height };
    this.updateMask();
    this.updateBgHitArea();
    this.resizeListeners.forEach((fn) => fn(this._bounds));
  }

  /* ---- z-order ---- */

  /**
   * 提到所有兄弟之上。
   * zIndex 策略：只增不减。注意 IEEE 754 精度问题：
   * 超过 2^25（3355 万）时 ULP ≥ 4，+1 因舍入到偶数永不进位，bringToFront 会卡死。
   * 目前无需处理（zIndex 不会达到这个量级），但需要知道这个限制。
   */
  bringToFront(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.sortableChildren = true;
    let max = this.stage.zIndex;
    for (const child of parent.children) {
      if (child === this.stage) continue;
      if (child.zIndex > max) max = child.zIndex;
    }
    this.stage.zIndex = max + 1;
    /* 同步 _subRegions 顺序（最后一个是顶层） */
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.push(this);
    }
  }

  sendToBack(): void {
    const parent = this.stage.parent;
    if (!parent) return;
    parent.sortableChildren = true;
    let min = this.stage.zIndex;
    for (const child of parent.children) {
      if (child === this.stage) continue;
      if (child.zIndex < min) min = child.zIndex;
    }
    this.stage.zIndex = min - 1;
    if (this.parent) {
      const idx = this.parent._subRegions.indexOf(this);
      if (idx >= 0) this.parent._subRegions.splice(idx, 1);
      this.parent._subRegions.unshift(this);
    }
  }

  /* ---- 子对象管理 ---- */

  /**
   * addChild 时自动检查：如果 child 的 label 是 DRAG_HANDLE_LABEL，
   * 且当前 region 配置了拖拽，给这个 child 安装拖拽事件。
   * 这样外部创建标题栏容器后只需设置 label，拖拽自动生效。
   */
  addChild<T extends PIXI.Container>(child: T): T {
    const added = this.stage.addChild(child) as T;
    if (this._dragHandlers && child.label === DRAG_HANDLE_LABEL && !this._dragHandles.has(child)) {
      this._dragHandles.add(child);
      this._installDragOnHandle(child);
    }
    return added;
  }

  removeChild<T extends PIXI.Container>(child: T): T {
    if (this._dragHandles.has(child)) {
      this._uninstallDragOnHandle(child);
      this._dragHandles.delete(child);
    }
    if (this._bg === child) this._bg = null;
    return this.stage.removeChild(child) as T;
  }

  /** 移除外层用户添加的子对象（保留内部 _mask 和 _bg） */
  removeChildren(): PIXI.Container[] {
    const internal = new Set<PIXI.Container>();
    if (this._mask) internal.add(this._mask);
    if (this._bg) internal.add(this._bg);
    const toRemove = this.stage.children.filter((c) => !internal.has(c));
    toRemove.forEach((c) => {
      if (this._dragHandles.has(c)) {
        this._uninstallDragOnHandle(c);
        this._dragHandles.delete(c);
      }
    });
    toRemove.forEach((c) => this.stage.removeChild(c));
    return toRemove;
  }

  getChildAt(index: number): PIXI.Container {
    return this.stage.getChildAt(index);
  }

  getChildByLabel(label: string): PIXI.Container | null {
    return this.stage.getChildByLabel(label);
  }

  /* ---- PIXI 属性短路（直接代理到 stage） ---- */

  get children(): readonly PIXI.Container[] {
    return this.stage.children;
  }

  get position(): PIXI.ObservablePoint {
    return this.stage.position;
  }

  get scale(): PIXI.ObservablePoint {
    return this.stage.scale;
  }

  get pivot(): PIXI.ObservablePoint {
    return this.stage.pivot;
  }

  get rotation(): number { return this.stage.rotation; }
  set rotation(v: number) { this.stage.rotation = v; }

  get angle(): number { return this.stage.angle; }
  set angle(v: number) { this.stage.angle = v; }

  get alpha(): number { return this.stage.alpha; }
  set alpha(v: number) { this.stage.alpha = v; }

  get visible(): boolean { return this.stage.visible; }
  set visible(v: boolean) { this.stage.visible = v; }

  get tint(): number { return this.stage.tint; }
  set tint(v: number) { this.stage.tint = v; }

  get x(): number { return this.stage.x; }
  get y(): number { return this.stage.y; }

  get eventMode(): PIXI.EventMode { return this.stage.eventMode; }
  set eventMode(v: PIXI.EventMode) { this.stage.eventMode = v; }

  get label(): string { return this.stage.label; }
  set label(v: string) { this.stage.label = v; }

  /* ---- 内部方法 ---- */

  private addListener(type: SubPointerType, fn: Listener): this {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return this;
  }

  /** 裁剪遮罩（clipToBounds 模式），遇到已销毁的 Graphics 自动重建 */
  private updateMask(): void {
    if (!this._mask) return;
    try {
      this._mask
        .clear()
        .rect(0, 0, this._bounds.width, this._bounds.height)
        .fill({ color: 0xffffff });
    } catch {
      /* _mask 被意外销毁后的恢复：当父级 stage.destroy 级联下来，
       * 或者 removeChildren + 外部手动 destroy 时，_mask 可能已不可用。
       * 此时重建一个新的继续工作。 */
      if (this._mask.parent) this._mask.parent.removeChild(this._mask);
      this._mask = new PIXI.Graphics();
      this._mask
        .rect(0, 0, this._bounds.width, this._bounds.height)
        .fill({ color: 0xffffff });
      this.stage.addChild(this._mask);
      this.stage.mask = this._mask;
    }
  }

  private updateBgHitArea(): void {
    if (!this._bg) return;
    this._bg.hitArea = new PIXI.Rectangle(0, 0, this._bounds.width, this._bounds.height);
  }

  /**
   * 创建透明拦截层，用于 dragMode === 'anywhere'。
   * 这层 Container 全区域 eventMode = 'static'，用户点在任何位置
   * 都能触发 drag。zIndex = -1 让实际内容保持在视觉上层。
   */
  private _ensureDragBg(): void {
    if (this._bg) return;
    const existing = this.stage.children.find((c) => c.label === DRAG_HANDLE_LABEL);
    if (existing) return;
    const bg = new PIXI.Container();
    bg.label = DRAG_HANDLE_LABEL;
    bg.eventMode = 'static';
    bg.hitArea = new PIXI.Rectangle(0, 0, this._bounds.width, this._bounds.height);
    bg.zIndex = -1;
    this.stage.addChildAt(bg, 0);
    this._bg = bg;
  }

  /* ===================================================
   * 拖拽系统
   *
   * 设计要点：
   * 1. 同时绑定 PIXI stage 和 window 的 pointermove/up—
   *    鼠标移出 canvas 时靠 window 事件继续拖拽，不会"脱手"
   * 2. 拖拽坐标基于 clientX/Y，在 applyDrag 中统一处理，
   *    不依赖 PIXI 的事件 target 链
   * 3. 每个 handle 独立安装/卸载，支持动态 addChild/removeChild
   * =================================================== */

  private _installDragOnHandle(handle: PIXI.Container): void {
    if (!this._dragHandlers) return;
    const handlers = this._dragHandlers;
    const root = this.rootApp.stage;
    let dragging = false;
    let startLocalX = 0;
    let startLocalY = 0;
    let startBoundsX = 0;
    let startBoundsY = 0;

    /**
     * 核心拖拽计算：
     * 用 clientX/Y 做相对位移（不受 PIXI 坐标变换影响），
     * 叠加到 startBounds 得到新位置，再根据 dragBounds 约束 clamp。
     */
    const applyDrag = (clientX: number, clientY: number) => {
      const local = { x: clientX, y: clientY };
      let nx = startBoundsX + (local.x - startLocalX);
      let ny = startBoundsY + (local.y - startLocalY);
      const constraint = handlers.getBounds?.() ?? this.parent?.bounds ?? null;
      if (constraint) {
        nx = Math.max(0, Math.min(nx, constraint.width - this._bounds.width));
        ny = Math.max(0, Math.min(ny, constraint.height - this._bounds.height));
      }
      this.setPosition(nx, ny);
      handlers.onDrag?.({ x: nx, y: ny });
    };

    const onDown = (e: PIXI.FederatedPointerEvent) => {
      e.stopPropagation();
      const parent = this.stage.parent;
      if (!parent) return;
      const local = e.getLocalPosition(parent);
      dragging = true;
      startLocalX = local.x;
      startLocalY = local.y;
      startBoundsX = this._bounds.x;
      startBoundsY = this._bounds.y;
      if (handlers.bringToFront) this.bringToFront();
      /* 安装 window-level 事件——关键：鼠标移出 canvas 仍能接收 move */
      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowUp);
      handlers.onStart?.({ x: this._bounds.x, y: this._bounds.y });
    };

    const onWindowMove = (e: PointerEvent) => {
      if (!dragging) return;
      applyDrag(e.clientX, e.clientY);
    };

    const onWindowUp = () => {
      if (!dragging) return;
      dragging = false;
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      handlers.onEnd?.({ x: this._bounds.x, y: this._bounds.y });
    };

    const onPxiMove = (e: PIXI.FederatedPointerEvent) => {
      if (!dragging) return;
      const parent = this.stage.parent;
      if (!parent) return;
      const local = e.getLocalPosition(parent);
      applyDrag(local.x, local.y);
    };

    const onPxiUp = () => {
      if (!dragging) return;
      onWindowUp();
    };

    handle.on('pointerdown', onDown);
    root.on('pointermove', onPxiMove);
    root.on('pointerup', onPxiUp);
    root.on('pointerupoutside', onPxiUp);

    this._perHandleCleanups.set(handle, () => {
      handle.off('pointerdown', onDown);
      root.off('pointermove', onPxiMove);
      root.off('pointerup', onPxiUp);
      root.off('pointerupoutside', onPxiUp);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    });
  }

  private _uninstallDragOnHandle(handle: PIXI.Container): void {
    const cleanup = this._perHandleCleanups.get(handle);
    if (cleanup) {
      cleanup();
      this._perHandleCleanups.delete(handle);
    }
  }

  /* ---- 子 region 创建 ---- */

  /** @deprecated 使用 createRegion */
  createSubRegion(
    bounds: Rect,
    opts?: {
      clipToBounds?: boolean;
      dragMode?: SubDragMode;
      dragBounds?: () => Rect | null;
      dragBringToFront?: boolean;
      onDragStart?: (e: { x: number; y: number }) => void;
      onDrag?: (e: { x: number; y: number }) => void;
      onDragEnd?: (e: { x: number; y: number }) => void;
    },
  ): SubCanvas {
    return this.createRegion(bounds, opts);
  }

  /**
   * 创建子 SubCanvas。子区域继承 rootApp，通过 parent 构建嵌套树。
   * onDestroy 回调自动从 _subRegions 中移除自身。
   */
  createRegion(
    bounds: Rect,
    opts?: {
      clipToBounds?: boolean;
      dragMode?: SubDragMode;
      dragBounds?: () => Rect | null;
      dragBringToFront?: boolean;
      onDragStart?: (e: { x: number; y: number }) => void;
      onDrag?: (e: { x: number; y: number }) => void;
      onDragEnd?: (e: { x: number; y: number }) => void;
    },
  ): SubCanvas {
    const sub = new SubCanvas({
      rootApp: this.rootApp,
      bounds,
      parent: this,
      clipToBounds: opts?.clipToBounds,
      dragMode: opts?.dragMode,
      dragBounds: opts?.dragBounds,
      dragBringToFront: opts?.dragBringToFront,
      onDragStart: opts?.onDragStart,
      onDrag: opts?.onDrag,
      onDragEnd: opts?.onDragEnd,
      onDestroy: () => {
        const idx = this._subRegions.indexOf(sub);
        if (idx >= 0) this._subRegions.splice(idx, 1);
      },
    });
    this._subRegions.push(sub);
    return sub;
  }

  /* ===================================================
   * 事件路由
   *
   * handlePointer 是整个框架的事件中枢。
   * 从 PixiApp（或 SubCanvasProxy）收到原始 PointerEvent 后：
   *   1. hit-test → 逐级下传到子 region 优先消费
   *   2. 本地处理 → 转换坐标、区分 tap/drag、触发 listener
   *
   * 为什么不在 stage 上加 PIXI 原生事件？
   *   因为 SubCanvas 的坐标是相对于 region 的，如果用 PIXI 原生的
   *   FederatedPointerEvent，坐标受 stage 的 position/scale 影响，
   *   需要在每个 handler 里手算 getLocalPosition。
   *   统一在 handlePointer 里算一次，所有 listener 拿到的 x/y 已经是 local 坐标。
   * =================================================== */

  /**
   * 处理 pointer 事件。
   * @returns true = 事件已消费，父级不应再处理
   */
  handlePointer(type: SubPointerType, e: PointerEvent): boolean {
    if (this._destroyed) return false;
    /* hit-test：检查是否在本 region 的 bounds 内 */
    const gb = this.globalBounds;
    const gx = e.clientX;
    const gy = e.clientY;
    if (gx < gb.x || gx > gb.x + gb.width) return false;
    if (gy < gb.y || gy > gb.y + gb.height) return false;

    /* 按 z-order 倒序下传子 region（视觉顶层的先得到事件） */
    for (let i = this._subRegions.length - 1; i >= 0; i--) {
      if (this._subRegions[i].handlePointer(type, e)) return true;
    }

    /* 转换 region-local 坐标 */
    const localX = gx - gb.x;
    const localY = gy - gb.y;

    /* tap 检测：pointerdown 时记录起始位置，move 时检查是否超过阈值，
     * pointerup 时如果没超过阈值且在阈值内，触发 tap 事件。
     * 这样 tap 和 drag 使用同一套 press→move→release 流程，
     * 不需要额外的 click 事件绑定。 */
    if (type === 'pointerdown') {
      this._pressStart = { x: localX, y: localY, clientX: gx, clientY: gy };
      this._pressMoved = false;
    } else if (type === 'pointermove' && this._pressStart) {
      const dx = gx - this._pressStart.clientX;
      const dy = gy - this._pressStart.clientY;
      if (dx * dx + dy * dy >= this._tapThreshold * this._tapThreshold) {
        this._pressMoved = true;
      }
    } else if (type === 'pointerup' && this._pressStart) {
      const start = this._pressStart;
      this._pressStart = null;
      if (!this._pressMoved) {
        const dx = gx - start.clientX;
        const dy = gy - start.clientY;
        if (dx * dx + dy * dy < this._tapThreshold * this._tapThreshold) {
          const tapEvent: SubPointerEvent = {
            type: 'tap',
            x: localX,
            y: localY,
            globalX: gx,
            globalY: gy,
            originalEvent: e,
          };
          this.listeners.get('tap')?.forEach((fn) => fn(tapEvent));
        }
      }
    } else if (type === 'pointerleave') {
      this._pressStart = null;
      this._pressMoved = false;
    }

    /* 如果有注册的 listener 才往下发，避免创建不必要的 SubPointerEvent */
    const hasListeners = (this.listeners.get(type)?.size ?? 0) > 0;
    if (!hasListeners) return false;

    const sub: SubPointerEvent = {
      type,
      x: localX,
      y: localY,
      globalX: gx,
      globalY: gy,
      originalEvent: e,
    };
    this.listeners.get(type)!.forEach((fn) => fn(sub));
    return true;
  }

  /* ---- 销毁 ---- */

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    /* 先清理拖拽事件（window-level 事件必须主动 remove） */
    for (const cleanup of this._perHandleCleanups.values()) cleanup();
    this._perHandleCleanups.clear();
    /* 递归销毁子 region */
    [...this._subRegions].forEach((c) => c.destroy());
    this._subRegions = [];
    this.listeners.clear();
    this.resizeListeners.clear();
    if (this.stage.parent) this.stage.parent.removeChild(this.stage);
    try {
      this.stage.destroy({ children: true, texture: false });
    } catch {
      /* stage 已被父级 destroy 级联销毁 */
    }
    this.onDestroy();
  }
}
