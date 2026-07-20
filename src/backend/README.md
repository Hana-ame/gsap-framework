# Backend

Pure-data backend layer — **zero PIXI/UI dependencies**. Emits events consumed by `src/adapters/` for rendering.

## Features

- MockBackend — simulates server push events via typed command interface
- WindowManager — manages window specs by command, emits lifecycle events
- ContentChannel — streaming channel that buffers chunks and emits assembled text

## Architecture

```
MockBackend (command source)
    ↓ commands
WindowManager (pure data)
    ├── maintains WindowSpec registry
    ├── handles open/close/move/resize/…
    └── emits events → WindowManagerAdapter
ContentChannel (stream processor)
    ├── buffers stream-content chunks
    ├── flushes assembled text on done
    └── emits events → ContentChannelAdapter
```

All event payloads are plain objects (`WindowSpec`, `FlushedData`, etc.) — no PIXI objects, no DOM references.

## Event Infrastructure

MockBackend, WindowManager, and ContentChannel share a single event infrastructure: `EventBus` from `src/framework/EventBus.ts`. Each class composes a private `EventBus` instance rather than reimplementing `Map<string, Set<Handler>>` + `on/off/emit`. This eliminates three duplicate implementations of the same pub-sub pattern.

## Design Principle

Backend emits data events; adapters decide how to render. Swap `MockBackend` for a real WebSocket without touching the rendering pipeline. The adapter layer (`src/adapters/`) subscribes to backend events and calls PIXI/component APIs.
