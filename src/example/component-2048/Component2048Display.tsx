// Example: 2048 game implemented on SubCanvas
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas } from '@framework';
import { makeInfoPanel } from '@components';

type Board = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

const MIN_DIM = 3;
const MAX_DIM = 10;
const SWIPE_THRESHOLD = 20;

const TILE_COLORS: Record<number, number> = {
  0: 0xcdc1b4,
  2: 0xeee4da,
  4: 0xede0c8,
  8: 0xf2b179,
  16: 0xf59563,
  32: 0xf67c5f,
  64: 0xf65e3b,
  128: 0xedcf72,
  256: 0xedcc61,
  512: 0xedc850,
  1024: 0xedc53f,
  2048: 0xedc22e,
};
const TILE_FG_LIGHT = 0x776e65;
const TILE_FG_DARK = 0xf9f6f2;
const TILE_SUPER_FG = 0xf9f6f2;
const TILE_SUPER_BG = 0x3c3a32;

function getTileColor(v: number): number {
  if (v === 0) return TILE_COLORS[0];
  return TILE_COLORS[v] ?? TILE_SUPER_BG;
}

function getTextColor(v: number): number {
  if (v === 0) return TILE_FG_LIGHT;
  if (v < 8) return TILE_FG_LIGHT;
  if (v <= 2048) return TILE_FG_DARK;
  return TILE_SUPER_FG;
}

function fontSizeFor(value: number, cellW: number, cellH: number): number {
  if (value === 0) return 1;
  const base = value < 100 ? 32 : value < 1000 ? 28 : 24;
  const digits = String(value).length;
  const maxByHeight = Math.floor(cellH * 0.55);
  const maxByWidth = Math.floor((cellW * 0.85) / (digits * 0.62));
  return Math.max(8, Math.min(base, maxByHeight, maxByWidth));
}

function newBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function emptyCells(board: Board): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) out.push([r, c]);
    }
  }
  return out;
}

function spawnTile(board: Board): Board {
  const empties = emptyCells(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const nb = board.map((row) => [...row]);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

function shiftLine(line: number[]): { line: number[]; score: number; moved: boolean } {
  const len = line.length;
  const nonZero = line.filter((v) => v !== 0);
  const merged: number[] = [];
  let score = 0;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const v = nonZero[i] * 2;
      merged.push(v);
      score += v;
      i += 2;
    } else {
      merged.push(nonZero[i]);
      i += 1;
    }
  }
  while (merged.length < len) merged.push(0);
  const moved = merged.some((v, idx) => v !== line[idx]);
  return { line: merged, score, moved };
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const nb = board.map((row) => {
    const r = shiftLine(row);
    totalScore += r.score;
    if (r.moved) moved = true;
    return r.line;
  });
  return { board: nb, score: totalScore, moved };
}

function moveRight(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const nb = board.map((row) => {
    const reversed = [...row].reverse();
    const r = shiftLine(reversed);
    totalScore += r.score;
    const result = r.line.reverse();
    if (result.some((v, idx) => v !== row[idx])) moved = true;
    return result;
  });
  return { board: nb, score: totalScore, moved };
}

function moveUp(board: Board): { board: Board; score: number; moved: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const nb = newBoard(rows, cols);
  let totalScore = 0;
  let moved = false;
  for (let c = 0; c < cols; c++) {
    const col: number[] = [];
    for (let r = 0; r < rows; r++) col.push(board[r][c]);
    const r = shiftLine(col);
    totalScore += r.score;
    for (let r2 = 0; r2 < rows; r2++) nb[r2][c] = r.line[r2];
    if (r.moved) moved = true;
  }
  return { board: nb, score: totalScore, moved };
}

function moveDown(board: Board): { board: Board; score: number; moved: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const nb = newBoard(rows, cols);
  let totalScore = 0;
  let moved = false;
  for (let c = 0; c < cols; c++) {
    const col: number[] = [];
    for (let r = 0; r < rows; r++) col.push(board[r][c]);
    const reversed = col.reverse();
    const r = shiftLine(reversed);
    totalScore += r.score;
    const result = r.line.reverse();
    for (let r2 = 0; r2 < rows; r2++) nb[r2][c] = result[r2];
    if (result.some((v, idx) => v !== col[idx])) moved = true;
  }
  return { board: nb, score: totalScore, moved };
}

