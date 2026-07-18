import * as PIXI from 'pixi.js';
import { SubCanvas } from '../../framework/SubCanvas';

export function mountDisplays(sc: SubCanvas): () => void {
  const crosshair = new PIXI.Graphics();
  const clickLayer = new PIXI.Container();
  let crosshairAlive = true;

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

  sc.stage.addChild(crosshair);
  sc.stage.addChild(clickLayer);
  sc.stage.addChild(moveText);
  sc.stage.addChild(clickCountText);

  let clickCount = 0;

  sc.onMove((e) => {
    if (!crosshairAlive) return;
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

  sc.onPress((e) => {
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
    let ringRemoved = false;
    const tick = () => {
      if (ringRemoved) return;
      t += 1000 / 60 / 700;
      if (t >= 1) {
        sc.ticker.remove(tick);
        ring.removeFromParent();
        ring.destroy();
        label.removeFromParent();
        label.destroy();
        return;
      }
      const r = 6 + t * 26;
      const a = 1 - t;
      try {
        ring.clear();
      } catch {
        ringRemoved = true;
        sc.ticker.remove(tick);
        ring.removeFromParent();
        ring.destroy();
        label.removeFromParent();
        label.destroy();
        return;
      }
      ring.circle(x, y, r).stroke({ width: 2, color: 0xff00ff, alpha: a });
    };
    sc.ticker.add(tick);

    clickCountText.text = `clicks: ${clickCount}`;
  });

  return () => {
    crosshairAlive = false;
    sc.stage.removeChild(crosshair);
    sc.stage.removeChild(clickLayer);
    sc.stage.removeChild(moveText);
    sc.stage.removeChild(clickCountText);
    crosshair.destroy();
    clickLayer.destroy({ children: true });
    moveText.destroy();
    clickCountText.destroy();
  };
}
