import type { BackendCommand, BackendCommandType, BackendStatus } from './types';

type Handler<T = unknown> = (payload: T) => void;

export class MockBackend {
  private _status: BackendStatus = 'disconnected';
  private listeners = new Map<string, Set<Handler>>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private seq = 0;

  get status(): BackendStatus {
    return this._status;
  }

  on<K extends keyof BackendEventMap>(event: K, fn: Handler<BackendEventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Handler);
    return () => set?.delete(fn as Handler);
  }

  private emit<K extends keyof BackendEventMap>(event: K, payload: BackendEventMap[K]): void {
    this.listeners.get(event)?.forEach((fn) => (fn as Handler)(payload));
  }

  connect(delay = 500): void {
    this.timers.push(setTimeout(() => {
      this._status = 'connected';
      this.emit('status', 'connected');
    }, delay));
  }

  disconnect(): void {
    this._status = 'disconnected';
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.emit('status', 'disconnected');
  }

  send(type: BackendCommandType, payload: Record<string, unknown>): void {
    if (this._status !== 'connected') return;
    const cmd: BackendCommand = {
      id: `cmd-${++this.seq}-${Date.now()}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    this.emit('command', cmd);
  }

  sendSequence(commands: { type: BackendCommandType; payload: Record<string, unknown>; delay: number }[]): void {
    let acc = 0;
    for (const c of commands) {
      acc += c.delay;
      this.timers.push(setTimeout(() => this.send(c.type, c.payload), acc));
    }
  }

  destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }
}

interface BackendEventMap {
  command: BackendCommand;
  status: BackendStatus;
  error: Error;
}
