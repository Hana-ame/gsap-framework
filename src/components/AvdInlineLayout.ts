/** Mixed text-and-image inline layout renderer for ADV dialogue lines. */
import * as PIXI from 'pixi.js';

export type AvdTextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'image'; texture: PIXI.Texture; width?: number; height?: number };

export interface InlineItem {
  kind: 'text' | 'image';
  textObj?: PIXI.Text;
  textContent?: string;
  sprite?: PIXI.Sprite;
  startUnit: number;
  endUnit: number;
  width: number;
  height: number;
}

export interface InlineLayout {
  container: PIXI.Container;
  items: InlineItem[];
  totalUnits: number;
}

export interface InlineLayoutOptions {
  maxWidth: number;
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  fill: number;
}

export function buildInlineLayout(segments: AvdTextSegment[], opts: InlineLayoutOptions): InlineLayout {
  const style = new PIXI.TextStyle({
    fontFamily: opts.fontFamily,
    fontSize: opts.fontSize,
    fill: opts.fill,
  });

  const flatItems: InlineItem[] = [];
  let unit = 0;

  for (const seg of segments) {
    if (seg.kind === 'text') {
      const text = seg.text;
      if (text.length === 0) continue;
      const breaks = computeBreakPoints(text);
      for (const bp of breaks) {
        const piece = text.slice(bp.start, bp.end);
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

  const rows: InlineItem[][] = [];
  let currentRow: InlineItem[] = [];
  let currentRowWidth = 0;

  for (const item of flatItems) {
    if (currentRowWidth + item.width > opts.maxWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push(item);
    currentRowWidth += item.width;
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const container = new PIXI.Container();
  rows.forEach((row, rowIdx) => {
    const rowMaxH = Math.max(...row.map((it) => it.height));
    const rowY = rowIdx * opts.lineHeight;
    let x = 0;
    for (const item of row) {
      const ix = x;
      const iy = rowY + (rowMaxH - item.height) / 2;
      if (item.textObj) {
        item.textObj.x = ix;
        item.textObj.y = iy;
        item.textObj.visible = false;
        container.addChild(item.textObj);
      }
      if (item.sprite) {
        item.sprite.x = ix;
        item.sprite.y = iy;
        item.sprite.visible = false;
        container.addChild(item.sprite);
      }
      x += item.width;
    }
  });

  return { container, items: flatItems, totalUnits: unit };
}

export function updateInlineLayout(layout: InlineLayout, revealedChars: number): void {
  for (const item of layout.items) {
    if (item.kind === 'text' && item.textObj && item.textContent) {
      const local = Math.max(0, Math.min(revealedChars, item.endUnit) - item.startUnit);
      if (local <= 0) {
        item.textObj.visible = false;
      } else if (local >= item.textContent.length) {
        item.textObj.visible = true;
        item.textObj.text = item.textContent;
      } else {
        item.textObj.visible = true;
        item.textObj.text = Array.from(item.textContent).slice(0, local).join('');
      }
    } else if (item.kind === 'image' && item.sprite) {
      item.sprite.visible = revealedChars >= item.startUnit;
    }
  }
}

export function destroyInlineLayout(layout: InlineLayout): void {
  layout.container.destroy({ children: true });
}

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

interface TextBreak {
  start: number;
  end: number;
}

function computeBreakPoints(text: string): TextBreak[] {
  if (text.length === 0) return [];
  const breaks: TextBreak[] = [];
  let bufStart = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (i === 0) continue;
    const prev = text[i - 1];
    const isSpace = c === ' ' || c === '\t';
    const prevIsSpace = prev === ' ' || prev === '\t';
    if (isSpace !== prevIsSpace) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
    } else if (isCJKChar(c) !== isCJKChar(prev) && !isSpace) {
      breaks.push({ start: bufStart, end: i });
      bufStart = i;
    }
  }
  breaks.push({ start: bufStart, end: text.length });
  return breaks;
}
