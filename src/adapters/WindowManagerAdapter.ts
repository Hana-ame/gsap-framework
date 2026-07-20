/** Bridges backend WindowManager events to PixiJS window creation/management. */
import * as PIXI from 'pixi.js';
import type { WindowSpec } from '../backend/types';
import type { WindowManager } from '../backend/WindowManager';
import { createWindow, type GameWindow } from '../components/PixiWindow';
import type { SubCanvas } from '../framework/SubCanvas';

export class WindowManagerAdapter {
  private pixiWindows = new Map<string, GameWindow>();
  private manager: WindowManager;
  private parent: SubCanvas;
  private unsubs: (() => void)[] = [];

  constructor(manager: WindowManager, parent: SubCanvas) {
    this.manager = manager;
    this.parent = parent;

    this.unsubs.push(
      manager.on('window-opened', ({ spec }) => this._onWindowOpened(spec)),
      manager.on('window-closed', ({ id }) => this._onWindowClosed(id)),
      manager.on('window-moved', ({ id, x, y }) => this._onWindowMoved(id, x, y)),
      manager.on('window-resized', ({ id, width, height }) => this._onWindowResized(id, width, height)),
      manager.on('window-title-changed', ({ id, title }) => this._onWindowTitleChanged(id, title)),
      manager.on('content-set', ({ windowId, type }) => this._onContentSet(windowId, type)),
      manager.on('content-cleared', ({ windowId }) => this._onContentCleared(windowId)),
      manager.on('window-hidden', ({ id }) => this._onWindowHidden(id)),
      manager.on('window-shown', ({ id }) => this._onWindowShown(id)),
      manager.on('window-focused', ({ id }) => this._onWindowFocused(id)),
    );
  }

  getContentStage(id: string): SubCanvas | undefined {
    return this.pixiWindows.get(id)?.content;
  }

  private _onWindowOpened(spec: WindowSpec): void {
    const win = createWindow({
      parent: this.parent,
      title: spec.title,
      x: spec.x,
      y: spec.y,
      width: spec.width,
      height: spec.height,
      draggable: true,
      closable: true,
      onClose: () => this.manager.closeWindow(spec.id),
    });
    this.pixiWindows.set(spec.id, win);
  }

  private _onWindowClosed(id: string): void {
    const win = this.pixiWindows.get(id);
    if (!win) return;
    win.destroy();
    this.pixiWindows.delete(id);
  }

  private _onWindowMoved(id: string, x: number, y: number): void {
    this.pixiWindows.get(id)?.setPosition(x, y);
  }

  private _onWindowResized(id: string, width: number, height: number): void {
    this.pixiWindows.get(id)?.setSize(width, height);
  }

  private _onWindowTitleChanged(id: string, title: string): void {
    this.pixiWindows.get(id)?.setTitle(title);
  }

  private _onContentSet(windowId: string, type: string): void {
    const win = this.pixiWindows.get(windowId);
    if (!win) return;
    win.content.removeChildren();
    if (type === 'ripple') {
      const text = new PIXI.Text({
        text: 'ripple content',
        style: { fontSize: 14, fill: 0x88ff88, fontFamily: 'monospace' },
      });
      text.x = 16;
      text.y = 16;
      win.content.stage.addChild(text);
    } else {
      const text = new PIXI.Text({
        text: `content: ${type}`,
        style: { fontSize: 14, fill: 0x8888ff, fontFamily: 'monospace' },
      });
      text.x = 16;
      text.y = 16;
      win.content.stage.addChild(text);
    }
  }

  private _onContentCleared(windowId: string): void {
    this.pixiWindows.get(windowId)?.content.removeChildren();
  }

  private _onWindowHidden(id: string): void {
    const win = this.pixiWindows.get(id);
    if (win) win.visible = false;
  }

  private _onWindowShown(id: string): void {
    const win = this.pixiWindows.get(id);
    if (win) win.visible = true;
  }

  private _onWindowFocused(id: string): void {
    this.pixiWindows.get(id)?.bringToFront();
  }

  destroy(): void {
    for (const win of this.pixiWindows.values()) win.destroy();
    this.pixiWindows.clear();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }
}
