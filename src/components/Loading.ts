import * as PIXI from 'pixi.js';
import { SubCanvas } from '@framework/SubCanvas';
import { gsap } from 'gsap';
import type { ComponentHandle } from '@framework/component';

export interface LoadingOptions {
  text?: string;
  spinnerColor?: number;
  showSpinner?: boolean;
  overlayColor?: number;
  overlayAlpha?: number;
}

export function createLoading(parent: SubCanvas, opts: LoadingOptions = {}): ComponentHandle {
  const text = opts.text ?? 'Loading...';
  const showSpinner = opts.showSpinner !== false;
  const spinnerColor = opts.spinnerColor ?? 0xffffff;
  const overlayColor = opts.overlayColor ?? 0x000000;
  const overlayAlpha = opts.overlayAlpha ?? 0.5;

  const W = parent.bounds.width;
  const H = parent.bounds.height;

  const stage = new PIXI.Container();
  stage.eventMode = 'none';
  parent.stage.addChild(stage);

  const overlay = new PIXI.Graphics()
    .rect(0, 0, W, H)
    .fill({ color: overlayColor, alpha: overlayAlpha });
  overlay.eventMode = 'none';
  stage.addChild(overlay);

  const spinner = new PIXI.Graphics();
  if (showSpinner) {
    spinner.x = W / 2;
    spinner.y = H / 2 - 10;
    spinner.eventMode = 'none';
    stage.addChild(spinner);
  }

  const label = new PIXI.Text({
    text,
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
  });
  label.x = (W - label.width) / 2;
  label.y = showSpinner ? H / 2 + 18 : (H - label.height) / 2;
  label.eventMode = 'none';
  stage.addChild(label);

  const phase = { t: 0 };
  let destroyed = false;

  if (showSpinner) {
    gsap.to(phase, {
      t: Math.PI * 2,
      duration: 1,
      repeat: -1,
      ease: 'none',
      onUpdate: () => {
        if (destroyed) return;
        try { spinner.clear(); } catch { return; }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 - phase.t * 2;
          const x = Math.cos(a) * 14;
          const y = Math.sin(a) * 14;
          spinner.circle(x, y, 3).fill({ color: spinnerColor, alpha: (i + 1) / 8 });
        }
      },
    });
  }

  return {
    stage,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      gsap.killTweensOf(phase);
      if (stage.parent) stage.parent.removeChild(stage);
      stage.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}

export function showLoading(sc: SubCanvas, opts: LoadingOptions | string = {}): () => void {
  const o: LoadingOptions = typeof opts === 'string' ? { text: opts } : opts;
  const handle = createLoading(sc, o);
  return () => handle.destroy();
}
