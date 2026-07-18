import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import type { SubCanvas, SubPointerEvent } from '../../framework/SubCanvas';

const TILE_SIZE = 256;
const CELLS_PER_TILE = 16;
const CELL_SIZE = TILE_SIZE / CELLS_PER_TILE;
const VISIBLE_TILES = 3;

const GRASS_COLOR = 0x3a5a2a;
const GRASS_VARIANT = 0x2a4a2a;
const GRID_COLOR = 0x4a6a3a;

const UI_COLOR = 0x1a1a2a;
const UI_ACTIVE = 0x4a6a8a;

type FloraType = 'flower' | 'bush' | 'tree' | 'rock';

const FLORA_COLOR_SETS: Record<FloraType, number[]> = {
  flower: [0xff4444, 0xffff44, 0x4488ff, 0xff88ff, 0xffaa44],
  bush:   [0x2a7a2a, 0x3a8a3a, 0x1a5a1a],
  tree:   [0x4a3a2a, 0x3a2a1a],
  rock:   [0x777777, 0x888888, 0x666666],
};

interface PlacedFlora {
  type: FloraType;
  ci: number;
  lx: number;
  ly: number;
}

interface ColonyTile {
  container: PIXI.Container;
  bg: PIXI.Graphics;
  fg: PIXI.Graphics;
  flora: PlacedFlora[];
  tx: number;
  ty: number;
}

interface ColonyState {
  cameraX: number;
  cameraY: number;
  tiles: Map<string, ColonyTile>;
  worldContainer: PIXI.Container;
  viewportW: number;
  viewportH: number;
  selectedTool: FloraType | 'erase' | null;
  selectedColor: number;
  uiPanel: PIXI.Container | null;
  uiExpanded: boolean;
  uiToolBtns: Map<string, PIXI.Container>;
  coordsText: PIXI.Text | null;
}

function tileKey(tx: number, ty: number): string { return `${tx},${ty}`; }
function worldToTile(wx: number, wy: number): { tx: number; ty: number } {
  return { tx: Math.floor(wx / TILE_SIZE), ty: Math.floor(wy / TILE_SIZE) };
}
function cellLocal(wx: number, wy: number, tx: number, ty: number): { cx: number; cy: number } {
  return {
    cx: Math.floor((wx - tx * TILE_SIZE) / CELL_SIZE),
    cy: Math.floor((wy - ty * TILE_SIZE) / CELL_SIZE),
  };
}

function drawTileBg(s: ColonyState, tile: ColonyTile): void {
  const g = tile.bg;
  g.clear();
  g.rect(0, 0, TILE_SIZE, TILE_SIZE).fill({ color: GRASS_COLOR });
  for (let i = 0; i < 60; i++) {
    const x = (i * 137 + tile.tx * 71) % TILE_SIZE;
    const y = (i * 251 + tile.ty * 43) % TILE_SIZE;
    const r = 3 + ((i * 7 + tile.tx) % 5);
    g.circle(x, y, r).fill({ color: GRASS_VARIANT, alpha: 0.3 });
  }
  g.stroke({ width: 0.5, color: GRID_COLOR, alpha: 0.3 });
  for (let c = 0; c <= CELLS_PER_TILE; c++) {
    const p = c * CELL_SIZE;
    g.moveTo(0, p).lineTo(TILE_SIZE, p);
    g.moveTo(p, 0).lineTo(p, TILE_SIZE);
  }
}

function drawTileFlora(tile: ColonyTile): void {
  const g = tile.fg;
  g.clear();
  for (const f of tile.flora) {
    const x = f.lx * CELL_SIZE + CELL_SIZE / 2;
    const y = f.ly * CELL_SIZE + CELL_SIZE / 2;
    const color = FLORA_COLOR_SETS[f.type][f.ci];
    if (f.type === 'flower') {
      const r = CELL_SIZE * 0.45;
      g.circle(x, y, r).fill({ color });
      g.circle(x, y, r * 0.3).fill({ color: 0xffff88, alpha: 0.6 });
    } else if (f.type === 'bush') {
      g.circle(x, y, CELL_SIZE * 0.5).fill({ color });
      g.stroke({ width: 1, color, alpha: 0.5 });
    } else if (f.type === 'tree') {
      g.rect(x - 1.5, y - CELL_SIZE * 0.2, 3, CELL_SIZE * 0.55).fill({ color: 0x4a3a2a });
      g.circle(x, y - CELL_SIZE * 0.25, CELL_SIZE * 0.45).fill({ color: color, alpha: 0.85 });
    } else if (f.type === 'rock') {
      const rx = CELL_SIZE * 0.45;
      const ry = CELL_SIZE * 0.35;
      g.ellipse(x, y, rx, ry).fill({ color });
      g.stroke({ width: 1, color: 0x444444, alpha: 0.5 });
    }
  }
}

