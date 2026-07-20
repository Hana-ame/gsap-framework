// Example: Conway's Game of Life simulation on SubCanvas
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas } from '@framework';
import { makeInfoPanel } from '@components';

type Grid = Uint8Array;

const MIN_DIM = 10;
const MAX_DIM = 120;
const DEFAULT_ROWS = 40;
const DEFAULT_COLS = 60;
const DEFAULT_FPS = 10;
const MIN_FPS = 1;
const MAX_FPS = 30;
const DEFAULT_DENSITY = 0.28;
const CONTROL_H = 100;
const CELL_COLOR = 0x88aaff;
const GRID_LINE_COLOR = 0x1a1a2e;
const DEAD_BG_COLOR = 0x0a0a14;
const BTN_BG = 0x1a1a2e;
const BTN_PLAY_BG = 0x2a4a2e;
const BTN_STEP_BG = 0x2a3a4a;
const BTN_CLEAR_BG = 0x4a3a2e;
const BTN_RANDOM_BG = 0x3a4a6a;
const BTN_WRAP_ON_BG = 0x2a4a2e;
const BTN_WRAP_OFF_BG = 0x4a3a2e;
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

function stepGrid(grid: Grid, rows: number, cols: number, wrap: boolean): Grid {
  const next = new Uint8Array(grid.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let nr = r + dr;
          let nc = c + dc;
          if (wrap) {
            nr = (nr + rows) % rows;
            nc = (nc + cols) % cols;
          } else if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            continue;
          }
          if (grid[idx(nr, nc, cols)]) n++;
        }
      }
      const i = idx(r, c, cols);
      if (grid[i]) {
        next[i] = n === 2 || n === 3 ? 1 : 0;
      } else {
        next[i] = n === 3 ? 1 : 0;
      }
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
  btn.on('pointerdown', onClick);
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
  const valW = 32;
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

interface ConwayRefs {
  W: number;
  H: number;
  rows: number;
  cols: number;
  grid: Grid;
  generation: number;
  playing: boolean;
  speed: number;
  wrap: boolean;
  lastStepTime: number;
  cellSize: number;
  gridOX: number;
  gridOY: number;
  controlRegion: SubCanvas | null;
  gridRegion: SubCanvas | null;
  cellsGraphics: PIXI.Graphics | null;
  gridBg: PIXI.Graphics | null;
  gridBgRect: PIXI.Graphics | null;
  genText: PIXI.Text | null;
  popText: PIXI.Text | null;
  playPauseText: PIXI.Text | null;
  wrapText: PIXI.Text | null;
  ticker: PIXI.Ticker | null;
  tickFn: (() => void) | null;
  keyCleanups: Array<() => void>;
  setRows: (n: number) => void;
  setCols: (n: number) => void;
}

function makeInitialRefs(rows: number, cols: number, W: number, H: number, setRows: (n: number) => void, setCols: (n: number) => void): ConwayRefs {
  return {
    W,
    H,
    rows,
    cols,
    grid: newGrid(rows, cols, 'random'),
    generation: 0,
    playing: false,
    speed: DEFAULT_FPS,
    wrap: true,
    lastStepTime: 0,
    cellSize: 8,
    gridOX: 0,
    gridOY: 0,
    controlRegion: null,
    gridRegion: null,
    cellsGraphics: null,
    gridBg: null,
    gridBgRect: null,
    genText: null,
    popText: null,
    playPauseText: null,
    wrapText: null,
    ticker: null,
    tickFn: null,
    keyCleanups: [],
    setRows,
    setCols,
  };
}

function clearRegion(region: SubCanvas): void {
  while (region.stage.children.length > 0) {
    const child = region.stage.children[0];
    region.stage.removeChild(child);
    child.destroy({ children: true });
  }
}

function drawCells(refs: ConwayRefs): void {
  if (!refs.cellsGraphics) return;
  refs.cellsGraphics.clear();
  for (let r = 0; r < refs.rows; r++) {
    for (let c = 0; c < refs.cols; c++) {
      if (refs.grid[idx(r, c, refs.cols)]) {
        refs.cellsGraphics.rect(c * refs.cellSize, r * refs.cellSize, refs.cellSize, refs.cellSize);
      }
    }
  }
  refs.cellsGraphics.fill({ color: CELL_COLOR });
}

function drawGridBg(refs: ConwayRefs): void {
  if (!refs.gridBg || !refs.gridRegion) return;
  refs.gridBg.clear();
  if (refs.cellSize < 6) return;
  refs.gridBg.stroke({ width: 0.5, color: GRID_LINE_COLOR, alpha: 0.6 });
  for (let r = 0; r <= refs.rows; r++) {
    refs.gridBg.moveTo(0, r * refs.cellSize);
    refs.gridBg.lineTo(refs.cols * refs.cellSize, r * refs.cellSize);
  }
  for (let c = 0; c <= refs.cols; c++) {
    refs.gridBg.moveTo(c * refs.cellSize, 0);
    refs.gridBg.lineTo(c * refs.cellSize, refs.rows * refs.cellSize);
  }
}

