// Example: Colony simulation (boid-like emergent behavior)
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '@framework/PixiApp';
import type { SubCanvas, SubPointerEvent } from '@framework/SubCanvas';
import { MockBackend, WindowManager } from '../../backend';
import { WindowManagerAdapter } from '../../adapters';

const TILE_SIZE = 256;
const CELLS_PER_TILE = 16;
const CELL_SIZE = TILE_SIZE / CELLS_PER_TILE;
const PRELOAD_MARGIN = 2;

const GRASS_COLOR = 0x3a5a2a;
const GRASS_VARIANT = 0x2a4a2a;
const GRID_COLOR = 0x4a6a3a;

const GROWTH_TIME = 8000;
const HARVEST_REWARD: Record<string, number> = { flower: 3, bush: 4, tree: 5 };
const PLANT_COST: Record<string, number> = { flower: 1, bush: 2, tree: 3 };

type FloraType = 'flower' | 'bush' | 'tree' | 'rock';

const FLORA_COLOR_SETS: Record<FloraType, number[]> = {
  flower: [0xff4444, 0xffff44, 0x4488ff, 0xff88ff, 0xffaa44],
  bush:   [0x2a7a2a, 0x3a8a3a, 0x1a5a1a],
  tree:   [0x4a3a2a, 0x3a2a1a],
  rock:   [0x777777, 0x888888, 0x666666],
};

interface PlacedFlora {
  type: FloraType; ci: number; lx: number; ly: number; growth: number;
}

interface ColonyTile {
  container: PIXI.Container; bg: PIXI.Graphics; fg: PIXI.Graphics;
  flora: PlacedFlora[]; tx: number; ty: number;
}

interface GameState {
  cameraX: number; cameraY: number;
  tiles: Map<string, ColonyTile>;
  worldContainer: PIXI.Container;
  viewportW: number; viewportH: number;
  selectedTool: FloraType | 'erase' | null;
  coins: number;
  tickerCleanup: (() => void) | null;
  backend: MockBackend | null;
  wm: WindowManager | null;
  wmAdapter: WindowManagerAdapter | null;
  toolButtons: PIXI.Container[];
  _lastCenterKey: string;
}

function tileKey(tx: number, ty: number): string { return `${tx},${ty}`; }
function worldToTile(wx: number, wy: number) {
  return { tx: Math.floor(wx / TILE_SIZE), ty: Math.floor(wy / TILE_SIZE) };
}
function cellLocal(wx: number, wy: number, tx: number, ty: number) {
  return { cx: Math.floor((wx - tx * TILE_SIZE) / CELL_SIZE), cy: Math.floor((wy - ty * TILE_SIZE) / CELL_SIZE) };
}

function drawTileBg(tile: ColonyTile): void {
  const g = tile.bg; g.clear();
  g.rect(0, 0, TILE_SIZE, TILE_SIZE).fill({ color: GRASS_COLOR });
  for (let i = 0; i < 60; i++) {
    const x = (i * 137 + tile.tx * 71) % TILE_SIZE;
    const y = (i * 251 + tile.ty * 43) % TILE_SIZE;
    g.circle(x, y, 3 + ((i * 7 + tile.tx) % 5)).fill({ color: GRASS_VARIANT, alpha: 0.3 });
  }
  g.stroke({ width: 0.5, color: GRID_COLOR, alpha: 0.3 });
  for (let c = 0; c <= CELLS_PER_TILE; c++) {
    g.moveTo(0, c * CELL_SIZE).lineTo(TILE_SIZE, c * CELL_SIZE);
    g.moveTo(c * CELL_SIZE, 0).lineTo(c * CELL_SIZE, TILE_SIZE);
  }
}

