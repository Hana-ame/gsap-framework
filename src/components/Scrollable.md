# Scrollable

A scrollable container for PIXI content. Supports wheel, mouse drag, and touch drag.

## API

```ts
createScrollable(opts: ScrollableOptions): Scrollable
```

### ScrollableOptions

```ts
{
  parent: SubCanvas;
  width: number;
  height: number;
  direction?: 'vertical' | 'horizontal';  // default 'vertical'
  scrollbar?: boolean;                     // default true
  accept?: { x?: number; y?: number };    // initial scroll position
}
```

### Scrollable

```ts
{
  stage: PIXI.Container;       // add to parent
  content: PIXI.Container;     // add your children here
  bounds: { width, height };
  scrollTo(x, y): void;
  scrollBy(dx, dy): void;
  recalc(): void;              // re-measure after content changes
  sync(): void;                 // sync view position (cheap, O(1))
  destroy(): void;
  destroyed: boolean;
}
```

## Usage

```ts
const scroll = createScrollable({
  parent: sc,
  width: 300,
  height: 400,
  direction: 'vertical',
  scrollbar: true,
});

// add content
const text = new PIXI.Text({ text: '...\n'.repeat(50), ... });
scroll.content.addChild(text);

// re-measure after adding children
scroll.recalc();

// parent controls scroll position
scroll.scrollTo(0, 100);
```
