// ============================================================
// 文件: src/plugins/apiDemo.plugin.ts
// 用途: PixiJS v8 API 教学演示插件。提供一系列从简单到复杂的示例，
//       展示 PixiJS 的核心功能：图形绘制、文本样式、精灵加载、
//       动画系统、滤镜应用、交互事件、容器层级以及简单粒子系统。
// 上下文: 注册到 PixiController，通过发送特定消息类型触发不同演示。
//        每个演示都会在一个固定区域（舞台左上角）展示，并带有说明文本。
//        插件内部使用 WeakMap 管理每个 app 实例的独立状态，确保多画布安全。
//
// 处理逻辑:
//   1. 插件通过 messageTypes 声明自己能处理的所有演示消息类型。
//   2. execute 方法根据 message.type 调用对应的演示函数。
//   3. 每个演示函数接收 app 和消息参数，首先获取/创建该 app 专用的演示容器，
//      然后清除容器内旧内容并停止任何正在运行的动画，最后构建新的演示内容。
//   4. 演示区域固定为从 (50, 50) 开始、宽度 400 高度 250 的矩形，并添加半透明背景。
//   5. 所有演示示例都带有标题和简要说明，方便理解。
//
// 使用方法:
//   // 在 App.tsx 中注册插件
//   import { apiDemoPlugin } from './plugins/apiDemo.plugin';
//   controller.registerPlugin(apiDemoPlugin);
//
//   // 发送消息触发演示
//   controller.sendToPixi({ type: 'apiDemo/basicShapes' });
//   controller.sendToPixi({ type: 'apiDemo/text' });
//   controller.sendToPixi({ type: 'apiDemo/sprite' });
//   controller.sendToPixi({ type: 'apiDemo/animation' });
//   controller.sendToPixi({ type: 'apiDemo/filter' });
//   controller.sendToPixi({ type: 'apiDemo/interaction' });
//   controller.sendToPixi({ type: 'apiDemo/container' });
//   controller.sendToPixi({ type: 'apiDemo/particles' });
//
// 注意事项:
//   - 每个演示都会完全替换之前的内容，动画和交互会被正确清理。
//   - 演示容器被固定在舞台左上角，不会影响舞台上其他已有图形。
//   - 为了教学清晰，所有示例代码都带有详细注释，并尽可能使用最新的 PixiJS v8 API。
//   - 精灵示例使用内置生成的纹理，避免依赖外部图片。
//   - 粒子示例使用 ParticleContainer 优化性能，展示简单粒子系统。
// ============================================================

import { PixiPlugin } from "./plugin.types";
import * as PIXI from "pixi.js";

// ============================================================
// 类型定义与状态管理
// ============================================================

/**
 * 每个应用实例的私有状态
 */
interface AppState {
  /** 用于放置所有演示内容的容器 */
  container: PIXI.Container;
  /** 当前正在运行的动画 ticker 回调（如果有），切换演示时需要移除 */
  tickerCallback?: () => void;
  /** 当前正在运行的交互对象（如可点击的图形），切换演示时需要清理事件监听 */
  interactiveObjects?: PIXI.Graphics[];
}

/**
 * 使用 WeakMap 存储每个 app 的状态，避免内存泄漏
 * WeakMap 的键是 app 对象本身，当 app 被销毁时，对应的状态会自动垃圾回收
 */
const appStates = new WeakMap<PIXI.Application, AppState>();

// ============================================================
// 辅助函数：获取或创建演示容器
// ============================================================

/**
 * 获取指定 app 的演示容器，如果不存在则创建并初始化
 * @param app - PIXI.Application 实例
 * @returns 该 app 对应的演示容器
 */
function getDemoContainer(app: PIXI.Application): PIXI.Container {
  let state = appStates.get(app);
  if (!state) {
    // 创建新的容器
    const container = new PIXI.Container();
    container.label = "apiDemoContainer";
    container.position.set(50, 50); // 固定在左上角，留出边距
    app.stage.addChild(container);

    // 添加一个半透明的背景矩形，使演示内容更清晰
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 400, 250);
    bg.fill({ color: 0x000000, alpha: 0.3 });
    bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    container.addChild(bg);

    state = { container };
    appStates.set(app, state);
  }
  return state.container;
}

