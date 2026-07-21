/** ZOrderManager — 在父容器中调整 DisplayObject 的堆叠顺序（置顶/置底）。 */
import * as PIXI from 'pixi.js';

const Z_RENORM_THRESHOLD = 1_000_000;

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
  renormZIndices(parent);
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
  renormZIndices(parent);
}

/** 对父容器的所有子对象做 zIndex 重归一化，防止 IEEE 754 精度溢出。
 *  当任意 zIndex ≥ 1_000_000 时，全部按顺序重置为 0,1,2,... */
export function renormZIndices(parent: PIXI.Container): void {
  if (parent.children.length < 2) return;
  const maxZ = Math.max(...parent.children.map(c => c.zIndex));
  if (maxZ < Z_RENORM_THRESHOLD) return;
  parent.children.forEach((c, i) => { c.zIndex = i; });
}
