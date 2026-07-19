import type { Rect } from '../SubCanvasTypes';

export function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectCenter(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function rectExpand(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  };
}

export function rectShrink(rect: Rect, amount: number): Rect {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: Math.max(0, rect.width - amount * 2),
    height: Math.max(0, rect.height - amount * 2),
  };
}

export function rectFit(
  outer: Rect,
  innerWidth: number,
  innerHeight: number,
  contain = true,
): Rect {
  const scaleX = outer.width / innerWidth;
  const scaleY = outer.height / innerHeight;
  const scale = contain ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  const fitW = innerWidth * scale;
  const fitH = innerHeight * scale;
  return {
    x: outer.x + (outer.width - fitW) / 2,
    y: outer.y + (outer.height - fitH) / 2,
    width: fitW,
    height: fitH,
  };
}

export function rectClamp(child: Rect, parent: Rect): Rect {
  const x = Math.max(parent.x, Math.min(child.x, parent.x + parent.width - child.width));
  const y = Math.max(parent.y, Math.min(child.y, parent.y + parent.height - child.height));
  return { x, y, width: child.width, height: child.height };
}

export function rectSnap(rect: Rect, gridSize: number): Rect {
  return {
    x: Math.round(rect.x / gridSize) * gridSize,
    y: Math.round(rect.y / gridSize) * gridSize,
    width: Math.round(rect.width / gridSize) * gridSize,
    height: Math.round(rect.height / gridSize) * gridSize,
  };
}