function drawTileFlora(tile: ColonyTile): void {
  const g = tile.fg; g.clear();
  for (const f of tile.flora) {
    const x = f.lx * CELL_SIZE + CELL_SIZE / 2, y = f.ly * CELL_SIZE + CELL_SIZE / 2;
    const color = FLORA_COLOR_SETS[f.type][f.ci];
    const gr = Math.min(1, f.growth / GROWTH_TIME);
    if (f.type === 'rock') {
      g.ellipse(x, y, CELL_SIZE * 0.45, CELL_SIZE * 0.35).fill({ color });
      g.stroke({ width: 1, color: 0x444444, alpha: 0.5 });
    } else if (gr < 1) {
      const r = CELL_SIZE * (0.15 + gr * 0.3);
      g.circle(x, y, r).fill({ color, alpha: 0.4 + gr * 0.6 });
      if (gr > 0.5) g.circle(x, y, r * 0.3).fill({ color: 0xffff88, alpha: 0.3 });
    } else if (f.type === 'flower') {
      g.circle(x, y, CELL_SIZE * 0.45).fill({ color });
      g.circle(x, y, CELL_SIZE * 0.13).fill({ color: 0xffff88, alpha: 0.6 });
    } else if (f.type === 'bush') {
      g.circle(x, y, CELL_SIZE * 0.5).fill({ color });
      g.stroke({ width: 1, color, alpha: 0.5 });
    } else if (f.type === 'tree') {
      g.rect(x - 1.5, y - CELL_SIZE * 0.2, 3, CELL_SIZE * 0.55).fill({ color: 0x4a3a2a });
      g.circle(x, y - CELL_SIZE * 0.25, CELL_SIZE * 0.45).fill({ color, alpha: 0.85 });
    }
  }
}

function loadTile(s: GameState, tx: number, ty: number): ColonyTile {
  const c = new PIXI.Container(); c.x = tx * TILE_SIZE; c.y = ty * TILE_SIZE; c.eventMode = 'none';
  s.worldContainer.addChild(c);
  const bg = new PIXI.Graphics(); bg.eventMode = 'none'; c.addChild(bg);
  const fg = new PIXI.Graphics(); fg.eventMode = 'none'; c.addChild(fg);
  const tile: ColonyTile = { container: c, bg, fg, flora: [], tx, ty };
  drawTileBg(tile); s.tiles.set(tileKey(tx, ty), tile); return tile;
}

function unloadTile(s: GameState, key: string): void {
  s.tiles.get(key)?.container.destroy({ children: true }); s.tiles.delete(key);
}

function syncTiles(s: GameState): void {
  const cx = s.cameraX + s.viewportW / 2, cy = s.cameraY + s.viewportH / 2;
  const { tx, ty } = worldToTile(cx, cy);
  const ck = tileKey(tx, ty);
  if (ck === s._lastCenterKey) { s.worldContainer.x = -s.cameraX; s.worldContainer.y = -s.cameraY; return; }
  s._lastCenterKey = ck;
  const hCount = Math.ceil(s.viewportW / TILE_SIZE / 2) + PRELOAD_MARGIN;
  const vCount = Math.ceil(s.viewportH / TILE_SIZE / 2) + PRELOAD_MARGIN;
  const needed = new Set<string>();
  for (let dy = -vCount; dy <= vCount; dy++) for (let dx = -hCount; dx <= hCount; dx++) needed.add(tileKey(tx + dx, ty + dy));
  for (const k of s.tiles.keys()) if (!needed.has(k)) unloadTile(s, k);
  for (const k of needed) if (!s.tiles.has(k)) { const [a, b] = k.split(',').map(Number); loadTile(s, a, b); }
  s.worldContainer.x = -s.cameraX; s.worldContainer.y = -s.cameraY;
}

function syncCoinUI(s: GameState): void {
  if (s.backend?.status !== 'connected') return;
  s.backend.send('set-title', { id: 'colony-panel', title: `\u2E19 ${s.coins}  Colony Bloom` });
}

function highlightTool(s: GameState, activeIdx: number): void {
  for (let i = 0; i < s.toolButtons.length; i++) {
    const btn = s.toolButtons[i];
    const g = btn.children[0] as PIXI.Graphics; g.clear();
    const c = i === activeIdx ? 0x4a6a8a : ([0x4a2a4a, 0x2a4a2a, 0x3a4a3a, 0x3a3a3a, 0x4a2a2a][i] ?? 0x3a3a3a);
    g.roundRect(0, 0, 170, 26, 4).fill({ color: c, alpha: 0.85 });
  }
}

