# Test Coverage

**599 tests across 44 files, all passing.**

## Configuration

- **Runner:** Vitest v4
- **Environment:** jsdom (global, via `environment: 'jsdom'` in `vite.config.ts`)
- **Node flag:** `--experimental-require-module` in `execArgv` to bypass `ERR_REQUIRE_ESM` from `@csstools/css-calc`
- **Pattern:** `src/**/__tests__/**/*.test.{ts,tsx}`
- **No setup files** — global mocks are defined inline per test file

## Directory Structure

```
src/
├── __tests__/                          # Root-level tests
│   ├── main.test.tsx                   #   Module import does not throw
│   └── ErrorBoundary.test.tsx          #   React error boundary (5)
│
├── backend/__tests__/
│   ├── MockBackend.test.ts             #   Connection lifecycle, reconnect, commands (10)
│   ├── WindowManager.test.ts           #   Window open/close/move/resize/title/visibility (19)
│   └── ContentChannel.test.ts          #   Stream content, buffering, attachStage (9)
│
├── components/__tests__/
│   ├── Avd.test.ts                     #   AVD display component (19)
│   ├── AvdDialogueBox.test.ts          #   Dialogue box lifecycle (11)
│   ├── AvdInlineLayout.test.ts         #   Inline layout (11)
│   ├── AvdPortraitLayer.test.ts        #   Portrait layer (10)
│   ├── AvdScript.test.ts               #   Script execution (10)
│   ├── ClickableImage.test.ts          #   Click threshold, fullscreen event, load (12)
│   ├── ComponentContract.test.ts       #   Shared component interface (varies)
│   ├── FullscreenManager.test.ts       #   Show/hide, gsap animation, destroy (10)
│   ├── Loading.test.ts                 #   Loading spinner (varies)
│   ├── PixiConfirm.test.ts             #   Confirm dialog (10)
│   ├── PixiImage.test.ts               #   Load success/error, placeholders (14)
│   ├── PixiVideoPlayer.test.ts         #   Play/pause/seek, error/load/ended events (15)
│   ├── PixiWindow.test.ts              #   Window creation, title, close, content region (12)
│   ├── Scrollable.test.ts              #   Scroll creation, scrollTo/by, recalc (10)
│   └── TextInput.test.ts               #   Input creation, events, destroy (14)
│
├── example/__tests__/
│   ├── Displays.test.ts                #   Display registry (5)
│   ├── examples.test.ts                #   Example registry + head metadata (varies)
│   ├── components.test.tsx             #   Parametrized metadata for 44 display components (89)
│   └── useHashExample.test.tsx          #   URL hash routing hook (4)
│
└── framework/__tests__/
    ├── EventBus.test.ts                #   Event system (10)
    ├── gsap-pixi.test.ts               #   GSAP integration (4)
    ├── InfiniteCanvas.test.ts          #   Pan/zoom/chunks/plugins/drag (14)
    ├── Layer.test.ts                   #   LayerManager add/get/remove/z-order (24)
    ├── perf.test.ts                    #   PerfDisplay enable/disable/toggle/destroy (9)
    ├── PixiApp.test.ts                 #   App init, destroy, perf display (6)
    ├── register-components.test.ts     #   Component registration (varies)
    ├── SubCanvas.test.ts               #   Event routing, bounds, nesting (14)
    ├── SubCanvas.clip.test.ts          #   Clip-to-bounds (varies)
    ├── SubCanvas.drag.test.ts          #   Drag behavior (varies)
    ├── SubCanvas.lifecycle.test.ts     #   Lifecycle (varies)
    ├── SubCanvasProxy.test.ts          #   Proxy routing (14)
    ├── component.test.ts               #   Component registry (10)
    └── ui-helpers.test.ts              #   Button, stepper, info panel (14)
```

## Coverage by Module

| Module | Files | Tests | Status |
|--------|-------|-------|--------|
| `src/backend/` | 3 source, 3 test | 38 | Full |
| `src/components/` | 14 source, 15 test | ~200 | Near-full |
| `src/example/` | 3 source, 4 test | ~100 | Full |
| `src/framework/` | 11 source, 14 test | ~260 | Near-full |
| Root (`src/index`, `src/main`) | 2 source, 2 test | 6 | Partial |

## Testing Patterns

### Pixi.js Mocking

PixiJS is always mocked at module level with `vi.mock('pixi.js', ...)`. Two styles exist:

**Style A — Sync factory with vi.hoisted (preferred):**
```typescript
const mockAssetsLoad = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock('pixi.js', () => ({
  Graphics: vi.fn(() => makeMockContainer()),
  Text: vi.fn(() => makeMockContainer()),
  Container: vi.fn(() => makeMockContainer()),
  Sprite: vi.fn(() => makeMockContainer()),
  Assets: { load: mockAssetsLoad },
}));
```

**Style B — Async factory with vi.importActual:**
```typescript
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return { ...actual, Graphics: vi.fn(() => makeMockContainer()) };
});
```

Style B provides type safety for pixi.js exports the tests don't override but can cause hoisting issues with module-scoped variables. **Prefer Style A** for new tests.

### Common Mock Patterns

- `createdObjects: Record<string, unknown>[]` — track all pixi.js constructor calls
- Shared `mockPixiObj(extra?)` function — returns a consistent mock container shape
- `makeStage()` / `makeSub()` — return minimal SubCanvas mocks
- GSAP mocked to fire `onComplete` immediately: `vi.fn((_target, vars) => { vars.onComplete?.(); return { kill: vi.fn() }; })`
- React tests use `act` from `react` (not deprecated `react-dom/test-utils`), with `async/await`
- Mouse events use `dispatchEvent(new MouseEvent(...))` for jsdom compatibility

### Async Testing

- `vi.waitFor(callback)` — polls until assertion passes (handles microtask timing)
- `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)` — for timer-dependent code
- `mockResolvedValue` / `mockRejectedValue` — for promise-based async flows

## Known Gaps

| File | Missing Coverage | Reason |
|------|----------------|--------|
| `src/framework/PixiApp.ts` | Internal functions `probeWebGL()`, `showFatalOverlay()`, `assertSingleBodyCanvas()` | Not exported; require DOM/WebGL environment |
| `src/framework/Layer.ts` | `LayerManager` accept PIXI.Container directly | Works via delegation, hard to test without real PIXI |
| `src/backend/types.ts` | All types | Pure interface definitions — no executable logic |
| `src/framework/perf.ts` | `_onTick` internal FPS calculation | Relies on real ticker `deltaMS` values |
| `src/framework/utils/math.ts` | `randomFloat` seeds/uniform distribution | Statistical test would be flaky |

## Running Tests

```bash
# Full suite
npx vitest run

# Single file
npx vitest run src/components/__tests__/PixiImage.test.ts

# Watch mode
npx vitest

# With pattern filter
npx vitest run --reporter=verbose src/framework/__tests__/
```
