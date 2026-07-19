import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, textPresets, makeInfoPanel } from '../../framework';
import { mountDisplays } from '../_shared/Displays';

export function SingleDisplay() {
  useEffect(() => {
    const displayCleanups: (() => void)[] = [];
    let cleanupResize: (() => void) | null = null;

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      makeInfoPanel(root, { title: '单一画布', lines: ['用途：全视口画布演示，显示指针跟踪效果', '测试方法：在屏幕上移动鼠标查看十字准星跟随光标；点击任意位置生成带有计数器的涟漪效果', '预期效果：十字准星跟踪光标，每次点击生成紫色涟漪并淡出，点击计数器递增'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const title = new PIXI.Text({
        text: 'single window — full viewport',
        style: textPresets.heading,
      });
      title.x = 12;
      title.y = 12;
      root.stage.addChild(title);

      displayCleanups.push(mountDisplays(root));

      cleanupResize = proxy.onWindowResize(() => {
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      cleanupResize?.();
      displayCleanups.forEach((c) => c());
      destroy();
    };
  }, []);

  return null;
}

SingleDisplay.head = {
  title: 'Single Canvas — sim',
  description: 'Full viewport PIXI canvas — mouse crosshair + click ripple + counter.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
