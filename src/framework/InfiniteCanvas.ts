/** InfiniteCanvas — 无限滚动画布，按需分块加载 SubCanvas 并支持平移/缩放。 */
import * as PIXI from 'pixi.js';
import type { SubCanvas } from './SubCanvas';
import type { SubPointerEvent, Rect } from './SubCanvasTypes';
import type { Chunk, InfiniteCanvasPlugin, InfiniteCanvasOptions } from './InfiniteCanvasTypes';
import { DeceleratePlugin } from './InfiniteCanvasDecelerate';
import { InfiniteCanvasDrag } from './InfiniteCanvasDrag';

export class InfiniteCanvas {
  readonly parent: SubCanvas;
  readonly chunkSize: number;
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
  private _pluginList: InfiniteCanvasPlugin[] = [];
  private _drag: InfiniteCanvasDrag;
  private _destroyed = false;
  private _tickFn: (() => void) | null = null;
  private _eventShield: PIXI.Container | null = null;
  private _lastChunkRange: { minCx: number; maxCx: number; minCy: number; maxCy: number } | null = null;

  get plugins(): readonly InfiniteCanvasPlugin[] {
    return this._pluginList;
  }

  get hasTapHandler(): boolean {
    return this._onTap !== null;
  }

  get scrollX(): number {
    return this._scrollX;
  }

  get scrollY(): number {
    return this._scrollY;
  }

  applyScroll(x: number, y: number): void {
    this._scrollX = x;
    this._scrollY = y;
    this.worldContainer.x = this._scrollX;
    this.worldContainer.y = this._scrollY;
    this._syncChunks();
    this._onDrag?.(this.worldX, this.worldY);
  }

  dispatchTap(worldX: number, worldY: number): void {
    this._onTap?.(worldX, worldY);
  }

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

    const shield = new PIXI.Container();
    shield.eventMode = 'static';
    shield.hitArea = new PIXI.Rectangle(0, 0, this._viewport.width, this._viewport.height);
    shield.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      let target: PIXI.Container | null = e.target as PIXI.Container | null;
      while (target) {
        if (target === this.worldContainer) return;
        target = target.parent as PIXI.Container | null;
      }
      e.stopPropagation();
    });
    this.parent.stage.addChild(shield);
    this._eventShield = shield;

    this._decelerate = new DeceleratePlugin();
    if (opts.decelerate !== false) {
      this.addPlugin(this._decelerate);
    }

    this._drag = new InfiniteCanvasDrag(this);
    this._drag.setup();

    this._setupTick();
    this._syncChunks();
  }

  addPlugin(plugin: InfiniteCanvasPlugin): void {
    plugin.parent = this;
    this._pluginList.push(plugin);
    this._pluginList.sort((a, b) => a.priority - b.priority);
  }

  removePlugin(name: string): void {
    const idx = this._pluginList.findIndex((p) => p.name === name);
    if (idx >= 0) {
      this._pluginList[idx].onDestroy?.();
      this._pluginList.splice(idx, 1);
    }
  }

  get worldX(): number {
    return (this._viewport.width / 2 - this._scrollX) / this._zoom;
  }

  get worldY(): number {
    return (this._viewport.height / 2 - this._scrollY) / this._zoom;
  }

  get zoom(): number { return this._zoom; }

  get viewport(): Readonly<Rect> { return this._viewport; }

  setZoom(zoom: number, cx?: number, cy?: number): void {
    const centerX = cx ?? this._viewport.width / 2;
    const centerY = cy ?? this._viewport.height / 2;
    const world = this.screenToWorld(centerX, centerY);
    this._zoom = Math.max(this._minZoom, Math.min(this._maxZoom, zoom));
    this.worldContainer.scale.set(this._zoom);
    this._scrollX = centerX - world.x * this._zoom;
    this._scrollY = centerY - world.y * this._zoom;
    this.worldContainer.x = this._scrollX;
    this.worldContainer.y = this._scrollY;
    this._syncChunks();
    for (const p of this._pluginList) p.onResize?.();
  }

  setViewport(rect: Rect): void {
    this._viewport = rect;
    if (this._eventShield) {
      this._eventShield.hitArea = new PIXI.Rectangle(0, 0, rect.width, rect.height);
    }
    this._syncChunks();
    for (const p of this._pluginList) p.onResize?.();
  }

  panBy(dx: number, dy: number): void {
    this.applyScroll(this._scrollX + dx, this._scrollY + dy);
  }

  panTo(x: number, y: number): void {
    this._decelerate.stop();
    this.applyScroll(x, y);
  }

  centerOn(worldCX: number, worldCY: number): void {
    const vw = this._viewport.width / 2;
    const vh = this._viewport.height / 2;
    this.panTo(vw - worldCX * this._zoom, vh - worldCY * this._zoom);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._scrollX) / this._zoom,
      y: (screenY - this._scrollY) / this._zoom,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this._zoom + this._scrollX,
      y: worldY * this._zoom + this._scrollY,
    };
  }

  getChunkAt(cx: number, cy: number): Chunk | undefined {
    return this._chunks.get(`${cx},${cy}`);
  }

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
    for (const p of this._pluginList) p.onDestroy?.();
    this._pluginList = [];
    this._drag.destroy();
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
      for (const p of this._pluginList) p.onUpdate?.(elapsed);
    };
    this.parent.ticker.add(this._tickFn);
  }

  private _chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private _syncChunks(): void {
    const margin = this._preloadMargin;
    const cs = this.chunkSize;
    const z = this._zoom;
    const worldLeft = -this._scrollX / z;
    const worldTop = -this._scrollY / z;
    const worldRight = worldLeft + this._viewport.width / z;
    const worldBottom = worldTop + this._viewport.height / z;
    const minCx = Math.floor(worldLeft / cs) - margin;
    const maxCx = Math.ceil(worldRight / cs) + margin;
    const minCy = Math.floor(worldTop / cs) - margin;
    const maxCy = Math.ceil(worldBottom / cs) + margin;

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

    const dead: string[] = [];
    for (const key of this._chunks.keys()) {
      if (!needed.has(key)) dead.push(key);
    }
    for (const key of dead) {
      const chunk = this._chunks.get(key)!;
      this._chunkDestroy(chunk);
      this._chunks.delete(key);
    }

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
