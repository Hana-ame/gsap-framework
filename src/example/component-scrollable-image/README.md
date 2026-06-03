# ComponentScrollableImageDisplay

Showcase combining `createClickableImage()` + `createFullscreenManager()` inside a scrollable gallery panel.

Components used:
- `createClickableImage` — thumbnail that emits `'fullscreen:show'` on click
- `createFullscreenManager` — singleton overlay for fullscreen view (zoom/drag/close)
- `SubCanvas` + `clipToBounds: true` — panel with mask, manual scroll (wheel + drag + window listener)

## What it shows

- 16 thumbnails (4 sources x 4 repetitions) in a 3-column grid
- Panel clipped to 500px height, content taller (~1200px)
- Wheel scroll, drag scroll (with window-level listener fallback)
- Click any thumbnail → fullscreen overlay (zoom/drag/close)
- Scrollbar indicator on panel right edge
- `globalBounds` propagation: scroll offset is tracked via SubCanvas `setPosition`, so the fullscreen animation origin always matches the scrolled position

## Key integration points

| Component | Role |
|-----------|------|
| `SubCanvas` (panel) | Clipped region, receives wheel/drag events |
| `SubCanvas` (content) | Tall container repositioned on scroll; its `globalBounds` auto-updates with scroll |
| `ClickableImage` | Thumbnail click → `bus.emit('fullscreen:show')` |
| `FullscreenManager` | Listens on bus → overlay + animation from thumb origin |

## Notes

- Manual scroll (not using `createScrollable`) to avoid coupling with ClickableImage's parent SubCanvas requirement
- Scroll origin in fullscreen animation is correct because content is positioned via `setPosition` on a SubCanvas — `globalBounds` accounts for it
- The `panel.stage.eventMode = 'auto'` ensures panel receives `pointerdown` on empty space while ClickableImage's `stopPropagation` prevents interference on thumbnails
