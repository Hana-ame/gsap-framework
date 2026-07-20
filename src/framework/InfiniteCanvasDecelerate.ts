/** InfiniteCanvasDecelerate — 无限画布的惯性减速插件。 */
import type { SubPointerEvent } from './SubCanvasTypes';
import type { InfiniteCanvas } from './InfiniteCanvas';
import type { InfiniteCanvasPlugin } from './InfiniteCanvasTypes';

const FRICTION = 0.95;
const MIN_SPEED = 0.1;
const VELOCITY_WINDOW = 50;

export class DeceleratePlugin implements InfiniteCanvasPlugin {
  readonly name = 'decelerate';
  priority = 50;
  parent!: InfiniteCanvas;

  private _saved: { x: number; y: number; time: number }[] = [];
  private _vx = 0;
  private _vy = 0;
  private _active = false;
  private _lastMoveTime = 0;

  onDown(): void {
    this._saved = [];
    this._vx = 0;
    this._vy = 0;
    this._active = false;
    this._lastMoveTime = 0;
  }

  onMove(e: SubPointerEvent): void {
    const now = performance.now();
    this._lastMoveTime = now;
    this._saved.push({ x: e.globalX, y: e.globalY, time: now });
    if (this._saved.length > 60) this._saved.shift();
  }

  onUp(): void {
    const snapshot = this._saved;
    this._saved = [];
    if (performance.now() - this._lastMoveTime > VELOCITY_WINDOW) return;
    if (snapshot.length < 2) return;
    const last = snapshot[snapshot.length - 1];
    let prev = snapshot[0];
    const cutoff = last.time - VELOCITY_WINDOW;
    for (let i = snapshot.length - 2; i >= 0; i--) {
      if (snapshot[i].time <= cutoff) {
        prev = snapshot[i];
        break;
      }
    }
    const dt = last.time - prev.time;
    if (dt <= 0) return;
    this._vx = (last.x - prev.x) / dt;
    this._vy = (last.y - prev.y) / dt;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) return;
    this._active = true;
  }

  onUpdate(elapsed: number): void {
    if (!this._active) return;
    const factor = Math.pow(FRICTION, elapsed / 16);
    this._vx *= factor;
    this._vy *= factor;
    if (Math.abs(this._vx) < MIN_SPEED && Math.abs(this._vy) < MIN_SPEED) {
      this._vx = 0;
      this._vy = 0;
      this._active = false;
      return;
    }
    this.parent.panBy(this._vx * elapsed, this._vy * elapsed);
  }

  onDestroy(): void {
    this._saved = [];
    this._vx = 0;
    this._vy = 0;
    this._active = false;
  }

  stop(): void {
    this._active = false;
    this._vx = 0;
    this._vy = 0;
  }
}
