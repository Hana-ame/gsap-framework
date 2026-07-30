export class AutoSkipService {
  private _autoMode = false;
  private _skipMode = false;
  private _autoTimer: ReturnType<typeof setTimeout> | null = null;

  get autoMode(): boolean { return this._autoMode; }
  get skipMode(): boolean { return this._skipMode; }

  setAutoMode(on: boolean): void {
    this._autoMode = on;
    if (on) this._skipMode = false;
  }

  setSkipMode(on: boolean): void {
    this._skipMode = on;
    if (on) this._autoMode = true;
  }

  /** Cancel skip mode when choices appear */
  onChoiceEnter(): void {
    this._skipMode = false;
  }

  clearAutoTimer(): void {
    if (this._autoTimer != null) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
  }

  startAutoTimer(delay: number, callback: () => void): void {
    this.clearAutoTimer();
    this._autoTimer = setTimeout(callback, delay);
  }

  getSerializedState(): { autoMode: boolean; skipMode: boolean } {
    return { autoMode: this._autoMode, skipMode: this._skipMode };
  }

  restoreState(autoMode: boolean, skipMode: boolean): void {
    this._autoMode = autoMode;
    this._skipMode = skipMode;
  }

  destroy(): void {
    this.clearAutoTimer();
  }
}
