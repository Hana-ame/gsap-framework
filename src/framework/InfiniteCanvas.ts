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

const FRICTION = 0.95;
const MIN_SPEED = 0.5;

class DeceleratePlugin implements InfiniteCanvasPlugin {
  readonly name = 'decelerate';
  priority = 50;
  parent!: InfiniteCanvas;
  private _saved: { x: number; y: number; time: number }[] = [];
  private _vx = 0;
  private _vy = 0;
  private _active = false;

  onDown(): void {
    this._saved = [];
    this._vx = 0;
    this._vy = 0;
    this._active = false;
  }

  onMove(e: SubPointerEvent): void {
    const now = performance.now();
    this._saved.push({ x: e.globalX, y: e.globalY, time: now });
    if (this._saved.length > 60) this._saved.shift();
  }

  onUp(): void {
    if (this._saved.length < 2) return;
    const now = performance.now();
    const cutoff = now - 100;
    let recent: { x: number; y: number; time: number } | null = null;
    for (let i = this._saved.length - 1; i >= 0; i--) {
      if (this._saved[i].time < cutoff) break;
      recent = this._saved[i];
    }
    if (!recent) return;
    const dt = (now - recent.time) / 1000;
    if (dt <= 0) return;
    this._vx = (this.parent.worldX - (this.parent.worldX + (recent.x - this._saved[0].x))) / dt;
    this._vy = (this.parent.worldY - (this.parent.worldY + (recent.y - this._saved[0].y))) / dt;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) return;
    this._active = true;
  }

  onUpdate(elapsed: number): void {
    if (!this._active) return;
    const factor = Math.pow(FRICTION, elapsed / 16);
    this._vx *= factor;
    this._vy *= factor;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) {
      this._vx = 0;
      this._vy = 0;
      this._active = false;
      return;
    }
    this.parent.panBy(this._vx * (elapsed / 16), this._vy * (elapsed / 16));
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
  onDrag?: (x: number, y: number) => void;
  onTap?: (worldX: number, worldY: number) => void;
  decelerate?: boolean;
}

export class InfiniteCanvas {
  readonly parent: SubCanvas;
  readonly worldContainer: PIXI.Container;
  readonly chunkSize: number;

  private _viewport: Rect;
  private _worldX = 0;
  private _worldY = 0;
  private _chunks = new Map<string, Chunk>();
  private _chunkCreate: (chunk: Chunk) => void;
  private _chunkDestroy: (chunk: Chunk) => void;
  private _onDrag: ((x: number, y: number) => void) | null;
  private _onTap: ((worldX: number, worldY: number) => void) | null;
  private _preloadMargin: number;
  private _decelerate: DeceleratePlugin;
  private _plugins: InfiniteCanvasPlugin[] = [];
  private _dragHandlers: (() => void)[] = [];
  private _destroyed = false;
  private _tickFn: (() => void) | null = null;

  constructor(opts: InfiniteCanvasOptions) {
    this.parent = opts.parent;
    this._viewport = opts.viewport;
    this.chunkSize = opts.chunkSize;
    this._preloadMargin = opts.preloadMargin ?? 1;
    this._chunkCreate = opts.chunkCreate;
    this._chunkDestroy = opts.chunkDestroy;
    this._onDrag = opts.onDrag ?? null;
    this._onTap = opts.onTap ?? null;

    this.worldContainer = new PIXI.Container();
    this.worldContainer.eventMode = 'none';
    this.parent.stage.addChild(this.worldContainer);

    this._decelerate = new DeceleratePlugin();
    if (opts.decelerate !== false) {
      this.addPlugin(this._decelerate);
    }

    this._setupDrag();
    this._setupTick();
    this._syncChunks();
  }

  addPlugin(plugin: InfiniteCanvasPlugin): void {
    plugin.parent = this;
    this._plugins.push(plugin);
    this._plugins.sort((a, b) => a.priority - b.priority);
  }

  removePlugin(name: string): void {
    const idx = this._plugins.findIndex((p) => p.name === name);
    if (idx >= 0) {
      this._plugins[idx].onDestroy?.();
      this._plugins.splice(idx, 1);
    }
  }

  get worldX(): number { return this._worldX; }
  get worldY(): number { return this._worldY; }

  get viewport(): Readonly<Rect> { return this._viewport; }

  setViewport(rect: Rect): void {
    this._viewport = rect;
    this._syncChunks();
    for (const p of this._plugins) p.onResize?.();
  }

  panBy(dx: number, dy: number): void {
    this._worldX += dx;
    this._worldY += dy;
    this.worldContainer.x = this._worldX;
    this.worldContainer.y = this._worldY;
    this._syncChunks();
    this._onDrag?.(this._worldX, this._worldY);
  }

  panTo(x: number, y: number): void {
    this._decelerate.stop();
    this._worldX = x;
    this._worldY = y;
    this.worldContainer.x = x;
    this.worldContainer.y = y;
    this._syncChunks();
    this._onDrag?.(x, y);
  }

  centerOn(worldCX: number, worldCY: number): void {
    const vw = this._viewport.width / 2;
    const vh = this._viewport.height / 2;
    this.panTo(vw - worldCX, vh - worldCY);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX - this._worldX,
      y: screenY - this._worldY,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX + this._worldX,
      y: worldY + this._worldY,
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
    for (const p of this._plugins) p.onDestroy?.();
    this._plugins = [];
    for (const cleanup of this._dragHandlers) cleanup();
    this._dragHandlers = [];
    for (const chunk of this._chunks.values()) this._chunkDestroy(chunk);
    this._chunks.clear();
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

  private _setupDrag(): void {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startWorldX = 0;
    let startWorldY = 0;

    const onPress = (e: SubPointerEvent) => {
      for (const p of this._plugins) p.onDown?.(e);
      dragging = true;
      startClientX = e.globalX;
      startClientY = e.globalY;
      startWorldX = this._worldX;
      startWorldY = this._worldY;
    };

    const onMove = (e: SubPointerEvent) => {
      for (const p of this._plugins) p.onMove?.(e);
      if (!dragging) return;
      const dx = e.globalX - startClientX;
      const dy = e.globalY - startClientY;
      this._worldX = startWorldX + dx;
      this._worldY = startWorldY + dy;
      this.worldContainer.x = this._worldX;
      this.worldContainer.y = this._worldY;
      this._syncChunks();
      this._onDrag?.(this._worldX, this._worldY);
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

    this._dragHandlers.push(
      () => this.parent.offPointer('pointerdown', onPress),
      () => this.parent.offPointer('pointermove', onMove),
      () => this.parent.offPointer('pointerup', onRelease),
    );
    if (this._onTap) {
      this._dragHandlers.push(() => this.parent.offPointer('tap', onTap));
    }
  }

  private _chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private _syncChunks(): void {
    const margin = this._preloadMargin;
    const cs = this.chunkSize;

    const minCx = Math.floor(-this._worldX / cs) - margin;
    const maxCx = Math.ceil((-this._worldX + this._viewport.width) / cs) + margin;
    const minCy = Math.floor(-this._worldY / cs) - margin;
    const maxCy = Math.ceil((-this._worldY + this._viewport.height) / cs) + margin;

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
