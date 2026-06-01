import * as PIXI from 'pixi.js';

export function mountDisplays(app: PIXI.Application): () => void {
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

  app.stage.addChild(crosshair);
  app.stage.addChild(clickLayer);
  app.stage.addChild(moveText);
  app.stage.addChild(clickCountText);

  let clickCount = 0;

  const onPointerMove = (e: PointerEvent) => {
    const x = e.clientX;
    const y = e.clientY;

    crosshair.clear();
    crosshair
      .moveTo(x - 10, y)
      .lineTo(x + 10, y)
      .moveTo(x, y - 10)
      .lineTo(x, y + 10)
      .stroke({ width: 1, color: 0x00ff00, alpha: 0.8 });

    moveText.text = `move: (${x.toFixed(0)}, ${y.toFixed(0)})`;
  };

  const onPointerDown = (e: PointerEvent) => {
    const x = e.clientX;
    const y = e.clientY;
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
        app.ticker.remove(tick);
        return;
      }
      const r = 6 + t * 26;
      const a = 1 - t;
      ring.clear();
      ring.setStrokeStyle({ width: 2, color: 0xff00ff, alpha: a });
      ring.circle(x, y, r).stroke();
    };
    app.ticker.add(tick);

    clickCountText.text = `clicks: ${clickCount}`;
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerdown', onPointerDown);

  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);

    app.stage.removeChild(crosshair);
    app.stage.removeChild(clickLayer);
    app.stage.removeChild(moveText);
    app.stage.removeChild(clickCountText);

    crosshair.destroy();
    clickLayer.destroy({ children: true });
    moveText.destroy();
    clickCountText.destroy();
  };
}
