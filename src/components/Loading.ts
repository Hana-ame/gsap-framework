import * as PIXI from 'pixi.js';
import { SubCanvas } from '../framework/SubCanvas';

export interface LoadingOptions {
  text?: string;
  spinnerColor?: number;
  showSpinner?: boolean;
  overlayColor?: number;
  overlayAlpha?: number;
}

export function showLoading(sc: SubCanvas, opts: LoadingOptions | string = {}): () => void {
  const o: LoadingOptions = typeof opts === 'string' ? { text: opts } : opts;
  const text = o.text ?? 'Loading...';
  const showSpinner = o.showSpinner !== false;
  const spinnerColor = o.spinnerColor ?? 0xffffff;
  const overlayColor = o.overlayColor ?? 0x000000;
  const overlayAlpha = o.overlayAlpha ?? 0.5;

  const W = sc.bounds.width;
  const H = sc.bounds.height;

  const overlay = new PIXI.Graphics()
    .rect(0, 0, W, H)
    .fill({ color: overlayColor, alpha: overlayAlpha });
  overlay.eventMode = 'none';
  sc.stage.addChild(overlay);

  const spinner = new PIXI.Graphics();
  if (showSpinner) {
    spinner.x = W / 2;
    spinner.y = H / 2 - 10;
    spinner.eventMode = 'none';
    sc.stage.addChild(spinner);
  }

  const label = new PIXI.Text({
    text,
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
  });
  label.x = (W - label.width) / 2;
  label.y = showSpinner ? H / 2 + 18 : (H - label.height) / 2;
  label.eventMode = 'none';
  sc.stage.addChild(label);

  let t = 0;
  let removed = false;
  const tick = (ticker: PIXI.Ticker) => {
    if (removed) return;
    t += ticker.deltaMS / 1000;
    spinner.clear();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - t * 2;
      const x = Math.cos(a) * 14;
      const y = Math.sin(a) * 14;
      spinner.circle(x, y, 3).fill({ color: spinnerColor, alpha: (i + 1) / 8 });
    }
  };
  if (showSpinner) sc.ticker.add(tick);

  return () => {
    removed = true;
    sc.ticker.remove(tick);
    sc.stage.removeChild(overlay);
    sc.stage.removeChild(spinner);
    sc.stage.removeChild(label);
    overlay.destroy();
    spinner.destroy();
    label.destroy();
  };
}
