// Example: Life map / terrain generation visualization
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas, type SubPointerEvent } from '@framework';
import { makeButton, makeStepper, type Stepper } from '@components';

type Grid = Uint8Array;

const CONTROL_H = 100;
const DEFAULT_WORLD_ROWS = 150;
const DEFAULT_WORLD_COLS = 200;
const MIN_WORLD_ROWS = 50;
const MAX_WORLD_ROWS = 300;
const MIN_WORLD_COLS = 50;
const MAX_WORLD_COLS = 400;
const DEFAULT_CELL_SIZE = 8;
const MIN_CELL_SIZE = 4;
const MAX_CELL_SIZE = 20;
const DEFAULT_FPS = 10;
const MIN_FPS = 1;
const MAX_FPS = 30;
const DEFAULT_DENSITY = 0.12;

const CELL_COLOR = 0x88aaff;
const DEAD_BG_COLOR = 0x0a0a14;
const GRID_LINE_COLOR = 0x1a1a2e;
const BTN_BG = 0x1a1a2e;
const BTN_PLAY_BG = 0x2a4a2e;
const BTN_STEP_BG = 0x2a3a4a;
const BTN_CLEAR_BG = 0x4a3a2e;
const BTN_RANDOM_BG = 0x3a4a6a;
const BTN_RESET_BG = 0x6a3a3a;
const BTN_CENTER_BG = 0x4a5a6a;

function idx(r: number, c: number, cols: number): number {
  return r * cols + c;
}

function newGrid(rows: number, cols: number, mode: 'empty' | 'random', density = DEFAULT_DENSITY): Grid {
  const g = new Uint8Array(rows * cols);
  if (mode === 'random') {
    for (let i = 0; i < g.length; i++) g[i] = Math.random() < density ? 1 : 0;
  }
  return g;
}

function stepGridToroidal(grid: Grid, rows: number, cols: number): Grid {
  const next = new Uint8Array(grid.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + rows) % rows;
          const nc = (c + dc + cols) % cols;
          if (grid[idx(nr, nc, cols)]) n++;
        }
      }
      const i = idx(r, c, cols);
      next[i] = grid[i] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
    }
  }
  return next;
}

