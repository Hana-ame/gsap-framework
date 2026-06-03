# ComponentWindowDisplay

Showcase for `createWindow()` from `components/PixiWindow.ts`. All UI is PIXI SubCanvas (no HTML overlay).

## What it shows

| Window | dragMode     | Behavior                                     |
|--------|--------------|----------------------------------------------|
| A      | `title`      | drag only the title bar (default)            |
| B      | `anywhere`   | drag from anywhere inside the window         |
| C      | `none`       | fixed position, cannot be dragged            |

## Buttons (PIXI SubCanvas panel)

Each window row has 4 buttons:
- **close** — destroy the window, remember its last position
- **open** — reopen at the default position
- **reopen** — reopen where it was last closed (disabled if never closed)
- **preset** — open at a hardcoded preset coordinate

## API

```ts
createWindow({
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent: SubCanvas;
  dragMode?: 'title' | 'anywhere' | 'none';  // default 'title'
})
```
