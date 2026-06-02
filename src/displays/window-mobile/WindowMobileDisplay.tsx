import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../pixi/PixiApp';
import { createConfirm } from '../../window/PixiConfirm';
import { showLoading } from '../../ui/Loading';
import type { PixiConfirm } from '../../window/PixiConfirm';
import type { SubCanvas } from '../../pixi/SubCanvas';

const TITLE_BAR_H = 22;
const MOBILE_BREAKPOINT = 600;
const SIDE_MARGIN = 12;
const TRIGGER_BAR_H = 44;
const TRIGGER_BTN_H = 30;
const TRIGGER_BTN_PAD = 14;
const TRIGGER_GAP = 8;
const HEADER_H = 24;

interface TriggerSpec {
  label: string;
  kind: 'simple' | 'custom' | 'three' | 'closeonly' | 'image';
}

const TRIGGERS: TriggerSpec[] = [
  { label: 'Simple', kind: 'simple' },
  { label: 'Custom', kind: 'custom' },
  { label: '3 buttons', kind: 'three' },
  { label: 'X only', kind: 'closeonly' },
  { label: 'Image', kind: 'image' },
];

export function WindowMobileDisplay() {
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);
  const confirmsRef = useRef<PixiConfirm[]>([]);

  useEffect(() => {
    let hideLoading: (() => void) | null = null;
    let offBackend: (() => void) | null = null;
    let offBusDemo: (() => void) | null = null;
    let offResize: (() => void) | null = null;
    let offMql: (() => void) | null = null;
    let simTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerCleanups: (() => void)[] = [];
    let root: SubCanvas | null = null;
    let header: PIXI.Text | null = null;
    let triggerLayer: PIXI.Container | null = null;

    const append = (text: string) => {
      const next = [`${new Date().toLocaleTimeString()}  ${text}`, ...logRef.current].slice(0, 10);
      logRef.current = next;
      setLog(next);
    };

    const confirmBoxFor = (
      kind: 'simple' | 'custom' | 'three' | 'closeonly' | 'image',
      ox: number,
      oy: number,
    ): PixiConfirm | null => {
      if (!root) return null;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const mobile = W < MOBILE_BREAKPOINT;

      if (kind === 'simple') {
        const w = mobile ? Math.min(W - 24, 320) : 320;
        const h = mobile ? Math.min(H - TRIGGER_BAR_H - HEADER_H - 24, 180) : 180;
        const c = createConfirm({
          parent: root,
          title: 'Delete item?',
          message: 'This will permanently remove the item. This action cannot be undone.',
          width: w,
          height: h,
          x: ox,
          y: oy,
          dragMode: 'anywhere',
          onResult: (r) => append(`simple: result=${r}`),
        });
        confirmsRef.current.push(c);
        return c;
      }
      if (kind === 'custom') {
        const w = mobile ? Math.min(W - 24, 340) : 360;
        const h = mobile ? Math.min(H - TRIGGER_BAR_H - HEADER_H - 24, 190) : 170;
        const c = createConfirm({
          parent: root,
          title: 'Save changes?',
          message: 'Save 3 unsaved changes to scene.json?',
          width: w,
          height: h,
          x: ox,
          y: oy,
          dragMode: 'anywhere',
          okText: 'Save',
          cancelText: 'Discard',
          onResult: (r) => append(`custom: result=${r}`),
        });
        confirmsRef.current.push(c);
        return c;
      }
      if (kind === 'three') {
        const w = mobile ? Math.min(W - 24, 360) : 420;
        const h = mobile ? Math.min(H - TRIGGER_BAR_H - HEADER_H - 24, 180) : 160;
        const c = createConfirm({
          parent: root,
          title: 'Pick a color',
          message: 'Choose primary color for the ship.',
          width: w,
          height: h,
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
        return c;
      }
      if (kind === 'image') {
        const w = mobile ? Math.min(W - 24, 320) : 440;
        const h = mobile ? Math.min(H - TRIGGER_BAR_H - HEADER_H - 24, 360) : 360;
        const c = createConfirm({
          parent: root,
          title: 'Image preview',
          image:
            'https://proxy.moonchan.xyz/8c38ea09-f922-477b-9eba-ea642423cfdd/i/7264791/358f15be-954e-4cef-b855-04a527545804_base_resized.jpg?proxy_host=booth.pximg.net',
          width: w,
          height: h,
          x: ox,
          y: oy,
          dragMode: 'anywhere',
          onResult: (r) => append(`image: result=${r}`),
        });
        confirmsRef.current.push(c);
        return c;
      }
      const w = mobile ? Math.min(W - 24, 280) : 280;
      const h = mobile ? Math.min(H - TRIGGER_BAR_H - HEADER_H - 24, 150) : 130;
      const c = createConfirm({
        parent: root,
        title: 'Read me',
        message: 'No buttons. Use the X to close (default Cancel result).',
        width: w,
        height: h,
        x: ox,
        y: oy,
        dragMode: 'anywhere',
        buttons: [],
        onResult: (r) => append(`closeonly: result=${r}`),
      });
      confirmsRef.current.push(c);
      return c;
    };

    const measureTrigger = (label: string) => {
      const t = new PIXI.Text({
        text: label,
        style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
      });
      const w = t.width + TRIGGER_BTN_PAD * 2;
      t.destroy();
      return w;
    };

    const buildTriggerBar = () => {
      if (!root || !triggerLayer) return;
      while (triggerLayer.children.length) {
        const c = triggerLayer.children[0];
        triggerLayer.removeChild(c);
        c.destroy({ children: true });
      }
      const W = window.innerWidth;
      const H = window.innerHeight;
      const innerW = W - SIDE_MARGIN * 2;
      const widths = TRIGGERS.map((t) => measureTrigger(t.label));
      const totalRowWidth = widths.reduce((a, b) => a + b, 0) + TRIGGER_GAP * (widths.length - 1);

      let rows: TriggerSpec[][] = [[]];
      let rowWidths: number[] = [0];
      if (totalRowWidth <= innerW) {
        rows = [TRIGGERS];
        rowWidths = [totalRowWidth];
      } else {
        const perRow = Math.max(2, Math.floor((innerW + TRIGGER_GAP) / (Math.max(...widths) + TRIGGER_GAP)));
        TRIGGERS.forEach((t, i) => {
          const w = widths[i];
          let placed = false;
          for (let r = 0; r < rows.length; r++) {
            if (rows[r].length < perRow && rowWidths[r] + w + (rows[r].length ? TRIGGER_GAP : 0) <= innerW) {
              rows[r].push(t);
              rowWidths[r] += w + (rows[r].length > 1 ? TRIGGER_GAP : 0);
              placed = true;
              break;
            }
          }
          if (!placed) {
            rows.push([t]);
            rowWidths.push(w);
          }
        });
      }

      const totalH = rows.length * TRIGGER_BTN_H + (rows.length - 1) * 6;
      const startY = H - TRIGGER_BAR_H + (TRIGGER_BAR_H - totalH) / 2;

      rows.forEach((row, rIdx) => {
        const rowW = rowWidths[rIdx];
        let cursorX = (W - rowW) / 2;
        const y = startY + rIdx * (TRIGGER_BTN_H + 6);
        row.forEach((spec) => {
          const w = measureTrigger(spec.label);
          const g = new PIXI.Graphics()
            .roundRect(0, 0, w, TRIGGER_BTN_H, 3)
            .fill({ color: 0x1a1a2a })
            .stroke({ width: 1, color: 0x3a3a55 });
          g.x = cursorX;
          g.y = y;
          triggerLayer!.addChild(g);
          const t = new PIXI.Text({
            text: spec.label,
            style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
          });
          t.x = cursorX + TRIGGER_BTN_PAD;
          t.y = y + (TRIGGER_BTN_H - t.height) / 2;
          triggerLayer!.addChild(t);

          const off = (e: { x: number; y: number; globalX: number; globalY: number }) => {
            if (e.globalX >= g.x && e.globalX <= g.x + w && e.globalY >= g.y && e.globalY <= g.y + TRIGGER_BTN_H) {
              const W2 = window.innerWidth;
              const H2 = window.innerHeight;
              const ox = Math.max(SIDE_MARGIN, (W2 - 320) / 2);
              const oy = Math.max(HEADER_H + 4, (H2 - TRIGGER_BAR_H - 200) / 2);
              confirmBoxFor(spec.kind, ox, oy);
            }
          };
          root!.onPress(off);
          triggerCleanups.push(() => root!.off('pointerdown', off));

          cursorX += w + TRIGGER_GAP;
        });
      });
    };

    const destroy = startPixiApp((proxy) => {
      root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

      header = new PIXI.Text({
        text: '#window-mobile — tap a trigger to spawn a draggable confirm',
        style: { fontSize: 11, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      header.x = 8;
      header.y = 8;
      header.eventMode = 'none';
      root.stage.addChild(header);

      const bg = new PIXI.Graphics()
        .rect(0, 0, window.innerWidth, TRIGGER_BAR_H)
        .fill({ color: 0x0a0a14, alpha: 0.9 });
      bg.y = window.innerHeight - TRIGGER_BAR_H;
      bg.eventMode = 'none';
      root.stage.addChild(bg);

      triggerLayer = new PIXI.Container();
      root.stage.addChild(triggerLayer);

      buildTriggerBar();

      offBackend = proxy.bus.on<{ from: string; msg: string }>('chat', () => {});
      offBusDemo = proxy.bus.on('demo:event', () => {});

      hideLoading = showLoading(root, 'mounting mobile confirms...');
      simTimer = setTimeout(() => hideLoading?.(), 200);

      offResize = proxy.onWindowResize(() => {
        if (!root) return;
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
        if (header) header.text = `#window-mobile — ${window.innerWidth}×${window.innerHeight}`;
        bg.clear()
          .rect(0, 0, window.innerWidth, TRIGGER_BAR_H)
          .fill({ color: 0x0a0a14, alpha: 0.9 });
        bg.y = window.innerHeight - TRIGGER_BAR_H;
        buildTriggerBar();
      });

      if (typeof window.matchMedia === 'function') {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onMql = () => buildTriggerBar();
        if (mql.addEventListener) {
          mql.addEventListener('change', onMql);
          offMql = () => mql.removeEventListener('change', onMql);
        } else {
          mql.addListener(onMql);
          offMql = () => mql.removeListener(onMql);
        }
      }

      append('ready — try each trigger, drag the dialogs anywhere');
    });

    return () => {
      hideLoading?.();
      if (simTimer) clearTimeout(simTimer);
      offBackend?.();
      offBusDemo?.();
      offResize?.();
      offMql?.();
      triggerCleanups.forEach((c) => c());
      confirmsRef.current.forEach((c) => {
        if (!c.destroyed) c.destroy();
      });
      confirmsRef.current = [];
      destroy();
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        right: 12,
        bottom: 52,
        width: Math.min(320, window.innerWidth - 24),
        background: 'rgba(13, 13, 24, 0.92)',
        border: '1px solid #2a2a3a',
        borderRadius: 4,
        padding: 8,
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
      <div style={{ color: '#88aaff', marginBottom: 4, fontWeight: 600 }}>events</div>
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