function countLive(grid: Grid): number {
  let n = 0;
  for (let i = 0; i < grid.length; i++) n += grid[i];
  return n;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

interface TileRefs {
  container: PIXI.Container;
  bg: PIXI.Graphics;
  cells: PIXI.Graphics;
  gridLines: PIXI.Graphics;
}

interface LifeMapRefs {
  W: number;
  H: number;
  viewportW: number;
  viewportH: number;
  worldRows: number;
  worldCols: number;
  worldW: number;
  worldH: number;
  cellSize: number;
  grid: Grid;
  generation: number;
  playing: boolean;
  speed: number;
  lastStepTime: number;
  worldX: number;
  worldY: number;
  controlRegion: SubCanvas | null;
  viewportRegion: SubCanvas | null;
  worldContainer: PIXI.Container | null;
  tiles: TileRefs[];
  tileCols: number;
  tileRows: number;
  genText: PIXI.Text | null;
  popText: PIXI.Text | null;
  coordsText: PIXI.Text | null;
  playPauseText: PIXI.Text | null;
  ticker: PIXI.Ticker | null;
  tickFn: (() => void) | null;
  steppers: {
    speed: Stepper | null;
    zoom: Stepper | null;
    rows: Stepper | null;
    cols: Stepper | null;
  };
  viewportCleanups: (() => void)[];
  setRows: (n: number) => void;
  setCols: (n: number) => void;
  setCellSize: (n: number) => void;
  setSpeed: (n: number) => void;
}

let state: LifeMapRefs | null = null;

function centerOfView(refs: LifeMapRefs): { c: number; r: number } {
  const cRaw = Math.floor((-refs.worldX + refs.viewportW / 2) / refs.cellSize);
  const rRaw = Math.floor((-refs.worldY + refs.viewportH / 2) / refs.cellSize);
  return { c: mod(cRaw, refs.worldCols), r: mod(rRaw, refs.worldRows) };
}

function tileBase(refs: LifeMapRefs): { cdx: number; cdy: number } {
  return {
    cdx: Math.floor(-refs.worldX / refs.worldW),
    cdy: Math.floor(-refs.worldY / refs.worldH),
  };
}

function updateTilePositions(refs: LifeMapRefs): void {
  const { cdx, cdy } = tileBase(refs);
  for (let i = 0; i < refs.tiles.length; i++) {
    const tileCx = i % refs.tileCols;
    const tileCy = Math.floor(i / refs.tileCols);
    const tile = refs.tiles[i];
    if (!tile) continue;
    tile.container.x = (cdx + tileCx) * refs.worldW;
    tile.container.y = (cdy + tileCy) * refs.worldH;
  }
}

function drawBg(refs: LifeMapRefs): void {
  for (const tile of refs.tiles) {
    tile.bg.clear().rect(0, 0, refs.worldW, refs.worldH).fill({ color: DEAD_BG_COLOR });
  }
}

function drawGridLines(refs: LifeMapRefs): void {
  for (const tile of refs.tiles) {
    tile.gridLines.clear();
  }
  if (refs.cellSize < 6) return;
  const cs = refs.cellSize;
  for (const tile of refs.tiles) {
    tile.gridLines.stroke({ width: 0.5, color: GRID_LINE_COLOR, alpha: 0.5 });
    for (let r = 0; r <= refs.worldRows; r++) {
      tile.gridLines.moveTo(0, r * cs);
      tile.gridLines.lineTo(refs.worldW, r * cs);
    }
    for (let c = 0; c <= refs.worldCols; c++) {
      tile.gridLines.moveTo(c * cs, 0);
      tile.gridLines.lineTo(c * cs, refs.worldH);
    }
  }
}

function drawCells(refs: LifeMapRefs): void {
  const cs = refs.cellSize;
  for (const tile of refs.tiles) {
    tile.cells.clear();
    for (let r = 0; r < refs.worldRows; r++) {
      for (let c = 0; c < refs.worldCols; c++) {
        if (refs.grid[idx(r, c, refs.worldCols)]) {
          tile.cells.rect(c * cs, r * cs, cs, cs);
        }
      }
    }
    tile.cells.fill({ color: CELL_COLOR });
  }
}

function setWorldPos(refs: LifeMapRefs, x: number, y: number): void {
  const cdxOld = Math.floor(-refs.worldX / refs.worldW);
  const cdyOld = Math.floor(-refs.worldY / refs.worldH);
  refs.worldX = x;
  refs.worldY = y;
  if (refs.worldContainer) {
    refs.worldContainer.x = x;
    refs.worldContainer.y = y;
  }
  const cdxNew = Math.floor(-x / refs.worldW);
  const cdyNew = Math.floor(-y / refs.worldH);
  if (cdxNew !== cdxOld || cdyNew !== cdyOld) {
    updateTilePositions(refs);
  }
  updateCoords(refs);
}

function toggleCellAt(refs: LifeMapRefs, regionX: number, regionY: number): void {
  const cRaw = Math.floor((regionX - refs.worldX) / refs.cellSize);
  const rRaw = Math.floor((regionY - refs.worldY) / refs.cellSize);
  const c = mod(cRaw, refs.worldCols);
  const r = mod(rRaw, refs.worldRows);
  const i = idx(r, c, refs.worldCols);
  refs.grid[i] = refs.grid[i] ? 0 : 1;
}

function updateStats(refs: LifeMapRefs): void {
  if (refs.genText) refs.genText.text = `Gen: ${refs.generation}`;
  if (refs.popText) refs.popText.text = `Pop: ${countLive(refs.grid)}`;
}

function updateCoords(refs: LifeMapRefs): void {
  if (!refs.coordsText) return;
  const center = centerOfView(refs);
  refs.coordsText.text = `view: ${center.c},${center.r}  \u00B7  world: ${refs.worldCols}\u00D7${refs.worldRows}  \u00B7  wrap: ON`;
}

function updatePlayPauseLabel(refs: LifeMapRefs): void {
  if (refs.playPauseText) refs.playPauseText.text = refs.playing ? '\u23F8  Pause' : '\u25B6  Play';
}

function doStep(refs: LifeMapRefs): void {
  refs.grid = stepGridToroidal(refs.grid, refs.worldRows, refs.worldCols);
  refs.generation++;
  drawCells(refs);
  updateStats(refs);
}

function doClear(refs: LifeMapRefs): void {
  refs.grid = newGrid(refs.worldRows, refs.worldCols, 'empty');
  refs.generation = 0;
  drawCells(refs);
  updateStats(refs);
}

function doRandom(refs: LifeMapRefs): void {
  refs.grid = newGrid(refs.worldRows, refs.worldCols, 'random');
  refs.generation = 0;
  drawCells(refs);
  updateStats(refs);
}

function doPlayPause(refs: LifeMapRefs): void {
  refs.playing = !refs.playing;
  if (refs.playing) refs.lastStepTime = performance.now();
  updatePlayPauseLabel(refs);
}

function doReset(refs: LifeMapRefs): void {
  refs.grid = newGrid(refs.worldRows, refs.worldCols, 'empty');
  refs.generation = 0;
  refs.playing = false;
  drawCells(refs);
  updateStats(refs);
  updatePlayPauseLabel(refs);
}

function doRecenter(refs: LifeMapRefs): void {
  setWorldPos(refs, 0, 0);
}

function unregisterTicker(refs: LifeMapRefs): void {
  if (refs.ticker && refs.tickFn) {
    refs.ticker.remove(refs.tickFn);
    refs.tickFn = null;
  }
}

function buildControlPanel(refs: LifeMapRefs): void {
  const region = refs.controlRegion;
  if (!region) return;
  const W = refs.W;

  const title = new PIXI.Text({
    text: "Life Map \u00B7 toroidal wrap",
    style: { fontSize: 18, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  title.x = 16;
  title.y = 8;
  region.stage.addChild(title);

  refs.genText = new PIXI.Text({
    text: 'Gen: 0',
    style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  refs.genText.x = 16;
  refs.genText.y = 38;
  region.stage.addChild(refs.genText);

  refs.popText = new PIXI.Text({
    text: 'Pop: 0',
    style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  refs.popText.x = 90;
  refs.popText.y = 38;
  region.stage.addChild(refs.popText);

  refs.coordsText = new PIXI.Text({
    text: '',
    style: { fontSize: 11, fill: 0x8888aa, fontFamily: 'monospace' },
  });
  refs.coordsText.anchor.set(1, 0);
  refs.coordsText.x = W - 16;
  refs.coordsText.y = 10;
  region.stage.addChild(refs.coordsText);

  const playPauseBtn = makeButton('\u25B6  Play', 80, 30, () => doPlayPause(refs), BTN_PLAY_BG);
  refs.playPauseText = (playPauseBtn.children[1] as PIXI.Text);
  playPauseBtn.x = 16;
  playPauseBtn.y = 60;
  region.stage.addChild(playPauseBtn);

  const stepBtn = makeButton('Step', 70, 30, () => {
    if (!refs.playing) doStep(refs);
  }, BTN_STEP_BG);
  stepBtn.x = 104;
  stepBtn.y = 60;
  region.stage.addChild(stepBtn);

  const clearBtn = makeButton('Clear', 70, 30, () => doClear(refs), BTN_CLEAR_BG);
  clearBtn.x = 182;
  clearBtn.y = 60;
  region.stage.addChild(clearBtn);

  const randomBtn = makeButton('\u2682  Random', 90, 30, () => doRandom(refs), BTN_RANDOM_BG);
  randomBtn.x = 260;
  randomBtn.y = 60;
  region.stage.addChild(randomBtn);

  const speedStepper = makeStepper({ label: 'Speed', getValue: () => state!.speed, onChange: refs.setSpeed, min: MIN_FPS, max: MAX_FPS });
  speedStepper.container.x = 360;
  speedStepper.container.y = 46;
  region.stage.addChild(speedStepper.container);
  refs.steppers.speed = speedStepper;

  const cellSizeStepper = makeStepper({ label: 'Zoom', getValue: () => state!.cellSize, onChange: refs.setCellSize, min: MIN_CELL_SIZE, max: MAX_CELL_SIZE });
  cellSizeStepper.container.x = 360 + speedStepper.width + 12;
  cellSizeStepper.container.y = 46;
  region.stage.addChild(cellSizeStepper.container);
  refs.steppers.zoom = cellSizeStepper;

  const rowsStepper = makeStepper({ label: 'Rows', getValue: () => state!.worldRows, onChange: refs.setRows, min: MIN_WORLD_ROWS, max: MAX_WORLD_ROWS });
  rowsStepper.container.x = 360 + speedStepper.width + 12 + cellSizeStepper.width + 12;
  rowsStepper.container.y = 46;
  region.stage.addChild(rowsStepper.container);
  refs.steppers.rows = rowsStepper;

  const colsStepper = makeStepper({ label: 'Cols', getValue: () => state!.worldCols, onChange: refs.setCols, min: MIN_WORLD_COLS, max: MAX_WORLD_COLS });
  colsStepper.container.x = rowsStepper.container.x + rowsStepper.width + 12;
  colsStepper.container.y = 46;
  region.stage.addChild(colsStepper.container);
  refs.steppers.cols = colsStepper;

  const centerBtn = makeButton('Center', 80, 30, () => doRecenter(refs), BTN_CENTER_BG);
  centerBtn.x = W - 184;
  centerBtn.y = 60;
  region.stage.addChild(centerBtn);

  const resetBtn = makeButton('Reset', 80, 30, () => doReset(refs), BTN_RESET_BG);
  resetBtn.x = W - 96;
  resetBtn.y = 60;
  region.stage.addChild(resetBtn);
}

function buildViewport(refs: LifeMapRefs): void {
  const region = refs.viewportRegion;
  if (!region) return;

  const mask = new PIXI.Graphics().rect(0, 0, refs.viewportW, refs.viewportH).fill({ color: 0xffffff });
  region.stage.addChild(mask);
  region.stage.mask = mask;

  const worldContainer = new PIXI.Container();
  worldContainer.eventMode = 'none';
  worldContainer.x = refs.worldX;
  worldContainer.y = refs.worldY;
  region.stage.addChild(worldContainer);
  refs.worldContainer = worldContainer;

  rebuildTileGrid(refs);

  let dragStartClientX = 0;
  let dragStartClientY = 0;
  let dragStartWorldX = 0;
  let dragStartWorldY = 0;
  let dragging = false;

  const onPress = (e: SubPointerEvent) => {
    dragging = true;
    dragStartClientX = e.globalX;
    dragStartClientY = e.globalY;
    dragStartWorldX = refs.worldX;
    dragStartWorldY = refs.worldY;
  };

  const onMove = (e: SubPointerEvent) => {
    if (!dragging) return;
    const dx = e.globalX - dragStartClientX;
    const dy = e.globalY - dragStartClientY;
    setWorldPos(refs, dragStartWorldX + dx, dragStartWorldY + dy);
  };

  const onRelease = () => {
    dragging = false;
  };

  const onTap = (e: SubPointerEvent) => {
    toggleCellAt(refs, e.x, e.y);
    drawCells(refs);
    updateStats(refs);
  };

  region.onPress(onPress);
  region.onMove(onMove);
  region.onRelease(onRelease);
  region.onTap(onTap);

  refs.viewportCleanups.push(
    () => region.offPointer('pointerdown', onPress),
    () => region.offPointer('pointermove', onMove),
    () => region.offPointer('pointerup', onRelease),
    () => region.offPointer('tap', onTap),
  );
}

function registerTicker(refs: LifeMapRefs): void {
  if (!refs.viewportRegion) return;
  refs.ticker = refs.viewportRegion.ticker;
  refs.tickFn = () => {
    if (!refs.playing) return;
    const now = performance.now();
    const interval = 1000 / refs.speed;
    if (now - refs.lastStepTime >= interval) {
      doStep(refs);
      refs.lastStepTime = now;
    }
  };
  refs.ticker.add(refs.tickFn);
}

function setRows(n: number): void {
  if (!state) return;
  if (n < MIN_WORLD_ROWS || n > MAX_WORLD_ROWS) return;
  if (state.worldRows === n) return;
  state.worldRows = n;
  state.worldH = n * state.cellSize;
  state.grid = newGrid(n, state.worldCols, 'empty');
  state.generation = 0;
  state.playing = false;
  state.lastStepTime = 0;
  setWorldPos(state, 0, 0);
  rebuildTileGrid(state);
  updateStats(state);
  updatePlayPauseLabel(state);
  state.steppers.rows?.refresh();
}

function setCols(n: number): void {
  if (!state) return;
  if (n < MIN_WORLD_COLS || n > MAX_WORLD_COLS) return;
  if (state.worldCols === n) return;
  state.worldCols = n;
  state.worldW = n * state.cellSize;
  state.grid = newGrid(state.worldRows, n, 'empty');
  state.generation = 0;
  state.playing = false;
  state.lastStepTime = 0;
  setWorldPos(state, 0, 0);
  rebuildTileGrid(state);
  updateStats(state);
  updatePlayPauseLabel(state);
  state.steppers.cols?.refresh();
}

function rebuildTileGrid(refs: LifeMapRefs): void {
  for (const tile of refs.tiles) tile.container.destroy({ children: true });
  refs.tiles = [];
  refs.tileCols = Math.ceil(refs.viewportW / refs.worldW) + 1;
  refs.tileRows = Math.ceil(refs.viewportH / refs.worldH) + 1;
  const wc = refs.worldContainer;
  if (!wc) return;
  for (let i = 0; i < refs.tileCols * refs.tileRows; i++) {
    const tileContainer = new PIXI.Container();
    tileContainer.eventMode = 'none';
    wc.addChild(tileContainer);
    const bg = new PIXI.Graphics();
    bg.eventMode = 'none';
    tileContainer.addChild(bg);
    const cells = new PIXI.Graphics();
    cells.eventMode = 'none';
    tileContainer.addChild(cells);
    const gridLines = new PIXI.Graphics();
    gridLines.eventMode = 'none';
    tileContainer.addChild(gridLines);
    refs.tiles.push({ container: tileContainer, bg, cells, gridLines });
  }
  updateTilePositions(refs);
  drawBg(refs);
  drawGridLines(refs);
  drawCells(refs);
}

function setCellSize(n: number): void {
  if (!state) return;
  if (n < MIN_CELL_SIZE || n > MAX_CELL_SIZE) return;
  if (state.cellSize === n) return;
  state.cellSize = n;
  state.worldW = state.worldCols * n;
  state.worldH = state.worldRows * n;
  setWorldPos(state, 0, 0);
  rebuildTileGrid(state);
  state.steppers.zoom?.refresh();
}

function setSpeed(n: number): void {
  if (!state) return;
  if (n < MIN_FPS || n > MAX_FPS) return;
  if (state.speed === n) return;
  state.speed = n;
  state.lastStepTime = performance.now();
  state.steppers.speed?.refresh();
}

function clearRegion(stage: PIXI.Container): void {
  while (stage.children.length > 0) {
    const child = stage.children[0];
    stage.removeChild(child);
    child.destroy({ children: true });
  }
}

function rebuild(refs: LifeMapRefs): void {
  if (refs.controlRegion) clearRegion(refs.controlRegion.stage);
  if (refs.viewportRegion) {
    clearRegion(refs.viewportRegion.stage);
    refs.viewportRegion.stage.mask = null;
  }
  for (const fn of refs.viewportCleanups) fn();
  refs.viewportCleanups = [];
  refs.worldContainer = null;
  refs.tiles = [];
  refs.tileCols = 0;
  refs.tileRows = 0;
  refs.genText = null;
  refs.popText = null;
  refs.coordsText = null;
  refs.playPauseText = null;
  refs.steppers = { speed: null, zoom: null, rows: null, cols: null };
  unregisterTicker(refs);
  buildControlPanel(refs);
  buildViewport(refs);
  registerTicker(refs);
  updateStats(refs);
  updatePlayPauseLabel(refs);
  updateCoords(refs);
}

export function ComponentLifeMapDisplay() {
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const viewportH = H - CONTROL_H;
    const cs = DEFAULT_CELL_SIZE;

    state = {
      W,
      H,
      viewportW: W,
      viewportH,
      worldRows: DEFAULT_WORLD_ROWS,
      worldCols: DEFAULT_WORLD_COLS,
      worldW: DEFAULT_WORLD_COLS * cs,
      worldH: DEFAULT_WORLD_ROWS * cs,
      cellSize: cs,
      grid: newGrid(DEFAULT_WORLD_ROWS, DEFAULT_WORLD_COLS, 'random'),
      generation: 0,
      playing: false,
      speed: DEFAULT_FPS,
      lastStepTime: 0,
      worldX: 0,
      worldY: 0,
      controlRegion: null,
      viewportRegion: null,
      worldContainer: null,
      tiles: [],
      tileCols: 0,
      tileRows: 0,
      genText: null,
      popText: null,
      coordsText: null,
      playPauseText: null,
      ticker: null,
      tickFn: null,
      steppers: { speed: null, zoom: null, rows: null, cols: null },
      viewportCleanups: [],
      setRows,
      setCols,
      setCellSize,
      setSpeed,
    };

    const destroyApp = startPixiApp((proxy) => {
      if (!state) return;
      state.controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      state.viewportRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: viewportH });
      rebuild(state);
    });

    return () => {
      if (state) {
        unregisterTicker(state);
        if (state.viewportRegion) {
          state.viewportRegion.stage.mask = null;
        }
      }
      destroyApp();
      state = null;
    };
  }, []);

  return <></>;
}

ComponentLifeMapDisplay.head = {
  title: 'Component: Life Map',
  description:
    "Conway's Game of Life on a large toroidal world with Google-Maps-style mouse-drag panning. Click cells to toggle, drag to pan around the world. Always wrapped (toroidal grid + visual tiling via 4 dynamic tiles), viewport drag is unbounded — pan as far as you want and the world tiles seamlessly.",
};