function isGameOver(board: Board): boolean {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) return false;
      if (c + 1 < board[r].length && board[r][c] === board[r][c + 1]) return false;
      if (r + 1 < board.length && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

function move(board: Board, dir: Direction): { board: Board; score: number; moved: boolean } {
  switch (dir) {
    case 'left': return moveLeft(board);
    case 'right': return moveRight(board);
    case 'up': return moveUp(board);
    case 'down': return moveDown(board);
  }
}

function makeButton(
  label: string,
  w: number,
  h: number,
  onClick: () => void,
  bg: number = 0x1a1a2e,
  fg: number = 0xffffff,
): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: { fontSize: 14, fill: fg, fontFamily: 'monospace' },
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
  w: number,
): PIXI.Container {
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: { fontSize: 13, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  lbl.x = 0;
  lbl.y = 8;
  wrap.addChild(lbl);

  const btnW = 28;
  const btnH = 28;
  const valW = 40;
  const rowY = 32;

  const minus = makeButton('-', btnW, btnH, () => {
    if (value > MIN_DIM) onChange(value - 1);
  });
  minus.x = lbl.width + 8;
  minus.y = rowY;
  wrap.addChild(minus);

  const valText = new PIXI.Text({
    text: String(value),
    style: { fontSize: 18, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  valText.anchor.set(0.5, 0);
  valText.x = lbl.width + 8 + btnW + valW / 2;
  valText.y = rowY + 4;
  wrap.addChild(valText);

  const plus = makeButton('+', btnW, btnH, () => {
    if (value < MAX_DIM) onChange(value + 1);
  });
  plus.x = lbl.width + 8 + btnW + valW;
  plus.y = rowY;
  wrap.addChild(plus);

  wrap.width = lbl.width + 8 + btnW + valW + btnW;
  wrap.height = 60;
  return wrap;
}

interface GameRefs {
  region: SubCanvas | null;
  W: number;
  H: number;
  rows: number;
  cols: number;
  board: Board;
  score: number;
  gameOver: boolean;
  tileNodes: PIXI.Container[][];
  scoreText: PIXI.Text | null;
  gameOverOverlay: PIXI.Container | null;
  cellW: number;
  cellH: number;
  boardOX: number;
  boardOY: number;
  pressStart: { x: number; y: number } | null;
  keyCleanups: Array<() => void>;
}

function clearRegion(region: SubCanvas): void {
  while (region.stage.children.length > 0) {
    const child = region.stage.children[0];
    region.stage.removeChild(child);
    child.destroy({ children: true });
  }
}

function buildBoard(refs: GameRefs): void {
  const region = refs.region;
  if (!region) return;
  clearRegion(region);
  refs.tileNodes = [];
  refs.gameOverOverlay = null;

  const GAP = 10;
  const controlH = 110;
  const W = refs.W;
  const H = refs.H;
  const rows = refs.rows;
  const cols = refs.cols;
  const availW = W - 20;
  const availH = H - controlH - 20;
  const cellWMax = (availW - GAP * (cols + 1)) / cols;
  const cellHMax = (availH - GAP * (rows + 1)) / rows;
  const cellSize = Math.max(0, Math.floor(Math.min(cellWMax, cellHMax)));
  refs.cellW = cellSize;
  refs.cellH = cellSize;
  const boardW = cols * refs.cellW + (cols + 1) * GAP;
  const boardH = rows * refs.cellH + (rows + 1) * GAP;
  refs.boardOX = (W - boardW) / 2;
  refs.boardOY = controlH + (H - controlH - boardH) / 2;

  const title = new PIXI.Text({
    text: '2048',
    style: { fontSize: 28, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  title.x = 20;
  title.y = 8;
  region.stage.addChild(title);

  const scoreBg = new PIXI.Graphics().roundRect(0, 0, 120, 56, 6).fill({ color: 0xbbada0 });
  scoreBg.x = W - 140;
  scoreBg.y = 8;
  region.stage.addChild(scoreBg);
  const scoreLabel = new PIXI.Text({
    text: 'SCORE',
    style: { fontSize: 10, fill: 0xeee4da, fontFamily: 'monospace' },
  });
  scoreLabel.anchor.set(0.5, 0);
  scoreLabel.x = W - 80;
  scoreLabel.y = 14;
  region.stage.addChild(scoreLabel);
  const scoreText = new PIXI.Text({
    text: `Score: ${refs.score}`,
    style: { fontSize: 16, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  scoreText.anchor.set(0.5, 0);
  scoreText.x = W - 80;
  scoreText.y = 32;
  region.stage.addChild(scoreText);
  refs.scoreText = scoreText;

  const rowsStepper = makeStepper('Rows', rows, (v) => setRows(v), 0);
  rowsStepper.x = 20;
  rowsStepper.y = 50;
  region.stage.addChild(rowsStepper);

  const colsStepper = makeStepper('Cols', cols, (v) => setCols(v), 0);
  colsStepper.x = rowsStepper.x + rowsStepper.width + 24;
  colsStepper.y = 50;
  region.stage.addChild(colsStepper);

  const resetBtn = makeButton('Reset', 72, 28, () => {
    refs.board = spawnTile(spawnTile(newBoard(refs.rows, refs.cols)));
    refs.score = 0;
    refs.gameOver = false;
    if (refs.scoreText) refs.scoreText.text = `Score: ${refs.score}`;
    if (refs.gameOverOverlay) {
      region.stage.removeChild(refs.gameOverOverlay);
      refs.gameOverOverlay.destroy({ children: true });
      refs.gameOverOverlay = null;
    }
    rebuildTiles(refs);
  }, 0x4a3a2e);
  resetBtn.x = colsStepper.x + colsStepper.width + 24;
  resetBtn.y = 50 + 32;
  region.stage.addChild(resetBtn);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = new PIXI.Graphics().roundRect(0, 0, refs.cellW, refs.cellH, 6).fill({ color: 0xbbada0 });
      cell.x = refs.boardOX + c * (refs.cellW + GAP) + GAP;
      cell.y = refs.boardOY + r * (refs.cellH + GAP) + GAP;
      region.stage.addChild(cell);
    }
  }

  for (let r = 0; r < rows; r++) {
    refs.tileNodes[r] = [];
    for (let c = 0; c < cols; c++) {
      const node = buildTileNode(refs.board[r][c], r, c, refs);
      region.stage.addChild(node);
      refs.tileNodes[r][c] = node;
    }
  }
}

function buildTileNode(value: number, r: number, c: number, refs: GameRefs): PIXI.Container {
  const node = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, refs.cellW, refs.cellH, 6).fill({ color: getTileColor(value) });
  node.addChild(g);
  const t = new PIXI.Text({
    text: value === 0 ? '' : String(value),
    style: {
      fontSize: fontSizeFor(value, refs.cellW, refs.cellH),
      fill: getTextColor(value),
      fontFamily: 'monospace',
      fontWeight: 'bold',
    },
  });
  t.anchor.set(0.5);
  t.x = refs.cellW / 2;
  t.y = refs.cellH / 2;
  node.addChild(t);
  node.x = refs.boardOX + c * (refs.cellW + 10) + 10;
  node.y = refs.boardOY + r * (refs.cellH + 10) + 10;
  return node;
}

function rebuildTiles(refs: GameRefs): void {
  for (let r = 0; r < refs.rows; r++) {
    for (let c = 0; c < refs.cols; c++) {
      const v = refs.board[r][c];
      const node = refs.tileNodes[r][c];
      while (node.children.length > 0) {
        const child = node.children[0];
        node.removeChild(child);
        child.destroy();
      }
      const g = new PIXI.Graphics().roundRect(0, 0, refs.cellW, refs.cellH, 6).fill({ color: getTileColor(v) });
      node.addChild(g);
      const t = new PIXI.Text({
        text: v === 0 ? '' : String(v),
        style: {
          fontSize: fontSizeFor(v, refs.cellW, refs.cellH),
          fill: getTextColor(v),
          fontFamily: 'monospace',
          fontWeight: 'bold',
        },
      });
      t.anchor.set(0.5);
      t.x = refs.cellW / 2;
      t.y = refs.cellH / 2;
      node.addChild(t);
    }
  }
}

function tryMove(refs: GameRefs, dir: Direction): void {
  if (refs.gameOver) return;
  const r = move(refs.board, dir);
  if (!r.moved) return;
  refs.board = spawnTile(r.board);
  refs.score += r.score;
  if (refs.scoreText) refs.scoreText.text = `Score: ${refs.score}`;
  rebuildTiles(refs);
  if (isGameOver(refs.board)) {
    refs.gameOver = true;
    showGameOver(refs);
  }
}

function showGameOver(refs: GameRefs): void {
  const region = refs.region;
  if (!region) return;
  const cellSize = Math.min(refs.cellW, refs.cellH);
  const boardW = refs.cols * refs.cellW + (refs.cols + 1) * 10;
  const boardH = refs.rows * refs.cellH + (refs.rows + 1) * 10;
  const overlay = new PIXI.Container();
  const dim = new PIXI.Graphics().rect(0, 0, boardW, boardH).fill({ color: 0x000000, alpha: 0.6 });
  overlay.addChild(dim);
  const t = new PIXI.Text({
    text: 'Game Over',
    style: { fontSize: Math.min(36, cellSize * 0.45), fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  t.anchor.set(0.5);
  t.x = boardW / 2;
  t.y = boardH / 2 - 20;
  overlay.addChild(t);
  const s = new PIXI.Text({
    text: `Final: ${refs.score}`,
    style: { fontSize: Math.min(18, cellSize * 0.25), fill: 0xcccccc, fontFamily: 'monospace' },
  });
  s.anchor.set(0.5);
  s.x = boardW / 2;
  s.y = boardH / 2 + 20;
  overlay.addChild(s);
  overlay.x = refs.boardOX;
  overlay.y = refs.boardOY;
  refs.gameOverOverlay = overlay;
  region.stage.addChild(overlay);
}

function setRows(n: number): void {
  if (!state) return;
  if (n < MIN_DIM || n > MAX_DIM) return;
  if (state.rows === n) return;
  state.rows = n;
  state.board = spawnTile(spawnTile(newBoard(n, state.cols)));
  state.score = 0;
  state.gameOver = false;
  buildBoard(state);
}

function setCols(n: number): void {
  if (!state) return;
  if (n < MIN_DIM || n > MAX_DIM) return;
  if (state.cols === n) return;
  state.cols = n;
  state.board = spawnTile(spawnTile(newBoard(state.rows, n)));
  state.score = 0;
  state.gameOver = false;
  buildBoard(state);
}

let state: GameRefs | null = null;

export function Component2048Display() {
  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const destroyApp = startPixiApp((proxy) => {
      const region = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      makeInfoPanel(region, { title: '2048 游戏', lines: ['2048 滑动拼图——滑动以合并方块。', '使用方向键或滑动操作。用步进器调整棋盘大小。', '方块滑动并合并相同数字。每次移动生成新方块。分数增加。棋盘满了则游戏结束。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });
      const refs: GameRefs = {
        region,
        W,
        H,
        rows: 4,
        cols: 4,
        board: spawnTile(spawnTile(newBoard(4, 4))),
        score: 0,
        gameOver: false,
        tileNodes: [],
        scoreText: null,
        gameOverOverlay: null,
        cellW: 0,
        cellH: 0,
        boardOX: 0,
        boardOY: 0,
        pressStart: null,
        keyCleanups: [],
      };
      state = refs;

      region.onPress((e) => {
        if (e.y < 110) return;
        if (state) state.pressStart = { x: e.x, y: e.y };
      });
      region.onRelease((e) => {
        if (!state) return;
        const ps = state.pressStart;
        state.pressStart = null;
        if (!ps) return;
        if (ps.y < 110) return;
        const dx = e.x - ps.x;
        const dy = e.y - ps.y;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          tryMove(state, dx > 0 ? 'right' : 'left');
        } else {
          tryMove(state, dy > 0 ? 'down' : 'up');
        }
      });

      const onKey = (ke: KeyboardEvent) => {
        if (!state) return;
        if (ke.key === 'ArrowLeft' || ke.key === 'a') tryMove(state, 'left');
        else if (ke.key === 'ArrowRight' || ke.key === 'd') tryMove(state, 'right');
        else if (ke.key === 'ArrowUp' || ke.key === 'w') tryMove(state, 'up');
        else if (ke.key === 'ArrowDown' || ke.key === 's') tryMove(state, 'down');
      };
      window.addEventListener('keydown', onKey);
      refs.keyCleanups.push(() => window.removeEventListener('keydown', onKey));

      buildBoard(refs);
    });

    return () => {
      if (state) {
        state.keyCleanups.forEach((fn) => fn());
        state.keyCleanups = [];
      }
      destroyApp();
      state = null;
    };
  }, []);

  return <></>;
}

Component2048Display.head = {
  title: 'Component: 2048',
  description: 'Classic 2048 sliding tile game. Touch swipe (or arrow keys / WASD) to merge tiles. Customizable board dimensions 3-10.',
};
