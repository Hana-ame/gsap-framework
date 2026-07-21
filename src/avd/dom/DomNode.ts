/**
 * DomNode — DOM 渲染节点，暴露 PixiJS 兼容的属性 API。
 *
 * 设计目标：DomContainer / DomSprite / DomText / DomGraphics 的
 * 属性名和行为与 PIXI 对应类一致，使 GSAP 动画无需修改即可在 DOM 模式下运行。
 *
 * ── 属性映射 ──
 *   alpha    → el.style.opacity
 *   visible  → el.style.display
 *   x, y     → CSS transform translate
 *   scale    → CSS transform scale
 *   rotation → CSS transform rotate
 *   tint     → CSS color (DomText) / filter (DomSprite)
 *
 * ── 生命周期 ──
 *   所有 DomNode 在构造时创建 document.createElement('div')，
 *   通过 addChild / removeChild 管理 DOM 树，与 Pixi 的场景树操作一致。
 */

// ── 工具函数 ──

function colorToCSS(color: number, alpha: number = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

function colorToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

interface TransformState {
  x: number; y: number;
  scaleX: number; scaleY: number;
  rotation: number;
}

export class DomTexture {
  url: string;
  img: HTMLImageElement | null = null;
  width = 0;
  height = 0;
  loaded = false;

  constructor(url: string) {
    this.url = url;
    const img = new Image();
    img.onload = () => {
      this.img = img;
      this.width = img.naturalWidth;
      this.height = img.naturalHeight;
      this.loaded = true;
    };
    img.src = url;
  }

  static readonly EMPTY = new DomTexture('');
}

export class DomDisplayObject {
  readonly el: HTMLElement;
  parent: DomDisplayObject | null = null;
  protected _transform: TransformState = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
  protected _alpha = 1;

  constructor(tag: string = 'div') {
    this.el = document.createElement(tag);
    this.el.style.position = 'absolute';
    this.el.style.left = '0px';
    this.el.style.top = '0px';
  }

  // ── alpha ──
  get alpha(): number { return this._alpha; }
  set alpha(v: number) {
    this._alpha = v;
    this.el.style.opacity = String(v);
  }

  // ── visible ──
  get visible(): boolean { return this.el.style.display !== 'none'; }
  set visible(v: boolean) { this.el.style.display = v ? '' : 'none'; }

  // ── position ──
  get x(): number { return this._transform.x; }
  set x(v: number) { this._transform.x = v; this._updateTransform(); }
  get y(): number { return this._transform.y; }
  set y(v: number) { this._transform.y = v; this._updateTransform(); }

  // ── scale (返回代理对象使 GSAP 可 tween scale.x / scale.y) ──
  readonly scale: { x: number; y: number } = {
    get x() { return 1; },
    set x(v) {},
    get y() { return 1; },
    set y(v) {},
  };

  protected _initScale(): void {
    const self = this;
    const s = this.scale as { x: number; y: number };
    Object.defineProperties(s, {
      x: { get() { return self._transform.scaleX; }, set(v: number) { self._transform.scaleX = v; self._updateTransform(); } },
      y: { get() { return self._transform.scaleY; }, set(v: number) { self._transform.scaleY = v; self._updateTransform(); } },
    });
  }

  // ── rotation ──
  get rotation(): number { return this._transform.rotation; }
  set rotation(v: number) { this._transform.rotation = v; this._updateTransform(); }

  // ── eventMode (Pixi 兼容) ──
  get eventMode(): string { return this.el.style.pointerEvents || 'none'; }
  set eventMode(v: string) { this.el.style.pointerEvents = v === 'none' ? 'none' : 'auto'; }

  // ── cursor ──
  set cursor(v: string) { this.el.style.cursor = v; }

  // ── width / height ──
  get width(): number { return this.el.offsetWidth || 0; }
  set width(v: number) { this.el.style.width = String(v) + 'px'; }
  get height(): number { return this.el.offsetHeight || 0; }
  set height(v: number) { this.el.style.height = String(v) + 'px'; }

  // ── 子树 ──
  get children(): DomDisplayObject[] { return []; }

  addChild(child: DomDisplayObject): void {
    child.removeFromParent();
    child.parent = this instanceof DomContainer ? this : null;
    this.el.appendChild(child.el);
  }

  removeChild(child: DomDisplayObject): void {
    if (child.parent === this) {
      child.parent = null;
      if (child.el.parentNode === this.el) {
        this.el.removeChild(child.el);
      }
    }
  }

  removeChildren(): DomDisplayObject[] {
    const removed: DomDisplayObject[] = [];
    while (this.el.firstChild) {
      const child = this.el.firstChild as HTMLElement;
      this.el.removeChild(child);
    }
    return removed;
  }

  removeFromParent(): void {
    if (this.parent) {
      this.parent.removeChild(this);
    } else if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }

  destroy(opts?: { children?: boolean }): void {
    if (opts?.children) {
      for (const child of this.children) child.destroy(opts);
      while (this.el.firstChild) {
        const child = this.el.firstChild as HTMLElement;
        this.el.removeChild(child);
      }
    }
    this.removeFromParent();
  }

  // ── 内部 ──
  protected _updateTransform(): void {
    const t = this._transform;
    const parts: string[] = [];
    if (t.x !== 0 || t.y !== 0) parts.push(`translate(${t.x}px, ${t.y}px)`);
    if (t.scaleX !== 1 || t.scaleY !== 1) parts.push(`scale(${t.scaleX}, ${t.scaleY})`);
    if (t.rotation !== 0) parts.push(`rotate(${t.rotation}rad)`);
    this.el.style.transform = parts.join(' ') || '';
  }
}

// ── DomContainer ──

export class DomContainer extends DomDisplayObject {
  private _children: DomDisplayObject[] = [];

  constructor() {
    super('div');
    this._initScale();
  }

  get children(): DomDisplayObject[] { return this._children; }

  addChild(child: DomDisplayObject): void {
    child.removeFromParent();
    child.parent = this;
    this._children.push(child);
    this.el.appendChild(child.el);
  }

  removeChild(child: DomDisplayObject): void {
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      child.parent = null;
      if (child.el.parentNode === this.el) {
        this.el.removeChild(child.el);
      }
    }
  }

  removeChildren(): DomDisplayObject[] {
    const removed = [...this._children];
    for (const c of removed) {
      c.parent = null;
      if (c.el.parentNode === this.el) this.el.removeChild(c.el);
    }
    this._children = [];
    return removed;
  }

  destroy(opts?: { children?: boolean }): void {
    if (opts?.children) {
      for (const c of this._children) c.destroy(opts);
    }
    this._children = [];
    super.destroy();
  }
}

