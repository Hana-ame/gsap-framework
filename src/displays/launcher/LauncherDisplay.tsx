import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../pixi/PixiApp';
import type { SubCanvas } from '../../pixi/SubCanvas';

interface AppEntry {
  route: string;
  label: string;
  hint: string;
  glyph: string;
  accent: number;
}

const APPS: AppEntry[] = [
  { route: 'window-mobile', label: 'Window Mobile', hint: 'adaptive stack + confirms', glyph: '◫', accent: 0x3a4a6a },
  { route: 'single', label: 'Single', hint: 'full viewport canvas', glyph: '▣', accent: 0x5a3a6a },
  { route: 'multiple', label: 'Multiple', hint: '2x2 quadrant grid', glyph: '⊞', accent: 0x3a6a5a },
  { route: 'window', label: 'Window', hint: 'draggable windows + chat', glyph: '▢', accent: 0x6a5a3a },
  { route: 'three', label: 'Three', hint: 'PIXI 3D scene', glyph: '◇', accent: 0x3a5a6a },
  { route: 'two-3d', label: 'Two 3D', hint: 'two synced 3D views', glyph: '◈', accent: 0x5a3a5a },
  { route: 'three-euler', label: 'Three Euler', hint: 'euler angle demo', glyph: '◊', accent: 0x3a6a3a },
  { route: 'camera-euler', label: 'Camera Euler', hint: 'camera rotation demo', glyph: '◆', accent: 0x6a3a3a },
  { route: 'confirm', label: 'Confirm', hint: 'html dialog playground', glyph: '?', accent: 0x4a4a6a },
  { route: 'pixi-confirm', label: 'Pixi Confirm', hint: 'pixi confirm with buttons', glyph: '!', accent: 0x4a6a4a },
];

const TILE_W = 150;
const TILE_H = 110;
const TILE_GAP_X = 12;
const TILE_GAP_Y = 12;
const SIDE_MARGIN = 16;
const TOP_BAR_H = 140;
const TILE_INNER_PAD = 14;
const INPUT_BOX_H = 40;
const BUTTON_W = 84;
const BUTTON_GAP = 8;
const INPUT_BOX_W_RATIO = 0.7;
const SCROLL_BAR_W = 4;

function readSafeBottom(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
  return parseFloat(v) || 0;
}

interface Scene {
  root: SubCanvas;
  bg: PIXI.Graphics;
  title: PIXI.Text;
  inputBg: PIXI.Graphics;
  inputText: PIXI.Text;
  buttonBg: PIXI.Graphics;
  buttonText: PIXI.Text;
  statusText: PIXI.Text;
  tilesLayer: PIXI.Container;
}

function buildInputBox(scene: Scene, W: number) {
  const inputW = Math.round(W * INPUT_BOX_W_RATIO) - BUTTON_GAP;
  scene.inputBg
    .clear()
    .roundRect(0, 0, inputW, INPUT_BOX_H, 8)
    .fill({ color: 0x14141f, alpha: 0.95 })
    .stroke({ width: 1, color: 0x2a2a3a });
  scene.inputBg.x = SIDE_MARGIN;
  scene.inputBg.y = 80;
  scene.inputText.x = SIDE_MARGIN + 14;
  scene.inputText.y = 80 + (INPUT_BOX_H - scene.inputText.height) / 2;

  const bx = SIDE_MARGIN + inputW + BUTTON_GAP;
  scene.buttonBg
    .clear()
    .roundRect(0, 0, BUTTON_W, INPUT_BOX_H, 8)
    .fill({ color: 0x3a4a6a })
    .stroke({ width: 1, color: 0x4a5a7a });
  scene.buttonBg.x = bx;
  scene.buttonBg.y = 80;
  scene.buttonText.x = bx + (BUTTON_W - scene.buttonText.width) / 2;
  scene.buttonText.y = 80 + (INPUT_BOX_H - scene.buttonText.height) / 2;
}

function buildTile(app: AppEntry, x: number, y: number): PIXI.Container {
  const c = new PIXI.Container();
  c.x = x;
  c.y = y;

  const bg = new PIXI.Graphics()
    .roundRect(0, 0, TILE_W, TILE_H, 10)
    .fill({ color: 0x14141f, alpha: 0.92 })
    .stroke({ width: 1, color: 0x2a2a3a });
  c.addChild(bg);

  const accent = new PIXI.Graphics()
    .roundRect(TILE_INNER_PAD, TILE_INNER_PAD, 36, 36, 8)
    .fill({ color: app.accent });
  c.addChild(accent);

  const glyph = new PIXI.Text({
    text: app.glyph,
    style: { fontSize: 22, fill: 0xffffff, fontFamily: 'monospace' },
  });
  glyph.x = TILE_INNER_PAD + (36 - glyph.width) / 2;
  glyph.y = TILE_INNER_PAD + (36 - glyph.height) / 2;
  c.addChild(glyph);

  const label = new PIXI.Text({
    text: app.label,
    style: { fontSize: 13, fill: 0xe6e6f0, fontFamily: 'monospace' },
  });
  label.x = TILE_INNER_PAD;
  label.y = 62;
  c.addChild(label);

  const hint = new PIXI.Text({
    text: app.hint,
    style: { fontSize: 10, fill: 0x888, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: TILE_W - 28 },
  });
  hint.x = TILE_INNER_PAD;
  hint.y = 80;
  c.addChild(hint);

  return c;
}

