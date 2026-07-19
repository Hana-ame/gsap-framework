// EventBus — 轻量泛型事件总线。
// 选择 Set 而非数组存储 listener，确保同函数不会重复注册，
// 且 off 操作 O(1)。

type Handler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  // on 返回取消函数，方便组件在 destroy 时一行解绑，避免忘记 off
  on<T = unknown>(event: string, fn: Handler<T>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Handler);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Handler): void {
    this.listeners.get(event)?.delete(fn);
  }

  // [...set] 快照遍历，防止 handler 内调用 off 导致迭代时修改集合
  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(payload as T);
      } catch (err) {
        console.error(`[EventBus] handler for "${event}" threw:`, err);
      }
    }
  }

  // 清空所有事件，用于模块卸载时的完整清理
  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
