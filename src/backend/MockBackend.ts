/** Mock backend that simulates native window management via command queuing. */
import type { BackendCommand, BackendCommandType, BackendStatus, BackendEventMap } from './types';
import { EventBus } from '../framework/EventBus';

export class MockBackend {
  private _status: BackendStatus = 'disconnected';
  private _bus = new EventBus();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private seq = 0;

  get status(): BackendStatus {
    return this._status;
  }

  on<K extends keyof BackendEventMap>(event: K, fn: (payload: BackendEventMap[K]) => void): () => void {
    return this._bus.on(event, fn);
  }

  private emit<K extends keyof BackendEventMap>(event: K, payload: BackendEventMap[K]): void {
    this._bus.emit(event, payload);
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
    this._bus.clear();
  }
}