// ── DomSprite ──

export class DomSprite extends DomDisplayObject {
  private _img: HTMLImageElement;
  private _texture: DomTexture = DomTexture.EMPTY;
  private _anchorX = 0;
  private _anchorY = 0;
  private _tintColor = 0xffffff;

  constructor(texture?: DomTexture) {
    super('div');
    this._initScale();
    this.el.style.overflow = 'hidden';
    this._img = document.createElement('img');
    this._img.style.display = 'block';
    this._img.style.width = '100%';
    this._img.style.height = '100%';
    this._img.style.objectFit = 'cover';
    this.el.appendChild(this._img);
    if (texture) this.texture = texture;
  }

  get texture(): DomTexture { return this._texture; }
  set texture(v: DomTexture) {
    this._texture = v;
    if (v.img) {
      this._img.src = v.img.src;
    } else if (v.url) {
      this._img.src = v.url;
    }
  }

  set textureKey(v: string) {
    this.el.setAttribute('data-texture-key', v);
  }

  get tint(): number { return this._tintColor; }
  set tint(v: number) {
    this._tintColor = v;
    if (v !== 0xffffff) {
      this._img.style.filter = `brightness(${((v >> 16) & 0xff) / 255}) saturate(${((v >> 8) & 0xff) / 255})`;
    } else {
      this._img.style.filter = 'none';
    }
  }

  get anchor(): { x: number; y: number; set(x: number, y?: number): void } {
    const self = this;
    return {
      get x() { return self._anchorX; },
      set x(v: number) { self._anchorX = v; self._updateAnchor(); },
      get y() { return self._anchorY; },
      set y(v: number) { self._anchorY = v; self._updateAnchor(); },
      set(sx: number, sy?: number) { self._anchorX = sx; self._anchorY = sy ?? sx; self._updateAnchor(); },
    };
  }
  set anchor(v: any) { /* read-only */ }

  private _updateAnchor(): void {
    const w = this._img.naturalWidth || parseFloat(this.el.style.width) || 0;
    const h = this._img.naturalHeight || parseFloat(this.el.style.height) || 0;
    this._img.style.marginLeft = `${-w * this._anchorX}px`;
    this._img.style.marginTop = `${-h * this._anchorY}px`;
  }
}

// ── DomTextStyle ──

export interface DomTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fill?: number | string;
  fontWeight?: string;
  wordWrap?: boolean;
  wordWrapWidth?: number;
  lineHeight?: number;
}

function applyTextStyle(el: HTMLElement, style: DomTextStyle): void {
  if (style.fontFamily) el.style.fontFamily = style.fontFamily;
  if (style.fontSize != null) el.style.fontSize = `${style.fontSize}px`;
  if (style.fill != null) {
    el.style.color = typeof style.fill === 'number' ? colorToHex(style.fill) : style.fill;
  }
  if (style.fontWeight) el.style.fontWeight = style.fontWeight;
  if (style.wordWrap) {
    el.style.whiteSpace = 'pre-wrap';
    el.style.wordBreak = 'break-word';
  }
  if (style.wordWrapWidth != null) {
    el.style.maxWidth = `${style.wordWrapWidth}px`;
    el.style.width = `${style.wordWrapWidth}px`;
  } else {
    el.style.maxWidth = '';
  }
  if (style.lineHeight != null) el.style.lineHeight = `${style.lineHeight}px`;
}

