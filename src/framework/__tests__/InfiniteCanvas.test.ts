import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { InfiniteCanvas } from '../InfiniteCanvas';
import type { InfiniteCanvasPlugin } from '../InfiniteCanvasTypes';

function makeMockParent() {
  const stage = new PIXI.Container();
  let pressCb: ((e: unknown) => void) | null = null;
  let moveCb: ((e: unknown) => void) | null = null;
  let releaseCb: ((e: unknown) => void) | null = null;
  let tickCb: ((elapsed: number) => void) | null = null;
  const sub: Record<string, unknown> = {
    stage,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    createRegion: vi.fn(),
    onPress: vi.fn((cb: (e: unknown) => void) => { pressCb = cb; }),
    onMove: vi.fn((cb: (e: unknown) => void) => { moveCb = cb; }),
    onRelease: vi.fn((cb: (e: unknown) => void) => { releaseCb = cb; }),
    destroy: vi.fn(),
    addChild: vi.fn((c: unknown) => c),
    ticker: {
      deltaMS: 16,
      add: vi.fn((cb: (elapsed: number) => void) => { tickCb = cb; }),
      remove: vi.fn(),
    },
    offPointer: vi.fn(),
    _pressCb: () => pressCb,
    _moveCb: () => moveCb,
    _releaseCb: () => releaseCb,
    _tickCb: () => tickCb,
  };
  return sub as never;
}

function makeCanvas(opts: Record<string, unknown> = {}) {
  return new InfiniteCanvas({
    parent: makeMockParent(),
    viewport: { x: 0, y: 0, width: 800, height: 600 },
    chunkSize: 256,
    chunkCreate: vi.fn(),
    chunkDestroy: vi.fn(),
    ...opts,
  });
}

