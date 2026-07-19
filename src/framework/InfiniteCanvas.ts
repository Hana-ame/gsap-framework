/* ===================================================
 * InfiniteCanvas －无限平移/缩放画布
 *
 * 核心思路：世界是无限的，但视口有限。用 chunk 做可见性管理：
 * 只加载视口附近的 chunk，远离视口的销毁。
 *
 * 坐标体系（三层）：
 *   1. 世界坐标（worldX/worldY）— 内容的自然坐标，不随视口变化
 *   2. 屏幕坐标（screenX/screenY）— 鼠标/触摸的像素位置
 *   3. _scrollX/_scrollY — 世界原点在屏幕上的像素位置（内部偏移）
 *
 * worldContainer 的 x/y 就是 _scrollX/_scrollY，scale 是 _zoom。
 * 公式：screen = world * zoom + scroll
 * 反向：world = (screen - scroll) / zoom
 *
 * 插件系统：DeceleratePlugin 是内置实现，可移除或用自定义插件替换。
 * =================================================== */

import * as PIXI from 'pixi.js';
import type { SubCanvas, SubPointerEvent, Rect } from './SubCanvas';

export interface Chunk {
  readonly cx: number;
  readonly cy: number;
  readonly container: PIXI.Container;
  readonly bounds: Rect;
}

export interface InfiniteCanvasPlugin {
  readonly name: string;
  priority: number;
  parent: InfiniteCanvas;
  onDown?(e: SubPointerEvent): void;
  onMove?(e: SubPointerEvent): void;
  onUp?(e: SubPointerEvent): void;
  onTap?(worldX: number, worldY: number): void;
  onUpdate?(elapsed: number): void;
  onResize?(): void;
  onDestroy?(): void;
}

/* ---- 减速参数 ---- */

/**
 * 摩擦系数 0.95 ≈ 每帧保留 95% 速度 → 1 秒后约 8%（60fps 时 0.95^60 ≈ 0.046）。
 * 这是一个"感觉对"的值：太快会像冰面，太慢会感觉黏滞。
 */
const FRICTION = 0.95;

/**
 * 速度低于此阈值时直接归零停止，避免"永远滑不完"。
 * 0.1 像素/帧 ≈ 4 秒后停（从 1 开始）。不能再小了，否则肉眼可见的微滑动会让
 * chunk 重算一直触发，浪费性能。
 */
const MIN_SPEED = 0.1;

/**
 * 时间窗口（ms）。onUp 时只取最后 50ms 内的样本算速度。
 * 这是关键优化：之前用全局 all-last-2-samples 策略，
 * 用户慢速拖拽较久后松开，"最后两点的差值/时间" 会低估速度。
 * 改用 50ms 滑动窗口后有两种情况：
 *   a) 快速滑动后突然停住再松开 — 最后 50ms 内速度≈0 → 无惯性
 *   b) 快速滑动后立即松开 — 最后 50ms 反映真实初始速度 → 有惯性
 */
const VELOCITY_WINDOW = 50;

/** 内置减速插件（惯性滑动） */
class DeceleratePlugin implements InfiniteCanvasPlugin {
  readonly name = 'decelerate';
  priority = 50;
  parent!: InfiniteCanvas;

  /* ---- 速度历史 ---- */
  private _saved: { x: number; y: number; time: number }[] = [];
  private _vx = 0;
  private _vy = 0;
  private _active = false;
  private _lastMoveTime = 0;

  onDown(): void {
    /* 开始新拖拽时清空历史，避免旧数据和当前拖拽混在一起 */
    this._saved = [];
    this._vx = 0;
    this._vy = 0;
    this._active = false;
    this._lastMoveTime = 0;
  }

  onMove(e: SubPointerEvent): void {
    /* 每秒最多 60 个样本（60fps * 50ms = 最多 3 个），60 足够 */
    const now = performance.now();
    this._lastMoveTime = now;
    this._saved.push({ x: e.globalX, y: e.globalY, time: now });
    if (this._saved.length > 60) this._saved.shift();
  }