/**
 * 清除当前演示内容，并停止任何正在运行的动画
 * @param app - PIXI.Application 实例
 */
function clearDemo(app: PIXI.Application) {
  const state = appStates.get(app);
  if (!state) return;

  // 移除之前添加的 ticker 回调
  if (state.tickerCallback) {
    app.ticker.remove(state.tickerCallback);
    state.tickerCallback = undefined;
  }

  // 移除之前的交互对象（如果有）
  if (state.interactiveObjects) {
    state.interactiveObjects.forEach((obj) => {
      obj.removeAllListeners(); // 移除所有事件监听
    });
    state.interactiveObjects = undefined;
  }

  // 清空容器，但保留背景（索引0）
  const container = state.container;
  while (container.children.length > 1) {
    container.removeChildAt(1).destroy({ children: true });
  }
}

/**
 * 在演示容器中添加一个标题文本
 * @param container - 演示容器
 * @param title - 标题文字
 * @returns 创建的文本对象
 */
function addTitle(container: PIXI.Container, title: string): PIXI.Text {
  const text = new PIXI.Text({
    text: title,
    style: {
      fontSize: 16,
      fill: 0xffff00,
      fontWeight: "bold",
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
function addDescription(
  container: PIXI.Container,
  description: string,
  y: number,
) {
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

// ============================================================
// 各个演示函数
// ============================================================

/**
 * 演示基础图形绘制 (Graphics)
 * - 矩形、圆形、线条、多边形
 * - 填充与描边
 */
function showBasicShapes(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "基础图形 (Graphics)");
  addDescription(container, "矩形、圆形、线条、多边形", 40);

  // 创建一个 Graphics 对象，所有图形都画在上面（也可以分别创建多个，这里集中演示）
  const graphics = new PIXI.Graphics();

  // 矩形（填充红色，黑色描边）
  graphics.rect(20, 60, 60, 40);
  graphics.fill(0xff0000);
  graphics.stroke({ width: 2, color: 0x000000 });

  // 圆形（填充蓝色，无描边）
  graphics.circle(120, 80, 25);
  graphics.fill(0x0000ff);

  // 线条（绿色，线宽3）
  graphics.moveTo(160, 60);
  graphics.lineTo(200, 100);
  graphics.stroke({ width: 3, color: 0x00ff00 });

  // 多边形（黄色填充，紫色描边）
  graphics.poly([220, 60, 260, 60, 240, 100]);
  graphics.fill(0xffff00);
  graphics.stroke({ width: 2, color: 0xff00ff });

  container.addChild(graphics);
}

/**
 * 演示文本样式 (Text)
 * - 不同字体、大小、颜色
 * - 描边、阴影
 */
function showText(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "文本样式 (Text)");

  // 普通文本
  const text1 = new PIXI.Text({
    text: "普通文本",
    style: { fontSize: 14, fill: 0xffffff },
  });
  text1.position.set(10, 40);
  container.addChild(text1);

  // 彩色文本
  const text2 = new PIXI.Text({
    text: "彩色文本",
    style: { fontSize: 16, fill: 0xffaa00 },
  });
  text2.position.set(10, 70);
  container.addChild(text2);

  // 描边文本
  const text3 = new PIXI.Text({
    text: "描边文本",
    style: {
      fontSize: 18,
      fill: 0x00ff00,
      stroke: { color: 0x0000ff, width: 2 },
    },
  });
  text3.position.set(10, 100);
  container.addChild(text3);

  // 阴影文本
  const text4 = new PIXI.Text({
    text: "阴影文本",
    style: {
      fontSize: 18,
      fill: 0xffffff,
      dropShadow: {
        alpha: 0.8,
        blur: 4,
        distance: 3,
        angle: Math.PI / 4,
      },
    },
  });
  text4.position.set(150, 100);
  container.addChild(text4);

  // 多种样式组合
  const text5 = new PIXI.Text({
    text: "组合样式",
    style: {
      fontSize: 20,
      fill: 0xff00ff,
      stroke: { color: 0xffffff, width: 1 },
      dropShadow: {
        alpha: 0.7,
        blur: 3,
        distance: 2,
        angle: 0,
      },
    },
  });
  text5.position.set(10, 140);
  container.addChild(text5);

  addDescription(container, "支持字体、颜色、描边、阴影等", 180);
}

/**
 * 演示精灵 (Sprite)
 * - 从纹理创建精灵
 * - 设置位置、旋转、缩放、透明度
 * - 使用 tint 改变颜色
 */
function showSprite(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "精灵 (Sprite)");
  addDescription(container, "纹理、位置、旋转、缩放、tint", 40);

  // 创建一个圆形纹理（使用 Graphics 生成）
  const circleGraphic = new PIXI.Graphics();
  circleGraphic.circle(0, 0, 25);
  circleGraphic.fill(0xffaa00);
  const texture = app.renderer.generateTexture(circleGraphic);

  // 创建第一个精灵
  const sprite1 = new PIXI.Sprite(texture);
  sprite1.position.set(50, 80);
  sprite1.rotation = 0.2; // 旋转
  sprite1.scale.set(1.2); // 缩放
  container.addChild(sprite1);

  // 创建第二个精灵，使用 tint 改变颜色
  const sprite2 = new PIXI.Sprite(texture);
  sprite2.position.set(130, 90);
  sprite2.tint = 0x00ff00; // 变为绿色
  sprite2.alpha = 0.7; // 半透明
  container.addChild(sprite2);

  // 创建第三个精灵，设置锚点为中心，并添加边框效果
  const sprite3 = new PIXI.Sprite(texture);
  sprite3.anchor.set(0.5);
  sprite3.position.set(220, 100);
  sprite3.scale.set(1.5);
  sprite3.rotation = 0.5;
  container.addChild(sprite3);

  // 添加一个白色方块精灵演示纹理复用
  const whiteTexture = PIXI.Texture.WHITE;
  const sprite4 = new PIXI.Sprite(whiteTexture);
  sprite4.position.set(300, 80);
  sprite4.width = 40;
  sprite4.height = 40;
  sprite4.tint = 0xff0000; // 红色方块
  container.addChild(sprite4);
}

/**
 * 演示动画 (Ticker)
 * - 使用 app.ticker 创建动画
 * - 移动、旋转、缩放动画
 */
function showAnimation(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "动画 (Ticker)");
  addDescription(container, "旋转、移动、缩放动画", 40);

  // 创建一个矩形
  const rect = new PIXI.Graphics();
  rect.rect(0, 0, 40, 30);
  rect.fill(0x00aaff);
  rect.stroke({ width: 2, color: 0xffffff });
  rect.position.set(50, 80);
  container.addChild(rect);

  // 创建一个圆形
  const circle = new PIXI.Graphics();
  circle.circle(0, 0, 20);
  circle.fill(0xffaa00);
  circle.position.set(150, 95);
  container.addChild(circle);

  // 创建一个文本显示帧频信息
  const fpsText = new PIXI.Text({
    text: "FPS: ",
    style: { fontSize: 12, fill: 0xffffff },
  });
  fpsText.position.set(250, 80);
  container.addChild(fpsText);

  // 存储动画状态
  let rectAngle = 0;
  let circleY = 80;
  let circleDir = 1;

  // 定义 ticker 回调
  const tickerCallback = () => {
    // 矩形旋转
    rect.rotation += 0.02;

    // 圆形上下移动
    circleY += circleDir * 1.5;
    if (circleY > 120 || circleY < 60) circleDir *= -1;
    circle.y = circleY;

    // 更新 FPS 显示
    fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
  };

  app.ticker.add(tickerCallback);

  // 保存 ticker 回调到状态，以便清除
  const state = appStates.get(app)!;
  state.tickerCallback = tickerCallback;
}

/**
 * 演示滤镜 (Filter)
 * - 应用模糊滤镜
 * - 应用颜色矩阵滤镜（灰度、色调）
 */
function showFilter(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "滤镜 (Filter)");
  addDescription(container, "模糊滤镜、颜色矩阵（灰度）", 40);

  // 创建一个带纹理的精灵作为滤镜对象
  const graphic = new PIXI.Graphics();
  graphic.rect(0, 0, 80, 60);
  graphic.fill(0xffaa00);
  graphic.stroke({ width: 2, color: 0xffffff });
  const texture = app.renderer.generateTexture(graphic);
  const sprite = new PIXI.Sprite(texture);
  sprite.position.set(30, 70);
  container.addChild(sprite);

  // 应用模糊滤镜
  const blurFilter = new PIXI.BlurFilter({ strength: 5 });
  const spriteBlur = new PIXI.Sprite(texture);
  spriteBlur.position.set(130, 70);
  spriteBlur.filters = [blurFilter];
  container.addChild(spriteBlur);

  // 应用颜色矩阵滤镜（灰度）
  const grayMatrix = new PIXI.ColorMatrixFilter();
  grayMatrix.grayscale(0.5, true); // 部分灰度
  const spriteGray = new PIXI.Sprite(texture);
  spriteGray.position.set(230, 70);
  spriteGray.filters = [grayMatrix];
  container.addChild(spriteGray);

  // 添加说明文字
  const desc = new PIXI.Text({
    text: "左:原图  中:模糊  右:灰度",
    style: { fontSize: 12, fill: 0xcccccc },
  });
  desc.position.set(30, 140);
  container.addChild(desc);
}

