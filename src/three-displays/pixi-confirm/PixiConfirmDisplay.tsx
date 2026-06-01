import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../pixi/PixiApp';
import { createConfirm } from '../../window/PixiConfirm';
import { showLoading } from '../../ui/Loading';
import type { PixiConfirm } from '../../window/PixiConfirm';

export function PixiConfirmDisplay() {
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);
  const confirmsRef = useRef<PixiConfirm[]>([]);

  useEffect(() => {
    let hideLoading: (() => void) | null = null;
    let cleanup: (() => void) | null = null;

    const append = (text: string) => {
      const next = [`${new Date().toLocaleTimeString()}  ${text}`, ...logRef.current].slice(0, 12);
      logRef.current = next;
      setLog(next);
    };

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const header = new PIXI.Text({
        text: '#pixi-confirm — buttons in anywhere-drag mode must not trigger drag',
        style: { fontSize: 12, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 8;
      header.y = 8;
      header.eventMode = 'none';
      root.stage.addChild(header);

      const offResize = proxy.onWindowResize(() => {
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });

      const triggerY = H - 60;
      const spawnAt = (
        ox: number,
        oy: number,
        kind: 'simple' | 'custom' | 'three' | 'closeonly' | 'image',
      ) => {
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
            onResult: (r) => append(`simple: result=${r}`),
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
            onResult: (r) => append(`custom: result=${r}`),
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
              { label: 'Red', onClick: () => append('three: Red') },
              { label: 'Green', primary: true, onClick: () => append('three: Green') },
              { label: 'Blue', onClick: () => append('three: Blue') },
            ],
            onResult: (r) => append(`three onResult=${r}`),
          });
          confirmsRef.current.push(c);
        } else if (kind === 'image') {
          const c = createConfirm({
            parent: root,
            title: 'Image preview',
            image:
              'https://proxy.moonchan.xyz/8c38ea09-f922-477b-9eba-ea642423cfdd/i/7264791/358f15be-954e-4cef-b855-04a527545804_base_resized.jpg?proxy_host=booth.pximg.net',
            width: 440,
            height: 360,
            x: ox,
            y: oy,
            dragMode: 'anywhere',
            onResult: (r) => append(`image: result=${r}`),
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
            onResult: (r) => append(`closeonly: result=${r}`),
          });
          confirmsRef.current.push(c);
        }
      };

      let cursorX = 12;
      const mkTrigger = (
        label: string,
        kind: 'simple' | 'custom' | 'three' | 'closeonly' | 'image',
      ) => {
        const padding = 14;
        const t = new PIXI.Text({
          text: label,
          style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
        });
        const w = t.width + padding * 2;
        const h = 30;
        const g = new PIXI.Graphics()
          .roundRect(0, 0, w, h, 3)
          .fill({ color: 0x1a1a2a })
          .stroke({ width: 1, color: 0x3a3a55 });
        g.eventMode = 'none';
        t.x = padding;
        t.y = (h - t.height) / 2;
        t.eventMode = 'none';
        const c = new PIXI.Container();
        const x = cursorX;
        c.x = x;
        c.y = triggerY;
        c.addChild(g);
        c.addChild(t);
        root.stage.addChild(c);
        cursorX += w + 8;

        const offPress = (e: { x: number; y: number }) => {
          if (e.x >= x && e.x <= x + w && e.y >= triggerY && e.y <= triggerY + h) {
            spawnAt(120, 60, kind);
          }
        };
        root.onPress(offPress);
        return () => root.off('pointerdown', offPress);
      };

      const offT1 = mkTrigger('Simple', 'simple');
      const offT2 = mkTrigger('Custom (Save/Discard)', 'custom');
      const offT3 = mkTrigger('3 buttons', 'three');
      const offT4 = mkTrigger('X only (no buttons)', 'closeonly');
      const offT5 = mkTrigger('Image (Pixiv proxy)', 'image');

      const offBus = proxy.bus.on('pixi-confirm:demo', () => {});

      hideLoading = showLoading(root, 'mounting pixi confirms...');
      const t = setTimeout(() => hideLoading?.(), 200);

      append('demo ready — click a trigger then try clicking buttons / dragging');

      cleanup = () => {
        offT1();
        offT2();
        offT3();
        offT4();
        offT5();
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
      cleanup?.();
      destroy();
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 32,
        right: 12,
        width: 360,
        maxHeight: 'calc(100vh - 40px)',
        background: 'rgba(13, 13, 24, 0.92)',
        border: '1px solid #2a2a3a',
        borderRadius: 4,
        padding: 10,
        color: '#ddd',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        lineHeight: 1.4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'auto',
      }}
    >
      <div style={{ color: '#88aaff', marginBottom: 6, fontWeight: 600 }}>events</div>
      {log.length === 0 ? (
        <div style={{ color: '#555' }}>(none yet)</div>
      ) : (
        log.map((line, i) => (
          <div key={`${i}-${line}`} style={{ color: i === 0 ? '#9ab' : '#777' }}>
            {line}
          </div>
        ))
      )}
    </div>
  );
}
