import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import type { SubCanvas, SubPointerEvent, Rect } from './SubCanvas';

export interface Chunk {
  readonly cx: number;
  readonly cy: number;
  readonly container: PIXI.Container;
  readonly bounds: Rect;
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
  inertia?: boolean;
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
  private _inertia: boolean;
  private _velX = 0;
  private _velY = 0;
  private _inertiaTween: gsap.core.Tween | null = null;
  private _dragHandlers: (() => void)[] = [];
  private _destroyed = false;

  constructor(opts: InfiniteCanvasOptions) {
    this.parent = opts.parent;
    this._viewport = opts.viewport;
    this.chunkSize = opts.chunkSize;
    this._preloadMargin = opts.preloadMargin ?? 1;
    this._chunkCreate = opts.chunkCreate;
    this._chunkDestroy = opts.chunkDestroy;
    this._onDrag = opts.onDrag ?? null;
    this._onTap = opts.onTap ?? null;
    this._inertia = opts.inertia ?? true;

    this.worldContainer = new PIXI.Container();
    this.worldContainer.eventMode = 'none';
    this.parent.stage.addChild(this.worldContainer);

    this._setupDrag();
    this._syncChunks();
  }

  get worldX(): number { return this._worldX; }
  get worldY(): number { return this._worldY; }

  get viewport(): Readonly<Rect> { return this._viewport; }

  setViewport(rect: Rect): void {
    this._viewport = rect;
    this._syncChunks();
  }

  panTo(x: number, y: number, animate = false): void {
    if (animate) {
      this._inertiaTween?.kill();
      this._inertiaTween = gsap.to(this, {
        duration: 0.3,
        _worldX: x,
        _worldY: y,
        ease: 'power2.out',
        onUpdate: () => {
          this.worldContainer.x = this._worldX;
          this.worldContainer.y = this._worldY;
          this._syncChunks();
          this._onDrag?.(this._worldX, this._worldY);
        },
        onComplete: () => { this._inertiaTween = null; },
      });
    } else {
      this._inertiaTween?.kill();
      this._inertiaTween = null;
      this._velX = 0;
      this._velY = 0;
      this._worldX = x;
      this._worldY = y;
      this.worldContainer.x = x;
      this.worldContainer.y = y;
      this._syncChunks();
      this._onDrag?.(x, y);
    }
  }

  centerOn(worldCX: number, worldCY: number, animate = false): void {
    const vw = this._viewport.width / 2;
    const vh = this._viewport.height / 2;
    this.panTo(vw - worldCX, vh - worldCY, animate);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX - this._worldX,
      y: screenY - this._worldY,
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
    this._inertiaTween?.kill();
    this._inertiaTween = null;
    for (const cleanup of this._dragHandlers) cleanup();
    this._dragHandlers = [];
    for (const chunk of this._chunks.values()) {
      this._chunkDestroy(chunk);
    }
    this._chunks.clear();
    if (this.worldContainer.parent) {
      this.worldContainer.parent.removeChild(this.worldContainer);
    }
    this.worldContainer.destroy({ children: true });
  }

  get destroyed(): boolean { return this._destroyed; }

  private _setupDrag(): void {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startWorldX = 0;
    let startWorldY = 0;

    const onPress = (e: SubPointerEvent) => {
      this._inertiaTween?.kill();
      this._inertiaTween = null;
      this._velX = 0;
      this._velY = 0;
      dragging = true;
      startClientX = e.globalX;
      startClientY = e.globalY;
      startWorldX = this._worldX;
      startWorldY = this._worldY;
    };

    const onMove = (e: SubPointerEvent) => {
      if (!dragging) return;
      const dx = e.globalX - startClientX;
      const dy = e.globalY - startClientY;
      this._worldX = startWorldX + dx;
      this._worldY = startWorldY + dy;
      this.worldContainer.x = this._worldX;
      this.worldContainer.y = this._worldY;
      this._velX = e.globalX - startClientX;
      this._velY = e.globalY - startClientY;
      this._syncChunks();
      this._onDrag?.(this._worldX, this._worldY);
    };

    const onRelease = () => {
      if (!dragging) return;
      dragging = false;
      if (this._inertia) {
        this._applyInertia();
      }
    };

    const onTap = (e: SubPointerEvent) => {
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

  private _applyInertia(): void {
    const vx = this._velX;
    const vy = this._velY;
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;

    this._inertiaTween = gsap.to(this, {
      duration: 0.8,
      _worldX: this._worldX + vx * 4,
      _worldY: this._worldY + vy * 4,
      ease: 'power3.out',
      onUpdate: () => {
        this.worldContainer.x = this._worldX;
        this.worldContainer.y = this._worldY;
        this._syncChunks();
        this._onDrag?.(this._worldX, this._worldY);
      },
      onComplete: () => {
        this._inertiaTween = null;
        this._velX = 0;
        this._velY = 0;
      },
    });
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

  get loadedChunkCount(): number {
    return this._chunks.size;
  }
}