/**
 * 演示交互事件 (Interaction)
 * - 设置 eventMode 为 static
 * - 监听点击、鼠标悬停事件
 * - 动态改变颜色
 */
function showInteraction(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "交互事件 (Interaction)");
  addDescription(container, "点击矩形变红，鼠标悬停圆形变蓝", 40);

  // 创建一个可点击的矩形
  const rect = new PIXI.Graphics();
  rect.rect(30, 60, 80, 50);
  rect.fill(0x3366cc);
  rect.stroke({ width: 2, color: 0xffffff });
  rect.eventMode = "static"; // 开启交互
  rect.cursor = "pointer";
  rect.on("pointerdown", () => {
    rect.fill(0xff0000); // 点击变红
    rect.stroke({ width: 2, color: 0xffff00 });
  });
  container.addChild(rect);

  // 创建一个可悬停的圆形
  const circle = new PIXI.Graphics();
  circle.circle(160, 85, 30);
  circle.fill(0x44aa44);
  circle.stroke({ width: 2, color: 0xffffff });
  circle.eventMode = "static";
  circle.cursor = "grab";
  circle.on("pointerover", () => {
    circle.fill(0x0000ff); // 悬停变蓝
  });
  circle.on("pointerout", () => {
    circle.fill(0x44aa44); // 恢复原色
  });
  container.addChild(circle);

  // 存储交互对象以便清理
  const state = appStates.get(app)!;
  state.interactiveObjects = [rect, circle];

  // 添加提示文字
  const tip = new PIXI.Text({
    text: "尝试点击矩形，鼠标悬停圆形",
    style: { fontSize: 12, fill: 0xffff00 },
  });
  tip.position.set(30, 130);
  container.addChild(tip);
}

