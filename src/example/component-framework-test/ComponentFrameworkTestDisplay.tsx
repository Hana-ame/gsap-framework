// Example: Verify DragController auto-cleanup, isDragHandle property, DirtyPropagator, ZOrderManager overflow protection
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, SubCanvas, DragController, DRAG_HANDLE_LABEL, LayerManager, type SubCanvasProxy } from '@framework';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDrag = (sc: SubCanvas): DragController => (sc as any)._drag;

export function ComponentFrameworkTestDisplay() {
  useEffect(() => {
    passed = 0; failed = 0;
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // ── 1. DragController removed auto-cleanup ──
      const title1 = new PIXI.Text({
        text: '[1] DragController removed auto-cleanup',
        style: { fontSize: 14, fill: '#ffcc44', fontFamily: 'monospace' },
      });
      title1.x = 20; title1.y = 40; root.stage.addChild(title1);

      const sc1 = root.createRegion({ x: 20, y: 70, width: 300, height: 100 },
        { clipToBounds: true, dragMode: 'title' });
      const bg1 = new PIXI.Graphics().rect(0, 0, 300, 100).fill({ color: 0x222244, alpha: 0.5 });
      bg1.eventMode = 'none'; sc1.stage.addChild(bg1);

      const handle1 = new PIXI.Container({ label: DRAG_HANDLE_LABEL });
      const handleBg1 = new PIXI.Graphics().rect(0, 0, 100, 24).fill({ color: 0xff8844 });
      handleBg1.eventMode = 'none';
      handle1.addChild(handleBg1);
      const handleLabel1 = new PIXI.Text({ text: 'drag me', style: { fontSize: 12, fill: '#000', fontFamily: 'monospace' } });
      handleLabel1.x = 10; handleLabel1.y = 4; handleLabel1.eventMode = 'none';
      handle1.addChild(handleLabel1);

      sc1.addChild(handle1);
      const dc1 = getDrag(sc1);
      assert(dc1.hasHandle(handle1), '[1] handle installed after addChild');

      // Remove — removed event fires → auto-cleanup
      sc1.removeChild(handle1);
      requestAnimationFrame(() => {
        assert(!dc1.hasHandle(handle1), '[1] handle auto-uninstalled after removeChild via removed event');

        // Re-add to verify re-install still works
        sc1.addChild(handle1);
        assert(dc1.hasHandle(handle1), '[1] handle re-installed after re-addChild');

        // ── 2. isDragHandle property ──
        runSection2(proxy, root);
      });

      // ── 3. DirtyPropagator + LayerManager ──
      setTimeout(() => runSection3(root), 400);

      // ── 4. ZOrderManager overflow protection ──
      setTimeout(() => runSection4(root), 600);
    });
    return stop;
  }, []);

  return null;
}

function runSection2(proxy: SubCanvasProxy, root: SubCanvas) {
  const title2 = new PIXI.Text({
    text: '[2] isDragHandle property',
    style: { fontSize: 14, fill: '#44ffcc', fontFamily: 'monospace' },
  });
  title2.x = 20; title2.y = 190; root.stage.addChild(title2);

  const sc2 = root.createRegion({ x: 20, y: 220, width: 300, height: 100 },
    { clipToBounds: true, dragMode: 'title' });
  const bg2 = new PIXI.Graphics().rect(0, 0, 300, 100).fill({ color: 0x224444, alpha: 0.5 });
  bg2.eventMode = 'none'; sc2.stage.addChild(bg2);

  const handle2 = new PIXI.Container();
  handle2.isDragHandle = true;
  const handleBg2 = new PIXI.Graphics().rect(0, 0, 100, 24).fill({ color: 0x44ff88 });
  handleBg2.eventMode = 'none';
  handle2.addChild(handleBg2);
  const handleLabel2 = new PIXI.Text({ text: 'isDragHandle', style: { fontSize: 12, fill: '#000', fontFamily: 'monospace' } });
  handleLabel2.x = 10; handleLabel2.y = 4; handleLabel2.eventMode = 'none';
  handle2.addChild(handleLabel2);

  assert(handle2.isDragHandle === true, '[2] isDragHandle returns true after setter');
  assert(handle2.label === DRAG_HANDLE_LABEL, '[2] label matches DRAG_HANDLE_LABEL after setter');

  sc2.addChild(handle2);
  const dc2 = getDrag(sc2);
  assert(dc2.hasHandle(handle2), '[2] isDragHandle handle installed via property check in addChild');

  handle2.isDragHandle = false;
  requestAnimationFrame(() => {
    assert(!dc2.hasHandle(handle2), '[2] isDragHandle = false triggers uninstall via label change + removed event');
  });
}

function runSection3(root: SubCanvas) {
  const title3 = new PIXI.Text({
    text: '[3] DirtyPropagator + LayerManager',
    style: { fontSize: 14, fill: '#88ccff', fontFamily: 'monospace' },
  });
  title3.x = 20; title3.y = 340; root.stage.addChild(title3);

  // LayerManager with DirtyPropagator: repeated bringToFront then flush
  const testContainer = new PIXI.Container();
  const lm = new LayerManager(testContainer);

  const names = ['a', 'b', 'c'];
  names.forEach((n, i) => lm.add(n, i * 10));

  for (let i = 0; i < 50_000; i++) {
    lm.bringToFront(names[i % 3]);
  }

  lm.flush(); // trigger renormalization via DirtyPropagator

  const maxZ = Math.max(...testContainer.children.map(c => c.zIndex));
  assert(maxZ < 1_000_000, `[3] LayerManager zIndex renormalized (max=${maxZ}) after 50k bringToFront`);
  assert(maxZ === 2, `[3] LayerManager zIndex sequential (max=${maxZ}) after flush`);

  lm.destroy();
  testContainer.destroy(true);

  showFinalStatus(root);
}

function runSection4(root: SubCanvas) {
  const title4 = new PIXI.Text({
    text: '[4] ZOrderManager overflow protection',
    style: { fontSize: 14, fill: '#cc88ff', fontFamily: 'monospace' },
  });
  title4.x = 20; title4.y = 490; root.stage.addChild(title4);

  const regions: SubCanvas[] = [];
  for (let i = 0; i < 3; i++) {
    const sc = root.createRegion(
      { x: 20 + i * 110, y: 520, width: 100, height: 80 },
      { clipToBounds: true, dragMode: 'anywhere' },
    );
    const bg = new PIXI.Graphics().rect(0, 0, 100, 80).fill({ color: [0x664488, 0x886644, 0x448866][i], alpha: 0.6 });
    bg.eventMode = 'none'; sc.stage.addChild(bg);
    regions.push(sc);
  }

  for (let i = 0; i < 50_000; i++) {
    regions[i % 3].bringToFront();
  }

  const parent = regions[0].stage.parent!;
  const maxZ = Math.max(...parent.children.map(c => c.zIndex));
  assert(maxZ < 1_000_000, `[4] zIndex renormalized (max=${maxZ}) after 50k bringToFront calls`);
}

function showFinalStatus(root: SubCanvas) {
  const status = new PIXI.Text({
    text: `passed: ${passed}  failed: ${failed}`,
    style: { fontSize: 16, fill: failed > 0 ? '#ff4444' : '#44ff44', fontFamily: 'monospace', fontWeight: 'bold' },
  });
  status.x = 20; status.y = window.innerHeight - 40;
  root.stage.addChild(status);
}

ComponentFrameworkTestDisplay.head = {
  title: 'Framework Test',
  description: 'Verify DragController auto-cleanup, isDragHandle, DirtyPropagator, ZOrderManager overflow protection.',
};