// ── Canvas 文本测量 ──

let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    const c = document.createElement('canvas');
    _measureCtx = c.getContext('2d')!;
  }
  return _measureCtx;
}

export function measureText(text: string, style: DomTextStyle): { width: number; height: number } {
  const ctx = getMeasureCtx();
  ctx.font = `${style.fontWeight ?? 'normal'} ${style.fontSize ?? 16}px ${style.fontFamily ?? 'sans-serif'}`;
  const metrics = ctx.measureText(text);
  const h = (style.lineHeight ?? (style.fontSize ?? 16) * 1.4);
  return { width: metrics.width, height: h };
}

// ── DomText ──

export class DomText extends DomDisplayObject {
  private _text = '';
  private _style: DomTextStyle = {};
  private _tintColor = 0xffffff;
  private _measuredWidth = 0;
  private _measuredHeight = 0;

  constructor(opts?: { text?: string; style?: DomTextStyle }) {
    super('div');
    this._initScale();
    this.el.style.whiteSpace = 'pre-wrap';
    this.el.style.wordBreak = 'break-word';
    if (opts) {
      if (opts.style) { this._style = opts.style; applyTextStyle(this.el, opts.style); }
      if (opts.text != null) { this._text = opts.text; this.el.textContent = opts.text; this._remeasure(); }
    }
  }

  get text(): string { return this._text; }
  set text(v: string) { this._text = v; this.el.textContent = v; this._remeasure(); }

  get style(): DomTextStyle { return this._style; }
  set style(s: DomTextStyle) { this._style = s; applyTextStyle(this.el, s); this._remeasure(); }

  get tint(): number { return this._tintColor; }
  set tint(v: number) {
    this._tintColor = v;
    if (v === 0xffffff) {
      if (this._style.fill != null) {
        this.el.style.color = typeof this._style.fill === 'number' ? colorToHex(this._style.fill) : this._style.fill;
      } else {
        this.el.style.color = '';
      }
    } else {
      this.el.style.color = colorToHex(v);
    }
  }

  get width(): number { return this.el.offsetWidth || this._measuredWidth || 0; }
  get height(): number { return this.el.offsetHeight || this._measuredHeight || (this._style.fontSize ?? 16); }

  private _remeasure(): void {
    if (this._text) {
      const m = measureText(this._text, this._style);
      this._measuredWidth = m.width;
      this._measuredHeight = m.height;
      if (this._style.wordWrapWidth == null) {
        this.el.style.width = `${m.width}px`;
      }
    } else {
      this._measuredWidth = 0;
      this._measuredHeight = 0;
    }
  }
}

// ── DomGraphics ──

export class DomGraphics extends DomDisplayObject {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _dirty = false;
  private _bufferW = 0;
  private _bufferH = 0;

  constructor() {
    super('div');
    this._initScale();
    this.el.style.overflow = 'hidden';
    this._canvas = document.createElement('canvas');
    this._canvas.style.display = 'block';
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this.el.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d')!;
  }

  clear(): this {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    return this;
  }

  rect(x: number, y: number, w: number, h: number): this {
    this._ctx.rect(x, y, w, h);
    this._ensureSize(w, h);
    return this;
  }

  roundRect(x: number, y: number, w: number, h: number, r: number): this {
    this._ctx.roundRect(x, y, w, h, r);
    this._ensureSize(w, h);
    return this;
  }

  circle(x: number, y: number, r: number): this {
    this._ctx.arc(x, y, r, 0, Math.PI * 2);
    this._ensureSize(x + r, y + r);
    return this;
  }

  moveTo(x: number, y: number): this {
    this._ctx.moveTo(x, y);
    return this;
  }

  lineTo(x: number, y: number): this {
    this._ctx.lineTo(x, y);
    return this;
  }

  fill(opts: { color: number; alpha?: number }): this {
    this._ctx.fillStyle = colorToCSS(opts.color, opts.alpha ?? 1);
    this._ctx.fill();
    this._ctx.beginPath();
    return this;
  }

  stroke(opts: { color: number; width?: number; alpha?: number }): this {
    this._ctx.strokeStyle = colorToCSS(opts.color, opts.alpha ?? 1);
    if (opts.width != null) this._ctx.lineWidth = opts.width;
    this._ctx.stroke();
    this._ctx.beginPath();
    return this;
  }

  private _ensureSize(w: number, h: number): void {
    if (w > this._bufferW || h > this._bufferH) {
      this._bufferW = Math.max(this._bufferW, Math.ceil(w));
      this._bufferH = Math.max(this._bufferH, Math.ceil(h));
      this._canvas.width = this._bufferW;
      this._canvas.height = this._bufferH;
      this.el.style.width = `${this._bufferW}px`;
      this.el.style.height = `${this._bufferH}px`;
    }
  }
}
