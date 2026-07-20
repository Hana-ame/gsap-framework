/** Shared UI constants, text presets, and helper utilities for PixiJS components. */
import * as PIXI from 'pixi.js';
import type { SubCanvas } from '@framework/SubCanvas';

export const textPresets = {
  btn:      { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' } as const,
  label:    { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' } as const,
  dim:      { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' } as const,
  coord:    { fontSize: 11, fill: 0x88aacc, fontFamily: 'monospace' } as const,
  heading:  { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' } as const,
};

export function makeButton(
  label: string,
  w: number,
  h: number,
  onClick: () => void,
  bg: number = 0x1a1a2e,
): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: textPresets.btn,
  });
  t.anchor.set(0.5);
  t.x = w / 2;
  t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export interface Stepper {
  container: PIXI.Container;
  width: number;
  refresh: () => void;
}

export function makeStepper(opts: {
  label: string;
  getValue: () => number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}): Stepper {
  const { label, getValue, onChange, min, max, step = 1 } = opts;
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: textPresets.label,
  });
  lbl.x = 0;
  lbl.y = 2;
  wrap.addChild(lbl);

  const btnW = 22;
  const btnH = 22;
  const valW = 36;
  const rowY = 20;

  let current = getValue();

  const valText = new PIXI.Text({
    text: String(current),
    style: textPresets.btn,
  });
  valText.anchor.set(0.5, 0);
  valText.x = lbl.width + 6 + btnW + valW / 2;
  valText.y = rowY + 3;
  wrap.addChild(valText);

  const stepLabel = step === 1 ? '' : String(step);
  const btnW2 = step > 9 ? 28 : btnW;

  const minus = makeButton('-' + stepLabel, btnW2, btnH, () => {
    if (current > min) {
      current = Math.max(min, current - step);
      valText.text = String(current);
      onChange(current);
    }
  });
  minus.x = lbl.width + 6;
  minus.y = rowY;
  wrap.addChild(minus);

  const plus = makeButton('+' + stepLabel, btnW2, btnH, () => {
    if (current < max) {
      current = Math.min(max, current + step);
      valText.text = String(current);
      onChange(current);
    }
  });
  plus.x = lbl.width + 6 + btnW2 + valW;
  plus.y = rowY;
  wrap.addChild(plus);

  const width = lbl.width + 6 + btnW2 + valW + btnW2;
  const refresh = () => {
    current = getValue();
    valText.text = String(current);
  };
  return { container: wrap, width, refresh };
}

export interface InfoPanelOptions {
  title: string;
  lines: string[];
  x?: number;
  y?: number;
  maxWidth?: number;
}

export function makeInfoPanel(parent: PIXI.Container | SubCanvas, opts: InfoPanelOptions): PIXI.Container {
  const stage = parent instanceof PIXI.Container ? parent : parent.stage;
  const { title, lines, x = 14, y: py = 14, maxWidth = 360 } = opts;
  const panel = new PIXI.Container();
  panel.eventMode = 'none';
  panel.zIndex = 2147483647;
  if (stage.sortableChildren !== true) stage.sortableChildren = true;

  const titleText = new PIXI.Text({
    text: title,
    style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  titleText.x = 10;
  titleText.y = 8;
  titleText.eventMode = 'none';
  panel.addChild(titleText);

  const textStyle = new PIXI.TextStyle({
    fontSize: 11,
    fill: 0xccccdd,
    fontFamily: 'monospace',
    lineHeight: 17,
    wordWrap: true,
    wordWrapWidth: maxWidth - 20,
  });
  const body = new PIXI.Text({
    text: lines.join('\n'),
    style: textStyle,
  });
  body.x = 10;
  body.y = titleText.height + 12;
  body.eventMode = 'none';
  panel.addChild(body);

  const pw = Math.max(titleText.width, body.width) + 20;
  const ph = titleText.height + body.height + 20;

  const bg = new PIXI.Graphics()
    .roundRect(0, 0, pw, ph, 8)
    .fill({ color: 0x0a0a14, alpha: 0.85 })
    .stroke({ width: 1, color: 0x2a2a3a });
  bg.eventMode = 'none';
  panel.addChildAt(bg, 0);

  panel.x = x;
  panel.y = py;
  stage.addChild(panel);
  return panel;
}
