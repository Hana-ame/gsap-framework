/** Shared types for the backend layer: commands, statuses, and window specs. */
export type BackendCommandType =
  | 'open-window'
  | 'close-window'
  | 'move-window'
  | 'resize-window'
  | 'set-title'
  | 'set-content'
  | 'stream-content'
  | 'clear-content'
  | 'ping'
  | 'hide-window'
  | 'show-window'
  | 'focus-window';

export interface BackendCommand {
  id: string;
  type: BackendCommandType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface WindowSpec {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContentSpec {
  windowId: string;
  type: 'text' | 'image' | 'canvas' | 'ripple';
  data: unknown;
}

export interface StreamChunk {
  windowId: string;
  seq: number;
  total: number;
  data: string;
  done: boolean;
}

export type BackendStatus = 'connected' | 'disconnected' | 'error';

export interface BackendEventMap {
  command: BackendCommand;
  status: BackendStatus;
  error: Error;
}
