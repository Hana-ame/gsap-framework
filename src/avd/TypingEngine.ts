/** Character-by-character text reveal engine with segment-based styling. */
import * as PIXI from 'pixi.js';
import { buildLayout, type LayoutResult } from '@framework/text-effects-layout';
import type { AvdText, AvdTextSegment } from './types';
import type { TextSegment } from '@framework/text-effects';

export class TypingEngine {
  private _layout: LayoutResult | null = null;
  private _revealedChars = 0;
  private _totalUnits = 0;
  private _speed = 30;
  private _active = false;
  private _onComplete: (() => void) | null = null;
  private _container: PIXI.Container | null = null;

  start(
    text: AvdText,
    speed: number,
    style: PIXI.TextStyle,
    maxWidth: number,
    lineHeight: number,
    onComplete?: () => void,
  ): PIXI.Container {
    this.destroy();

    this._speed = Math.max(1, speed);
    this._onComplete = onComplete ?? null;

    const container = new PIXI.Container();
    this._container = container;

    const isSegments = Array.isArray(text);
    const segments: TextSegment[] = isSegments
      ? (text as AvdTextSegment[]).map((s) =>
          s.kind === 'image'
            ? { kind: 'image', texture: s.texture, width: s.width, height: s.height }
            : { kind: 'text', text: s.text },
        )
      : [{ kind: 'text', text: text as string }];

    this._layout = buildLayout(segments, style, maxWidth, lineHeight);
    this._totalUnits = this._layout.totalUnits;
    container.addChild(this._layout.container);

    for (const item of this._layout.items) {
      if (item.textObj) item.textObj.visible = false;
      if (item.sprite) item.sprite.visible = false;
    }

    this._revealedChars = 0;
    this._active = this._totalUnits > 0;

    return container;
  }

  update(deltaMS: number): void {
    if (!this._active || !this._layout) return;
    if (this._revealedChars >= this._totalUnits) return;

    this._revealedChars = Math.min(
      this._totalUnits,
      this._revealedChars + (this._speed * deltaMS) / 1000,
    );

    this._syncLayout();

    if (this._revealedChars >= this._totalUnits) {
      this._active = false;
      this._onComplete?.();
    }
  }

  complete(): void {
    if (!this._layout) return;
    this._revealedChars = this._totalUnits;
    this._syncLayout();
    this._active = false;
    this._onComplete?.();
  }

  destroy(): void {
    if (this._container) {
      this._container.removeFromParent();
      this._container.destroy({ children: true });
      this._container = null;
    }
    this._layout = null;
    this._active = false;
    this._onComplete = null;
  }

  get active(): boolean {
    return this._active;
  }

  get progress(): number {
    return this._totalUnits > 0 ? this._revealedChars / this._totalUnits : 1;
  }

  get container(): PIXI.Container | null {
    return this._container;
  }

  get revealedChars(): number {
    return this._revealedChars;
  }

  get totalUnits(): number {
    return this._totalUnits;
  }

  private _syncLayout(): void {
    if (!this._layout) return;
    const shown = Math.floor(this._revealedChars);
    for (const item of this._layout.items) {
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
}