  onUp(): void {
    const snapshot = this._saved;
    this._saved = [];

    /* 关键检查：鼠标松开前最后 50ms 没有移动 → 不触发惯性。
     * 场景：用户拖到目标位置后停住不动，等 50ms+ 再松开，
     * 说明用户想停在那个位置。如果直接松开就触发惯性，会"滑过头"。 */
    if (performance.now() - this._lastMoveTime > VELOCITY_WINDOW) return;

    if (snapshot.length < 2) return;
    const last = snapshot[snapshot.length - 1];
    let prev = snapshot[0];
    const cutoff = last.time - VELOCITY_WINDOW;
    for (let i = snapshot.length - 2; i >= 0; i--) {
      if (snapshot[i].time <= cutoff) {
        prev = snapshot[i];
        break;
      }
    }
    const dt = last.time - prev.time;
    if (dt <= 0) return;
    this._vx = (last.x - prev.x) / dt;
    this._vy = (last.y - prev.y) / dt;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) return;
    this._active = true;
  }

  /** 每帧按 friction 衰减速度 */
  onUpdate(elapsed: number): void {
    if (!this._active) return;
    /* 帧率无关的衰减：elapsed/16 归一化到 60fps */
    const factor = Math.pow(FRICTION, elapsed / 16);
    this._vx *= factor;
    this._vy *= factor;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) {
      this._vx = 0;
      this._vy = 0;
      this._active = false;
      return;
    }
    this.parent.panBy(this._vx * elapsed, this._vy * elapsed);
  }

  onDestroy(): void {
    this._saved = [];
    this._vx = 0;
    this._vy = 0;
    this._active = false;
  }

  stop(): void {
    this._active = false;
    this._vx = 0;
    this._vy = 0;
  }
}

export interface InfiniteCanvasOptions {
  parent: SubCanvas;
  viewport: Rect;
  chunkSize: number;
  preloadMargin?: number;
  chunkCreate: (chunk: Chunk) => void;
  chunkDestroy: (chunk: Chunk) => void;
  onDrag?: (worldX: number, worldY: number) => void;
  onTap?: (worldX: number, worldY: number) => void;
  decelerate?: boolean;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * 插件化的无限平移/缩放画布。
 *
 * 内部维护一个 `worldContainer`（PIXI.Container），通过 `_scrollX/_scrollY`
 * （屏幕像素偏移）和 `_zoom`（缩放）变换，将世界空间映射到视口。
 *
 * `_scrollX/_scrollY` 是 worldContainer 在父 SubCanvas stage 中的
 * x/y 位置。它们**不是世界坐标**，而是世界原点在屏幕上的像素位置。
 * 视口中心的世界坐标通过公式 `(viewportCenter - scroll) / zoom` 计算。
 */
export class InfiniteCanvas {
  readonly parent: SubCanvas;
  readonly chunkSize: number;

  /** worldContainer 承载所有 chunk 内容，通过 x/y/scale 实现平移和缩放 */
  readonly worldContainer: PIXI.Container;

  private _viewport: Rect;
  private _scrollX = 0;
  private _scrollY = 0;
  private _zoom: number;
  private _minZoom: number;
  private _maxZoom: number;
  private _chunks = new Map<string, Chunk>();
  private _chunkCreate: (chunk: Chunk) => void;
  private _chunkDestroy: (chunk: Chunk) => void;
  private _onDrag: ((x: number, y: number) => void) | null;
  private _onTap: ((worldX: number, worldY: number) => void) | null;
  private _preloadMargin: number;
  private _decelerate: DeceleratePlugin;
  private _plugins: InfiniteCanvasPlugin[] = [];
  private _dragCleanups: (() => void)[] = [];
  private _destroyed = false;
  private _tickFn: (() => void) | null = null;

  /**
   * 事件盾 — 拦截 pointerdown 防冒泡（stopPropagation）。
   * PIXI 的事件系统默认会冒泡到父容器，如果不拦截，
   * SubCanvas 的 eventShield 或父 region 的 handlePointer
   * 会错误处理本该属于 InfiniteCanvas 的事件。
   */
  private _eventShield: PIXI.Container | null = null;

  /** chunk 范围缓存。_syncChunks 比较当前范围与上次是否一致，相同则跳过 */
  private _lastChunkRange: { minCx: number; maxCx: number; minCy: number; maxCy: number } | null = null;

