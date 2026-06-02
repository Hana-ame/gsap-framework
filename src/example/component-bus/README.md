# ComponentBusDisplay

Showcase for `EventBus` from `framework/EventBus.ts`. Two windows communicating via pub-sub across independent windows.

## What it shows

- **Sender** window with a button that emits `ping` events onto `proxy.bus`
- **Receiver** window (anywhere-draggable) that subscribes to `ping` and renders the payload as a log
- The bus is shared across all sub-regions in the same `SubCanvasProxy`, so windows can communicate without direct references

## API

```ts
const bus = proxy.bus;

bus.emit<T>(type: string, payload: T): void;
bus.on<T>(type: string, fn: (payload: T) => void): () => void;  // returns cleanup
bus.off(type: string, fn: Function): void;
bus.clear(): void;  // removes all listeners (also called on proxy.destroyAll)
```