function popCoin(s: GameState, wx: number, wy: number, text: string, color: number): void {
  const t = new PIXI.Text({ text, style: { fontSize: 14, fill: color, fontFamily: 'monospace', fontWeight: 'bold' } });
  t.x = wx - s.cameraX + 12; t.y = wy - s.cameraY - 8; t.alpha = 1;
  s.worldContainer.parent.addChild(t);
  const start = performance.now();
  const anim = () => { const dt = performance.now() - start; if (dt > 800) { t.destroy(); return; } t.y -= 0.4; t.alpha = 1 - dt / 800; requestAnimationFrame(anim); };
  requestAnimationFrame(anim);
}

function interactCell(s: GameState, screenX: number, screenY: number): void {
  const wx = screenX + s.cameraX, wy = screenY + s.cameraY;
  const { tx, ty } = worldToTile(wx, wy);
  const tile = s.tiles.get(tileKey(tx, ty)); if (!tile) return;
  const { cx, cy } = cellLocal(wx, wy, tx, ty);
  if (cx < 0 || cx >= CELLS_PER_TILE || cy < 0 || cy >= CELLS_PER_TILE) return;
  const ei = tile.flora.findIndex((f) => f.lx === cx && f.ly === cy);
  const ex = ei >= 0 ? tile.flora[ei] : null;

  const isErase = s.selectedTool === 'erase';

  if (ex && ex.type !== 'rock' && ex.growth >= GROWTH_TIME && !isErase) {
    s.coins += HARVEST_REWARD[ex.type] ?? 1;
    tile.flora.splice(ei, 1); drawTileFlora(tile); syncCoinUI(s);
    popCoin(s, wx, wy, `+${HARVEST_REWARD[ex.type] ?? 1}`, 0xffcc44);
    return;
  }
  if (isErase && ex) { tile.flora.splice(ei, 1); drawTileFlora(tile); return; }
  if (s.selectedTool && ex?.type === 'rock') {
    if (s.coins >= 2) { s.coins -= 2; tile.flora.splice(ei, 1); drawTileFlora(tile); syncCoinUI(s); popCoin(s, wx, wy, '-2', 0xff6644); }
    return;
  }
  if (!s.selectedTool || ex) return;
  const ft = s.selectedTool as FloraType;
  const cost = PLANT_COST[ft] ?? 1;
  if (s.coins < cost) { popCoin(s, wx, wy, 'need coin!', 0xff4444); return; }
  s.coins -= cost;
  tile.flora.push({ type: ft, ci: Math.floor(Math.random() * FLORA_COLOR_SETS[ft].length), lx: cx, ly: cy, growth: 0 });
  drawTileFlora(tile); syncCoinUI(s);
  popCoin(s, wx, wy, `-${cost}`, 0xff6644);
}

function setupTicker(s: GameState, ticker: PIXI.Ticker): () => void {
  const fn = () => {
    for (const tile of s.tiles.values()) {
      let dirty = false;
      for (const f of tile.flora) {
        if (f.type !== 'rock' && f.growth < GROWTH_TIME) { f.growth += ticker.deltaMS; if (f.growth >= GROWTH_TIME) dirty = true; }
      }
      if (dirty) drawTileFlora(tile);
    }
  };
  ticker.add(fn); return () => ticker.remove(fn);
}