  constructor(opts: InfiniteCanvasOptions) {
    this.parent = opts.parent;
    this._viewport = opts.viewport;
    this.chunkSize = opts.chunkSize;
    this._preloadMargin = opts.preloadMargin ?? 1;
    this._chunkCreate = opts.chunkCreate;
    this._chunkDestroy = opts.chunkDestroy;
    this._onDrag = opts.onDrag ?? null;
    this._onTap = opts.onTap ?? null;
    this._zoom = opts.zoom ?? 1;
    this._minZoom = opts.minZoom ?? 0.1;
    this._maxZoom = opts.maxZoom ?? 10;

    this.worldContainer = new PIXI.Container();
    this.worldContainer.eventMode = 'none';
    this.worldContainer.scale.set(this._zoom);
    this.parent.stage.addChild(this.worldContainer);

    /* ---- 事件盾：防止 PIXI 原生事件穿透到 SubCanvas 的 stage ---- */
    const shield = new PIXI.Container();
    shield.eventMode = 'static';
    shield.hitArea = new PIXI.Rectangle(0, 0, this._viewport.width, this._viewport.height);
    shield.on('pointerdown', (e: PIXI.FederatedPointerEvent) => e.stopPropagation());
    shield.zIndex = -999;
    this.parent.stage.addChild(shield);
    this._eventShield = shield;

    this._decelerate = new DeceleratePlugin();
    if (opts.decelerate !== false) {
      this.addPlugin(this._decelerate);
    }

    this._setupDrag();
    this._setupTick();
    this._syncChunks();
  }

  /** 添加插件，按 priority 升序执行 */
  addPlugin(plugin: InfiniteCanvasPlugin): void {
    plugin.parent = this;
    this._plugins.push(plugin);
    this._plugins.sort((a, b) => a.priority - b.priority);
  }

  /** 移除插件（触发 onDestroy） */
  removePlugin(name: string): void {
    const idx = this._plugins.findIndex((p) => p.name === name);
    if (idx >= 0) {
      this._plugins[idx].onDestroy?.();
      this._plugins.splice(idx, 1);
    }
  }

  /**
   * 视口中心在世界空间中的 X 坐标。
   *
   * 这个值在 zoom 时保持不变（zoom 不改变"我在看世界哪个点"），
   * 只受平移影响。不像 `_scrollX` 会在 zoom 时重新计算而跳跃。
   */
  get worldX(): number {
    return (this._viewport.width / 2 - this._scrollX) / this._zoom;
  }

  /**
   * 视口中心在世界空间中的 Y 坐标。
   *
   * 参见 `worldX`。
   */
  get worldY(): number {
    return (this._viewport.height / 2 - this._scrollY) / this._zoom;
  }

  get zoom(): number { return this._zoom; }

  get viewport(): Readonly<Rect> { return this._viewport; }

  /**
   * 设置缩放，保持指定屏幕点 (cx, cy) 下的世界点不动。
   * @param zoom 目标缩放（会自动 clamp 到 minZoom/maxZoom）
   * @param cx 缩放中心的屏幕 X（默认视口中心）
   * @param cy 缩放中心的屏幕 Y（默认视口中心）
   */
  setZoom(zoom: number, cx?: number, cy?: number): void {
    const centerX = cx ?? this._viewport.width / 2;
    const centerY = cy ?? this._viewport.height / 2;
    const world = this.screenToWorld(centerX, centerY);
    this._zoom = Math.max(this._minZoom, Math.min(this._maxZoom, zoom));
    this.worldContainer.scale.set(this._zoom);
    /* 保持 (cx, cy) 下的世界点不动：新 _scrollX = cx - world.x * zoom */
    this._scrollX = centerX - world.x * this._zoom;
    this._scrollY = centerY - world.y * this._zoom;
    this.worldContainer.x = this._scrollX;
    this.worldContainer.y = this._scrollY;
    this._syncChunks();
    for (const p of this._plugins) p.onResize?.();
  }

  /** 更新视口矩形（如 resize 时），触发 chunk 重算 */
  setViewport(rect: Rect): void {
    this._viewport = rect;
    if (this._eventShield) {
      this._eventShield.hitArea = new PIXI.Rectangle(0, 0, rect.width, rect.height);
    }
    this._syncChunks();
    for (const p of this._plugins) p.onResize?.();
  }