function loadTile(s: ColonyState, tx: number, ty: number): ColonyTile {
  const container = new PIXI.Container();
  container.x = tx * TILE_SIZE;
  container.y = ty * TILE_SIZE;
  container.eventMode = 'none';
  s.worldContainer.addChild(container);

  const bg = new PIXI.Graphics();
  bg.eventMode = 'none';
  container.addChild(bg);

  const fg = new PIXI.Graphics();
  fg.eventMode = 'none';
  container.addChild(fg);

  const tile: ColonyTile = { container, bg, fg, flora: [], tx, ty };
  drawTileBg(s, tile);
  s.tiles.set(tileKey(tx, ty), tile);
  return tile;
}

function unloadTile(s: ColonyState, key: string): void {
  const tile = s.tiles.get(key);
  if (!tile) return;
  tile.container.destroy({ children: true });
  s.tiles.delete(key);
}

function syncTiles(s: ColonyState): void {
  const cx = s.cameraX + s.viewportW / 2;
  const cy = s.cameraY + s.viewportH / 2;
  const { tx, ty } = worldToTile(cx, cy);
  const needed = new Set<string>();
  const half = Math.floor(VISIBLE_TILES / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      needed.add(tileKey(tx + dx, ty + dy));
    }
  }
  for (const key of s.tiles.keys()) {
    if (!needed.has(key)) unloadTile(s, key);
  }
  for (const key of needed) {
    if (!s.tiles.has(key)) {
      const [a, b] = key.split(',').map(Number);
      loadTile(s, a, b);
    }
  }
  s.worldContainer.x = -s.cameraX;
  s.worldContainer.y = -s.cameraY;
  if (s.coordsText) {
    const c = worldToTile(cx, cy);
    s.coordsText.text = `tile: ${c.tx},${c.ty}  \u00B7  camera: ${Math.floor(s.cameraX)},${Math.floor(s.cameraY)}`;
  }
}

function placeFlora(s: ColonyState, screenX: number, screenY: number): void {
  if (!s.selectedTool) return;
  const wx = screenX + s.cameraX;
  const wy = screenY + s.cameraY;
  const { tx, ty } = worldToTile(wx, wy);
  const key = tileKey(tx, ty);
  const tile = s.tiles.get(key);
  if (!tile) return;
  const { cx, cy } = cellLocal(wx, wy, tx, ty);
  if (cx < 0 || cx >= CELLS_PER_TILE || cy < 0 || cy >= CELLS_PER_TILE) return;

  if (s.selectedTool === 'erase') {
    tile.flora = tile.flora.filter((f) => !(f.lx === cx && f.ly === cy));
  } else {
    const existing = tile.flora.find((f) => f.lx === cx && f.ly === cy);
    if (existing) {
      existing.ci = (existing.ci + 1) % FLORA_COLOR_SETS[s.selectedTool].length;
    } else {
      tile.flora.push({ type: s.selectedTool, ci: 0, lx: cx, ly: cy });
    }
  }
  drawTileFlora(tile);
}

function makeSimpleBtn(label: string, w: number, h: number, onClick: () => void, bg = UI_COLOR): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.9 });
  g.stroke({ width: 1, color: 0x445, alpha: 0.7 });
  btn.addChild(g);
  const t = new PIXI.Text({ text: label, style: { fontSize: 11, fill: 0xccccee, fontFamily: 'monospace', fontWeight: 'bold' } });
  t.anchor.set(0.5);
  t.x = w / 2;
  t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

