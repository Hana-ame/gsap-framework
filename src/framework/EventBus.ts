type Handler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<Handler>> = new Map();

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

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
