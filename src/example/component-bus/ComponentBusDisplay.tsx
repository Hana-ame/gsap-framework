// Example: Event bus communication between components
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, EventBus, type SubCanvas, type SubCanvasProxy } from '@framework';
import { textPresets, makeInfoPanel } from '@components';
import { createWindow, type GameWindow } from '../../components';
// NOTE: this example uses createWindow() directly as a component demo. Do NOT migrate to WindowManagerAdapter — standalone component showcases should keep using the direct API.

type BusPayload = { from: string; text: string; n: number };

export function ComponentBusDisplay() {
  const scRef = useRef<SubCanvas | null>(null);
  const busRef = useRef<EventBus | null>(null);
  const sendRef = useRef<GameWindow | null>(null);
  const recvRef = useRef<GameWindow | null>(null);
  const recvLogRef = useRef<string[]>([]);
  const [htmlLog, setHtmlLog] = useState<string[]>([]);

  const appendHtml = (line: string) =>
    setHtmlLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 6));

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;
      makeInfoPanel(sc, { title: '事件总线', lines: ['目的：演示 EventBus 发布-订阅模式，带发送和接收窗口。', '操作：在发送窗口输入消息并点击发送。观察接收窗口。', '预期：接收窗口显示消息。多个订阅者均收到同一事件。取消订阅后停止接收。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });
      busRef.current = proxy.bus;

      const drawLog = (parent: SubCanvas, lines: string[]) => {
        const wrap = new PIXI.Container();
        let y = 50;
        for (const line of lines) {
          const t = new PIXI.Text({
            text: line,
            style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
          });
          t.x = 12;
          t.y = y;
          wrap.addChild(t);
          y += 18;
        }
        parent.stage.addChild(wrap);
        return wrap;
      };

      sendRef.current = createWindow({
        title: 'Sender',
        x: 60,
        y: 110,
        width: 320,
        height: 120,
        parent: sc,
        dragMode: 'anywhere',
      });
      let sendN = 0;
      const sendBtn = makeButton('emit ping', 12, 40, () => {
        const n = ++sendN;
        const payload: BusPayload = { from: 'sender', text: `ping #${n}`, n };
        busRef.current?.emit<BusPayload>('ping', payload);
        appendHtml(`emit ping #${n}`);
      });
      sendRef.current.stage.addChild(sendBtn);
      const sendHint = new PIXI.Text({
        text: 'click to emit · drag anywhere',
        style: textPresets.dim,
      });
      sendHint.x = 12;
      sendHint.y = 78;
      sendRef.current.stage.addChild(sendHint);

      recvRef.current = createWindow({
        title: 'Receiver',
        x: 420,
        y: 110,
        width: 360,
        height: 320,
        parent: sc,
        dragMode: 'anywhere',
      });
      let logWrap = drawLog(recvRef.current, ['waiting...']);
      const refresh = () => {
        logWrap.destroy();
        logWrap = drawLog(recvRef.current!, recvLogRef.current.slice(-10));
      };
      busRef.current?.on<BusPayload>('ping', (p) => {
        recvLogRef.current.push(`${p.text} (n=${p.n})`);
        refresh();
        appendHtml(`recv ${p.text}`);
      });
    });
    return () => {
      sendRef.current?.destroy();
      recvRef.current?.destroy();
      stop();
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="overlay top">
        <div className="panel">
          <div className="panel-title">EventBus.ts</div>
          <div className="panel-hint">
            proxy.bus.emit&lt;T&gt;(type, payload) · on&lt;T&gt;(type, fn) &rarr; cleanup
            <br />
            shared across all SubCanvases in the proxy. Move Receiver anywhere; emit
            still reaches.
          </div>
        </div>
      </div>
      <div className="overlay bottom">
        <div className="log">
          {htmlLog.length === 0 ? (
            <div className="log-empty">log empty — click "emit ping" in Sender</div>
          ) : (
            htmlLog.map((l, i) => (
              <div key={i} className="log-line">
                {l}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function makeButton(label: string, x: number, y: number, onClick: () => void) {
  const c = new PIXI.Container();
  c.x = x;
  c.y = y;
  c.eventMode = 'static';
  c.cursor = 'pointer';
  const g = new PIXI.Graphics();
  g.roundRect(0, 0, 96, 30, 6).fill(0x14141f).stroke({ color: 0x4a6a9a, width: 1 });
  c.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
  });
  t.x = (96 - t.width) / 2;
  t.y = (30 - t.height) / 2;
  c.addChild(t);
  c.on('pointerdown', (e) => {
    e.stopPropagation();
    onClick();
  });
  c.hitArea = new PIXI.Rectangle(0, 0, 96, 30);
  return c;
}

ComponentBusDisplay.head = {
  title: 'subcanvas — Bus',
  description: 'Showcase: EventBus pub-sub between windows.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

const css = `
.overlay { position: fixed; left: 0; right: 0; z-index: 50; pointer-events: none; display: flex; justify-content: center; padding: 0 12px; }
.overlay.top { top: 16px; }
.overlay.bottom { bottom: 16px; }
.panel {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 14px 18px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  min-width: 380px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.panel-title { font-size: 0.85rem; color: #88aaff; margin-bottom: 4px; }
.panel-hint { font-size: 0.72rem; opacity: 0.65; line-height: 1.5; white-space: pre-wrap; }
.log {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 10px 14px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  font-size: 0.72rem;
  min-width: 380px;
  max-height: 140px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.log-empty { opacity: 0.4; }
.log-line { padding: 1px 0; }
`;
