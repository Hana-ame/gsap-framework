import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';
import { AvdController, parseScript } from '../../components';
import { preloadImages, getTexture, makeResolver } from '../h-scenes/imageMap';
import { HB1_LINES } from '../h-scenes/HB1Script';

const CONTROL_H = 48;

function makeButton(label: string, w: number, h: number, onClick: () => void): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: 0x1a1a2e, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({ text: label, style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' } });
  t.anchor.set(0.5); t.x = w / 2; t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static'; btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', onClick);
  return btn;
}

export function ComponentAvdHb1Display() {
  const avdRef = useRef<AvdController | null>(null);
  const destroyRef = useRef<(() => void) | null>(null);
  const [showBacklog, setShowBacklog] = useState(false);
  const [backlogData, setBacklogData] = useState<string[]>([]);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const avdH = H - CONTROL_H;

    destroyRef.current = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      makeInfoPanel(root, {
        title: 'HB1 忠誠オナニー1',
        lines: ['忠誠：オナニー(通常服)', 'クリックで進行'],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      const controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      const avdRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: avdH });

      const allBgKeys = HB1_LINES.filter(l => l.bgKey).map(l => l.bgKey!);
      preloadImages(allBgKeys).then(() => {
        return parseScript({ lines: HB1_LINES, roster: {} }, makeResolver());
      }).then((parsed) => {
        const avd = new AvdController(avdRegion.stage, avdRegion.ticker, {
          screenW: W, screenH: avdH,
          boxY: avdH - 200 - 40,
          portraitY: avdH - 560 - 20,
          typewriterSpeed: 35,
          onComplete: () => {},
          onLineEnter: () => {},
        });

        avd.setBgTextureMap(Object.fromEntries(allBgKeys.map(k => [k, getTexture(k)])));
        avd.setScript(parsed.lines);
        avdRef.current = avd;

        if (controlRegion) {
          const stage = controlRegion.stage;
          const restartBtn = makeButton('Restart', 72, 28, () => {
            avd.destroy();
            avdRef.current = null;
            location.reload();
          });
          restartBtn.x = 12; restartBtn.y = 10;
          stage.addChild(restartBtn);

          const backlogBtn = makeButton('记录', 56, 28, () => {
            setBacklogData(avd.getBacklog().map((e) => `[${e.speaker ?? '--'}] ${e.text}`));
            setShowBacklog((v) => !v);
          });
          backlogBtn.x = 96; backlogBtn.y = 10;
          stage.addChild(backlogBtn);
        }
      });
    });

    return () => {
      avdRef.current?.destroy();
      if (destroyRef.current) destroyRef.current();
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      {showBacklog && (
        <div className="hsc-backlog-overlay" onClick={() => setShowBacklog(false)}>
          <div className="hsc-backlog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="hsc-backlog-title">对话记录</div>
            <div className="hsc-backlog-list">
              {backlogData.length === 0 ? (
                <div className="hsc-backlog-empty">暂无记录</div>
              ) : (
                backlogData.map((l, i) => <div key={i} className="hsc-backlog-item">{l}</div>)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ComponentAvdHb1Display.head = {
  title: 'HB1 忠誠オナニー1',
  description: '「イルと貧乳の国」忠誠オナニーシーン(通常服)',
};

const css = `
.hsc-backlog-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.hsc-backlog-panel {
  background: rgba(10,10,20,0.95);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 16px;
  width: 80%; max-width: 600px; max-height: 80vh;
  display: flex; flex-direction: column;
  color: #c8c8e8;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.hsc-backlog-title {
  font-size: 1rem; font-weight: bold;
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px solid #2a2a4a;
}
.hsc-backlog-list { overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.hsc-backlog-empty { opacity: 0.4; }
.hsc-backlog-item {
  font-size: 0.8rem; padding: 3px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.03);
}
`;
