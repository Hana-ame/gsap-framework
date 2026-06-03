# Scrollable

A scrollable container for PIXI content. Supports wheel, mouse drag, and touch drag.

## API

```ts
createScrollable(parent: SubCanvas, opts: ScrollableOptions): Scrollable
```

### ScrollableOptions

```ts
{
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
  destroy(): void;
  destroyed: boolean;
}
```

## Usage

```ts
const scroll = createScrollable(sc, {
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
