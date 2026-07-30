import type { AnimationDriver } from '@framework/animation/types';
import { GSAPDriver } from '@framework/animation/GSAPDriver';
import { DomContainer, DomGraphics } from './DomNode';

export class DomScreenEffects {
  readonly container: DomContainer;
  private _flashOverlay: DomGraphics;
  private _fadeOverlay: DomGraphics;
  private _target: DomContainer | null = null;
  private _originalX = 0;
  private _originalY = 0;
  private _driver: AnimationDriver;

  constructor(parent: DomContainer, driver?: AnimationDriver) {
    this._driver = driver ?? GSAPDriver.INSTANCE;
    this.container = new DomContainer();
    this.container.eventMode = 'none';
    parent.addChild(this.container);

    this._flashOverlay = new DomGraphics();
    this._flashOverlay.alpha = 0;
    this._flashOverlay.eventMode = 'none';
    this.container.addChild(this._flashOverlay);

    this._fadeOverlay = new DomGraphics();
    this._fadeOverlay.alpha = 0;
    this._fadeOverlay.eventMode = 'none';
    this.container.addChild(this._fadeOverlay);
  }

  setTarget(target: DomContainer): void {
    this._target = target;
    this._originalX = target.x;
    this._originalY = target.y;
  }

  shake(intensity: number = 6, duration: number = 300): void {
    if (!this._target) return;
    this._driver.killTweensOf(this._target, 'x,y');
    this._driver.to(this._target, {
      x: `+=${intensity}` as any,
      y: `+=${intensity}` as any,
      duration: duration / 1000 / 4,
      repeat: 3,
      yoyo: true,
      ease: 'power1.inOut',
      onComplete: () => {
        if (this._target) {
          this._target.x = this._originalX;
          this._target.y = this._originalY;
        }
      },
    });
  }

  flash(color: number = 0xffffff, duration: number = 200): void {
    this._driver.killTweensOf(this._flashOverlay);
    this._flashOverlay.alpha = 0.8;
    this._driver.to(this._flashOverlay, {
      alpha: 0,
      duration: duration / 1000,
      ease: 'power2.out',
    });
  }

  fadeOut(duration: number = 500, onComplete?: () => void): void {
    this._driver.killTweensOf(this._fadeOverlay);
    this._fadeOverlay.alpha = 0;
    this._driver.to(this._fadeOverlay, {
      alpha: 1,
      duration: duration / 1000,
      ease: 'power2.in',
      onComplete,
    });
  }

  fadeIn(duration: number = 500, onComplete?: () => void): void {
    this._driver.killTweensOf(this._fadeOverlay);
    this._fadeOverlay.alpha = 1;
    this._driver.to(this._fadeOverlay, {
      alpha: 0,
      duration: duration / 1000,
      ease: 'power2.out',
      onComplete,
    });
  }

  resize(w: number, h: number): void {
    this._flashOverlay.clear()
      .rect(0, 0, w, h)
      .fill({ color: 0xffffff, alpha: 1 });
    this._fadeOverlay.clear()
      .rect(0, 0, w, h)
      .fill({ color: 0x000000, alpha: 1 });
  }

  destroy(): void {
    if (this._target) this._driver.killTweensOf(this._target);
    this._driver.killTweensOf(this._flashOverlay);
    this._driver.killTweensOf(this._fadeOverlay);
    this.container.destroy({ children: true });
  }
}
