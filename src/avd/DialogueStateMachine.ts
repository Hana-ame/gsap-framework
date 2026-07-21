/** Finite state machine for dialogue progression (typing → between|choice → done). */
import type { AvdState } from './types';

export interface StateMachineCallbacks {
  onStateChange?: (state: AvdState) => void;
  onLineEnter?: (index: number) => void;
  onLineExit?: (index: number) => void;
  onComplete?: () => void;
}

export class DialogueStateMachine {
  private _state: AvdState = 'done';
  private _lineIndex = 0;
  private _lineCount = 0;
  private _callbacks: StateMachineCallbacks;

  constructor(callbacks: StateMachineCallbacks = {}) {
    this._callbacks = callbacks;
  }

  get state(): AvdState {
    return this._state;
  }

  get lineIndex(): number {
    return this._lineIndex;
  }

  get lineCount(): number {
    return this._lineCount;
  }

  get isComplete(): boolean {
    return this._state === 'done';
  }

  setLineCount(n: number): void {
    this._lineCount = n;
  }

  setScript(lineCount: number): void {
    this._lineCount = lineCount;
    this._lineIndex = 0;
    this._setState('typing');
    this._callbacks.onLineEnter?.(0);
  }

  advance(): void {
    if (this._state === 'done') return;
    if (this._state === 'typing') {
      this._setState('between');
      return;
    }
    if (this._state === 'between') {
      this._callbacks.onLineExit?.(this._lineIndex);
      this._lineIndex++;
      if (this._lineIndex >= this._lineCount) {
        this._setState('done');
        this._callbacks.onComplete?.();
        return;
      }
      this._setState('typing');
      this._callbacks.onLineEnter?.(this._lineIndex);
    }
  }

  /** Move to 'choice' state (called by controller when line has choices). */
  enterChoice(): void {
    this._setState('choice');
  }

  /** End the script immediately (for lines marked end:true). */
  finish(): void {
    this._setState('done');
    this._callbacks.onComplete?.();
  }

  /** Process a choice selection and jump to target line. */
  choose(index: number): void {
    if (this._state !== 'choice') return;
    this._callbacks.onLineExit?.(this._lineIndex);
    this._lineIndex = index;
    this._setState('typing');
    this._callbacks.onLineEnter?.(index);
  }

  goTo(index: number): void {
    if (index < 0 || index >= this._lineCount) return;
    if (index === this._lineIndex && this._state !== 'done') return;
    this._lineIndex = index;
    this._setState('typing');
    this._callbacks.onLineEnter?.(index);
  }

  goToLast(): void {
    this.goTo(this._lineCount - 1);
  }

  reset(): void {
    this._lineIndex = 0;
    this._setState('typing');
    this._callbacks.onLineEnter?.(0);
  }

  private _setState(s: AvdState): void {
    this._state = s;
    this._callbacks.onStateChange?.(s);
  }
}
