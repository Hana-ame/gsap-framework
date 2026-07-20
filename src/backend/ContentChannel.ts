/** Content channel that batches and flushes messages per window. */
import { MockBackend } from './MockBackend';
import { EventBus } from '../framework/EventBus';

export interface ChannelMessage {
  windowId: string;
  text: string;
  done: boolean;
  seq: number;
  total: number;
}

export interface FlushedData {
  windowId: string;
  text: string;
}

export class ContentChannel {
  private backend: MockBackend;
  private _bus = new EventBus();
  private buffers = new Map<string, string[]>();
  private unsubs: (() => void)[] = [];

  constructor(backend: MockBackend) {
    this.backend = backend;
    this.unsubs.push(
      backend.on('command', (cmd) => {
        if (cmd.type === 'stream-content') {
          const msg = cmd.payload as unknown as ChannelMessage;
          this.receive(msg);
        }
      }),
    );
  }

  onMessage(fn: (payload: ChannelMessage) => void): () => void {
    return this._bus.on('message', fn);
  }

  onFlushed(fn: (payload: FlushedData) => void): () => void {
    return this._bus.on('flushed', fn);
  }

  private receive(msg: ChannelMessage): void {
    this._bus.emit('message', msg);

    if (!this.buffers.has(msg.windowId)) {
      this.buffers.set(msg.windowId, []);
    }
    this.buffers.get(msg.windowId)![msg.seq] = msg.text;

    if (msg.done) {
      this.flush(msg.windowId);
    }
  }

  private flush(windowId: string): void {
    const parts = this.buffers.get(windowId);
    if (!parts) return;
    const full = parts.filter(Boolean).join('');
    this.buffers.delete(windowId);

    this._bus.emit('flushed', { windowId, text: full });
  }

  simulateStream(windowId: string, lines: string[], interval = 300): void {
    const total = lines.length;
    lines.forEach((line, i) => {
      setTimeout(() => {
        this.backend.send('stream-content', {
          windowId,
          text: line,
          seq: i,
          total,
          done: i === total - 1,
        } satisfies ChannelMessage);
      }, (i + 1) * interval);
    });
  }

  destroy(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this._bus.clear();
    this.buffers.clear();
  }
}
