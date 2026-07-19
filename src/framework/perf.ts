import * as PIXI from 'pixi.js';

export interface PerfDisplayOptions {
  x?: number;
  y?: number;
  fontSize?: number;
  color?: number;
  textAlpha?: number;
}

export class PerfDisplay {
  readonly container: PIXI.Container;

  private _enabled = false;
  private _text: PIXI.Text;
  private _ticker: PIXI.Ticker;
  private _stage: () => PIXI.Container;
  private _destroyed = false;

  private _frames: number[] = [];
  private _fps = 0;
  private _frameTimeMs = 0;

  constructor(
    ticker: PIXI.Ticker,
    stage: () => PIXI.Container,
    opts: PerfDisplayOptions = {},
  ) {
    const {
      x = 10,
      y = 10,
      fontSize = 11,
      color = 0x88ff88,
      textAlpha = 0.85,
    } = opts;

    this._ticker = ticker;
    this._stage = stage;

    this._text = new PIXI.Text({
      text: '',
      style: {
        fontSize,
        fill: color,
        fontFamily: 'monospace',
        lineHeight: fontSize + 4,
      },
    });
    this._text.x = x;
    this._text.y = y;
    this._text.alpha = textAlpha;
    this._text.eventMode = 'none';

    this.container = new PIXI.Container();
    this.container.addChild(this._text);
    this.container.zIndex = 2147483647;

    this._ticker.add(this._onTick, this);
  }

  get enabled(): boolean {
    return this._enabled;
  }

  enable(): void {
    if (this._destroyed) return;
    if (this._enabled) return;
    this._enabled = true;
    this._stage().addChild(this.container);
  }

  disable(): void {
    if (!this._enabled) return;
    this._enabled = false;
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }

  toggle(): void {
    if (this._enabled) this.disable();
    else this.enable();
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.disable();
    this._ticker.remove(this._onTick, this);
    this.container.destroy({ children: true });
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  private _onTick = (): void => {
    const dt = this._ticker.deltaMS;
    this._frames.push(dt);
    if (this._frames.length > 60) this._frames.shift();

    if (this._frames.length > 0) {
      const sum = this._frames.reduce((a, b) => a + b, 0);
      this._frameTimeMs = sum / this._frames.length;
      this._fps = 1000 / this._frameTimeMs;
    }

    if (!this._enabled) return;

    const stage = this._stage();
    const count = this._countChildren(stage);

    this._text.text = [
      `${this._fps.toFixed(1)} FPS`,
      `${this._frameTimeMs.toFixed(1)} ms`,
      `objects: ${count}`,
      `resolution: ${stage.width}×${stage.height}`,
    ].join('\n');
  };

  private _countChildren(container: PIXI.Container): number {
    let count = 1;
    for (const child of container.children) {
      if (child instanceof PIXI.Container) {
        count += this._countChildren(child);
      } else {
        count += 1;
      }
    }
    return count;
  }
}
