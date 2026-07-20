/** Barrel file for the backend module. */
export { MockBackend } from './MockBackend';
export { WindowManager } from './WindowManager';
export type { WindowManagerEventMap } from './WindowManager';
export { ContentChannel } from './ContentChannel';
export type { ChannelMessage, FlushedData } from './ContentChannel';
export type {
  BackendCommand,
  BackendCommandType,
  BackendStatus,
  WindowSpec,
  ContentSpec,
  StreamChunk,
  BackendEventMap,
} from './types';
