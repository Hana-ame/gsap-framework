# ComponentLoadingDisplay

Showcase for `showLoading()` from `components/Loading.ts`. Demonstrates the default spinner, custom spinner color, and text-only variants.

## API

```ts
showLoading(sc: SubCanvas, opts?: LoadingOptions | string)
  → () => void   // call the returned function to hide
```

`opts` may be a string (treated as `{ text: 'that string' }`):

```ts
interface LoadingOptions {
  text?: string;          // default 'Loading...'
  spinnerColor?: number;  // default 0x88aaff
}
```

The overlay is a single sub-region on top of the parent's bounds. It auto-clears on `parent.destroy()`.
