import type { AvdChoice, ResolvedAvdOptions } from './types';
import type { IAvdRenderLayer } from './render/types';

export interface ChoiceSelectedCallback {
  (choice: AvdChoice, index: number): void;
}

export class ChoiceService {
  private _layer: IAvdRenderLayer | null = null;
  private _opts: ResolvedAvdOptions | null = null;
  private _parentContainer: any = null;
  private _choiceButtons: any[] = [];
  private _onSelected: ChoiceSelectedCallback | null = null;
  private _flags: Set<string> = new Set();
  private _segmentMap: Map<string, number> = new Map();
  private _choiceTimer: ReturnType<typeof setTimeout> | null = null;

  init(
    layer: IAvdRenderLayer,
    opts: ResolvedAvdOptions,
    parentContainer: any,
    onSelected: ChoiceSelectedCallback,
  ): void {
    this._layer = layer;
    this._opts = opts;
    this._parentContainer = parentContainer;
    this._onSelected = onSelected;
  }

  setFlags(flags: Set<string>): void { this._flags = flags; }
  setSegmentMap(m: Map<string, number>): void { this._segmentMap = m; }

  /** Filter choices by flags, return those that should be visible. */
  filterChoices(choices: AvdChoice[]): AvdChoice[] {
    return choices.filter((c) => {
      if (c.conditionFlag && !this._flags.has(c.conditionFlag)) return false;
      if (c.conditionNotFlag && this._flags.has(c.conditionNotFlag)) return false;
      return true;
    });
  }

  /** Display filtered choices in the dialog box area. */
  show(visible: AvdChoice[]): void {
    this.hide();
    const L = this._layer;
    const opts = this._opts;
    if (!L || !opts) return;

    const cx = opts.boxX + opts.boxPadding;
    const cy = opts.boxY + opts.boxPadding + opts.nameSize + 8 + 60;
    const btnH = 34;
    const gap = 8;
    const maxW = opts.boxWidth - opts.boxPadding * 2;

    for (let i = 0; i < visible.length; i++) {
      const choice = visible[i];
      const y = cy + i * (btnH + gap);
      const btn = L.createContainer();
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bg = L.createGraphics();
      btn.addChild(bg);

      const label = L.createText({
        text: choice.text,
        style: { fontSize: 14, fill: 0xffffff, fontFamily: opts.fontFamily },
      });
      label.x = 12;
      label.y = (btnH - (label as any).height) / 2;
      btn.addChild(label);

      const btnEl = (btn as any).el ?? btn;
      btnEl.addEventListener?.('pointerdown', () => this._onChoiceSelected(choice, i));
      btnEl.addEventListener?.('pointerover', () => {
        bg.clear().roundRect(0, 0, maxW, btnH, 6).fill({ color: 0x3a4a7a, alpha: 0.95 });
      });
      btnEl.addEventListener?.('pointerout', () => {
        bg.clear().roundRect(0, 0, maxW, btnH, 6).fill({ color: 0x1a1a3a, alpha: 0.95 });
      });
      (btn as any).on?.('pointerdown', () => this._onChoiceSelected(choice, i));

      bg.clear().roundRect(0, 0, maxW, btnH, 6).fill({ color: 0x1a1a3a, alpha: 0.95 });

      btn.x = cx;
      btn.y = y;
      this._parentContainer.addChild(btn);
      this._choiceButtons.push(btn);
    }
  }

  /** Remove all choice buttons. */
  hide(): void {
    for (const btn of this._choiceButtons) {
      this._parentContainer?.removeChild?.(btn);
      btn.destroy?.({ children: true });
    }
    this._choiceButtons = [];
  }

  /** Resolve the target line for a choice. */
  resolveTarget(choice: AvdChoice): number {
    if (choice.targetSegment != null) {
      const idx = this._segmentMap.get(choice.targetSegment);
      if (idx != null) return idx;
    }
    return choice.targetLine ?? 0;
  }

  startTimer(ms: number, choice: AvdChoice, index: number): void {
    this.clearTimer();
    this._choiceTimer = setTimeout(() => this._onChoiceSelected(choice, index), ms);
  }

  clearTimer(): void {
    if (this._choiceTimer != null) {
      clearTimeout(this._choiceTimer);
      this._choiceTimer = null;
    }
  }

  private _onChoiceSelected(choice: AvdChoice, index: number): void {
    this._onSelected?.(choice, index);
  }

  destroy(): void {
    this.clearTimer();
    this.hide();
    this._layer = null;
    this._opts = null;
    this._parentContainer = null;
    this._onSelected = null;
  }
}
