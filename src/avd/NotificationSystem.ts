import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export type NotifType = 'info' | 'success' | 'warn' | 'error';

export interface NotifOptions {
  text: string;
  duration?: number;
  type?: NotifType;
  icon?: string;
}

interface NotifInstance {
  container: PIXI.Container;
  bg: PIXI.Graphics;
  text: PIXI.Text;
  duration: number;
  timer: gsap.core.Tween | null;
}

const TYPE_COLORS: Record<NotifType, { bar: number; bg: number; text: number }> = {
  info:    { bar: 0x4488cc, bg: 0x1a1a2e, text: 0xcccccc },
  success: { bar: 0x44cc66, bg: 0x1a2e1a, text: 0xcccccc },
  warn:    { bar: 0xccaa44, bg: 0x2e2a1a, text: 0xcccccc },
  error:   { bar: 0xcc4444, bg: 0x2e1a1a, text: 0xcccccc },
};

const TYPE_ICONS: Record<NotifType, string> = {
  info:    'ℹ',
  success: '✓',
  warn:    '⚠',
  error:   '✕',
};

export interface NotificationSystemOptions {
  maxVisible?: number;
  notifWidth?: number;
  padding?: number;
  margin?: number;
  slideInMs?: number;
  fadeOutMs?: number;
  yStart?: number;
}

const DEFAULTS: Required<NotificationSystemOptions> = {
  maxVisible: 5,
  notifWidth: 280,
  padding: 10,
  margin: 6,
  slideInMs: 300,
  fadeOutMs: 400,
  yStart: 12,
};

export class NotificationSystem {
  readonly container: PIXI.Container;
  private _opts: Required<NotificationSystemOptions>;
  private _active: NotifInstance[] = [];

  constructor(parent: PIXI.Container, opts?: NotificationSystemOptions) {
    this._opts = { ...DEFAULTS, ...opts };
    this.container = new PIXI.Container();
    this.container.eventMode = 'none';
    parent.addChild(this.container);
  }

  show(opts: string | NotifOptions): void {
    const opt: NotifOptions = typeof opts === 'string' ? { text: opts } : opts;
    const type = opt.type ?? 'info';
    const colors = TYPE_COLORS[type];
    const icon = opt.icon ?? TYPE_ICONS[type];
    const duration = opt.duration ?? 2500;

    if (this._active.length >= this._opts.maxVisible) {
      const old = this._active.shift()!;
      this._kill(old);
    }

    const cont = new PIXI.Container();
    cont.alpha = 0;
    cont.x = this._opts.notifWidth + 20;

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, this._opts.notifWidth, 36, 6).fill({ color: colors.bg, alpha: 0.92 });
    bg.rect(0, 0, 4, 36).fill({ color: colors.bar });
    cont.addChild(bg);

    const text = new PIXI.Text({
      text: `${icon} ${opt.text}`,
      style: {
        fontSize: 13,
        fill: colors.text,
        fontFamily: 'monospace',
        wordWrap: true,
        wordWrapWidth: this._opts.notifWidth - this._opts.padding * 2 - 6,
      },
    });
    text.x = this._opts.padding + 4;
    let textH = 16;
    try {
      textH = text.height;
    } catch {
      textH = 16;
    }
    text.y = (36 - textH) / 2;
    cont.addChild(text);

    this.container.addChild(cont);

    const inst: NotifInstance = { container: cont, bg, text, duration, timer: null };
    this._active.push(inst);
    this._reflow();

    // Slide in
    gsap.to(cont, {
      x: this._opts.margin,
      alpha: 1,
      duration: this._opts.slideInMs / 1000,
      ease: 'power3.out',
    });

    // Auto dismiss
    inst.timer = gsap.delayedCall(duration / 1000, () => {
      this._dismiss(inst);
    });
  }

  dismissAll(): void {
    for (const inst of [...this._active]) {
      this._dismiss(inst);
    }
  }

  destroy(): void {
    this.dismissAll();
    this.container.removeFromParent();
  }

  private _dismiss(inst: NotifInstance): void {
    if (inst.timer) {
      inst.timer.kill();
      inst.timer = null;
    }
    const idx = this._active.indexOf(inst);
    if (idx >= 0) this._active.splice(idx, 1);

    gsap.to(inst.container, {
      alpha: 0,
      x: inst.container.x - 30,
      duration: this._opts.fadeOutMs / 1000,
      ease: 'power2.in',
      onComplete: () => {
        inst.container.removeFromParent();
        inst.container.destroy({ children: true });
        this._reflow();
      },
    });
  }

  private _kill(inst: NotifInstance): void {
    if (inst.timer) { inst.timer.kill(); inst.timer = null; }
    inst.container.removeFromParent();
    inst.container.destroy({ children: true });
  }

  private _reflow(): void {
    let y = this._opts.yStart;
    for (const inst of this._active) {
      gsap.to(inst.container, {
        y,
        duration: 0.25,
        ease: 'power2.out',
      });
      y += 36 + this._opts.margin;
    }
  }
}
