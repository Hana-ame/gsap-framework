/** text-effects-layout — 文字布局引擎，将富文本段落实例化为 DisplayObject 网格。 */
import * as PIXI from 'pixi.js';
import type { TextSegment } from './text-effects';

export interface LayoutItem<T = any> {
  kind: 'text' | 'image';
  textObj?: T;
  textContent?: string;
  sprite?: T;
  startUnit: number;
  endUnit: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface LayoutResult {
  container: PIXI.Container;
  items: LayoutItem[];
  totalUnits: number;
}

interface TextBreak {
  start: number;
  end: number;
}

export const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function isCJKChar(c: string): boolean {
  if (c.length === 0) return false;
  const code = c.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff)
  );
}

function computeBreakPoints(text: string): TextBreak[] {
  if (text.length === 0) return [];
  const breaks: TextBreak[] = [];
  let bufStart = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === 0) continue;
    const c = text[i];
    const prev = text[i - 1];
    const isSpace = c === ' ' || c === '\t';
    const prevIsSpace = prev === ' ' || prev === '\t';
    if (isSpace && !prevIsSpace) continue;
    if (!isSpace && prevIsSpace) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
      continue;
    }
    if (!isSpace && !prevIsSpace && isCJKChar(c) !== isCJKChar(prev)) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
    }
  }
  breaks.push({ start: bufStart, end: text.length });
  return breaks;
}

/** Shared row-wrapping and positioning for both PIXI and DOM engines. */
export function layoutItems<T extends { width: number; height: number; x: number; y: number }>(
  items: T[],
  maxWidth: number,
  lineHeight: number,
): void {
  const rows: T[][] = [];
  let currentRow: T[] = [];
  let currentRowWidth = 0;

  for (const item of items) {
    if (currentRowWidth + item.width > maxWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(item);
    currentRowWidth += item.width;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowMaxH = Math.max(...row.map((it) => it.height));
    const rowY = ri * lineHeight;
    let x = 0;
    for (const item of row) {
      item.x = x;
      item.y = rowY + (rowMaxH - item.height) / 2;
      x += item.width;
    }
  }
}

export function buildLayout(segments: TextSegment[], style: PIXI.TextStyle, maxWidth: number, lineHeight: number): LayoutResult {
  const flatItems: LayoutItem[] = [];
  let unit = 0;

  for (const seg of segments) {
    if (seg.kind === 'text') {
      if (seg.text.length === 0) continue;
      const breaks = computeBreakPoints(seg.text);
      for (const bp of breaks) {
        const piece = seg.text.slice(bp.start, bp.end);
        if (piece.length === 0) continue;
        const t = new PIXI.Text({ text: piece, style });
        flatItems.push({
          kind: 'text',
          textObj: t,
          textContent: piece,
          startUnit: unit,
          endUnit: unit + piece.length,
          width: t.width,
          height: t.height,
          x: 0,
          y: 0,
        });
        unit += piece.length;
      }
    } else {
      const w = seg.width ?? seg.texture.width;
      const h = seg.height ?? seg.texture.height;
      const s = new PIXI.Sprite(seg.texture);
      s.width = w;
      s.height = h;
      flatItems.push({
        kind: 'image',
        sprite: s,
        startUnit: unit,
        endUnit: unit,
        width: w,
        height: h,
        x: 0,
        y: 0,
      });
    }
  }

  layoutItems(flatItems, maxWidth, lineHeight);

  const container = new PIXI.Container();
  for (const item of flatItems) {
    if (item.textObj) container.addChild(item.textObj as PIXI.Text);
    if (item.sprite) container.addChild(item.sprite as PIXI.Sprite);
  }

  return { container, items: flatItems, totalUnits: unit };
}
