import * as PIXI from 'pixi.js';

export const TXT = {
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
    style: TXT.btn,
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

export function makeStepper(
  label: string,
  getValue: () => number,
  onChange: (v: number) => void,
  min: number,
  max: number,
): Stepper {
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: TXT.label,
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
    style: TXT.btn,
  });
  valText.anchor.set(0.5, 0);
  valText.x = lbl.width + 6 + btnW + valW / 2;
  valText.y = rowY + 3;
  wrap.addChild(valText);

  const minus = makeButton('-', btnW, btnH, () => {
    if (current > min) {
      current -= 1;
      valText.text = String(current);
      onChange(current);
    }
  });
  minus.x = lbl.width + 6;
  minus.y = rowY;
  wrap.addChild(minus);

  const plus = makeButton('+', btnW, btnH, () => {
    if (current < max) {
      current += 1;
      valText.text = String(current);
      onChange(current);
    }
  });
  plus.x = lbl.width + 6 + btnW + valW;
  plus.y = rowY;
  wrap.addChild(plus);

  const width = lbl.width + 6 + btnW + valW + btnW;
  const refresh = () => {
    current = getValue();
    valText.text = String(current);
  };
  return { container: wrap, width, refresh };
}