function rebuildTiles(scene: Scene, W: number, viewportH: number, query: string, scrollY: number) {
  scene.tilesLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
  const q = query.trim().toLowerCase();
  const list = q
    ? APPS.filter(
        (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q) || a.route.includes(q),
      )
    : APPS;
  const usableW = W - SIDE_MARGIN * 2;
  const cols = Math.max(1, Math.floor((usableW + TILE_GAP_X) / (TILE_W + TILE_GAP_X)));
  const rows = Math.max(1, Math.ceil(list.length / cols));
  const contentH = rows * TILE_H + (rows - 1) * TILE_GAP_Y;
  const maxScroll = Math.max(0, contentH - (viewportH - TOP_BAR_H - 20 - readSafeBottom()));
  const clampedScroll = Math.max(0, Math.min(scrollY, maxScroll));
  list.forEach((app, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = SIDE_MARGIN + col * (TILE_W + TILE_GAP_X);
    const y = TOP_BAR_H + 20 - clampedScroll + row * (TILE_H + TILE_GAP_Y);
    scene.tilesLayer.addChild(buildTile(app, x, y));
  });

  if (q) {
    scene.statusText.text =
      list.length === 0
        ? `no match for "${q}"`
        : `${list.length} match${list.length === 1 ? '' : 'es'} for "${q}"`;
    scene.statusText.style.fill = list.length === 0 ? 0xff6688 : 0x8a8a9a;
  } else {
    scene.statusText.text = `${APPS.length} routes · tap a tile or type to filter`;
    scene.statusText.style.fill = 0x8a8a9a;
  }
  return { contentH, maxScroll, clampedScroll, cols };
}

