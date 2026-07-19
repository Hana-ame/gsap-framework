# Test Plan — SubCanvas Framework

Maintains all test cases. Each test file lists its coverage. New tests are added per priority.

---

## Existing Tests (236 tests / 20 files)

### framework/utils/__tests__/math.test.ts — 28 tests
- `clamp`: 4 (below/above/within/edge)
- `lerp`: 4 (t=0/t=1/t=0.5/extrapolate)
- `invLerp`: 4 (value=a/value=b/midpoint/a==b)
- `mapRange`: 3 (normal/inverse/negative)
- `degToRad / radToDeg`: 4 (180↔π/0/360)
- `distance / distanceSq`: 3 (3-4-5/same/inequality)
- `normalizeAngle`: 2 (wrap/negative)
- `snapToGrid`: 2 (nearest/exact)
- `randomInt`: 2 (range/single)

### framework/utils/__tests__/rect.test.ts — 17 tests
- `rectContains`: 5 (inside/outside left/below/edge inclusive/exclusive)
- `rectIntersects`: 3 (overlap/non-overlap/touching)
- `rectCenter`: 1 (center)
- `rectExpand`: 1 (equal sides)
- `rectShrink`: 2 (equal sides/clamp zero)
- `rectFit`: 2 (contain/cover)
- `rectClamp`: 2 (clamp/keep)
- `rectSnap`: 1 (grid)

### framework/utils/__tests__/color.test.ts — 14 tests
- `hexToRgb / rgbToHex`: 3 (round-trip/black/white)
- `rgbaToHex`: 1 (pack)
- `parseHexString / formatHexString`: 3 (full/shorthand/no-hash)
- `blendColors`: 3 (t=0/t=1/mid)
- `luminance / isLight`: 2 (white/black)
- `contrastTextColor`: 2 (white on dark / black on light)

### framework/utils/__tests__/registry.test.ts — 4 tests
- Component types registered: `['confirm', 'scrollable', 'window']`
- Factory exists per type
- Unknown type returns undefined
- `createComponent` throws for unknown type

### framework/__tests__/EventBus.test.ts — 9 tests
- `on`/`emit` delivers payload
- Multiple handlers
- `unsub()` removes
- `off()` removes
- Emit with no listeners
- `listenerCount` correct
- `clear()` removes all
- Handler exception isolation
- Independent events

### framework/__tests__/SubCanvas.test.ts — 25 tests
- Event routing: pointerdown within bounds, outside bounds, sub-regions prioritized, parent fallback
- pointermove, pointerup routing
- Tap detection: within threshold, beyond threshold
- Nested globalBounds calculation
- Content-only routing (miss content but hit window)
- No-handler returns false
- Multiple handlers on same type
- `offPointer` removes
- Events ignored after destroy
- `setPosition`/`setSize`/`globalBounds`
- SubCanvasProxy: top-level routing, nested hierarchy, empty proxy, destroyAll, multiple canvases, createRegion, getTopCanvases

### framework/__tests__/color.test.ts — 32 tests
- `hexToRgb`: 6 (white/black/red/green/blue/mid)
- `rgbToHex`: 4 (white/black/red/mid)
- `rgbaToHex`: 2 (alpha/opaque)
- `hexToRgba`: 1 (alpha decode)
- `parseHexString`: 3 (with hash/without/shorthand)
- `formatHexString`: 2 (hash/pad)
- `blendColors`: 4 (t=0/t=1/mid/black-white)
- `alphaBlend`: 3 (opaque/transparent/50%)
- `luminance`: 2 (white/black)
- `isLight`: 3 (white/black/yellow)
- `contrastTextColor`: 2 (light bg/dark bg)

### example/__tests__/examples.test.ts — 10 tests
- Default example defined and valid
- All EXAMPLES entries map to valid components with head
- exampleMap keys match EXAMPLES
- component-single-window registered and has correct head
- `isExample` true for valid, false for invalid
- DEFAULT_EXAMPLE resolves
- Array and map length match
- Unique routes
- head metadata correctness

### backend/__tests__/MockBackend.test.ts — 9 tests
- Starts disconnected
- Connects after delay
- Emits command on `send`
- Ignores send when disconnected
- sendSequence order and timing
- Disconnect clears timers and emits status
- Destroy cleanup
- Multiple listeners
- Unsubscribe

### backend/__tests__/WindowManager.test.ts — 7 tests
- Opens window on command
- Closes window on command
- Multiple windows
- Duplicate open ignored
- getOpenWindows returns specs
- closeAll
- Destroy cleanup

### backend/__tests__/ContentChannel.test.ts — 4 tests
- Receives stream-content
- Multiple chunks
- Destroy cleanup
- onMessage unsub

