// ============================================================
// 文件: src/plugins/api-demo/demos/container.ts
// 用途: 演示容器与层级 (Container)
//       包括创建子容器、移动容器影响所有子元素、调整子元素顺序。
// 上下文: 被 demos/index.ts 导入，由 apiDemoPlugin 在收到
//        'apiDemo/container' 消息时调用。
//
// Outline:
// 1. 导入 PIXI 及辅助函数、状态管理
// 2. 定义并导出 showContainer 函数
// 3. 创建子容器并添加多个矩形，添加移动按钮
// 4. 保存交互对象以便清理
//
// 注意事项:
//   - 移动按钮演示了移动整个容器。
// ============================================================

import * as PIXI from 'pixi.js';
import { getDemoContainer, clearDemo, appStates } from '../state';
import { addTitle, addDescription } from '../utils';
import { AppState } from '../types';

export function showContainer(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, '容器与层级 (Container)');
  addDescription(container, '容器整体移动，子元素顺序', 40);

  const subContainer = new PIXI.Container();
  subContainer.position.set(50, 70);

  const rect1 = new PIXI.Graphics();
  rect1.rect(0, 0, 40, 30);
  rect1.fill(0xff0000);
  subContainer.addChild(rect1);

  const rect2 = new PIXI.Graphics();
  rect2.rect(20, 15, 40, 30);
  rect2.fill(0x00ff00);
  subContainer.addChild(rect2);

  const rect3 = new PIXI.Graphics();
  rect3.rect(40, 30, 40, 30);
  rect3.fill(0x0000ff);
  subContainer.addChild(rect3);

  container.addChild(subContainer);

  const moveButton = new PIXI.Graphics();
  moveButton.rect(200, 70, 80, 30);
  moveButton.fill(0x666666);
  moveButton.stroke({ width: 1, color: 0xffffff });
  moveButton.eventMode = 'static';
  moveButton.cursor = 'pointer';
  moveButton.on('pointerdown', () => {
    subContainer.x += 10;
    if (subContainer.x > 200) subContainer.x = 50;
  });
  container.addChild(moveButton);

  const buttonText = new PIXI.Text({
    text: '移动容器',
    style: { fontSize: 12, fill: 0xffffff },
  });
  buttonText.position.set(210, 76);
  container.addChild(buttonText);

  const state = appStates.get(app)!;
  state.interactiveObjects = [moveButton];
}