import * as PIXI from 'pixi.js';
import { WindowInstance } from './WindowInstance';

export function mountDisplays(win: WindowInstance): () => void {
  const crosshair = new PIXI.Graphics();
  const clickLayer = new PIXI.Container();

  const moveText = new PIXI.Text({
    text: 'move: -',
    style: { fontSize: 14, fill: 0x00ff00, fontFamily: 'monospace' },
  });
  moveText.x = 10;
  moveText.y = 10;

  const clickCountText = new PIXI.Text({
    text: 'clicks: 0',
    style: { fontSize: 14, fill: 0xff00ff, fontFamily: 'monospace' },
  });
  clickCountText.x = 10;
  clickCountText.y = 30;

  win.stage.addChild(crosshair);
  win.stage.addChild(clickLayer);
  win.stage.addChild(moveText);
  win.stage.addChild(clickCountText);

  let clickCount = 0;

  win.onMove((e) => {
    const x = e.x;
    const y = e.y;

    crosshair.clear();
    crosshair
      .moveTo(x - 10, y)
      .lineTo(x + 10, y)
      .moveTo(x, y - 10)
      .lineTo(x, y + 10)
      .stroke({ width: 1, color: 0x00ff00, alpha: 0.8 });

    moveText.text = `move: (${x.toFixed(0)}, ${y.toFixed(0)})`;
  });

  win.onPress((e) => {
    const x = e.x;
    const y = e.y;
    clickCount += 1;

    const ring = new PIXI.Graphics();
    ring.circle(x, y, 6).fill({ color: 0xff00ff });
    clickLayer.addChild(ring);

    const label = new PIXI.Text({
      text: `#${clickCount} (${x.toFixed(0)}, ${y.toFixed(0)})`,
      style: { fontSize: 12, fill: 0xff00ff, fontFamily: 'monospace' },
    });
    label.x = x + 12;
    label.y = y - 6;
    clickLayer.addChild(label);

    let t = 0;
    const tick = (delta: { deltaMS: number }) => {
      t += delta.deltaMS / 700;
      if (t >= 1) {
        win.ticker.remove(tick);
        return;
      }
      const r = 6 + t * 26;
      const a = 1 - t;
      ring.clear();
      ring.setStrokeStyle({ width: 2, color: 0xff00ff, alpha: a });
      ring.circle(x, y, r).stroke();
    };
    win.ticker.add(tick);

    clickCountText.text = `clicks: ${clickCount}`;
  });

  return () => {
    win.stage.removeChild(crosshair);
    win.stage.removeChild(clickLayer);
    win.stage.removeChild(moveText);
    win.stage.removeChild(clickCountText);
    crosshair.destroy();
    clickLayer.destroy({ children: true });
    moveText.destroy();
    clickCountText.destroy();
  };
}