function updateStats(refs: ConwayRefs): void {
  if (refs.genText) refs.genText.text = `Gen: ${refs.generation}`;
  if (refs.popText) refs.popText.text = `Pop: ${countLive(refs.grid)}`;
}

function updatePlayPauseLabel(refs: ConwayRefs): void {
  if (refs.playPauseText) refs.playPauseText.text = refs.playing ? '\u23F8  Pause' : '\u25B6  Play';
}

function updateWrapLabel(refs: ConwayRefs): void {
  if (refs.wrapText) refs.wrapText.text = refs.wrap ? 'Wrap: ON' : 'Wrap: OFF';
}

function doStep(refs: ConwayRefs): void {
  refs.grid = stepGrid(refs.grid, refs.rows, refs.cols, refs.wrap);
  refs.generation++;
  drawCells(refs);
  updateStats(refs);
}

function doClear(refs: ConwayRefs): void {
  refs.grid = newGrid(refs.rows, refs.cols, 'empty');
  refs.generation = 0;
  drawCells(refs);
  updateStats(refs);
}

function doRandom(refs: ConwayRefs): void {
  refs.grid = newGrid(refs.rows, refs.cols, 'random');
  refs.generation = 0;
  drawCells(refs);
  updateStats(refs);
}

function doPlayPause(refs: ConwayRefs): void {
  refs.playing = !refs.playing;
  if (refs.playing) refs.lastStepTime = performance.now();
  updatePlayPauseLabel(refs);
}

function doReset(refs: ConwayRefs): void {
  refs.grid = newGrid(refs.rows, refs.cols, 'empty');
  refs.generation = 0;
  refs.playing = false;
  drawCells(refs);
  updateStats(refs);
  updatePlayPauseLabel(refs);
}

function doToggleWrap(refs: ConwayRefs): void {
  refs.wrap = !refs.wrap;
  updateWrapLabel(refs);
}

function unregisterTicker(refs: ConwayRefs): void {
  if (refs.ticker && refs.tickFn) {
    refs.ticker.remove(refs.tickFn);
    refs.tickFn = null;
  }
}

