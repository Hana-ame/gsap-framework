import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import type { SubCanvas, SubPointerEvent } from '../../framework/SubCanvas';

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
const DRAG_THRESHOLD = 4;

const CELL_COLOR = 0x88aaff;
const DEAD_BG_COLOR = 0x0a0a14;
const GRID_LINE_COLOR = 0x1a1a2e;
const BTN_BG = 0x1a1a2e;
const BTN_PLAY_BG = 0x2a4a2e;
const BTN_STEP_BG = 0x2a3a4a;
const BTN_CLEAR_BG = 0x4a3a2e;
const BTN_RANDOM_BG = 0x3a4a6a;
const BTN_RESET_BG = 0x6a3a3a;

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

function makeButton(
  label: string,
  w: number,
  h: number,
  onClick: () => void,
  bg: number = BTN_BG,
): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  t.anchor.set(0.5);
  t.x = w / 2;
  t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function makeStepper(
  label: string,
  value: number,
  onChange: (v: number) => void,
  min: number,
  max: number,
): PIXI.Container {
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: { fontSize: 11, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  lbl.x = 0;
  lbl.y = 2;
  wrap.addChild(lbl);

  const btnW = 22;
  const btnH = 22;
  const valW = 36;
  const rowY = 20;

  const minus = makeButton('-', btnW, btnH, () => {
    if (value > min) onChange(value - 1);
  });
  minus.x = lbl.width + 6;
  minus.y = rowY;
  wrap.addChild(minus);

  const valText = new PIXI.Text({
    text: String(value),
    style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  valText.anchor.set(0.5, 0);
  valText.x = lbl.width + 6 + btnW + valW / 2;
  valText.y = rowY + 3;
  wrap.addChild(valText);

  const plus = makeButton('+', btnW, btnH, () => {
    if (value < max) onChange(value + 1);
  });
  plus.x = lbl.width + 6 + btnW + valW;
  plus.y = rowY;
  wrap.addChild(plus);

  wrap.width = lbl.width + 6 + btnW + valW + btnW;
  wrap.height = 48;
  return wrap;
}

interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface LifeMapRefs {
  W: number;
  H: number;
  viewportW: number;
  viewportH: number;
  worldRows: number;
  worldCols: number;
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
  worldBg: PIXI.Graphics | null;
  cellsGraphics: PIXI.Graphics | null;
  gridLineGraphics: PIXI.Graphics | null;
  genText: PIXI.Text | null;
  popText: PIXI.Text | null;
  coordsText: PIXI.Text | null;
  playPauseText: PIXI.Text | null;
  ticker: PIXI.Ticker | null;
  tickFn: (() => void) | null;
  pointerCleanups: Array<() => void>;
  drag: {
    active: boolean;
    startClientX: number;
    startClientY: number;
    startWorldX: number;
    startWorldY: number;
    moved: boolean;
  } | null;
  setRows: (n: number) => void;
  setCols: (n: number) => void;
  setCellSize: (n: number) => void;
  setSpeed: (n: number) => void;
}

let state: LifeMapRefs | null = null;

function clampPan(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

function getBounds(refs: LifeMapRefs): WorldBounds {
  const worldW = refs.worldCols * refs.cellSize;
  const worldH = refs.worldRows * refs.cellSize;
  let minX: number;
  let maxX: number;
  if (worldW <= refs.viewportW) {
    const c = Math.floor((refs.viewportW - worldW) / 2);
    minX = c;
    maxX = c;
  } else {
    minX = -(worldW - refs.viewportW);
    maxX = 0;
  }
  let minY: number;
  let maxY: number;
  if (worldH <= refs.viewportH) {
    const c = Math.floor((refs.viewportH - worldH) / 2);
    minY = c;
    maxY = c;
  } else {
    minY = -(worldH - refs.viewportH);
    maxY = 0;
  }
  return { minX, maxX, minY, maxY };
}

function initialWorldPos(refs: LifeMapRefs): { x: number; y: number } {
  const b = getBounds(refs);
  return { x: b.minX, y: b.minY };
}

function drawBg(refs: LifeMapRefs): void {
  if (!refs.worldBg) return;
  refs.worldBg.clear();
  const worldW = refs.worldCols * refs.cellSize;
  const worldH = refs.worldRows * refs.cellSize;
  refs.worldBg.rect(0, 0, worldW, worldH).fill({ color: DEAD_BG_COLOR });
}

function drawGridLines(refs: LifeMapRefs): void {
  if (!refs.gridLineGraphics) return;
  refs.gridLineGraphics.clear();
  if (refs.cellSize < 6) return;
  refs.gridLineGraphics.stroke({ width: 0.5, color: GRID_LINE_COLOR, alpha: 0.5 });
  for (let r = 0; r <= refs.worldRows; r++) {
    refs.gridLineGraphics.moveTo(0, r * refs.cellSize);
    refs.gridLineGraphics.lineTo(refs.worldCols * refs.cellSize, r * refs.cellSize);
  }
  for (let c = 0; c <= refs.worldCols; c++) {
    refs.gridLineGraphics.moveTo(c * refs.cellSize, 0);
    refs.gridLineGraphics.lineTo(c * refs.cellSize, refs.worldRows * refs.cellSize);
  }
}

function drawCells(refs: LifeMapRefs): void {
  if (!refs.cellsGraphics) return;
  refs.cellsGraphics.clear();
  const cs = refs.cellSize;
  const b = getBounds(refs);
  const leftPx = -b.minX;
  const topPx = -b.minY;
  const rightPx = leftPx + refs.viewportW;
  const bottomPx = topPx + refs.viewportH;
  const firstCol = Math.max(0, Math.floor(leftPx / cs) - 1);
  const lastCol = Math.min(refs.worldCols, Math.ceil(rightPx / cs) + 1);
  const firstRow = Math.max(0, Math.floor(topPx / cs) - 1);
  const lastRow = Math.min(refs.worldRows, Math.ceil(bottomPx / cs) + 1);
  for (let r = firstRow; r < lastRow; r++) {
    for (let c = firstCol; c < lastCol; c++) {
      if (refs.grid[idx(r, c, refs.worldCols)]) {
        refs.cellsGraphics.rect(c * cs, r * cs, cs, cs);
      }
    }
  }
  refs.cellsGraphics.fill({ color: CELL_COLOR });
}

function applyPan(refs: LifeMapRefs, dx: number, dy: number): void {
  const b = getBounds(refs);
  refs.worldX = clampPan(refs.drag!.startWorldX + dx, b.minX, b.maxX);
  refs.worldY = clampPan(refs.drag!.startWorldY + dy, b.minY, b.maxY);
  if (refs.worldContainer) {
    refs.worldContainer.x = refs.worldX;
    refs.worldContainer.y = refs.worldY;
  }
}

function toggleCellAt(refs: LifeMapRefs, regionX: number, regionY: number): void {
  if (!refs.worldContainer) return;
  const worldLocalX = regionX - refs.worldX;
  const worldLocalY = regionY - refs.worldY;
  if (worldLocalX < 0 || worldLocalY < 0) return;
  if (worldLocalX >= refs.worldCols * refs.cellSize || worldLocalY >= refs.worldRows * refs.cellSize) return;
  const c = Math.floor(worldLocalX / refs.cellSize);
  const r = Math.floor(worldLocalY / refs.cellSize);
  if (r < 0 || r >= refs.worldRows || c < 0 || c >= refs.worldCols) return;
  const i = idx(r, c, refs.worldCols);
  refs.grid[i] = refs.grid[i] ? 0 : 1;
}

function updateStats(refs: LifeMapRefs): void {
  if (refs.genText) refs.genText.text = `Gen: ${refs.generation}`;
  if (refs.popText) refs.popText.text = `Pop: ${countLive(refs.grid)}`;
}

function updateCoords(refs: LifeMapRefs): void {
  if (!refs.coordsText) return;
  const cx = Math.floor((-refs.worldX + refs.viewportW / 2) / refs.cellSize);
  const cy = Math.floor((-refs.worldY + refs.viewportH / 2) / refs.cellSize);
  refs.coordsText.text = `view: ${cx},${cy}  \u00B7  world: ${refs.worldCols}\u00D7${refs.worldRows}  \u00B7  cell: ${refs.cellSize}px`;
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
  const { worldRows, worldCols, cellSize, speed } = refs;

  const title = new PIXI.Text({
    text: "Life Map \u00B7 toroidal world",
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

  const playPauseBtn = new PIXI.Container();
  const ppBg = new PIXI.Graphics().roundRect(0, 0, 80, 30, 6).fill({ color: BTN_PLAY_BG, alpha: 0.92 });
  ppBg.stroke({ width: 1.5, color: 0x446 });
  playPauseBtn.addChild(ppBg);
  refs.playPauseText = new PIXI.Text({
    text: '\u25B6  Play',
    style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  refs.playPauseText.anchor.set(0.5);
  refs.playPauseText.x = 40;
  refs.playPauseText.y = 15;
  playPauseBtn.addChild(refs.playPauseText);
  playPauseBtn.eventMode = 'static';
  playPauseBtn.cursor = 'pointer';
  playPauseBtn.hitArea = new PIXI.Rectangle(0, 0, 80, 30);
  playPauseBtn.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    doPlayPause(refs);
  });
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

  const speedStepper = makeStepper('Speed', speed, refs.setSpeed, MIN_FPS, MAX_FPS);
  speedStepper.x = 360;
  speedStepper.y = 46;
  region.stage.addChild(speedStepper);

  const cellSizeStepper = makeStepper('Zoom', cellSize, refs.setCellSize, MIN_CELL_SIZE, MAX_CELL_SIZE);
  cellSizeStepper.x = 360 + speedStepper.width + 12;
  cellSizeStepper.y = 46;
  region.stage.addChild(cellSizeStepper);

  const rowsStepper = makeStepper('Rows', worldRows, refs.setRows, MIN_WORLD_ROWS, MAX_WORLD_ROWS);
  rowsStepper.x = 360 + speedStepper.width + 12 + cellSizeStepper.width + 12;
  rowsStepper.y = 46;
  region.stage.addChild(rowsStepper);

  const colsStepper = makeStepper('Cols', worldCols, refs.setCols, MIN_WORLD_COLS, MAX_WORLD_COLS);
  colsStepper.x = rowsStepper.x + rowsStepper.width + 12;
  colsStepper.y = 46;
  region.stage.addChild(colsStepper);

  const resetBtn = makeButton('Reset', 80, 30, () => doReset(refs), BTN_RESET_BG);
  resetBtn.x = W - 96;
  resetBtn.y = 60;
  region.stage.addChild(resetBtn);
}

function buildViewport(refs: LifeMapRefs): void {
  const region = refs.viewportRegion;
  if (!region) return;

  const worldContainer = new PIXI.Container();
  worldContainer.eventMode = 'none';
  worldContainer.x = refs.worldX;
  worldContainer.y = refs.worldY;
  region.stage.addChild(worldContainer);
  refs.worldContainer = worldContainer;

  refs.worldBg = new PIXI.Graphics();
  refs.worldBg.eventMode = 'none';
  worldContainer.addChild(refs.worldBg);
  drawBg(refs);

  refs.gridLineGraphics = new PIXI.Graphics();
  refs.gridLineGraphics.eventMode = 'none';
  worldContainer.addChild(refs.gridLineGraphics);
  drawGridLines(refs);

  refs.cellsGraphics = new PIXI.Graphics();
  refs.cellsGraphics.eventMode = 'none';
  worldContainer.addChild(refs.cellsGraphics);
  drawCells(refs);

  setupDrag(refs);
}

function setupDrag(refs: LifeMapRefs): void {
  const region = refs.viewportRegion;
  if (!region) return;

  const onPress = (e: SubPointerEvent) => {
    const startX = e.originalEvent.clientX;
    const startY = e.originalEvent.clientY;
    refs.drag = {
      active: true,
      startClientX: startX,
      startClientY: startY,
      startWorldX: refs.worldX,
      startWorldY: refs.worldY,
      moved: false,
    };

    const onMove = (ev: PointerEvent) => {
      if (!refs.drag || !refs.drag.active) return;
      const dx = ev.clientX - refs.drag.startClientX;
      const dy = ev.clientY - refs.drag.startClientY;
      if (!refs.drag.moved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      refs.drag.moved = true;
      applyPan(refs, dx, dy);
      drawCells(refs);
      updateCoords(refs);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (refs.drag && !refs.drag.moved) {
        toggleCellAt(refs, e.x, e.y);
        drawCells(refs);
        updateStats(refs);
      }
      refs.drag = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  region.onPress(onPress);
  refs.pointerCleanups.push(() => region.offPointer('pointerdown', onPress));
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
  state.grid = newGrid(n, state.worldCols, 'empty');
  state.generation = 0;
  state.playing = false;
  state.lastStepTime = 0;
  const init = initialWorldPos(state);
  state.worldX = init.x;
  state.worldY = init.y;
  rebuild(state);
}

function setCols(n: number): void {
  if (!state) return;
  if (n < MIN_WORLD_COLS || n > MAX_WORLD_COLS) return;
  if (state.worldCols === n) return;
  state.worldCols = n;
  state.grid = newGrid(state.worldRows, n, 'empty');
  state.generation = 0;
  state.playing = false;
  state.lastStepTime = 0;
  const init = initialWorldPos(state);
  state.worldX = init.x;
  state.worldY = init.y;
  rebuild(state);
}

function setCellSize(n: number): void {
  if (!state) return;
  if (n < MIN_CELL_SIZE || n > MAX_CELL_SIZE) return;
  if (state.cellSize === n) return;
  state.cellSize = n;
  const init = initialWorldPos(state);
  state.worldX = init.x;
  state.worldY = init.y;
  rebuild(state);
}

function setSpeed(n: number): void {
  if (!state) return;
  if (n < MIN_FPS || n > MAX_FPS) return;
  state.speed = n;
}

function clearRegion(stage: PIXI.Container): void {
  while (stage.children.length > 0) {
    const child = stage.children[0];
    stage.removeChild(child);
    child.destroy({ children: true });
  }
}

function rebuild(refs: LifeMapRefs): void {
  refs.pointerCleanups.forEach((fn) => fn());
  refs.pointerCleanups = [];
  if (refs.controlRegion) clearRegion(refs.controlRegion.stage);
  if (refs.viewportRegion) clearRegion(refs.viewportRegion.stage);
  refs.worldContainer = null;
  refs.worldBg = null;
  refs.cellsGraphics = null;
  refs.gridLineGraphics = null;
  refs.genText = null;
  refs.popText = null;
  refs.coordsText = null;
  refs.playPauseText = null;
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

    state = {
      W,
      H,
      viewportW: W,
      viewportH,
      worldRows: DEFAULT_WORLD_ROWS,
      worldCols: DEFAULT_WORLD_COLS,
      cellSize: DEFAULT_CELL_SIZE,
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
      worldBg: null,
      cellsGraphics: null,
      gridLineGraphics: null,
      genText: null,
      popText: null,
      coordsText: null,
      playPauseText: null,
      ticker: null,
      tickFn: null,
      pointerCleanups: [],
      drag: null,
      setRows,
      setCols,
      setCellSize,
      setSpeed,
    };

    const init = initialWorldPos(state);
    state.worldX = init.x;
    state.worldY = init.y;

    const destroyApp = startPixiApp((proxy) => {
      if (!state) return;
      state.controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      state.viewportRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: viewportH });
      rebuild(state);
    });

    return () => {
      if (state) {
        unregisterTicker(state);
        state.pointerCleanups.forEach((fn) => fn());
        state.pointerCleanups = [];
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
    "Conway's Game of Life on a large toroidal world with Google-Maps-style mouse-drag panning. Click cells to toggle, drag to pan around the world. Always wrapped (toroidal grid), viewport drag is clamped but you can always pan back.",
};
