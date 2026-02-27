// ============================================================
// 文件: src/plugins/api-demo/demos/interaction.ts
// 用途: 演示交互事件 (Interaction)
//       包括点击矩形变色、鼠标悬停圆形变色。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/interaction' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数、状态管理
// 2. 定义并导出 showInteraction 函数
// 3. 创建可交互的矩形和圆形，设置事件监听
// 4. 将交互对象存入状态，以便清理时移除监听
//
// 注意事项:
//   - 必须设置 eventMode = 'static' 并指定 cursor。
//   - 交互对象保存在 state.interactiveObjects 中。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo, appStates } from '../state';
import { addTitle, addDescription } from '../utils';
import { AppState } from '../types';

export function showInteraction(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '交互事件 (Interaction)');
  addDescription(container, '点击矩形变红，鼠标悬停圆形变蓝', 40);

  const rect = new PIXI.Graphics();
  rect.rect(30, 60, 80, 50);
  rect.fill(0x3366cc);
  rect.stroke({ width: 2, color: 0xffffff });
  rect.eventMode = 'static';
  rect.cursor = 'pointer';
  rect.on('pointerdown', () => {
    rect.fill(0xff0000);
    rect.stroke({ width: 2, color: 0xffff00 });
  });
  container.addChild(rect);

  const circle = new PIXI.Graphics();
  circle.circle(160, 85, 30);
  circle.fill(0x44aa44);
  circle.stroke({ width: 2, color: 0xffffff });
  circle.eventMode = 'static';
  circle.cursor = 'grab';
  circle.on('pointerover', () => {
    circle.fill(0x0000ff);
  });
  circle.on('pointerout', () => {
    circle.fill(0x44aa44);
  });
  container.addChild(circle);

  // 保存交互对象以便清理
  const state = appStates.get(app)!;
  state.interactiveObjects = [rect, circle];

  const tip = new PIXI.Text({
    text: '尝试点击矩形，鼠标悬停圆形',
    style: { fontSize: 12, fill: 0xffff00 },
  });
  tip.position.set(30, 130);
  container.addChild(tip);
}