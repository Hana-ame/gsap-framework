/**
 * InputRemapper — 按键重映射中间层
 *
 * 用法：
 *   const input = new InputRemapper();
 *   input.on('advance', () => avd.next());
 *   input.on('menu', () => showMenu());
 *   input.on('auto', () => avd.setAutoMode(!avd.isAutoMode()));
 *   input.on('skip', () => avd.setSkipMode(!avd.isSkipMode()));
 *   input.on('quickSave', () => avd.quickSave());
 *   input.on('quickLoad', () => avd.quickLoad());
 *   input.on('backlog', () => toggleBacklog());
 *
 *   // 运行时重映射
 *   input.remap('KeyZ', 'advance');     // Z 键改为推进
 *   input.remap('KeyX', 'backlog');     // X 键改为对话记录
 *
 * 默认绑定（Kirikiri2 风格）：
 *   Enter / Space / MouseLeft → advance
 *   ArrowDown                → advance
 *   ArrowUp                  → backlog
 *   Escape                   → menu
 *   Ctrl                     → skip (按住)
 *   A                        → auto
 *   F5                       → quickSave
 *   F8                       → quickLoad
 *   F12                      → screenshot
 */

export type InputAction =
  | 'advance'
  | 'backlog'
  | 'menu'
  | 'skip'
  | 'auto'
  | 'quickSave'
  | 'quickLoad'
  | 'screenshot'
  | string;

export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface InputBinding {
  combo: KeyCombo;
  action: InputAction;
}

export class InputRemapper {
  private _bindings: InputBinding[] = [];
  private _handlers: Map<InputAction, () => void> = new Map();
  private _enabled = true;
  private _keyHandler: (e: KeyboardEvent) => void;
  private _skipHeld = false;

  constructor(customBindings?: InputBinding[]) {
    this._bindings = customBindings ?? DEFAULT_BINDINGS;
    this._keyHandler = (e: KeyboardEvent) => this._dispatch(e);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keyHandler);
      window.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'Control') this._skipHeld = false;
      });
    }
  }

  /** 注册动作回调 */
  on(action: InputAction, handler: () => void): void {
    this._handlers.set(action, handler);
  }

  /** 移除动作回调 */
  off(action: InputAction): void {
    this._handlers.delete(action);
  }

  /** 重映射按键 → 动作 */
  remap(key: string, action: InputAction, mods?: { ctrl?: boolean; shift?: boolean; alt?: boolean }): void {
    this._unbindKey(key);
    this._bindings.push({
      combo: { key, ctrl: mods?.ctrl ?? false, shift: mods?.shift ?? false, alt: mods?.alt ?? false },
      action,
    });
  }

  /** 启用/禁用 */
  set enabled(v: boolean) { this._enabled = v; }
  get enabled(): boolean { return this._enabled; }

  /** 当前所有绑定（只读复制） */
  getBindings(): InputBinding[] { return [...this._bindings]; }

  /** 恢复到默认绑定 */
  resetDefaults(): void {
    this._bindings = DEFAULT_BINDINGS;
  }

  /** 移除所有绑定 */
  clearBindings(): void {
    this._bindings = [];
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._keyHandler);
    }
    this._handlers.clear();
    this._bindings = [];
  }

  private _dispatch(e: KeyboardEvent): void {
    if (!this._enabled) return;

    if (e.key === 'Control') this._skipHeld = true;

    for (const b of this._bindings) {
      if (this._match(e, b.combo)) {
        e.preventDefault();
        e.stopPropagation();

        if (b.action === 'skip') {
          this._handlers.get('skip')?.();
          return;
        }

        const fn = this._handlers.get(b.action);
        if (fn) fn();
        return;
      }
    }
  }

  private _match(e: KeyboardEvent, combo: KeyCombo): boolean {
    if (e.key !== combo.key && e.code !== combo.key && e.key.toLowerCase() !== combo.key.toLowerCase()) return false;
    if (combo.ctrl && !e.ctrlKey) return false;
    if (combo.ctrl === false && e.ctrlKey) return this._skipHeld; // 单独 Ctrl 被 skip 吃掉
    if (combo.shift && !e.shiftKey) return false;
    if (combo.alt && !e.altKey) return false;
    return true;
  }

  private _unbindKey(key: string): void {
    this._bindings = this._bindings.filter((b) => b.combo.key !== key && b.combo.key.toLowerCase() !== key.toLowerCase());
  }
}

const DEFAULT_BINDINGS: InputBinding[] = [
  { combo: { key: 'Enter' }, action: 'advance' },
  { combo: { key: ' ' }, action: 'advance' },
  { combo: { key: 'Space' }, action: 'advance' },
  { combo: { key: 'ArrowDown' }, action: 'advance' },
  { combo: { key: 'ArrowRight' }, action: 'advance' },
  { combo: { key: 'ArrowUp' }, action: 'backlog' },
  { combo: { key: 'Escape' }, action: 'menu' },
  { combo: { key: 'Control' }, action: 'skip' },
  { combo: { key: 'KeyA' }, action: 'auto' },
  { combo: { key: 'F5' }, action: 'quickSave' },
  { combo: { key: 'F8' }, action: 'quickLoad' },
  { combo: { key: 'F12' }, action: 'screenshot' },
];