### framework/__tests__/SubCanvas.drag.test.ts — 14 tests (P0)
- dragMode anywhere: bg container created
- dragMode title: no bg by default, installs on labeled handle
- dragMode none: no handlers
- dragBounds: clamp position within parent
- dragBounds: allow when within
- bringToFront: zIndex increase
- sendToBack: zIndex decrease
- bringToFront + sendToBack round-trip
- bringToFront=false: natural zIndex
- onDragStart/onDrag/onEnd callbacks not called pre-drag
- Multiple windows independent drag
- removeChild uninstalls drag handle
- removeChildren uninstalls all drag handles

### framework/__tests__/SubCanvas.clip.test.ts — 8 tests (P1)
- clipToBounds creates mask Graphics
- No mask when false
- No mask by default
- Mask added to stage on creation
- Mask persists on setSize
- Mask persists on setBounds
- Mask auto-recovers after external destroy
- Mask auto-recovers after parent removeChild

### framework/__tests__/SubCanvas.lifecycle.test.ts — 11 tests (P1)
- destroy sets destroyed=true
- destroy cascades to sub-regions
- destroy removes stage from parent
- destroy clears pointer listeners
- destroy clears resize listeners
- double destroy safe
- parent destroy prevents child events
- onDestroy callback fires
- setPosition no-op after destroy
- child subRegions removed on destroy
- createRegion on destroyed parent

### framework/__tests__/InfiniteCanvas.test.ts — 16 tests (P0)
- Construct with default zoom loads chunks
- panBy / panTo move world coordinates
- setZoom clamps to min/max
- zoom-to-pointer keeps world point under cursor
- screenToWorld / worldToScreen round-trip
- centerOn correct
- addPlugin / removePlugin lifecycle
- decelerate plugin removable
- loads chunks on pan
- eachChunk iteration
- destroy cleans up plugins
- chunk callbacks balanced
- plugin onDown/onMove/onUp during drag
- plugin onUpdate from tick
- decelerate captures velocity on drag end

### components/__tests__/ComponentContract.test.ts — 6 tests (P1)
- createWindow returns { stage, destroy, destroyed }
- destroy toggles destroyed
- has content SubCanvas
- setTitle works
- closable=true creates close button
- double destroy safe

### framework/__tests__/register-components.test.ts — 6 tests (P2)
- Registers window, confirm, scrollable
- getComponentFactory returns factory for each
- createComponent("window") returns Component
- createComponent("confirm") returns Component
- createComponent("scrollable") returns Component
- Component.destroy toggles destroyed

### framework/__tests__/PixiApp.test.ts — 4 tests (P2)
- startPixiApp returns a destroy function
- destroy function does not throw
- startPixiApp with onReady callback fires
- debugBodyCanvases returns array

### components/__tests__/PixiImage.test.ts — 6 tests
- Returns handle with expected shape (container, destroy, setUrl, setErrorHintVisible, destroyed)
- Adds container to parent stage
- destroy toggles destroyed
- setUrl triggers load
- setErrorHintVisible works
- destroy is idempotent

### components/__tests__/Loading.test.ts — 6 tests
- showLoading returns hide function
- Adds overlay/spinner/label to stage
- Hide removes children
- showSpinner=false only adds 2 children
- Accepts string as text option
- Hide is idempotent

---

## Remaining Planned Tests

All originally planned tests are now implemented. Below is the completion summary:

| Area | File | Status |
|------|------|--------|
| SubCanvas Drag (P0) | `src/framework/__tests__/SubCanvas.drag.test.ts` | **10 tests** ✓ |
| InfiniteCanvas Core (P0) | `src/framework/__tests__/InfiniteCanvas.test.ts` | **16 tests** ✓ |
| Component Contracts (P1) | `src/components/__tests__/ComponentContract.test.ts` | **6 tests** ✓ |
| SubCanvas Clip (P1) | `src/framework/__tests__/SubCanvas.clip.test.ts` | **8 tests** ✓ |
| SubCanvas Lifecycle (P1) | `src/framework/__tests__/SubCanvas.lifecycle.test.ts` | **11 tests** ✓ |
| register-components (P2) | `src/framework/__tests__/register-components.test.ts` | **6 tests** ✓ |
| PixiApp (P2) | `src/framework/__tests__/PixiApp.test.ts` | **4 tests** ✓ |

---

## Test Configuration

Tests run via vitest. All test files in `src/**/__tests__/**/*.test.ts` are automatically discovered (configured in `vite.config.ts`).

```sh
npm test        # vitest run
npm run lint    # eslint .
npm run build   # vite build
```
