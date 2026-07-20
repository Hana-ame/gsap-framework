// Example: Analog clock rendering on SubCanvas
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';

export function ComponentClockDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '模拟时钟', lines: ['用途：带平滑秒针的实时模拟时钟', '测试方法：观察时钟，显示当前时间', '预期效果：时、分、秒针正确转动，实时更新'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
      const R = Math.max(120, radius);

      const face = new PIXI.Container();
      face.eventMode = 'none';
      root.stage.addChild(face);

      const bg = new PIXI.Graphics()
        .circle(cx, cy, R + 20)
        .fill({ color: 0x0a0a14 })
        .stroke({ width: 2, color: 0x2a3a4a });
      face.addChild(bg);

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const isHour = i % 3 === 0;
        const innerR = isHour ? R * 0.82 : R * 0.87;
        const outerR = isHour ? R * 0.95 : R * 0.92;
        const g = new PIXI.Graphics()
          .moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
          .lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
          .stroke({ width: isHour ? 3 : 1.5, color: 0x556688 });
        face.addChild(g);
      }

      for (let i = 0; i < 60; i++) {
        if (i % 5 === 0) continue;
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const innerR = R * 0.93;
        const outerR = R * 0.96;
        const g = new PIXI.Graphics()
          .moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
          .lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
          .stroke({ width: 0.8, color: 0x334455 });
        face.addChild(g);
      }

      for (let i = 1; i <= 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const t = new PIXI.Text({
          text: String(i),
          style: { fontSize: i % 3 === 0 ? 22 : 16, fill: 0x88aacc, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        t.anchor.set(0.5);
        t.x = cx + Math.cos(angle) * R * 0.72;
        t.y = cy + Math.sin(angle) * R * 0.72;
        face.addChild(t);
      }

      const centerDot = new PIXI.Graphics()
        .circle(cx, cy, 6)
        .fill({ color: 0x88aacc });
      face.addChild(centerDot);

      const hourHand = new PIXI.Graphics();
      face.addChild(hourHand);
      const minuteHand = new PIXI.Graphics();
      face.addChild(minuteHand);
      const secondHand = new PIXI.Graphics();
      face.addChild(secondHand);

      const digital = new PIXI.Text({
        text: '',
        style: { fontSize: 24, fill: 0x88aacc, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      digital.anchor.set(0.5);
      digital.x = cx;
      digital.y = cy + R * 0.5;
      face.addChild(digital);

      const dateText = new PIXI.Text({
        text: '',
        style: { fontSize: 13, fill: 0x556688, fontFamily: 'monospace' },
      });
      dateText.anchor.set(0.5);
      dateText.x = cx;
      dateText.y = cy + R * 0.5 + 32;
      face.addChild(dateText);

      function drawHands() {
        const now = new Date();
        const h = now.getHours() % 12;
        const m = now.getMinutes();
        const s = now.getSeconds();
        const ms = now.getMilliseconds();

        const sAngle = ((s + ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
        const mAngle = ((m + s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
        const hAngle = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;

        const hLen = R * 0.45;
        const mLen = R * 0.6;
        const sLen = R * 0.75;

        hourHand.clear()
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(hAngle) * hLen, cy + Math.sin(hAngle) * hLen)
          .stroke({ width: 5, color: 0x88aacc, cap: 'round' });

        minuteHand.clear()
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(mAngle) * mLen, cy + Math.sin(mAngle) * mLen)
          .stroke({ width: 3, color: 0x88aacc, cap: 'round' });

        secondHand.clear()
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(sAngle) * sLen, cy + Math.sin(sAngle) * sLen)
          .stroke({ width: 1.5, color: 0xff4455, cap: 'round' });

        digital.text = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        dateText.text = now.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      }

      drawHands();
      const ticker = proxy.ticker;
      const tickFn = () => drawHands();
      ticker.add(tickFn);

      return () => {
        ticker.remove(tickFn);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentClockDisplay.head = {
  title: 'Analog + Digital Clock',
  description: 'Real-time analog clock with smooth second hand, hour/minute markings, digital display, and date. All PIXI-rendered.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
