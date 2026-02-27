// ============================================================
// 文件: src/plugins/api-demo/utils.ts
// 用途: 提供在演示容器中添加标题和说明文本的辅助函数。
// 上下文: 被所有演示函数调用，统一文本样式。
//
// Outline:
// 1. 导入 PIXI
// 2. 导出函数: addTitle, addDescription
//
// 注意事项:
//   - 标题字体大小 16，黄色加粗带阴影。
//   - 说明文字字体大小 12，灰色。
// ============================================================

import * as PIXI from 'pixi.js';

/**
 * 在演示容器中添加一个标题文本
 * @param container - 演示容器
 * @param title - 标题文字
 * @returns 创建的文本对象
 */
export function addTitle(container: PIXI.Container, title: string): PIXI.Text {
  const text = new PIXI.Text({
    text: title,
    style: {
      fontSize: 16,
      fill: 0xffff00,
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.5,
        blur: 2,
        distance: 2,
        angle: Math.PI / 4,
      },
    },
  });
  text.position.set(10, 10);
  container.addChild(text);
  return text;
}

/**
 * 在演示容器中添加一行说明文本
 * @param container - 演示容器
 * @param description - 说明文字
 * @param y - 垂直位置（相对于容器顶部）
 */
export function addDescription(container: PIXI.Container, description: string, y: number) {
  const text = new PIXI.Text({
    text: description,
    style: {
      fontSize: 12,
      fill: 0xcccccc,
    },
  });
  text.position.set(10, y);
  container.addChild(text);
}