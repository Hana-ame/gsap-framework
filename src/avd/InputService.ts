export interface InputCallbacks {
  quickSave: () => void;
  quickLoad: () => void;
  advance: () => void;
}

export class InputService {
  private _handler: ((e: KeyboardEvent) => void) | null = null;
  private _callbacks: InputCallbacks | null = null;

  setCallbacks(cbs: InputCallbacks): void { this._callbacks = cbs; }

  init(): void {
    if (typeof window === 'undefined') return;
    this._handler = (e: KeyboardEvent) => {
      if (!this._callbacks) return;
      if (e.key === 'F5') { e.preventDefault(); this._callbacks.quickSave(); return; }
      if (e.key === 'F8') { e.preventDefault(); this._callbacks.quickLoad(); return; }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault(); this._callbacks.advance();
      }
    };
    window.addEventListener('keydown', this._handler);
  }

  destroy(): void {
    if (typeof window !== 'undefined' && this._handler) {
      window.removeEventListener('keydown', this._handler);
    }
    this._handler = null;
    this._callbacks = null;
  }
}
