/** DirtyPropagator — 脏标记向上传播 + 延迟整树计算。
 *
 * 用法：
 *   root.mark()  → 传播到根 → 根脏
 *   root.clean() → 递归清理 → 调用每个脏节点的 onFlush
 *
 * 避免每帧全量遍历：只会遍历有脏标记的子树。 */
export class DirtyPropagator {
  private _parent: DirtyPropagator | null = null;
  private _children = new Set<DirtyPropagator>();
  private _dirty = false;
  private _onDirty: (() => void) | null = null;
  private _onFlush: (() => void) | null = null;

  /** 节点变脏时的回调（自底向上触发） */
  get onDirty(): (() => void) | null { return this._onDirty; }
  set onDirty(fn) { this._onDirty = fn; }

  /** 节点清理时的回调（自顶向下触发，即父 → 子的顺序） */
  get onFlush(): (() => void) | null { return this._onFlush; }
  set onFlush(fn) { this._onFlush = fn; }

  get parent(): DirtyPropagator | null { return this._parent; }
  get isDirty(): boolean { return this._dirty; }

  /** 将 propagator 挂到父节点下 */
  attach(parent: DirtyPropagator | null): void {
    if (this._parent === parent) return;
    this._parent?._children.delete(this);
    this._parent = parent;
    parent?._children.add(this);
  }

  /** 标记本节点脏，逐级向上传播到根 */
  mark(): void {
    if (this._dirty) return;
    this._dirty = true;
    this._onDirty?.();
    this._parent?.mark();
  }

  /** 从本节点开始递归清理所有脏节点（自顶向下） */
  clean(): void {
    if (!this._dirty) return;
    for (const child of this._children) child.clean();
    this._onFlush?.();
    this._dirty = false;
  }

  /** 销毁：断开父子关系，清理回调 */
  destroy(): void {
    this.attach(null);
    for (const child of [...this._children]) child.destroy();
    this._children.clear();
    this._onDirty = null;
    this._onFlush = null;
  }
}