/**
 * 演示容器与层级 (Container)
 * - 创建容器，内部放置多个图形
 * - 移动容器影响所有子元素
 * - 调整子元素顺序
 */
function showContainer(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "容器与层级 (Container)");
  addDescription(container, "容器整体移动，子元素顺序", 40);

  // 创建一个子容器
  const subContainer = new PIXI.Container();
  subContainer.position.set(50, 70);

  // 在子容器中添加三个不同颜色的矩形
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

  // 添加一个按钮形状来演示移动整个容器
  const moveButton = new PIXI.Graphics();
  moveButton.rect(200, 70, 80, 30);
  moveButton.fill(0x666666);
  moveButton.stroke({ width: 1, color: 0xffffff });
  moveButton.eventMode = "static";
  moveButton.cursor = "pointer";
  moveButton.on("pointerdown", () => {
    subContainer.x += 10;
    if (subContainer.x > 200) subContainer.x = 50;
  });
  container.addChild(moveButton);

  const buttonText = new PIXI.Text({
    text: "移动容器",
    style: { fontSize: 12, fill: 0xffffff },
  });
  buttonText.position.set(210, 76);
  container.addChild(buttonText);

  // 存储交互对象以便清理
  const state = appStates.get(app)!;
  state.interactiveObjects = [moveButton];
}