export function LauncherDisplay() {
  useEffect(() => {
    let query = '';
    let scrollY = 0;
    let hiddenInput: HTMLInputElement | null = null;
    let cleanupResize: (() => void) | null = null;
    let sceneRef: Scene | null = null;
    let contentHRef = 0;
    let maxScrollRef = 0;
    const cleanups: (() => void)[] = [];
    let visibleApps: AppEntry[] = APPS;

    const focusHidden = () => {
      if (hiddenInput) {
        hiddenInput.focus({ preventScroll: true });
      }
    };

    const onInput = () => {
      if (!sceneRef || !hiddenInput) return;
      query = hiddenInput.value;
      sceneRef.inputText.text = query ? query + '|' : '|';
      scrollY = 0;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const result = rebuildTiles(sceneRef, W, H, query, scrollY);
      contentHRef = result.contentH;
      maxScrollRef = result.maxScroll;
    };

    const onKey = (e: KeyboardEvent) => {
      if (!sceneRef) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = query.trim().toLowerCase();
        if (!q) return;
        const hit = visibleApps.find((a) => a.route === q || a.label.toLowerCase() === q);
        if (hit) {
          window.location.hash = `#${hit.route}`;
        } else {
          sceneRef.statusText.text = `no app matches "${q}"`;
          sceneRef.statusText.style.fill = 0xff6688;
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (hiddenInput) hiddenInput.value = '';
        query = '';
        sceneRef.inputText.text = '|';
        scrollY = 0;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const result = rebuildTiles(sceneRef, W, H, '', 0);
        contentHRef = result.contentH;
        maxScrollRef = result.maxScroll;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!sceneRef) return;
      e.preventDefault();
      const H = window.innerHeight;
      const usableH = H - TOP_BAR_H - 20 - readSafeBottom();
      if (contentHRef <= usableH) return;
      scrollY = Math.max(0, Math.min(maxScrollRef, scrollY + e.deltaY));
      rebuildTiles(sceneRef, window.innerWidth, H, query, scrollY);
    };

    const onPress = (e: { globalX: number; globalY: number }) => {
      if (!sceneRef) return;
      const inBox = sceneRef.inputBg.getBounds();
      if (
        e.globalX >= inBox.x &&
        e.globalX <= inBox.x + inBox.width &&
        e.globalY >= inBox.y &&
        e.globalY <= inBox.y + inBox.height
      ) {
        focusHidden();
        return;
      }
      const btn = sceneRef.buttonBg.getBounds();
      if (
        e.globalX >= btn.x &&
        e.globalX <= btn.x + btn.width &&
        e.globalY >= btn.y &&
        e.globalY <= btn.y + btn.height
      ) {
        const q = query.trim().toLowerCase();
        if (!q) {
          focusHidden();
          return;
        }
        const hit = visibleApps.find((a) => a.route === q || a.label.toLowerCase() === q);
        if (hit) {
          window.location.hash = `#${hit.route}`;
        } else {
          sceneRef.statusText.text = `no app matches "${q}"`;
          sceneRef.statusText.style.fill = 0xff6688;
        }
        return;
      }
      for (let i = 0; i < sceneRef.tilesLayer.children.length; i++) {
        const child = sceneRef.tilesLayer.getChildAt(i) as PIXI.Container;
        const cb = child.getBounds();
        if (
          e.globalX >= cb.x &&
          e.globalX <= cb.x + cb.width &&
          e.globalY >= cb.y &&
          e.globalY <= cb.y + cb.height
        ) {
          const app = visibleApps[i];
          if (app) {
            window.location.hash = `#${app.route}`;
            return;
          }
        }
      }
    };

    const destroy = startPixiApp((proxy) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      const bg = new PIXI.Graphics().rect(0, 0, W, H).fill({ color: 0x0a0a14 });
      bg.eventMode = 'none';
      root.stage.addChild(bg);

      const title = new PIXI.Text({
        text: 'sim',
        style: { fontSize: 28, fill: 0x88aaff, fontFamily: 'monospace' },
      });
      title.x = SIDE_MARGIN;
      title.y = 16;
      title.eventMode = 'none';
      root.stage.addChild(title);

      const inputBg = new PIXI.Graphics();
      inputBg.eventMode = 'none';
      root.stage.addChild(inputBg);

      const inputText = new PIXI.Text({
        text: '|',
        style: { fontSize: 15, fill: 0xe6e6f0, fontFamily: 'monospace' },
      });
      inputText.eventMode = 'none';
      root.stage.addChild(inputText);

      const buttonBg = new PIXI.Graphics();
      buttonBg.eventMode = 'none';
      root.stage.addChild(buttonBg);

      const buttonText = new PIXI.Text({
        text: 'Go',
        style: { fontSize: 15, fill: 0xffffff, fontFamily: 'monospace' },
      });
      buttonText.eventMode = 'none';
      root.stage.addChild(buttonText);

      const statusText = new PIXI.Text({
        text: `${APPS.length} routes · tap a tile or type to filter`,
        style: { fontSize: 11, fill: 0x8a8a9a, fontFamily: 'monospace' },
      });
      statusText.x = SIDE_MARGIN;
      statusText.y = 126;
      statusText.eventMode = 'none';
      root.stage.addChild(statusText);

      const tilesLayer = new PIXI.Container();
      tilesLayer.eventMode = 'none';
      root.stage.addChild(tilesLayer);

      const scene: Scene = { root, bg, title, inputBg, inputText, buttonBg, buttonText, statusText, tilesLayer };
      sceneRef = scene;

      buildInputBox(scene, W);
      const r0 = rebuildTiles(scene, W, H, '', 0);
      contentHRef = r0.contentH;
      maxScrollRef = r0.maxScroll;
      visibleApps = APPS;

      hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.setAttribute('aria-hidden', 'true');
      hiddenInput.tabIndex = -1;
      hiddenInput.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(hiddenInput);
      hiddenInput.addEventListener('input', onInput);
      hiddenInput.addEventListener('keydown', onKey);
      cleanups.push(() => {
        if (hiddenInput) {
          hiddenInput.removeEventListener('input', onInput);
          hiddenInput.removeEventListener('keydown', onKey);
          hiddenInput.remove();
          hiddenInput = null;
        }
      });

      root.onPress(onPress);
      cleanups.push(() => root.off('pointerdown', onPress));

      window.addEventListener('wheel', onWheel, { passive: false });
      cleanups.push(() => window.removeEventListener('wheel', onWheel));

      cleanupResize = proxy.onWindowResize(() => {
        if (!sceneRef) return;
        const W2 = window.innerWidth;
        const H2 = window.innerHeight;
        sceneRef.root.setBounds({ x: 0, y: 0, width: W2, height: H2 });
        sceneRef.bg.clear().rect(0, 0, W2, H2).fill({ color: 0x0a0a14 });
        buildInputBox(sceneRef, W2);
        scrollY = 0;
        const r = rebuildTiles(sceneRef, W2, H2, query, 0);
        contentHRef = r.contentH;
        maxScrollRef = r.maxScroll;
      });

      setTimeout(focusHidden, 50);
    });

    return () => {
      cleanups.forEach((c) => c());
      cleanupResize?.();
      destroy();
    };
  }, []);

  return null;
}
