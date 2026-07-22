# ExMoonchan Scene Migration Pattern

## Overview

Port RPG Maker MV H-scenes to pure DOM rendering using ex.moonchan.xyz image hosting. Bypasses CORS restrictions that block PixiJS WebGL from loading cross-origin images.

## Architecture

```
AvdController (mode: 'dom')
  ├── DomLayer          → creates DOM elements (div, img, canvas)
  ├── DomTexture         → <img> without crossOrigin attribute
  ├── DomBackgroundLayer → CSS background-image
  └── DomDialogueBox    → DOM-based text box
```

No PixiJS, no WebGL, no Vite proxy. Images loaded via `<img>` tags — no `texImage2D` CORS error.

## Key Files

| File | Purpose |
|------|---------|
| `src/example/h-scenes/imageMapEx.ts` | URL mapping: CG key → ex.moonchan.xyz URL |
| `src/example/h-scenes/domSceneHelper.ts` | Shared bootstrap: load DomTexture → create AvdController('dom') |
| `src/example/component-avd-*-dom/` | Per-scene display component (20 scenes) |

## How to Add a New Scene

### 1. Add CG URLs to `imageMapEx.ts`

```ts
export const IMAGE_MAP: Record<string, string> = {
  ...
  'MYSCENE-1': 'https://ex.moonchan.xyz/s/xxx/yyy-zz?redirect_to=image',
  'MYSCENE-2': 'https://ex.moonchan.xyz/s/xxx/yyy-zz?redirect_to=image',
};
```

### 2. Create Script File

```ts
// src/example/h-scenes/MySceneScript.ts
import type { AvdLineJSON } from '../../components';
export const MYSCENE_LINES: AvdLineJSON[] = [
  { speaker: '角色名', bgKey: 'MYSCENE-1', text: '台词…' },
  { speaker: '', bgKey: 'MYSCENE-2', text: '叙述' },
  { speaker: '', text: '— 终 —', end: true },
];
```

### 3. Create Display Component

```tsx
// src/example/component-avd-myscene-dom/ComponentAvdMySceneDomDisplay.tsx
import { useEffect, useRef } from 'react';
import { mountDomScene } from '../h-scenes/domSceneHelper';
import { MYSCENE_LINES } from '../h-scenes/MySceneScript';

export function ComponentAvdMySceneDomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const cleanup = mountDomScene({
      el,
      title: 'MyScene',
      lines: MYSCENE_LINES,
      getBgKeys: () => MYSCENE_LINES.filter(l => l.bgKey).map(l => l.bgKey!),
    });
    return () => { cleanup.then(fn => fn()); };
  }, []);
  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}
ComponentAvdMySceneDomDisplay.head = { title: 'MyScene (DOM)', description: '...' };
```

### 4. Register

- `src/example/examples.ts`: import → `EXAMPLES` array → `exampleMap`
- `src/example/launcher/LauncherDisplay.tsx`: append tile to `APPS`

## `mountDomScene` API

```ts
mountDomScene({
  el,          // HTMLElement — mount point
  title,       // string — unused internally, for metadata
  lines,       // AvdLineJSON[] — script content
  getBgKeys,   // () => string[] — extract bg keys from lines
}): Promise<() => void>  // returns cleanup function
```

Internally:
1. Collects unique bg keys
2. Creates `DomTexture` for each from `IMAGE_MAP`
3. Waits for all images to load (polling `texture.loaded`)
4. Calls `parseScript({ lines, roster: {} }, ...)`
5. Creates `AvdController(el, null, opts, 'dom')`
6. Sets bg texture map and parsed script

## CG URL Source

Gallery: <https://ex.moonchan.xyz/g/3631029/8a2a08b248/>

URL pattern: `https://ex.moonchan.xyz/s/{hash}/{gallery_id}-{page}?redirect_to=image`

## Migration Checklist

- [ ] CG images uploaded to ex.moonchan.xyz
- [ ] URLs mapped in `imageMapEx.ts`
- [ ] Script translated and saved as `*Script.ts`
- [ ] DOM display component created in `component-avd-*-dom/`
- [ ] Component registered in `examples.ts` and `LauncherDisplay.tsx`
- [ ] `tsc --noEmit` passes
