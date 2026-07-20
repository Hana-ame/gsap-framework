/** ZOrderManager — 在父容器中调整 DisplayObject 的堆叠顺序（置顶/置底）。 */
import * as PIXI from 'pixi.js';

export function bringToFront(stage: PIXI.Container): void {
  const parent = stage.parent;
  if (!parent) return;
  parent.sortableChildren = true;
  let max = stage.zIndex;
  for (const child of parent.children) {
    if (child === stage) continue;
    if (child.zIndex > max) max = child.zIndex;
  }
  stage.zIndex = max + 1;
}

export function sendToBack(stage: PIXI.Container): void {
  const parent = stage.parent;
  if (!parent) return;
  parent.sortableChildren = true;
  let min = stage.zIndex;
  for (const child of parent.children) {
    if (child === stage) continue;
    if (child.zIndex < min) min = child.zIndex;
  }
  stage.zIndex = min - 1;
}