export function ComponentColonyDisplay() {
  useEffect(() => {
    const W = window.innerWidth, H = window.innerHeight;

    const gs: GameState = {
      cameraX: -W / 2, cameraY: -H / 2,
      tiles: new Map(), worldContainer: new PIXI.Container(),
      viewportW: W, viewportH: H,
      selectedTool: null, coins: 10,
      tickerCleanup: null, backend: null, wm: null, wmAdapter: null,
      toolButtons: [], _lastCenterKey: '',
    };

    let dragging = false, dCX = 0, dCY = 0, dCamX = 0, dCamY = 0;

    const stop = startPixiApp((proxy) => {
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      gs.worldContainer.eventMode = 'none'; region.stage.addChild(gs.worldContainer);

      const backend = new MockBackend(); gs.backend = backend;
      const wm = new WindowManager(backend); gs.wm = wm;
      const wmAdapter = new WindowManagerAdapter(wm, region); gs.wmAdapter = wmAdapter;

      const coords = new PIXI.Text({ text: '', style: { fontSize: 11, fill: 0x8888aa, fontFamily: 'monospace' } });
      coords.x = 12; coords.y = H - 20; region.stage.addChild(coords);
      syncTiles(gs);

      backend.connect(100);

      setTimeout(() => {
        backend.send('open-window', {
          id: 'colony-panel', title: `\u2E19 ${gs.coins}  Colony Bloom`, x: 12, y: 12, width: 210, height: 280,
        });
      }, 300);

      wm.on('window-opened', ({ spec }) => {
        if (spec.id !== 'colony-panel') return;
        const content = wmAdapter.getContentStage('colony-panel');
        if (!content) return;

        const TOOLS = [
          { type: 'flower' as const, label: '\u273F  Flower', cost: '\u2E191' },
          { type: 'bush' as const, label: '\u2663  Bush', cost: '\u2E192' },
          { type: 'tree' as const, label: '\u2666  Tree', cost: '\u2E193' },
          { type: 'rock' as const, label: '\u25C8  Rock', cost: '' },
          { type: 'erase' as const, label: '\u2717  Erase', cost: '' },
        ];
        const COLORS = [0x4a2a4a, 0x2a4a2a, 0x3a4a3a, 0x3a3a3a, 0x4a2a2a];

        const help = new PIXI.Text({
          text: 'select a tool\nthen tap the world\ndrag to pan',
          style: { fontSize: 9, fill: 0x8888aa, fontFamily: 'monospace', lineHeight: 14 },
        });
        help.x = 8; help.y = 6; content.stage.addChild(help);

        for (let i = 0; i < TOOLS.length; i++) {
          const btn = new PIXI.Container();
          const bg = new PIXI.Graphics().roundRect(0, 0, 170, 26, 4).fill({ color: COLORS[i], alpha: 0.85 });
          btn.addChild(bg);
          const lb = new PIXI.Text({ text: TOOLS[i].label, style: { fontSize: 11, fill: 0xeee, fontFamily: 'monospace' } });
          lb.x = 8; lb.y = 5; btn.addChild(lb);
          if (TOOLS[i].cost) {
            const ct = new PIXI.Text({ text: TOOLS[i].cost, style: { fontSize: 9, fill: 0xffcc44, fontFamily: 'monospace' } });
            ct.x = 150; ct.y = 6; btn.addChild(ct);
          }
          btn.eventMode = 'static'; btn.cursor = 'pointer';
          btn.hitArea = new PIXI.Rectangle(0, 0, 170, 26);
          const idx = i;
          btn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            e.stopPropagation();
            gs.selectedTool = gs.selectedTool === TOOLS[idx].type as FloraType | 'erase' ? null : TOOLS[idx].type as FloraType | 'erase';
            highlightTool(gs, gs.selectedTool ? idx : -1);
          });
          btn.x = 8; btn.y = 52 + i * 30;
          content.stage.addChild(btn);
          gs.toolButtons.push(btn);
        }
      });

      gs.tickerCleanup = setupTicker(gs, region.ticker);

      region.onPress((e: SubPointerEvent) => {
        dragging = true; dCX = e.globalX; dCY = e.globalY;
        dCamX = gs.cameraX; dCamY = gs.cameraY;
      });
      region.onMove((e: SubPointerEvent) => {
        if (!dragging) return;
        gs.cameraX = dCamX - (e.globalX - dCX); gs.cameraY = dCamY - (e.globalY - dCY);
        syncTiles(gs);
      });
      region.onRelease(() => { dragging = false; });
      region.onTap((e: SubPointerEvent) => { interactCell(gs, e.x, e.y); });

      proxy.onWindowResize(() => region.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }));
    });

    return () => {
      gs.tickerCleanup?.();
      gs.wmAdapter?.destroy(); gs.wm?.destroy(); gs.backend?.destroy();
      if (gs.worldContainer) gs.worldContainer.destroy({ children: true });
      stop();
    };
  }, []);

  return <></>;
}

ComponentColonyDisplay.head = {
  title: 'Component: Colony',
  description:
    'Colony Bloom — a planting & harvesting mini-game with adapter-driven control window. Select tools in the window, tap the world to plant/harvest.',
};
