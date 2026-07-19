import * as PIXI from 'pixi.js';
import { MockBackend } from './MockBackend';
import type { SubCanvas } from '@framework/SubCanvas';

export interface ChannelMessage {
  windowId: string;
  text: string;
  done: boolean;
  seq: number;
  total: number;
}

type Handler<T = unknown> = (payload: T) => void;

export class ContentChannel {
  private backend: MockBackend;
  private listeners = new Map<string, Set<Handler>>();
  private stages = new Map<string, SubCanvas>();
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

  onMessage(fn: Handler<ChannelMessage>): () => void {
    let set = this.listeners.get('message');
    if (!set) {
      set = new Set();
      this.listeners.set('message', set);
    }
    set.add(fn);
    return () => set?.delete(fn);
  }

  attachStage(windowId: string, stage: SubCanvas): void {
    this.stages.set(windowId, stage);
  }

  detachStage(windowId: string): void {
    this.stages.delete(windowId);
  }

  private receive(msg: ChannelMessage): void {
    this.listeners.get('message')?.forEach((fn) => fn(msg));

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

    const stage = this.stages.get(windowId);
    if (!stage || stage.destroyed) return;

    stage.removeChildren();
    const text = new PIXI.Text({
      text: full,
      style: { fontSize: 12, fill: 0x88ff88, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: stage.bounds.width - 24 },
    });
    text.x = 12;
    text.y = 12;
    stage.stage.addChild(text);
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
    this.listeners.clear();
    this.stages.clear();
    this.buffers.clear();
  }
}
