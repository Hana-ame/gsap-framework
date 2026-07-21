import type { AvdText, AvdTextSegment } from '../types';
import { DomContainer, DomText, DomSprite, DomTextStyle, measureText } from './DomNode';

export type TextEffect = 'none' | 'wave' | 'shake' | 'rainbow';

interface LayoutItem {
  kind: 'text' | 'image';
  textObj?: DomText;
  textContent?: string;
  sprite?: DomSprite;
  startUnit: number;
  endUnit: number;
  width: number;
  height: number;
}

interface ItemState {
  origX: number; origY: number; origColor: number;
  item: LayoutItem;
}

export class DomTypingEngine {
  private _layout: LayoutItem[] = [];
  private _container: DomContainer | null = null;
  private _revealedChars = 0;
  private _totalUnits = 0;
  private _speed = 30;
  private _active = false;
  private _onComplete: (() => void) | null = null;
  private _effect: TextEffect = 'none';
  private _elapsed = 0;
  private _itemStates: ItemState[] = [];
  private _phaseOffsets: number[] = [];

  start(
    text: AvdText,
    speed: number,
    style: DomTextStyle,
    maxWidth: number,
    lineHeight: number,
    onComplete?: () => void,
  ): DomContainer {
    this.destroy();

    this._speed = Math.max(1, speed);
    this._onComplete = onComplete ?? null;

    const container = new DomContainer();
    this._container = container;

    const segments = Array.isArray(text)
      ? (text as AvdTextSegment[]).map((s) =>
          s.kind === 'image'
            ? { kind: 'image' as const, textureKey: (s as any).textureKey ?? '', width: s.width, height: s.height }
            : { kind: 'text' as const, text: (s as any).text ?? '' }
        )
      : [{ kind: 'text' as const, text: text as string }];

    this._buildLayout(segments, style, maxWidth, lineHeight);

    for (const item of this._layout) {
      if (item.textObj) {
        container.addChild(item.textObj);
      }
      if (item.sprite) {
        container.addChild(item.sprite);
      }
    }

    this._itemStates = [];
    this._phaseOffsets = [];
    for (const item of this._layout) {
      if (item.textObj) {
        item.textObj.visible = false;
        this._itemStates.push({
          origX: item.textObj.x,
          origY: item.textObj.y,
          origColor: typeof item.textObj.style?.fill === 'number' ? item.textObj.style.fill : 0xffffff,
          item,
        });
        this._phaseOffsets.push(Math.random() * Math.PI * 2);
      }
      if (item.sprite) item.sprite.visible = false;
    }

    this._revealedChars = 0;
    this._active = this._totalUnits > 0;
    this._elapsed = 0;

    return container;
  }

  update(deltaMS: number): void {
    if (!this._active) return;
    this._elapsed += deltaMS;

    if (this._revealedChars < this._totalUnits) {
      this._revealedChars = Math.min(
        this._totalUnits,
        this._revealedChars + (this._speed * deltaMS) / 1000,
      );
    }

    this._syncLayout();
    this._applyEffect();

    if (this._revealedChars >= this._totalUnits) {
      this._active = false;
      this._onComplete?.();
    }
  }

  setEffect(effect: TextEffect): void { this._effect = effect; }

  complete(): void {
    this._revealedChars = this._totalUnits;
    this._syncLayout();
    this._applyEffect();
    this._active = false;
    this._onComplete?.();
  }

  destroy(): void {
    if (this._container) {
      this._container.destroy({ children: true });
      this._container = null;
    }
    this._layout = [];
    this._active = false;
    this._onComplete = null;
    this._itemStates = [];
    this._phaseOffsets = [];
  }

  get active(): boolean { return this._active; }
  get progress(): number {
    return this._totalUnits > 0 ? this._revealedChars / this._totalUnits : 1;
  }
  get container(): DomContainer | null { return this._container; }
  get totalUnits(): number { return this._totalUnits; }
  get effect(): TextEffect { return this._effect; }

  private _buildLayout(
    segments: Array<{ kind: 'text' | 'image'; text?: string; textureKey?: string; width?: number; height?: number }>,
    style: DomTextStyle,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const flatItems: LayoutItem[] = [];
    let unit = 0;

    for (const seg of segments) {
      if (seg.kind === 'text' && seg.text) {
        const t = new DomText({ text: seg.text, style });
        const mw = t.width;
        flatItems.push({
          kind: 'text',
          textObj: t,
          textContent: seg.text,
          startUnit: unit,
          endUnit: unit + seg.text.length,
          width: mw,
          height: lineHeight,
        });
        unit += seg.text.length;
      } else if (seg.kind === 'image') {
        const w = seg.width ?? 64;
        const h = seg.height ?? 64;
        const s = new DomSprite();
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

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const rowMaxH = Math.max(...row.map((it) => it.height));
      const rowY = ri * lineHeight;
      let x = 0;
      for (const item of row) {
        const iy = rowY + (rowMaxH - item.height) / 2;
        if (item.textObj) { item.textObj.x = x; item.textObj.y = iy; }
        if (item.sprite) { item.sprite.x = x; item.sprite.y = iy; }
        x += item.width;
      }
    }

    this._layout = flatItems;
  }

  private _syncLayout(): void {
    const shown = Math.floor(this._revealedChars);
    for (const item of this._layout) {
      if (item.kind === 'text' && item.textObj && item.textContent) {
        const local = Math.max(0, Math.min(shown, item.endUnit) - item.startUnit);
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
        item.sprite.visible = shown >= item.startUnit;
      }
    }
  }

  private _applyEffect(): void {
    if (this._effect === 'none') {
      for (const st of this._itemStates) {
        if (!st.item.textObj) continue;
        st.item.textObj.x = st.origX;
        st.item.textObj.y = st.origY;
        st.item.textObj.alpha = 1;
        st.item.textObj.tint = 0xffffff;
      }
      return;
    }

    const t = this._elapsed / 1000;
    for (let i = 0; i < this._itemStates.length; i++) {
      const st = this._itemStates[i];
      const obj = st.item.textObj;
      if (!obj || !obj.visible) continue;
      const phase = this._phaseOffsets[i];

      switch (this._effect) {
        case 'wave':
          obj.y = st.origY + Math.sin(t * 4 + phase) * 4;
          obj.x = st.origX; obj.alpha = 1; obj.tint = 0xffffff;
          break;
        case 'shake':
          obj.x = st.origX + (Math.sin(t * 20 + phase * 10) * 2);
          obj.y = st.origY + (Math.cos(t * 18 + phase * 8) * 2);
          obj.alpha = 1; obj.tint = 0xffffff;
          break;
        case 'rainbow': {
          const hue = ((t * 60 + i * 30) % 360) / 360;
          obj.tint = hslToNumber(hue, 0.8, 0.6);
          obj.x = st.origX; obj.y = st.origY; obj.alpha = 1;
          break;
        }
      }
    }
  }
}

function hslToNumber(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 1/6) { r = c; g = x; }
  else if (h < 2/6) { r = x; g = c; }
  else if (h < 3/6) { g = c; b = x; }
  else if (h < 4/6) { g = x; b = c; }
  else if (h < 5/6) { r = x; b = c; }
  else { r = c; b = x; }
  return (
    Math.round((r + m) * 255) << 16 |
    Math.round((g + m) * 255) << 8 |
    Math.round((b + m) * 255)
  );
}
