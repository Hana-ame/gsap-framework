import { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import type { SubCanvas } from '../../framework/SubCanvas';

type Grid = Uint8Array;

const MIN_DIM = 10;
const MAX_DIM = 120;
const DEFAULT_ROWS = 40;
const DEFAULT_COLS = 60;
const DEFAULT_FPS = 10;
const MIN_FPS = 1;
const MAX_FPS = 30;
const DEFAULT_DENSITY = 0.28;
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

export function ComponentConwayDisplay() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    let controlRegion: SubCanvas | null = null;
    let gridRegion: SubCanvas | null = null;
    let destroyed = false;

    const controlH = 100;
    let grid: Grid = newGrid(rows, cols, 'random');
    let generation = 0;
    let playing = false;
    let speed = DEFAULT_FPS;
    let wrap = true;
    let lastStepTime = 0;
    let cellSize = 8;
    let gridOX = 0;
    let gridOY = 0;

    let cellsGraphics: PIXI.Graphics | null = null;
    let gridBg: PIXI.Graphics | null = null;
    let gridBgRect: PIXI.Graphics | null = null;
    let genText: PIXI.Text | null = null;
    let popText: PIXI.Text | null = null;
    let playPauseBtn: PIXI.Container | null = null;
    let playPauseText: PIXI.Text | null = null;
    let wrapBtn: PIXI.Container | null = null;
    let wrapText: PIXI.Text | null = null;

    function drawCells() {
      if (!cellsGraphics) return;
      cellsGraphics.clear();
      cellsGraphics.fill({ color: CELL_COLOR });
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[idx(r, c, cols)]) {
            cellsGraphics.rect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    function drawGridBg() {
      if (!gridBg || !gridRegion) return;
      gridBg.clear();
      if (cellSize < 6) return;
      gridBg.stroke({ width: 0.5, color: GRID_LINE_COLOR, alpha: 0.6 });
      for (let r = 0; r <= rows; r++) {
        gridBg.moveTo(0, r * cellSize);
        gridBg.lineTo(cols * cellSize, r * cellSize);
      }
      for (let c = 0; c <= cols; c++) {
        gridBg.moveTo(c * cellSize, 0);
        gridBg.lineTo(c * cellSize, rows * cellSize);
      }
    }

    function updateStats() {
      if (genText) genText.text = `Gen: ${generation}`;
      if (popText) popText.text = `Pop: ${countLive(grid)}`;
    }

    function updatePlayPauseLabel() {
      if (playPauseText) playPauseText.text = playing ? '\u23F8  Pause' : '\u25B6  Play';
    }

    function updateWrapLabel() {
      if (wrapText) wrapText.text = wrap ? 'Wrap: ON' : 'Wrap: OFF';
    }

    function doStep() {
      grid = stepGrid(grid, rows, cols, wrap);
      generation++;
      drawCells();
      updateStats();
    }

    function doClear() {
      grid = newGrid(rows, cols, 'empty');
      generation = 0;
      drawCells();
      updateStats();
    }

    function doRandom() {
      grid = newGrid(rows, cols, 'random');
      generation = 0;
      drawCells();
      updateStats();
    }

    function doPlayPause() {
      playing = !playing;
      if (playing) lastStepTime = performance.now();
      updatePlayPauseLabel();
    }

    function doReset() {
      grid = newGrid(rows, cols, 'empty');
      generation = 0;
      playing = false;
      drawCells();
      updateStats();
      updatePlayPauseLabel();
    }

    function doToggleWrap() {
      wrap = !wrap;
      updateWrapLabel();
    }

    const destroyApp = startPixiApp((proxy) => {
      if (destroyed) return;
      controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: controlH });
      gridRegion = proxy.createRegion({ x: 0, y: controlH, width: W, height: H - controlH });

      const availW = gridRegion.bounds.width - 24;
      const availH = gridRegion.bounds.height - 24;
      cellSize = Math.max(2, Math.floor(Math.min(availW / cols, availH / rows)));
      const gridW = cols * cellSize;
      const gridH = rows * cellSize;
      gridOX = Math.floor((gridRegion.bounds.width - gridW) / 2);
      gridOY = Math.floor((gridRegion.bounds.height - gridH) / 2);

      const title = new PIXI.Text({
        text: "Conway's Game of Life",
        style: { fontSize: 18, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      title.x = 16;
      title.y = 8;
      controlRegion.stage.addChild(title);

      genText = new PIXI.Text({
        text: 'Gen: 0',
        style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
      });
      genText.x = 16;
      genText.y = 38;
      controlRegion.stage.addChild(genText);

      popText = new PIXI.Text({
        text: 'Pop: 0',
        style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
      });
      popText.x = 90;
      popText.y = 38;
      controlRegion.stage.addChild(popText);

      playPauseBtn = new PIXI.Container();
      const ppBg = new PIXI.Graphics().roundRect(0, 0, 80, 30, 6).fill({ color: BTN_PLAY_BG, alpha: 0.92 });
      ppBg.stroke({ width: 1.5, color: 0x446 });
      playPauseBtn.addChild(ppBg);
      playPauseText = new PIXI.Text({
        text: '\u25B6  Play',
        style: { fontSize: 13, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      playPauseText.anchor.set(0.5);
      playPauseText.x = 40;
      playPauseText.y = 15;
      playPauseBtn.addChild(playPauseText);
      playPauseBtn.eventMode = 'static';
      playPauseBtn.cursor = 'pointer';
      playPauseBtn.hitArea = new PIXI.Rectangle(0, 0, 80, 30);
      playPauseBtn.on('pointerdown', doPlayPause);
      playPauseBtn.x = 16;
      playPauseBtn.y = 60;
      controlRegion.stage.addChild(playPauseBtn);

      const stepBtn = makeButton('Step', 70, 30, () => {
        if (!playing) doStep();
      }, BTN_STEP_BG);
      stepBtn.x = 104;
      stepBtn.y = 60;
      controlRegion.stage.addChild(stepBtn);

      const clearBtn = makeButton('Clear', 70, 30, doClear, BTN_CLEAR_BG);
      clearBtn.x = 182;
      clearBtn.y = 60;
      controlRegion.stage.addChild(clearBtn);

      const randomBtn = makeButton('\u2682  Random', 90, 30, doRandom, BTN_RANDOM_BG);
      randomBtn.x = 260;
      randomBtn.y = 60;
      controlRegion.stage.addChild(randomBtn);

      wrapBtn = new PIXI.Container();
      const wBg = new PIXI.Graphics().roundRect(0, 0, 90, 28, 6).fill({ color: wrap ? BTN_WRAP_ON_BG : BTN_WRAP_OFF_BG, alpha: 0.92 });
      wBg.stroke({ width: 1.5, color: 0x446 });
      wrapBtn.addChild(wBg);
      wrapText = new PIXI.Text({
        text: wrap ? 'Wrap: ON' : 'Wrap: OFF',
        style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      wrapText.anchor.set(0.5);
      wrapText.x = 45;
      wrapText.y = 14;
      wrapBtn.addChild(wrapText);
      wrapBtn.eventMode = 'static';
      wrapBtn.cursor = 'pointer';
      wrapBtn.hitArea = new PIXI.Rectangle(0, 0, 90, 28);
      wrapBtn.on('pointerdown', doToggleWrap);
      wrapBtn.x = 360;
      wrapBtn.y = 61;
      controlRegion.stage.addChild(wrapBtn);

      const speedStepper = makeStepper('Speed', speed, (v) => { speed = v; }, MIN_FPS, MAX_FPS);
      speedStepper.x = 460;
      speedStepper.y = 46;
      controlRegion.stage.addChild(speedStepper);

      const rowsStepper = makeStepper('Rows', rows, setRows, MIN_DIM, MAX_DIM);
      rowsStepper.x = 460 + speedStepper.width + 16;
      rowsStepper.y = 46;
      controlRegion.stage.addChild(rowsStepper);

      const colsStepper = makeStepper('Cols', cols, setCols, MIN_DIM, MAX_DIM);
      colsStepper.x = rowsStepper.x + rowsStepper.width + 16;
      colsStepper.y = 46;
      controlRegion.stage.addChild(colsStepper);

      const resetBtn = makeButton('Reset', 80, 30, doReset, BTN_RESET_BG);
      resetBtn.x = W - 96;
      resetBtn.y = 60;
      controlRegion.stage.addChild(resetBtn);

      gridBgRect = new PIXI.Graphics().rect(0, 0, cols * cellSize, rows * cellSize).fill({ color: DEAD_BG_COLOR });
      gridBgRect.x = gridOX;
      gridBgRect.y = gridOY;
      gridRegion.stage.addChild(gridBgRect);

      gridBg = new PIXI.Graphics();
      gridBg.x = gridOX;
      gridBg.y = gridOY;
      gridRegion.stage.addChild(gridBg);
      drawGridBg();

      cellsGraphics = new PIXI.Graphics();
      cellsGraphics.x = gridOX;
      cellsGraphics.y = gridOY;
      gridRegion.stage.addChild(cellsGraphics);
      drawCells();

      gridRegion.onPress((e) => {
        const localX = e.x - gridOX;
        const localY = e.y - gridOY;
        if (localX < 0 || localY < 0) return;
        if (localX >= cols * cellSize || localY >= rows * cellSize) return;
        const c = Math.floor(localX / cellSize);
        const r = Math.floor(localY / cellSize);
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        const i = idx(r, c, cols);
        grid[i] = grid[i] ? 0 : 1;
        drawCells();
        updateStats();
      });

      updateStats();
      updatePlayPauseLabel();
      updateWrapLabel();

      const ticker = gridRegion.ticker;
      const tickFn = () => {
        if (!playing) return;
        const now = performance.now();
        const interval = 1000 / speed;
        if (now - lastStepTime >= interval) {
          doStep();
          lastStepTime = now;
        }
      };
      ticker.add(tickFn);
      return () => {
        ticker.remove(tickFn);
      };
    });

    return () => {
      destroyed = true;
      destroyApp();
    };
  }, [rows, cols]);

  return <></>;
}

ComponentConwayDisplay.head = {
  title: "Component: Conway's Game of Life",
  description: "Classic cellular automaton on a configurable grid. Play/Pause, Step, Clear, Random fill, toroidal wrap toggle, speed control, click cells to toggle. All UI rendered purely in PIXI.js — no DOM overlays.",
};