function buildControlPanel(refs: ConwayRefs): void {
  const region = refs.controlRegion;
  if (!region) return;
  const W = refs.W;
  const { rows, cols } = refs;

  const title = new PIXI.Text({
    text: "Conway's Game of Life",
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
  playPauseBtn.on('pointerdown', () => doPlayPause(refs));
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

  const wrapBtn = new PIXI.Container();
  const wBg = new PIXI.Graphics().roundRect(0, 0, 90, 28, 6).fill({ color: refs.wrap ? BTN_WRAP_ON_BG : BTN_WRAP_OFF_BG, alpha: 0.92 });
  wBg.stroke({ width: 1.5, color: 0x446 });
  wrapBtn.addChild(wBg);
  refs.wrapText = new PIXI.Text({
    text: refs.wrap ? 'Wrap: ON' : 'Wrap: OFF',
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  refs.wrapText.anchor.set(0.5);
  refs.wrapText.x = 45;
  refs.wrapText.y = 14;
  wrapBtn.addChild(refs.wrapText);
  wrapBtn.eventMode = 'static';
  wrapBtn.cursor = 'pointer';
  wrapBtn.hitArea = new PIXI.Rectangle(0, 0, 90, 28);
  wrapBtn.on('pointerdown', () => doToggleWrap(refs));
  wrapBtn.x = 360;
  wrapBtn.y = 61;
  region.stage.addChild(wrapBtn);

  const speedStepper = makeStepper('Speed', refs.speed, (v) => { refs.speed = v; }, MIN_FPS, MAX_FPS);
  speedStepper.x = 460;
  speedStepper.y = 46;
  region.stage.addChild(speedStepper);

  const rowsStepper = makeStepper('Rows', rows, refs.setRows, MIN_DIM, MAX_DIM);
  rowsStepper.x = 460 + speedStepper.width + 16;
  rowsStepper.y = 46;
  region.stage.addChild(rowsStepper);

  const colsStepper = makeStepper('Cols', cols, refs.setCols, MIN_DIM, MAX_DIM);
  colsStepper.x = rowsStepper.x + rowsStepper.width + 16;
  colsStepper.y = 46;
  region.stage.addChild(colsStepper);

  const resetBtn = makeButton('Reset', 80, 30, () => doReset(refs), BTN_RESET_BG);
  resetBtn.x = W - 96;
  resetBtn.y = 60;
  region.stage.addChild(resetBtn);
}

function buildGrid(refs: ConwayRefs): void {
  const region = refs.gridRegion;
  if (!region) return;

  const availW = region.bounds.width - 24;
  const availH = region.bounds.height - 24;
  refs.cellSize = Math.max(2, Math.floor(Math.min(availW / refs.cols, availH / refs.rows)));
  const gridW = refs.cols * refs.cellSize;
  const gridH = refs.rows * refs.cellSize;
  refs.gridOX = Math.floor((region.bounds.width - gridW) / 2);
  refs.gridOY = Math.floor((region.bounds.height - gridH) / 2);

  refs.gridBgRect = new PIXI.Graphics().rect(0, 0, gridW, gridH).fill({ color: DEAD_BG_COLOR });
  refs.gridBgRect.x = refs.gridOX;
  refs.gridBgRect.y = refs.gridOY;
  region.stage.addChild(refs.gridBgRect);

  refs.gridBg = new PIXI.Graphics();
  refs.gridBg.x = refs.gridOX;
  refs.gridBg.y = refs.gridOY;
  region.stage.addChild(refs.gridBg);
  drawGridBg(refs);

  refs.cellsGraphics = new PIXI.Graphics();
  refs.cellsGraphics.x = refs.gridOX;
  refs.cellsGraphics.y = refs.gridOY;
  region.stage.addChild(refs.cellsGraphics);
  drawCells(refs);

  region.onPress((e) => {
    const localX = e.x - refs.gridOX;
    const localY = e.y - refs.gridOY;
    if (localX < 0 || localY < 0) return;
    if (localX >= refs.cols * refs.cellSize || localY >= refs.rows * refs.cellSize) return;
    const c = Math.floor(localX / refs.cellSize);
    const r = Math.floor(localY / refs.cellSize);
    if (r < 0 || r >= refs.rows || c < 0 || c >= refs.cols) return;
    const i = idx(r, c, refs.cols);
    refs.grid[i] = refs.grid[i] ? 0 : 1;
    drawCells(refs);
    updateStats(refs);
  });
}

function registerTicker(refs: ConwayRefs): void {
  if (!refs.gridRegion) return;
  refs.ticker = refs.gridRegion.ticker;
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

function rebuildBoard(refs: ConwayRefs): void {
  if (refs.controlRegion) clearRegion(refs.controlRegion);
  if (refs.gridRegion) clearRegion(refs.gridRegion);
  refs.cellsGraphics = null;
  refs.gridBg = null;
  refs.gridBgRect = null;
  refs.genText = null;
  refs.popText = null;
  refs.playPauseText = null;
  refs.wrapText = null;
  unregisterTicker(refs);
  buildControlPanel(refs);
  buildGrid(refs);
  registerTicker(refs);
  updateStats(refs);
  updatePlayPauseLabel(refs);
  updateWrapLabel(refs);
}

export function ComponentConwayDisplay() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const refsRef = useRef<ConwayRefs | null>(null);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    refsRef.current = makeInitialRefs(DEFAULT_ROWS, DEFAULT_COLS, W, H, setRows, setCols);
    const refs = refsRef.current;

    const destroyApp = startPixiApp((proxy) => {
      if (!refs || !refsRef.current) return;
      refs.controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      refs.gridRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: H - CONTROL_H });
      makeInfoPanel(refs.controlRegion, { title: '康威生命游戏', lines: ['用途：细胞自动机——每个细胞根据邻居数量存活或死亡', '测试方法：点击细胞切换状态，按下播放模拟，调整速度和网格大小', '预期效果：细胞遵循康威规则：3个邻居→诞生，2-3个→存活，否则→死亡。模式持续演化'], x: (refs.controlRegion.bounds?.width ?? window.innerWidth) - 400, y: (refs.controlRegion.bounds?.height ?? window.innerHeight) - 150 });
      rebuildBoard(refs);
    });

    return () => {
      const refs = refsRef.current;
      if (refs) {
        unregisterTicker(refs);
        refs.keyCleanups.forEach((fn) => fn());
      }
      destroyApp();
      refsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const refs = refsRef.current;
    if (!refs || !refs.controlRegion) return;
    refs.rows = rows;
    refs.cols = cols;
    refs.grid = newGrid(rows, cols, 'random');
    refs.generation = 0;
    refs.playing = false;
    refs.lastStepTime = 0;
    rebuildBoard(refs);
  }, [rows, cols]);

  return <></>;
}

ComponentConwayDisplay.head = {
  title: "Component: Conway's Game of Life",
  description: "Classic cellular automaton on a configurable grid. Play/Pause, Step, Clear, Random fill, toroidal wrap toggle, speed control, click cells to toggle. All UI rendered purely in PIXI.js — no DOM overlays.",
};
