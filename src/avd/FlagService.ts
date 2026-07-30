export class FlagService {
  private _flags: Set<string> = new Set();

  getSnapshot(): Set<string> { return this._flags; }

  add(name: string): void { this._flags.add(name); }

  delete(name: string): void { this._flags.delete(name); }

  has(name: string): boolean { return this._flags.has(name); }

  clear(): void { this._flags.clear(); }

  toArray(): string[] { return Array.from(this._flags); }

  setFromArray(arr: string[]): void {
    this._flags.clear();
    for (const f of arr) this._flags.add(f);
  }
}
