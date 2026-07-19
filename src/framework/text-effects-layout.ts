import * as PIXI from 'pixi.js';
import type { TextSegment } from './text-effects';

export interface LayoutItem {
  kind: 'text' | 'image';
  textObj?: PIXI.Text;
  textContent?: string;
  sprite?: PIXI.Sprite;
  startUnit: number;
  endUnit: number;
  width: number;
  height: number;
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
    if (isSpace && !prevIsSpace) {
      // non-space → space: append trailing space to word, don't break
      continue;
    }
    if (!isSpace && prevIsSpace) {
      // space → non-space: break here, trailing spaces belong to previous segment
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
      });
    }
  }

  const rows: LayoutItem[][] = [];
  let currentRow: LayoutItem[] = [];
  let currentRowWidth = 0;

  for (const item of flatItems) {
    if (currentRowWidth + item.width > maxWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(item);
    currentRowWidth += item.width;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const container = new PIXI.Container();
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowMaxH = Math.max(...row.map((it) => it.height));
    const rowY = ri * lineHeight;
    let x = 0;
    for (const item of row) {
      const iy = rowY + (rowMaxH - item.height) / 2;
      if (item.textObj) {
        item.textObj.x = x;
        item.textObj.y = iy;
        container.addChild(item.textObj);
      }
      if (item.sprite) {
        item.sprite.x = x;
        item.sprite.y = iy;
        container.addChild(item.sprite);
      }
      x += item.width;
    }
  }

  return { container, items: flatItems, totalUnits: unit };
}


