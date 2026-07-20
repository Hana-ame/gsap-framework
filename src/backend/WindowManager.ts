/** High-level window lifecycle manager: open, close, move, resize. */
import { MockBackend } from './MockBackend';
import { EventBus } from '../framework/EventBus';
import type { BackendCommand, WindowSpec } from './types';

export interface WindowManagerEventMap {
  'window-opened': { spec: WindowSpec };
  'window-closed': { id: string };
  'window-moved': { id: string; x: number; y: number };
  'window-resized': { id: string; width: number; height: number };
  'window-title-changed': { id: string; title: string };
  'content-set': { windowId: string; type: string };
  'content-cleared': { windowId: string };
  'window-hidden': { id: string };
  'window-shown': { id: string };
  'window-focused': { id: string };
}

interface ManagedWindow {
  spec: WindowSpec;
}

export class WindowManager {
  private backend: MockBackend;
  private windows = new Map<string, ManagedWindow>();
  private unsubs: (() => void)[] = [];
  private _bus = new EventBus();

  constructor(backend: MockBackend) {
    this.backend = backend;
    this.unsubs.push(
      backend.on('command', (cmd) => this.handleCommand(cmd)),
    );
  }

  on<K extends keyof WindowManagerEventMap>(
    event: K,
    fn: (payload: WindowManagerEventMap[K]) => void,
  ): () => void {
    return this._bus.on(event, fn);
  }

  private emit<K extends keyof WindowManagerEventMap>(
    event: K,
    payload: WindowManagerEventMap[K],
  ): void {
    this._bus.emit(event, payload);
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
        this.setTitle(cmd.payload.id as string, cmd.payload.title as string);
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

  openWindow(spec: WindowSpec): boolean {
    if (this.windows.has(spec.id)) return false;
    this.windows.set(spec.id, { spec });
    this.emit('window-opened', { spec });
    return true;
  }

  closeWindow(id: string): void {
    if (!this.windows.has(id)) return;
    this.windows.delete(id);
    this.emit('window-closed', { id });
  }

  moveWindow(id: string, x: number, y: number): void {
    const w = this.windows.get(id);
    if (!w) return;
    w.spec = { ...w.spec, x, y };
    this.emit('window-moved', { id, x, y });
  }

  resizeWindow(id: string, width: number, height: number): void {
    const w = this.windows.get(id);
    if (!w) return;
    w.spec = { ...w.spec, width, height };
    this.emit('window-resized', { id, width, height });
  }

  setTitle(id: string, title: string): void {
    const w = this.windows.get(id);
    if (!w) return;
    w.spec = { ...w.spec, title };
    this.emit('window-title-changed', { id, title });
  }

  setContent(windowId: string, type: string): void {
    if (!this.windows.has(windowId)) return;
    this.emit('content-set', { windowId, type });
  }

  clearContent(windowId: string): void {
    if (!this.windows.has(windowId)) return;
    this.emit('content-cleared', { windowId });
  }

  hideWindow(id: string): void {
    if (!this.windows.has(id)) return;
    this.emit('window-hidden', { id });
  }

  showWindow(id: string): void {
    if (!this.windows.has(id)) return;
    this.emit('window-shown', { id });
  }

  focusWindow(id: string): void {
    if (!this.windows.has(id)) return;
    this.emit('window-focused', { id });
  }

  getWindow(id: string): WindowSpec | undefined {
    return this.windows.get(id)?.spec;
  }

  getOpenWindows(): WindowSpec[] {
    return [...this.windows.values()].map((w) => ({ ...w.spec }));
  }

  getWindowCount(): number {
    return this.windows.size;
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
    this._bus.clear();
  }
}
