import { describe, it, expect, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { SubCanvas } from '../SubCanvas';

function mockApp() {
  const stage = new PIXI.Container();
  return { stage, canvas: document.createElement('canvas') } as never;
}

function ev(clientX: number, clientY: number): PointerEvent {
  return { clientX, clientY, button: 0 } as PointerEvent;
}

describe('SubCanvas sibling occlusion (click-through fixes)', () => {
  it('covered sibling does not respond to pointerdown', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const back = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const front = parent.createRegion({ x: 150, y: 150, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const onPress = vi.fn();
    back.onPress(onPress);

    const result = back.handlePointer('pointerdown', ev(200, 200));
    expect(result).toBe(false);
    expect(onPress).not.toHaveBeenCalled();
    expect(back.stage.zIndex).toBe(0);
  });

  it('covered sibling does not record press — tap never fires', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const back = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 });
    const front = parent.createRegion({ x: 150, y: 150, width: 300, height: 200 });
    const onTap = vi.fn();
    back.onTap(onTap);

    back.handlePointer('pointerdown', ev(200, 200));
    back.handlePointer('pointerup', ev(201, 201));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('front shell (no listeners) blocks the covered back window via parent routing', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const back = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const frontShell = parent.createRegion({ x: 150, y: 150, width: 300, height: 200 });
    const onPress = vi.fn();
    back.onPress(onPress);

    const result = parent.handlePointer('pointerdown', ev(200, 200));
    expect(result).toBe(false);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('click on overlap goes to the front-most window only (via parent routing)', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const back = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const front = parent.createRegion({ x: 150, y: 150, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const backPress = vi.fn();
    const frontPress = vi.fn();
    back.onPress(backPress);
    front.onPress(frontPress);

    parent.handlePointer('pointerdown', ev(200, 200));
    expect(frontPress).toHaveBeenCalledTimes(1);
    expect(backPress).not.toHaveBeenCalled();
  });

  it('partially visible back window still responds on its exposed area', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const back = parent.createRegion({ x: 150, y: 250, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const front = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 });
    const onPress = vi.fn();
    back.onPress(onPress);

    // 被 front 覆盖的区域 → 不响应（先测遮挡，避免 bringToFront 改变 z 序）
    parent.handlePointer('pointerdown', ev(200, 260));
    expect(onPress).not.toHaveBeenCalled();

    // 未被遮挡的可见区域 → 正常响应
    parent.handlePointer('pointerdown', ev(420, 400));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('drag continues when pointer moves over a covering sibling', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const onDrag = vi.fn();
    const dragged = parent.createRegion({ x: 0, y: 0, width: 200, height: 200 }, { dragMode: 'anywhere', onDrag });
    parent.createRegion({ x: 100, y: 100, width: 200, height: 200 });

    dragged.handlePointer('pointerdown', ev(20, 20));
    dragged.handlePointer('pointermove', ev(140, 140));
    expect(onDrag).toHaveBeenCalled();
  });
});

describe('tap on anywhere-draggable windows', () => {
  it('fires tap on click without movement', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const win = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const onTap = vi.fn();
    win.onTap(onTap);

    win.handlePointer('pointerdown', ev(150, 150));
    win.handlePointer('pointerup', ev(151, 151));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('does not fire tap after an actual drag', () => {
    const parent = new SubCanvas({ rootApp: mockApp(), bounds: { x: 0, y: 0, width: 600, height: 600 } });
    const win = parent.createRegion({ x: 100, y: 100, width: 300, height: 200 }, { dragMode: 'anywhere' });
    const onTap = vi.fn();
    win.onTap(onTap);

    win.handlePointer('pointerdown', ev(150, 150));
    win.handlePointer('pointermove', ev(170, 150));
    win.handlePointer('pointerup', ev(170, 150));
    expect(onTap).not.toHaveBeenCalled();
  });
});