/**
 * 演示简单粒子系统 (ParticleContainer)
 * - 使用 ParticleContainer 优化大量小精灵
 * - 生成随机粒子并动画
 */
function showParticles(app: PIXI.Application) {
  const container = getDemoContainer(app);
  clearDemo(app);

  addTitle(container, "粒子系统 (ParticleContainer)");
  addDescription(container, "大量粒子，性能优化", 40);

  // 1. Setup the container
  const particleContainer = new PIXI.ParticleContainer({
    dynamicProperties: {
      position: true,
      rotation: true,
      color: true, // In v8, tint and alpha are handled via 'color'
    },
    // texture: myTexture, // Optional: default texture for all particles
  });
  

  particleContainer.position.set(20, 60);
  app.stage.addChild(particleContainer); // You still add the container to the stage

  // 创建一个圆形纹理供粒子使用
  const particleGraphic = new PIXI.Graphics();
  particleGraphic.circle(0, 0, 3);
  particleGraphic.fill(0xffffff);
  const texture = app.renderer.generateTexture(particleGraphic);

  // 生成200个粒子
  const particles: PIXI.Sprite[] = [];
  for (let i = 0; i < 200; i++) {
    const sprite = new PIXI.Sprite(texture);
    sprite.x = Math.random() * 300;
    sprite.y = Math.random() * 120;
    sprite.tint = Math.random() * 0xffffff;
    sprite.alpha = 0.6 + Math.random() * 0.4;
    sprite.rotation = Math.random() * Math.PI * 2;
    particles.push(sprite);
    particleContainer.addChild(sprite);
  }
  container.addChild(particleContainer);

  // 动画：让粒子缓慢旋转和移动
  const tickerCallback = () => {
    particles.forEach((p, index) => {
      p.rotation += 0.01;
      p.x += Math.sin(index + Date.now() * 0.001) * 0.5;
      p.y += Math.cos(index + Date.now() * 0.001) * 0.5;
      // 边界环绕
      if (p.x < 0) p.x = 300;
      if (p.x > 300) p.x = 0;
      if (p.y < 0) p.y = 120;
      if (p.y > 120) p.y = 0;
    });
  };

  app.ticker.add(tickerCallback);
  const state = appStates.get(app)!;
  state.tickerCallback = tickerCallback;
}

// ============================================================
// 插件导出
// ============================================================

/**
 * API 演示插件
 * 支持多种消息类型，每个类型触发一个独立的 PixiJS 功能演示
 */
export const apiDemoPlugin: PixiPlugin = {
  name: "ApiDemoPlugin",
  messageTypes: [
    "apiDemo/basicShapes",
    "apiDemo/text",
    "apiDemo/sprite",
    "apiDemo/animation",
    "apiDemo/filter",
    "apiDemo/interaction",
    "apiDemo/container",
    "apiDemo/particles",
  ],

  /**
   * 插件执行入口
   * @param message - 消息对象，必须包含 type 字段，用于选择演示内容
   * @param app - Pixi Application 实例
   */
  execute(message: any, app: PIXI.Application): void {
    if (!app) {
      console.warn("[ApiDemoPlugin] 未提供 Pixi 应用实例");
      return;
    }

    console.log(`[ApiDemoPlugin] 执行演示: ${message.type}`);

    // 根据消息类型分发到对应的演示函数
    switch (message.type) {
      case "apiDemo/basicShapes":
        showBasicShapes(app);
        break;
      case "apiDemo/text":
        showText(app);
        break;
      case "apiDemo/sprite":
        showSprite(app);
        break;
      case "apiDemo/animation":
        showAnimation(app);
        break;
      case "apiDemo/filter":
        showFilter(app);
        break;
      case "apiDemo/interaction":
        showInteraction(app);
        break;
      case "apiDemo/container":
        showContainer(app);
        break;
      case "apiDemo/particles":
        showParticles(app);
        break;
      default:
        console.warn(`[ApiDemoPlugin] 未知的消息类型: ${message.type}`);
    }
  },
};
