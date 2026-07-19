import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeInfoPanel, textPresets, type SubCanvas, type SubCanvasProxy } from '@framework';
import { createWindow, type GameWindow } from '../../components';
import { mountDisplays } from '../_shared/Displays';

export function ComponentSingleWindowDisplay() {
  useEffect(() => {
    let root: SubCanvas | null = null;
    let win: GameWindow | null = null;
    let displayCleanup: (() => void) | null = null;

    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      makeInfoPanel(root, {
        title: '单窗口应用',
        lines: [
          '用途：极简单窗口应用布局展示。',
          '测试方法：观察带内容区域的窗口。',
          '预期效果：单窗口占据屏幕大部分区域，包含标题栏和内容区。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      const title = new PIXI.Text({
        text: 'single window — draggable',
        style: textPresets.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      win = createWindow({
        parent: root,
        title: 'Single Display',
        x: 60,
        y: 60,
        width: 500,
        height: 400,
        draggable: true,
        closable: true,
      });

      displayCleanup = mountDisplays(win.content);
    });

    return () => {
      displayCleanup?.();
      win?.destroy();
      stop();
    };
  }, []);

  return null;
}

ComponentSingleWindowDisplay.head = {
  title: 'Single Window — Draggable',
  description: '#single crosshair + click ripple inside a draggable window.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
