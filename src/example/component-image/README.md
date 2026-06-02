# ComponentImageDisplay

Showcase for `createLoadingImage()` from `components/PixiImage.ts`. Four slots demonstrate loading, success, and error states.

## Slots

| Slot | Source                                          | Expected              |
|------|-------------------------------------------------|-----------------------|
| A    | small sinaimg via moonchan proxy                | loaded                |
| B    | large sinaimg via moonchan proxy                | loaded, contain-fit   |
| C    | 404 URL                                         | error, placeholder    |
| D    | direct bfs URL (no referrer)                    | error, placeholder    |

Click "load" to start async asset load, "clear" to destroy the handle.

## API

```ts
createLoadingImage(parent, {
  url: string;
  x?: number; y?: number;
  width?: number; height?: number;
  onLoad?: () => void;
  onError?: (err: unknown) => void;
})
  → { setUrl(url), destroy() }
```

`createLoadingImage` is token-cancellation-safe: a new load before the previous resolves will not clobber the placeholder.
