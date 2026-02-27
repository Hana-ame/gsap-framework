// ============================================================
// 文件: src/plugins/api-demo/demos/animation.ts
// 用途: 演示动画 (Ticker)
//       包括旋转、移动、缩放动画，并显示帧率。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/animation' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数、状态管理
// 2. 定义并导出 showAnimation 函数
// 3. 创建矩形、圆形、FPS 文本，注册 ticker 回调
// 4. 在状态中保存 tickerCallback 以便清理
//
// 注意事项:
//   - 使用 app.ticker 进行逐帧更新。
//   - 需要保存回调到状态，以便切换演示时移除。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo, appStates } from '../state';
import { addTitle, addDescription } from '../utils';
import { AppState } from '../types';

export function showAnimation(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '动画 (Ticker)');
  addDescription(container, '旋转、移动、缩放动画', 40);

  const rect = new PIXI.Graphics();
  rect.rect(0, 0, 40, 30);
  rect.fill(0x00aaff);
  rect.stroke({ width: 2, color: 0xffffff });
  rect.position.set(50, 80);
  container.addChild(rect);

  const circle = new PIXI.Graphics();
  circle.circle(0, 0, 20);
  circle.fill(0xffaa00);
  circle.position.set(150, 95);
  container.addChild(circle);

  const fpsText = new PIXI.Text({
    text: 'FPS: ',
    style: { fontSize: 12, fill: 0xffffff },
  });
  fpsText.position.set(250, 80);
  container.addChild(fpsText);

  let circleY = 80;
  let circleDir = 1;

  const tickerCallback = () => {
    rect.rotation += 0.02;

    circleY += circleDir * 1.5;
    if (circleY > 120 || circleY < 60) circleDir *= -1;
    circle.y = circleY;

    fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
  };

  app.ticker.add(tickerCallback);

  // 保存回调以便清理
  const state = (appStates as any).get(app) as AppState;
  state.tickerCallback = tickerCallback;
}