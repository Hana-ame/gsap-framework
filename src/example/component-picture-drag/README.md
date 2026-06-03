# ComponentPictureDragDisplay

A minimal demo of a single draggable picture SubCanvas with click-position reporting.

Features:
- `SubCanvas` with `dragMode: 'anywhere'` — drag anywhere on the canvas to move it
- `dragBringToFront: true` — click/drag brings it to front
- Image loaded from URL (scaled to fit)
- Click on the SubCanvas → red dot at click position + coordinate text via `EventBus`
- Coordinate display is fixed on screen (root stage); dot moves with the SubCanvas

## Key integration

| Mechanism | Role |
|-----------|------|
| `SubCanvas.onPress()` (AABB routing) | Reports click position without conflicting with PIXI drag handle |
| `EventBus.emit('picture:click')` | Makes click data available for external hooks |
| `dragMode: 'anywhere'` | Transparent drag handle covers the entire SubCanvas, installed at construction |
| `pic.stage.addChild()` | Content children coexist with the drag handle (zIndex -1) |

The click handler uses the legacy AABB routing (`onPress`/`handlePointer`) rather than PIXI FederatedEvents, so it does not interfere with the drag handle's `pointerdown` listener.