  /**
   * 平移画布（屏幕像素空间）。
   *
   * dx/dy 是屏幕像素偏移，不是世界坐标偏移。
   * 拖拽时鼠标移动 dx 像素，画布跟随移动 dx 像素，
   * 保持鼠标下的世界点跟手（即使 zoom ≠ 1）。
   */
  panBy(dx: number, dy: number): void {
    this._scrollX += dx;
    this._scrollY += dy;
    this.worldContainer.x = this._scrollX;
    this.worldContainer.y = this._scrollY;
    this._syncChunks();
    this._onDrag?.(this.worldX, this.worldY);
  }

  /**
   * 直接设置滚动偏移（内部使用的是 `_scrollX`/`_scrollY` 屏幕像素值）。
   *
   * 适用于保存/恢复视口位置。通常用 `centerOn` 代替。
   * @deprecated 用 centerOn(worldX, worldY) 代替，更直观
   */
  panTo(x: number, y: number): void {
    this._decelerate.stop();
    this._scrollX = x;
    this._scrollY = y;
    this.worldContainer.x = this._scrollX;
    this.worldContainer.y = this._scrollY;
    this._syncChunks();
    this._onDrag?.(this.worldX, this.worldY);
  }

  /**
   * 居中到世界坐标点。视口中心将对齐到 (worldCX, worldCY)。
   * 这是 "我想看世界上的 (x, y) 点" 的正确方式。
   */
  centerOn(worldCX: number, worldCY: number): void {
    const vw = this._viewport.width / 2;
    const vh = this._viewport.height / 2;
    this.panTo(vw - worldCX * this._zoom, vh - worldCY * this._zoom);
  }

