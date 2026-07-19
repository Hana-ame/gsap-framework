/* ===================================================
 * UI 帮助函数
 *
 * 提供框架内通用 UI 组件的工厂函数：
 *   - TXT：预设字体样式（按钮、标签、暗淡、坐标、标题）
 *   - makeButton：圆角按钮
 *   - makeStepper：加减步进器（带 +/- 按钮和值显示）
 *   - makeInfoPanel：浮动信息面板（半透明背景 + 标题 + 正文）
 *
 * 这些函数返回 PIXI Container，可以添加到任意 SubCanvas.stage。
 * 注意 eventMode 和事件处理已内置，不要重复绑定。
 * =================================================== */

import * as PIXI from 'pixi.js';
import type { SubCanvas } from './SubCanvas';

/**
 * TXT：预设字体样式对象。
 * 选择 monospace 是为了在半透明背景上保持一致的字符宽度和高度，
 * 避免 proportional 字体对齐不一致的问题。
 *
 * 各个样式按用途命名：
 *   btn    — 按钮文字，白色粗体
 *   label  — 通用标签，淡紫灰色
 *   dim    — 辅助信息，灰色（如坐标值）
 *   coord  — 坐标显示，蓝灰色
 *   heading — 标题，白色
 */
export const TXT = {
  btn:      { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' } as const,
  label:    { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' } as const,
  dim:      { fontSize: 11, fill: 0x888888, fontFamily: 'monospace' } as const,
  coord:    { fontSize: 11, fill: 0x88aacc, fontFamily: 'monospace' } as const,
  heading:  { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' } as const,
};

/**
 * 创建圆角按钮。
 * 默认颜色 #1a1a2e（深蓝黑），圆角 6px，边框 1.5px #446。
 * text anchor 居中定位 (w/2, h/2)。
 * eventMode = 'static'，cursor = 'pointer'。
 * hitArea 用 Rectangle 替代 Graphics，避免 PIXI 额外计算 Graphics 的 hit-test。
 *
 * onClick 中的 e.stopPropagation() 是为了防止 PIXI 事件冒泡到父容器。
 */
export function makeButton(
  label: string,
  w: number,
  h: number,
  onClick: () => void,
  bg: number = 0x1a1a2e,
): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: TXT.btn,
  });
  t.anchor.set(0.5);
  t.x = w / 2;
  t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export interface Stepper {
  container: PIXI.Container;
  width: number;
  refresh: () => void;
}

/**
 * 加减步进器。
 *
 * 布局：label ｜ [-] ｜ value ｜ [+]
 *   - label 在 y=2
 *   - [-] [+] 按钮在 rowY=20，宽 btnW=22
 *   - value 文字在 [-] 和 [+] 之间居中
 *
 * 通过 refresh() 从外部同步最新值（因为 getValue 只在校验时调用，
 * 外部状态变化时调用 refresh 保持显示一致）。
 *
 * step 参数 > 1 时按钮文字会显示步长（如 +5, -5）。
 * 当 step > 9 时按钮宽度从 22 增加到 28，保证两位数步长不溢出。
 */
export function makeStepper(opts: {
  label: string;
  getValue: () => number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}): Stepper {
  const { label, getValue, onChange, min, max, step = 1 } = opts;
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: TXT.label,
  });
  lbl.x = 0;
  lbl.y = 2;
  wrap.addChild(lbl);

  const btnW = 22;
  const btnH = 22;
  const valW = 36;
  const rowY = 20;

  let current = getValue();

  const valText = new PIXI.Text({
    text: String(current),
    style: TXT.btn,
  });
  valText.anchor.set(0.5, 0);
  valText.x = lbl.width + 6 + btnW + valW / 2;
  valText.y = rowY + 3;
  wrap.addChild(valText);

  const stepLabel = step === 1 ? '' : String(step);
  const btnW2 = step > 9 ? 28 : btnW;

  const minus = makeButton('-' + stepLabel, btnW2, btnH, () => {
    if (current > min) {
      current = Math.max(min, current - step);
      valText.text = String(current);
      onChange(current);
    }
  });
  minus.x = lbl.width + 6;
  minus.y = rowY;
  wrap.addChild(minus);

  const plus = makeButton('+' + stepLabel, btnW2, btnH, () => {
    if (current < max) {
      current = Math.min(max, current + step);
      valText.text = String(current);
      onChange(current);
    }
  });
  plus.x = lbl.width + 6 + btnW2 + valW;
  plus.y = rowY;
  wrap.addChild(plus);

  const width = lbl.width + 6 + btnW2 + valW + btnW2;
  const refresh = () => {
    current = getValue();
    valText.text = String(current);
  };
  return { container: wrap, width, refresh };
}

export interface InfoPanelOptions {
  title: string;
  lines: string[];
  x?: number;
  y?: number;
  maxWidth?: number;
}

/**
 * 浮动信息面板。
 *
 * 半透明深色背景（#0a0a14, alpha 0.85），圆角 8px，1px 边框。
 * 面板自身 eventMode = 'none'（不拦截点击），
 * zIndex 设为 2147483647（接近 int32 max）确保在顶层。
 * 因为框架内其他元素不会设置这么高的 zIndex，可以保证 info panel 始终可见。
 *
 * parent 参数可以接受 PIXI.Container 或 SubCanvas，
 * 内部通过 instanceof 判断取出 stage。
 */
export function makeInfoPanel(parent: PIXI.Container | SubCanvas, opts: InfoPanelOptions): PIXI.Container {
  const stage = parent instanceof PIXI.Container ? parent : parent.stage;
  const { title, lines, x = 14, y: py = 14, maxWidth = 360 } = opts;
  const panel = new PIXI.Container();
  panel.eventMode = 'none';
  panel.zIndex = 2147483647;
  if (stage.sortableChildren !== true) stage.sortableChildren = true;

  const titleText = new PIXI.Text({
    text: title,
    style: { fontSize: 13, fill: 0x88aaff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  titleText.x = 10;
  titleText.y = 8;
  titleText.eventMode = 'none';
  panel.addChild(titleText);

  const textStyle = new PIXI.TextStyle({
    fontSize: 11,
    fill: 0xccccdd,
    fontFamily: 'monospace',
    lineHeight: 17,
    wordWrap: true,
    wordWrapWidth: maxWidth - 20,
  });
  const body = new PIXI.Text({
    text: lines.join('\n'),
    style: textStyle,
  });
  body.x = 10;
  body.y = titleText.height + 12;
  body.eventMode = 'none';
  panel.addChild(body);

  const pw = Math.max(titleText.width, body.width) + 20;
  const ph = titleText.height + body.height + 20;

  const bg = new PIXI.Graphics()
    .roundRect(0, 0, pw, ph, 8)
    .fill({ color: 0x0a0a14, alpha: 0.85 })
    .stroke({ width: 1, color: 0x2a2a3a });
  bg.eventMode = 'none';
  panel.addChildAt(bg, 0);

  panel.x = x;
  panel.y = py;
  stage.addChild(panel);
  return panel;
}