function buildUI(s: ColonyState, panelParent: PIXI.Container): void {
  const panel = new PIXI.Container();
  s.uiToolBtns = new Map();
  s.uiExpanded = false;

  const BTN_W = 44;
  const BTN_H = 28;
  const PAD = 6;
  const TOOLS: { type: FloraType | 'erase'; label: string; bg: number }[] = [
    { type: 'flower', label: '\u273F', bg: 0x4a2a4a },
    { type: 'bush', label: '\u2663', bg: 0x2a4a2a },
    { type: 'tree', label: '\u2666', bg: 0x3a4a3a },
    { type: 'rock', label: '\u25C8', bg: 0x3a3a3a },
    { type: 'erase', label: '\u2717', bg: 0x4a2a2a },
  ];

  const toolContainer = new PIXI.Container();
  toolContainer.visible = false;
  panel.addChild(toolContainer);

  const bg = new PIXI.Graphics();
  const fullH = PAD + TOOLS.length * (BTN_H + PAD) + BTN_H + PAD;
  bg.roundRect(0, 0, BTN_W + PAD * 2, fullH, 8).fill({ color: 0x0a0a14, alpha: 0.75 });
  bg.stroke({ width: 1, color: 0x333355, alpha: 0.5 });
  toolContainer.addChild(bg);

  for (let i = 0; i < TOOLS.length; i++) {
    const tool = TOOLS[i];
    const btn = makeSimpleBtn(tool.label, BTN_W, BTN_H, () => {
      s.selectedTool = s.selectedTool === tool.type ? null : tool.type;
      updateUIVisuals(s);
    }, tool.bg);
    btn.x = PAD;
    btn.y = PAD + i * (BTN_H + PAD);
    toolContainer.addChild(btn);
    s.uiToolBtns.set(tool.type, btn);
  }

  const expandBtn = makeSimpleBtn('\u2630', BTN_W, BTN_H, () => {
    s.uiExpanded = !s.uiExpanded;
    toolContainer.visible = s.uiExpanded;
    if (s.uiExpanded) {
      s.selectedTool = null;
      updateUIVisuals(s);
    }
  });
  expandBtn.x = PAD;
  expandBtn.y = PAD + TOOLS.length * (BTN_H + PAD);
  toolContainer.addChild(expandBtn);

  const collapsedBtn = makeSimpleBtn('\u2630', BTN_W, BTN_H, () => {
    s.uiExpanded = !s.uiExpanded;
    toolContainer.visible = s.uiExpanded;
  });
  panel.addChild(collapsedBtn);

  panel.x = 12;
  panel.y = 12;
  panel.eventMode = 'none';
  panelParent.addChild(panel);
  s.uiPanel = panel;
}

function updateUIVisuals(s: ColonyState): void {
  for (const [type, btn] of s.uiToolBtns.entries()) {
    const g = btn.children[0] as PIXI.Graphics;
    const isActive = s.selectedTool === type;
    g.clear();
    const c = isActive ? UI_ACTIVE : (FLORA_COLOR_SETS[type as FloraType]?.[0] ?? UI_COLOR);
    g.roundRect(0, 0, 44, 28, 6).fill({ color: c, alpha: 0.9 });
    g.stroke({ width: 1, color: isActive ? 0x88ccff : 0x445, alpha: 0.7 });
  }
}

export function ComponentColonyDisplay() {
  const [restartKey] = useState(0);
  const stateRef = useRef<ColonyState | null>(null);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const st: ColonyState = {
      cameraX: -W / 2,
      cameraY: -H / 2,
      tiles: new Map(),
      worldContainer: new PIXI.Container(),
      viewportW: W,
      viewportH: H,
      selectedTool: null,
      selectedColor: 0,
      uiPanel: null,
      uiExpanded: false,
      uiToolBtns: new Map(),
      coordsText: null,
    };
    stateRef.current = st;

    let dragStartCX = 0;
    let dragStartCY = 0;
    let dragStartCamX = 0;
    let dragStartCamY = 0;
    let dragging = false;

    const destroyApp = startPixiApp((proxy) => {
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      st.worldContainer.eventMode = 'none';
      region.stage.addChild(st.worldContainer);

      const coords = new PIXI.Text({
        text: '',
        style: { fontSize: 11, fill: 0x8888aa, fontFamily: 'monospace' },
      });
      coords.x = 12;
      coords.y = H - 20;
      region.stage.addChild(coords);
      st.coordsText = coords;

      buildUI(st, region.stage);
      syncTiles(st);
      setWorldPos(st, W / 2, H / 2);

      const onPress = (e: SubPointerEvent) => {
        dragging = true;
        dragStartCX = e.globalX;
        dragStartCY = e.globalY;
        dragStartCamX = st.cameraX;
        dragStartCamY = st.cameraY;
      };

      const onMove = (e: SubPointerEvent) => {
        if (!dragging) return;
        st.cameraX = dragStartCamX - (e.globalX - dragStartCX);
        st.cameraY = dragStartCamY - (e.globalY - dragStartCY);
        syncTiles(st);
      };

      const onRelease = () => { dragging = false; };

      const onTap = (e: SubPointerEvent) => {
        placeFlora(st, e.x, e.y);
      };

      region.onPress(onPress);
      region.onMove(onMove);
      region.onRelease(onRelease);
      region.onTap(onTap);
    });

    return () => {
      if (st.worldContainer) st.worldContainer.destroy({ children: true });
      destroyApp();
      stateRef.current = null;
    };
  }, [restartKey]);

  return <></>;
}

function setWorldPos(s: ColonyState, centerX: number, centerY: number): void {
  s.cameraX = centerX - s.viewportW / 2;
  s.cameraY = centerY - s.viewportH / 2;
  syncTiles(s);
}

ComponentColonyDisplay.head = {
  title: 'Component: Colony',
  description:
    'Tile-based colony simulation. 3×3 dynamic tile loading/unloading, fixed tile size (256px, 16×16 cells). Mouse drag to pan, click to place flora (flowers, bushes, trees, rocks). Floating transparent expandable UI.',
};