describe('InfiniteCanvas', () => {
  it('constructs with default zoom and loads initial chunks', () => {
    const ic = makeCanvas();
    expect(ic.zoom).toBe(1);
    expect(ic.loadedChunkCount).toBeGreaterThan(0);
  });

  it('panBy moves world coordinates', () => {
    const ic = makeCanvas();
    ic.panBy(100, 50);
    // panBy(dx,dy) shifts viewport center in world space by -dx/zoom, -dy/zoom
    // initial _worldX=0, zoom=1, viewport 800×600 → worldX=(400-0)/1=400
    // after panBy(100,50): _worldX=100 → worldX=(400-100)/1=300
    expect(ic.worldX).toBe(300);
    expect(ic.worldY).toBe(250);
  });

  it('panTo sets world coordinate at viewport center', () => {
    const ic = makeCanvas();
    ic.panTo(300, 200);
    // panTo(x,y) sets _worldX=x → worldX=(viewportW/2 - x)/zoom
    expect(ic.worldX).toBe(100);
    expect(ic.worldY).toBe(100);
  });

  it('setZoom clamps to min/max', () => {
    const ic = makeCanvas({ minZoom: 0.5, maxZoom: 4, zoom: 1 });
    ic.setZoom(10);
    expect(ic.zoom).toBe(4);
    ic.setZoom(0.1);
    expect(ic.zoom).toBe(0.5);
  });

  it('zoom-to-pointer keeps world point under cursor', () => {
    const ic = makeCanvas();
    const before = ic.screenToWorld(400, 300);
    ic.setZoom(2, 400, 300);
    const after = ic.screenToWorld(400, 300);
    expect(before.x).toBeCloseTo(after.x, 5);
    expect(before.y).toBeCloseTo(after.y, 5);
  });

  it('screenToWorld / worldToScreen round-trip', () => {
    const ic = makeCanvas();
    ic.panTo(100, 200);
    ic.setZoom(2);
    const world = ic.screenToWorld(400, 300);
    const screen = ic.worldToScreen(world.x, world.y);
    expect(screen.x).toBeCloseTo(400, 5);
    expect(screen.y).toBeCloseTo(300, 5);
  });

  it('centerOn sets world position to center specified point', () => {
    const ic = makeCanvas();
    ic.centerOn(500, 400);
    // centerOn(worldCX, worldCY) → viewport center = (500, 400) in world space
    expect(ic.worldX).toBe(500);
    expect(ic.worldY).toBe(400);
  });

  it('addPlugin and removePlugin', () => {
    const onDestroy = vi.fn();
    const ic = makeCanvas({ decelerate: false });
    const p: InfiniteCanvasPlugin = { name: 'test-p', priority: 10, parent: ic, onDestroy };
    ic.addPlugin(p);
    ic.removePlugin('test-p');
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('removing decelerate plugin prevents inertial scrolling', () => {
    const ic = makeCanvas();
    ic.removePlugin('decelerate');
    const p = (ic as unknown as { _pluginList: InfiniteCanvasPlugin[] })._pluginList.find((x) => x.name === 'decelerate');
    expect(p).toBeUndefined();
  });

  it('loads chunks on pan', () => {
    const chunkCreate = vi.fn();
    const ic = new InfiniteCanvas({
      parent: makeMockParent(),
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      chunkSize: 256,
      chunkCreate,
      chunkDestroy: vi.fn(),
      decelerate: false,
    });
    ic.panBy(100, 50);
    expect(chunkCreate).toHaveBeenCalled();
  });

  it('eachChunk iterates loaded chunks', () => {
    const ic = makeCanvas({ decelerate: false });
    ic.panBy(100, 50);
    const visited: string[] = [];
    ic.eachChunk((chunk) => visited.push(`${chunk.cx},${chunk.cy}`));
    expect(visited.length).toBeGreaterThan(0);
  });

  it('destroy cleans up', () => {
    const onDestroy = vi.fn();
    const ic = makeCanvas({ decelerate: false });
    const p: InfiniteCanvasPlugin = { name: 'test-d', priority: 10, parent: ic, onDestroy };
    ic.addPlugin(p);
    ic.destroy();
    expect(onDestroy).toHaveBeenCalled();
  });

  it('chunk callbacks are balanced (each create has matching destroy on destroy)', () => {
    const chunkCreate = vi.fn();
    const chunkDestroy = vi.fn();
    const ic = new InfiniteCanvas({
      parent: makeMockParent(),
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      chunkSize: 128,
      chunkCreate,
      chunkDestroy,
      decelerate: false,
    });
    ic.panBy(200, 150);
    const createdCount = chunkCreate.mock.calls.length;
    ic.destroy();
    expect(chunkDestroy).toHaveBeenCalledTimes(createdCount);
  });

  it('plugin onDown/onMove/onUp called during drag cycle', () => {
    const onDown = vi.fn();
    const onMove = vi.fn();
    const onUp = vi.fn();
    const parent = makeMockParent();
    const ic = new InfiniteCanvas({
      parent,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      chunkSize: 256,
      chunkCreate: vi.fn(),
      chunkDestroy: vi.fn(),
      decelerate: false,
    });
    const p: InfiniteCanvasPlugin = { name: 't', priority: 10, parent: ic, onDown, onMove, onUp };
    ic.addPlugin(p);
    const pressCb = (parent as unknown as { _pressCb: () => ((e: unknown) => void) | null })._pressCb();
    const moveCb = (parent as unknown as { _moveCb: () => ((e: unknown) => void) | null })._moveCb();
    const releaseCb = (parent as unknown as { _releaseCb: () => ((e: unknown) => void) | null })._releaseCb();
    pressCb!({ globalX: 100, globalY: 200 } as never);
    expect(onDown).toHaveBeenCalledWith({ globalX: 100, globalY: 200 });
    moveCb!({ globalX: 150, globalY: 250 } as never);
    expect(onMove).toHaveBeenCalledWith({ globalX: 150, globalY: 250 });
    releaseCb!({ globalX: 150, globalY: 250 } as never);
    expect(onUp).toHaveBeenCalledWith({ globalX: 150, globalY: 250 });
  });

  it('plugin onUpdate called from tick', () => {
    const onUpdate = vi.fn();
    const parent = makeMockParent();
    const ic = new InfiniteCanvas({
      parent,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      chunkSize: 256,
      chunkCreate: vi.fn(),
      chunkDestroy: vi.fn(),
      decelerate: false,
    });
    const p: InfiniteCanvasPlugin = { name: 't', priority: 10, parent: ic, onUpdate };
    ic.addPlugin(p);
    const tickCb = (parent as unknown as { _tickCb: () => ((elapsed: number) => void) | null })._tickCb();
    tickCb!(16);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('decelerate plugin captures velocity on drag end', () => {
    const parent = makeMockParent();
    const ic = new InfiniteCanvas({
      parent,
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      chunkSize: 256,
      chunkCreate: vi.fn(),
      chunkDestroy: vi.fn(),
    });
    const pressCb = (parent as unknown as { _pressCb: () => ((e: unknown) => void) | null })._pressCb()!;
    const moveCb = (parent as unknown as { _moveCb: () => ((e: unknown) => void) | null })._moveCb()!;
    const releaseCb = (parent as unknown as { _releaseCb: () => ((e: unknown) => void) | null })._releaseCb()!;

    pressCb({ globalX: 100, globalY: 200 } as never);
    moveCb({ globalX: 120, globalY: 220 } as never);
    releaseCb({ globalX: 120, globalY: 220 } as never);

    // decelerate should not throw, and drag position should be updated
    // drag (100→120, 200→220) = dx=20, dy=20 → _worldX=20, _worldY=20
    // worldX = (400 - 20) / 1 = 380
    expect(ic.worldX).toBe(380);
    expect(ic.worldY).toBe(280);
  });
});
