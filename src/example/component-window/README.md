# ComponentWindowDisplay

Showcase for `createWindow()` from `components/PixiWindow.ts`. Demonstrates the three drag modes side by side.

## What it shows

| Window | dragMode     | Behavior                                     |
|--------|--------------|----------------------------------------------|
| A      | `title`      | drag only the title bar (default)            |
| B      | `anywhere`   | drag from anywhere inside the window         |
| C      | `none`       | fixed position, cannot be dragged            |

Each window can be closed and reopened from the bottom panel.

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
