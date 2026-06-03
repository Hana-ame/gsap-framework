import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';

interface Snapshot {
  innerW: number;
  innerH: number;
  visualVpW: number;
  visualVpH: number;
  dpr: number;
  screenW: number;
  screenH: number;
  ua: string;
  lang: string;
  online: boolean;
  standalone: boolean;
  maxTouch: number;
  hwConcurrency: number | string;
  mem: number | string;
  conn: string;
  ts: string;
}

function snapshot(): Snapshot {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; type?: string };
    standalone?: boolean;
  };
  const conn = nav.connection;
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    visualVpW: window.visualViewport?.width ?? 0,
    visualVpH: window.visualViewport?.height ?? 0,
    dpr: window.devicePixelRatio,
    screenW: window.screen.width,
    screenH: window.screen.height,
    ua: navigator.userAgent,
    lang: navigator.language,
    online: navigator.onLine,
    standalone: !!nav.standalone,
    maxTouch: navigator.maxTouchPoints,
    hwConcurrency: navigator.hardwareConcurrency ?? '?',
    mem: nav.deviceMemory ?? '?',
    conn: conn ? `${conn.effectiveType ?? '?'} / ${conn.type ?? '?'}` : '?',
    ts: new Date().toISOString(),
  };
}

  let rendererName = '?';
  const ROWS: Array<[string, (s: Snapshot) => string | number]> = [
    ['inner', (s) => `${s.innerW} x ${s.innerH}`],
    ['visualViewport', (s) => `${s.visualVpW} x ${s.visualVpH}`],
    ['screen', (s) => `${s.screenW} x ${s.screenH}`],
    ['dpr', (s) => s.dpr],
    ['renderer', () => rendererName],
    ['maxTouchPoints', (s) => s.maxTouch],
    ['hardwareConcurrency', (s) => s.hwConcurrency],
    ['deviceMemory(GB)', (s) => s.mem],
    ['connection', (s) => s.conn],
    ['online', (s) => (s.online ? 'yes' : 'no')],
    ['standalone', (s) => (s.standalone ? 'yes' : 'no')],
    ['lang', (s) => s.lang],
    ['ts', (s) => s.ts],
  ];

export function ScreenSizeDisplay() {
  useEffect(() => {
    let cleanupResize: (() => void) | null = null;
    let cleanupVp: (() => void) | null = null;
    let tickerStop: (() => void) | null = null;
    let mounted = true;

    const destroy = startPixiApp((proxy) => {
      if (!mounted) return;
      rendererName = proxy.renderer.name;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const bg = new PIXI.Graphics().rect(0, 0, W, H).fill({ color: 0x0a0a14 });
      bg.eventMode = 'none';
      root.stage.addChild(bg);

      const title = new PIXI.Text({
        text: 'screen size',
        style: { fontSize: 14, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: '600' },
      });
      title.x = 12;
      title.y = 10;
      title.eventMode = 'none';
      root.stage.addChild(title);

      const bigSize = new PIXI.Text({
        text: '',
        style: { fontSize: 26, fill: 0xe6e6f0, fontFamily: 'monospace', fontWeight: '700' },
      });
      bigSize.x = 12;
      bigSize.y = 30;
      bigSize.eventMode = 'none';
      root.stage.addChild(bigSize);

      const sub = new PIXI.Text({
        text: '',
        style: { fontSize: 11, fill: 0x8a8a9a, fontFamily: 'monospace' },
      });
      sub.x = 12;
      sub.y = 62;
      sub.eventMode = 'none';
      root.stage.addChild(sub);

      const tableX = 12;
      const tableY = 86;
      let rowH = 15;
      const labelStyle = { fontSize: 10, fill: 0x8a8a9a, fontFamily: 'monospace' as const };
      const valueStyle = { fontSize: 10, fill: 0xe6e6f0, fontFamily: 'monospace' as const };
      const labels: PIXI.Text[] = [];
      const values: PIXI.Text[] = [];
      ROWS.forEach(([key], i) => {
        const lab = new PIXI.Text({ text: key, style: labelStyle });
        lab.x = tableX;
        lab.y = tableY + i * rowH;
        lab.eventMode = 'none';
        root.stage.addChild(lab);
        labels.push(lab);
        const val = new PIXI.Text({ text: '', style: valueStyle });
        val.x = tableX + 160;
        val.y = tableY + i * rowH;
        val.eventMode = 'none';
        root.stage.addChild(val);
        values.push(val);
      });

      const uaText = new PIXI.Text({
        text: '',
        style: { fontSize: 10, fill: 0x6a6a7a, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: W - 32 },
      });
      uaText.x = 16;
      uaText.y = tableY + ROWS.length * rowH + 12;
      uaText.eventMode = 'none';
      root.stage.addChild(uaText);

      const diagText = new PIXI.Text({
        text: '',
        style: { fontSize: 11, fill: 0x66aaff, fontFamily: 'monospace' },
      });
      diagText.x = 16;
      diagText.y = H - 28;
      diagText.eventMode = 'none';
      root.stage.addChild(diagText);

      const renderNow = (s: Snapshot) => {
        const Wcur = window.innerWidth;
        const Hcur = window.innerHeight;
        rowH = Math.max(13, Math.min(18, Math.floor((Hcur - 86 - 80) / ROWS.length)));
        bigSize.text = `${s.innerW} x ${s.innerH}`;
        sub.text = `dpr ${s.dpr} \u00b7 css ${s.visualVpW}\u00d7${s.visualVpH} \u00b7 device ${s.screenW}\u00d7${s.screenH}`;
        ROWS.forEach(([_key, fn], i) => {
          values[i].text = String(fn(s));
          labels[i].y = tableY + i * rowH;
          values[i].y = tableY + i * rowH;
        });
        uaText.style.wordWrapWidth = Wcur - 24;
        uaText.x = 12;
        uaText.text = s.ua;
        uaText.y = tableY + ROWS.length * rowH + 8;
        const uaLines = uaText.height > 0 ? Math.ceil(uaText.height / 11) : 1;
        diagText.x = 12;
        diagText.y = Math.min(Hcur - 22, uaText.y + uaLines * 11 + 8);
        diagText.text = `\u25CF ${s.ts}`;
      };
      renderNow(snapshot());

      const tick = () => {
        if (!mounted) return;
        renderNow(snapshot());
      };
      proxy.ticker.add(tick);
      tickerStop = () => proxy.ticker.remove(tick);

      const onResize = () => {
        const W2 = window.innerWidth;
        const H2 = window.innerHeight;
        root.setBounds({ x: 0, y: 0, width: W2, height: H2 });
        bg.clear().rect(0, 0, W2, H2).fill({ color: 0x0a0a14 });
        uaText.style.wordWrapWidth = W2 - 32;
        diagText.y = H2 - 28;
        renderNow(snapshot());
      };
      cleanupResize = proxy.onWindowResize(onResize);
      window.visualViewport?.addEventListener('resize', onResize);
      cleanupVp = () => window.visualViewport?.removeEventListener('resize', onResize);
    });

    return () => {
      mounted = false;
      cleanupResize?.();
      cleanupVp?.();
      tickerStop?.();
      destroy();
    };
  }, []);

  return null;
}

ScreenSizeDisplay.head = {
  title: 'Screen Size — sim',
  description: 'PIXI live readout: inner / visualViewport / screen / dpr / device info.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
