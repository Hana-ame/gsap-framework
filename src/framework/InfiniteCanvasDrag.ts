/** InfiniteCanvasDrag — 无限画布的拖拽平移交互。 */
import type { SubPointerEvent } from './SubCanvasTypes';
import type { InfiniteCanvas } from './InfiniteCanvas';

export class InfiniteCanvasDrag {
  private _parent: InfiniteCanvas;
  private _cleanups: (() => void)[] = [];

  constructor(parent: InfiniteCanvas) {
    this._parent = parent;
  }

  setup(): void {
    let dragging = false;
    let startClientX = 0;
    let startClientY = 0;
    let startScrollX = 0;
    let startScrollY = 0;

    const ic = this._parent;

    const onPress = (e: SubPointerEvent) => {
      for (const p of ic.plugins) p.onDown?.(e);
      dragging = true;
      startClientX = e.globalX;
      startClientY = e.globalY;
      startScrollX = ic.scrollX;
      startScrollY = ic.scrollY;
    };

    const onMove = (e: SubPointerEvent) => {
      for (const p of ic.plugins) p.onMove?.(e);
      if (!dragging) return;
      const dx = e.globalX - startClientX;
      const dy = e.globalY - startClientY;
      ic.applyScroll(startScrollX + dx, startScrollY + dy);
    };

    const onRelease = (e: SubPointerEvent) => {
      dragging = false;
      for (const p of ic.plugins) p.onUp?.(e);
    };

    ic.parent.onPress(onPress);
    ic.parent.onMove(onMove);
    ic.parent.onRelease(onRelease);

    this._cleanups.push(
      () => ic.parent.offPointer('pointerdown', onPress),
      () => ic.parent.offPointer('pointermove', onMove),
      () => ic.parent.offPointer('pointerup', onRelease),
    );

    if (ic.hasTapHandler) {
      const onTap = (e: SubPointerEvent) => {
        const w = ic.screenToWorld(e.x, e.y);
        for (const p of ic.plugins) p.onTap?.(w.x, w.y);
        ic.dispatchTap(w.x, w.y);
      };
      ic.parent.onTap(onTap);
      this._cleanups.push(() => ic.parent.offPointer('tap', onTap));
    }
  }

  destroy(): void {
    for (const fn of this._cleanups) fn();
    this._cleanups = [];
  }
}