  /** 屏幕坐标 → 世界坐标 */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._scrollX) / this._zoom,
      y: (screenY - this._scrollY) / this._zoom,
    };
  }

  /** 世界坐标 → 屏幕坐标 */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this._zoom + this._scrollX,
      y: worldY * this._zoom + this._scrollY,
    };
  }

  /** 获取指定 chunk 坐标的 Chunk 对象（未加载则返回 undefined） */
  getChunkAt(cx: number, cy: number): Chunk | undefined {
    return this._chunks.get(`${cx},${cy}`);
  }

  /** 遍历所有已加载的 chunk */
  eachChunk(fn: (chunk: Chunk) => void): void {
    for (const chunk of this._chunks.values()) fn(chunk);
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this._tickFn && this.parent.ticker) {
      this.parent.ticker.remove(this._tickFn);
      this._tickFn = null;
    }
    for (const p of this._plugins) p.onDestroy?.();
    this._plugins = [];
    for (const cleanup of this._dragCleanups) cleanup();
    this._dragCleanups = [];
    this._lastChunkRange = null;
    for (const chunk of this._chunks.values()) this._chunkDestroy(chunk);
    this._chunks.clear();
    if (this._eventShield) {
      if (this._eventShield.parent) this._eventShield.parent.removeChild(this._eventShield);
      this._eventShield.destroy();
      this._eventShield = null;
    }
    if (this.worldContainer.parent) {
      this.worldContainer.parent.removeChild(this.worldContainer);
    }
    this.worldContainer.destroy({ children: true });
  }

  get destroyed(): boolean { return this._destroyed; }

  get loadedChunkCount(): number {
    return this._chunks.size;
  }

  private _setupTick(): void {
    let lastTime = performance.now();
    this._tickFn = () => {
      const now = performance.now();
      const elapsed = now - lastTime;
      lastTime = now;
      for (const p of this._plugins) p.onUpdate?.(elapsed);
    };
    this.parent.ticker.add(this._tickFn);
  }

  /**
   * 拖拽逻辑：用 clientX/Y 做 delta 计算，不受 zoom 影响。
   * 用户拖拽 dx 像素，_scrollX 增加 dx，worldContainer.x 增加 dx，
   * 鼠标下的世界点始终保持一致。
   */
  private _setupDrag(): void {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startScrollX = 0;
    let startScrollY = 0;

    const onPress = (e: SubPointerEvent) => {
      for (const p of this._plugins) p.onDown?.(e);
      dragging = true;
      startClientX = e.globalX;
      startClientY = e.globalY;
      startScrollX = this._scrollX;
      startScrollY = this._scrollY;
    };

    const onMove = (e: SubPointerEvent) => {
      for (const p of this._plugins) p.onMove?.(e);
      if (!dragging) return;
      const dx = e.globalX - startClientX;
      const dy = e.globalY - startClientY;
      this._scrollX = startScrollX + dx;
      this._scrollY = startScrollY + dy;
      this.worldContainer.x = this._scrollX;
      this.worldContainer.y = this._scrollY;
      this._syncChunks();
      this._onDrag?.(this.worldX, this.worldY);
    };

    const onRelease = (e: SubPointerEvent) => {
      dragging = false;
      for (const p of this._plugins) p.onUp?.(e);
    };

    const onTap = (e: SubPointerEvent) => {
      for (const p of this._plugins) p.onTap?.(this.screenToWorld(e.x, e.y).x, this.screenToWorld(e.x, e.y).y);
      if (!this._onTap) return;
      const w = this.screenToWorld(e.x, e.y);
      this._onTap(w.x, w.y);
    };

    this.parent.onPress(onPress);
    this.parent.onMove(onMove);
    this.parent.onRelease(onRelease);
    if (this._onTap) this.parent.onTap(onTap);

    this._dragCleanups.push(
      () => this.parent.offPointer('pointerdown', onPress),
      () => this.parent.offPointer('pointermove', onMove),
      () => this.parent.offPointer('pointerup', onRelease),
    );
    if (this._onTap) {
      this._dragCleanups.push(() => this.parent.offPointer('tap', onTap));
    }
  }

  private _chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  /**
   * 核心：计算当前视口下哪些 chunk 需要加载。
   *
   * 1. 用 _scrollX/_scrollY/_zoom 算出世界空间中的可见矩形
   * 2. 扩展 preloadMargin 个 chunk
   * 3. 对比上次范围，相同则跳过（平移几帧内范围不变时避免重复计算）
   * 4. 移除不再需要的 chunk，创建新的
   */
  private _syncChunks(): void {
    const margin = this._preloadMargin;
    const cs = this.chunkSize;

    /* 世界坐标系中的可见范围 */
    const z = this._zoom;
    const worldLeft = -this._scrollX / z;
    const worldTop = -this._scrollY / z;
    const worldRight = worldLeft + this._viewport.width / z;
    const worldBottom = worldTop + this._viewport.height / z;
    const minCx = Math.floor(worldLeft / cs) - margin;
    const maxCx = Math.ceil(worldRight / cs) + margin;
    const minCy = Math.floor(worldTop / cs) - margin;
    const maxCy = Math.ceil(worldBottom / cs) + margin;

    /* 范围没变 → 跳过（性能优化：慢速平移时避免每帧重算） */
    const range = this._lastChunkRange;
    if (range && range.minCx === minCx && range.maxCx === maxCx && range.minCy === minCy && range.maxCy === maxCy) {
      return;
    }
    this._lastChunkRange = { minCx, maxCx, minCy, maxCy };

    const needed = new Set<string>();
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        needed.add(this._chunkKey(cx, cy));
      }
    }

    /* 移除已不在范围内的 chunk */
    const dead: string[] = [];
    for (const key of this._chunks.keys()) {
      if (!needed.has(key)) dead.push(key);
    }
    for (const key of dead) {
      const chunk = this._chunks.get(key)!;
      this._chunkDestroy(chunk);
      this._chunks.delete(key);
    }

    /* 创建新的 chunk */
    for (const key of needed) {
      if (this._chunks.has(key)) continue;
      const [cxStr, cyStr] = key.split(',');
      const cx = parseInt(cxStr, 10);
      const cy = parseInt(cyStr, 10);
      const container = new PIXI.Container();
      container.eventMode = 'none';
      container.x = cx * cs;
      container.y = cy * cs;
      this.worldContainer.addChild(container);
      const chunk: Chunk = {
        cx,
        cy,
        container,
        bounds: { x: cx * cs, y: cy * cs, width: cs, height: cs },
      };
      this._chunks.set(key, chunk);
      this._chunkCreate(chunk);
    }
  }
}
