/** Bridges ContentChannel flushes to PixiJS SubCanvas rendering. */
import * as PIXI from 'pixi.js';
import type { ContentChannel, FlushedData } from '../backend/ContentChannel';
import type { SubCanvas } from '../framework/SubCanvas';

export class ContentChannelAdapter {
  private channel: ContentChannel;
  private stages = new Map<string, SubCanvas>();
  private unsubs: (() => void)[] = [];

  constructor(channel: ContentChannel) {
    this.channel = channel;
    this.unsubs.push(
      channel.onFlushed((data: FlushedData) => this._renderFlushed(data)),
    );
  }

  attachStage(windowId: string, stage: SubCanvas): void {
    this.stages.set(windowId, stage);
  }

  detachStage(windowId: string): void {
    this.stages.delete(windowId);
  }

  private _renderFlushed(data: FlushedData): void {
    const stage = this.stages.get(data.windowId);
    if (!stage || stage.destroyed) return;

    stage.removeChildren();
    const text = new PIXI.Text({
      text: data.text,
      style: {
        fontSize: 12,
        fill: 0x88ff88,
        fontFamily: 'monospace',
        wordWrap: true,
        wordWrapWidth: stage.bounds.width - 24,
      },
    });
    text.x = 12;
    text.y = 12;
    stage.stage.addChild(text);
  }

  destroy(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.stages.clear();
  }
}
