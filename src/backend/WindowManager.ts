import * as PIXI from 'pixi.js';
import { MockBackend } from './MockBackend';
import {
  type BackendCommand,
  type BackendCommandType,
  type WindowSpec,
} from './types';
import { createWindow, type GameWindow } from '../components';
import type { SubCanvas } from '../framework/SubCanvas';
import { mountDisplays } from '../example/_shared/Displays';

interface ManagedWindow {
  spec: WindowSpec;
  instance: GameWindow;
  contentCleanup: (() => void) | null;
}

export class WindowManager {
  private backend: MockBackend;
  private parent: SubCanvas;
  private windows = new Map<string, ManagedWindow>();
  private unsubs: (() => void)[] = [];

  constructor(backend: MockBackend, parent: SubCanvas) {
    this.backend = backend;
    this.parent = parent;
    this.unsubs.push(
      backend.on('command', (cmd) => this.handleCommand(cmd)),
    );
  }

  private handleCommand(cmd: BackendCommand): void {
    switch (cmd.type) {
      case 'open-window':
        this.openWindow(cmd.payload as unknown as WindowSpec);
        break;
      case 'close-window':
        this.closeWindow(cmd.payload.id as string);
        break;
      case 'move-window':
        this.moveWindow(
          cmd.payload.id as string,
          cmd.payload.x as number,
          cmd.payload.y as number,
        );
        break;
      case 'resize-window':
        this.resizeWindow(
          cmd.payload.id as string,
          cmd.payload.width as number,
          cmd.payload.height as number,
        );
        break;
      case 'set-title': {
        const w = this.windows.get(cmd.payload.id as string);
        if (w) w.instance.setTitle(cmd.payload.title as string);
        break;
      }
      case 'set-content':
        this.setContent(cmd.payload.windowId as string, cmd.payload.type as string);
        break;
      case 'clear-content':
        this.clearContent(cmd.payload.windowId as string);
        break;
      case 'hide-window':
        this.hideWindow(cmd.payload.id as string);
        break;
      case 'show-window':
        this.showWindow(cmd.payload.id as string);
        break;
      case 'focus-window':
        this.focusWindow(cmd.payload.id as string);
        break;
    }
  }

  openWindow(spec: WindowSpec): GameWindow | null {
    if (this.windows.has(spec.id)) return null;
    const win = createWindow({
      parent: this.parent,
      title: spec.title,
      x: spec.x,
      y: spec.y,
      width: spec.width,
      height: spec.height,
      draggable: true,
      closable: true,
      onClose: () => this.closeWindow(spec.id),
    });
    this.windows.set(spec.id, { spec, instance: win, contentCleanup: null });
    return win;
  }

  closeWindow(id: string): void {
    const w = this.windows.get(id);
    if (!w) return;
    w.contentCleanup?.();
    w.instance.destroy();
    this.windows.delete(id);
  }

  moveWindow(id: string, x: number, y: number): void {
    this.windows.get(id)?.instance.setPosition(x, y);
  }

  resizeWindow(id: string, width: number, height: number): void {
    this.windows.get(id)?.instance.setSize(width, height);
  }

  hideWindow(id: string): void {
    const w = this.windows.get(id);
    if (w) w.instance.visible = false;
  }

  showWindow(id: string): void {
    const w = this.windows.get(id);
    if (w) w.instance.visible = true;
  }

  focusWindow(id: string): void {
    const w = this.windows.get(id);
    if (w) w.instance.bringToFront();
  }

  getWindow(id: string): GameWindow | undefined {
    return this.windows.get(id)?.instance;
  }

  private setContent(windowId: string, type: string): void {
    const w = this.windows.get(windowId);
    if (!w) return;
    this.clearContent(windowId);
    if (type === 'ripple') {
      w.contentCleanup = mountDisplays(w.instance.content);
    } else {
      const text = new PIXI.Text({
        text: `content: ${type}`,
        style: { fontSize: 14, fill: 0xffffff, fontFamily: 'monospace' },
      });
      text.x = 16;
      text.y = 16;
      w.instance.content.stage.addChild(text);
      w.contentCleanup = () => {
        text.removeFromParent();
        text.destroy();
      };
    }
  }

  private clearContent(windowId: string): void {
    const w = this.windows.get(windowId);
    if (!w) return;
    w.contentCleanup?.();
    w.contentCleanup = null;
    w.instance.content.removeChildren();
  }

  getWindowCount(): number {
    return this.windows.size;
  }

  getOpenWindows(): WindowSpec[] {
    return [...this.windows.values()].map((w) => ({ ...w.spec }));
  }

  closeAll(): void {
    for (const id of [...this.windows.keys()]) {
      this.closeWindow(id);
    }
  }

  destroy(): void {
    this.closeAll();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }
}
