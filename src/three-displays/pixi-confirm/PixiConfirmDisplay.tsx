import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../pixi/PixiApp';
import { createConfirm } from '../../window/PixiConfirm';
import { showLoading } from '../../ui/Loading';
import type { PixiConfirm } from '../../window/PixiConfirm';

type LogEntry = { ts: number; text: string };

export function PixiConfirmDisplay() {
  const logRef = useRef<LogEntry[]>([]);
  const confirmsRef = useRef<PixiConfirm[]>([]);
  const logTextRef = useRef<PIXI.Text | null>(null);

  useEffect(() => {
    let hideLoading: (() => void) | null = null;
    let cleanupLogListeners: (() => void) | null = null;

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const header = new PIXI.Text({
        text: '#pixi-confirm — buttons (in `anywhere` mode) must NOT trigger drag',
        style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 8;
      header.y = 8;
      header.eventMode = 'none';
      root.stage.addChild(header);

      const logBg = new PIXI.Graphics()
        .rect(8, 28, 360, 140)
        .fill({ color: 0x0d0d18, alpha: 0.85 })
        .stroke({ width: 1, color: 0x2a2a3a });
      logBg.eventMode = 'none';
      root.stage.addChild(logBg);

      const logText = new PIXI.Text({
        text: 'events:\n(none yet)',
        style: { fontSize: 11, fill: 0x99aabb, fontFamily: 'monospace' },
      });
      logText.x = 14;
      logText.y = 32;
      logText.eventMode = 'none';
      root.stage.addChild(logText);
      logTextRef.current = logText;

      const renderLog = () => {
        const lines = logRef.current.slice(0, 8);
        logText.text = 'events:\n' + (lines.length === 0 ? '(none yet)' : lines.map((l) => l.text).join('\n'));
      };

      const append = (text: string) => {
        logRef.current = [{ ts: Date.now(), text }, ...logRef.current].slice(0, 8);
        renderLog();
      };

      const onResize = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        root.setBounds({ x: 0, y: 0, width: W, height: H });
      };
      const offResize = proxy.onWindowResize(onResize);

      const spawnAt = (ox: number, oy: number, kind: 'simple' | 'custom' | 'three' | 'closeonly') => {
        if (kind === 'simple') {
          const c = createConfirm({
            parent: root,
            title: 'Delete item?',
            message: 'This will permanently remove the item. This action cannot be undone.',
            width: 320,
            height: 160,
            x: ox,
            y: oy,
            dragMode: 'anywhere',
            onResult: (r, conf) => {
              append(`simple: result=${r}`);
              conf.destroy();
            },
          });
          confirmsRef.current.push(c);
        } else if (kind === 'custom') {
          const c = createConfirm({
            parent: root,
            title: 'Save changes?',
            message: 'Save 3 unsaved changes to scene.json?',
            width: 360,
            height: 170,
            x: ox,
            y: oy,
            dragMode: 'anywhere',
            okText: 'Save',
            cancelText: 'Discard',
            onResult: (r, conf) => {
              append(`custom: result=${r}`);
              conf.destroy();
            },
          });
          confirmsRef.current.push(c);
        } else if (kind === 'three') {
          const c = createConfirm({
            parent: root,
            title: 'Pick a color',
            message: 'Choose primary color for the ship.',
            width: 420,
            height: 160,
            x: ox,
            y: oy,
            dragMode: 'anywhere',
            buttons: [
              { label: 'Cancel' },
              { label: 'Red', onClick: (conf) => { append('three: Red'); conf.destroy(); } },
              { label: 'Green', primary: true, onClick: (conf) => { append('three: Green'); conf.destroy(); } },
              { label: 'Blue', onClick: (conf) => { append('three: Blue'); conf.destroy(); } },
            ],
            onResult: (r) => append(`three onResult=${r}`),
          });
          confirmsRef.current.push(c);
        } else {
          const c = createConfirm({
            parent: root,
            title: 'Read me',
            message: 'No buttons. Use the X to close (default Cancel result).',
            width: 280,
            height: 130,
            x: ox,
            y: oy,
            dragMode: 'anywhere',
            buttons: [],
            onResult: (r, conf) => {
              append(`closeonly: result=${r}`);
              conf.destroy();
            },
          });
          confirmsRef.current.push(c);
        }
      };

      const triggerY = H - 48;
      const mkTrigger = (label: string, x: number, kind: 'simple' | 'custom' | 'three' | 'closeonly') => {
        const padding = 14;
        const t = new PIXI.Text({
          text: label,
          style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
        });
        const w = t.width + padding * 2;
        const h = 28;
        const g = new PIXI.Graphics()
          .roundRect(0, 0, w, h, 3)
          .fill({ color: 0x1a1a2a })
          .stroke({ width: 1, color: 0x2a2a3a });
        g.eventMode = 'none';
        t.x = padding;
        t.y = (h - t.height) / 2;
        t.eventMode = 'none';
        const c = new PIXI.Container();
        c.x = x;
        c.y = triggerY;
        c.addChild(g);
        c.addChild(t);
        root.stage.addChild(c);
        const hit = { x, y: triggerY, width: w, height: h };
        const offPress = (e: { x: number; y: number; globalX: number; globalY: number }) => {
          if (
            e.x >= hit.x &&
            e.x <= hit.x + hit.width &&
            e.y >= hit.y &&
            e.y <= hit.y + hit.height
          ) {
            spawnAt(80, 80, kind);
          }
        };
        root.onPress(offPress);
        return () => root.off('pointerdown', offPress);
      };

      const offT1 = mkTrigger('Simple', 8, 'simple');
      const offT2 = mkTrigger('Custom (Save/Discard)', 130, 'custom');
      const offT3 = mkTrigger('Three buttons', 320, 'three');
      const offT4 = mkTrigger('No buttons (X only)', 460, 'closeonly');

      const offBus = proxy.bus.on('pixi-confirm:demo', () => {});

      hideLoading = showLoading(root, 'mounting pixi confirms...');
      const t = setTimeout(() => hideLoading?.(), 200);

      cleanupLogListeners = () => {
        offT1();
        offT2();
        offT3();
        offT4();
        offBus();
        offResize();
        clearTimeout(t);
        confirmsRef.current.forEach((c) => {
          if (!c.destroyed) c.destroy();
        });
        confirmsRef.current = [];
      };
    });

    return () => {
      hideLoading?.();
      cleanupLogListeners?.();
      destroy();
    };
  }, []);

  return null;
}
