import { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp } from '../../framework/PixiApp';
import type { SubCanvas } from '../../framework/SubCanvas';

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

export function Component2048Display() {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    let boardRegion: SubCanvas | null = null;
    let controlRegion: SubCanvas | null = null;
    let destroyed = false;
    const keyCleanups: Array<() => void> = [];

    let board: Board = spawnTile(spawnTile(newBoard(rows, cols)));
    let score = 0;
    let gameOver = false;

    let tileNodes: PIXI.Container[][] = [];
    let boardBg: PIXI.Container | null = null;
    let boardW = 0;
    let boardH = 0;
    let cellW = 0;
    let cellH = 0;
    let boardOX = 0;
    let boardOY = 0;
    let scoreText: PIXI.Text | null = null;
    let gameOverOverlay: PIXI.Container | null = null;
    let pressStart: { x: number; y: number } | null = null;

    function renderTiles() {
      if (!boardRegion) return;
      while (boardRegion.stage.children.length > 0) {
        const child = boardRegion.stage.children[0];
        boardRegion.stage.removeChild(child);
        child.destroy({ children: true });
      }
      tileNodes = [];

      boardBg = new PIXI.Container();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = new PIXI.Graphics().roundRect(0, 0, cellW, cellH, 6).fill({ color: 0xbbada0 });
          cell.x = boardOX + c * (cellW + 10) + 10;
          cell.y = boardOY + r * (cellH + 10) + 10;
          boardBg.addChild(cell);
        }
      }
      boardRegion.stage.addChild(boardBg);

      for (let r = 0; r < rows; r++) {
        tileNodes[r] = [];
        for (let c = 0; c < cols; c++) {
          const node = makeTileNode(board[r][c], r, c);
          boardRegion.stage.addChild(node);
          tileNodes[r][c] = node;
        }
      }
    }

    function makeTileNode(value: number, r: number, c: number): PIXI.Container {
      const node = new PIXI.Container();
      const g = new PIXI.Graphics().roundRect(0, 0, cellW, cellH, 6).fill({ color: getTileColor(value) });
      node.addChild(g);
      const t = new PIXI.Text({
        text: value === 0 ? '' : String(value),
        style: {
          fontSize: value < 100 ? 32 : value < 1000 ? 28 : 24,
          fill: getTextColor(value),
          fontFamily: 'monospace',
          fontWeight: 'bold',
        },
      });
      t.anchor.set(0.5);
      t.x = cellW / 2;
      t.y = cellH / 2;
      node.addChild(t);
      node.x = boardOX + c * (cellW + 10) + 10;
      node.y = boardOY + r * (cellH + 10) + 10;
      return node;
    }

    function updateTiles() {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = board[r][c];
          const node = tileNodes[r][c];
          while (node.children.length > 0) {
            const child = node.children[0];
            node.removeChild(child);
            child.destroy();
          }
          const g = new PIXI.Graphics().roundRect(0, 0, cellW, cellH, 6).fill({ color: getTileColor(v) });
          node.addChild(g);
          const t = new PIXI.Text({
            text: v === 0 ? '' : String(v),
            style: {
              fontSize: v < 100 ? 32 : v < 1000 ? 28 : 24,
              fill: getTextColor(v),
              fontFamily: 'monospace',
              fontWeight: 'bold',
            },
          });
          t.anchor.set(0.5);
          t.x = cellW / 2;
          t.y = cellH / 2;
          node.addChild(t);
        }
      }
    }

    function tryMove(dir: Direction) {
      if (gameOver) return;
      const r = move(board, dir);
      if (!r.moved) return;
      board = spawnTile(r.board);
      score += r.score;
      if (scoreText) scoreText.text = `Score: ${score}`;
      updateTiles();
      if (isGameOver(board)) {
        gameOver = true;
        showGameOver();
      }
    }

    function showGameOver() {
      if (!boardRegion) return;
      const overlay = new PIXI.Container();
      const dim = new PIXI.Graphics().rect(0, 0, boardW, boardH).fill({ color: 0x000000, alpha: 0.6 });
      overlay.addChild(dim);
      const t = new PIXI.Text({
        text: 'Game Over',
        style: { fontSize: 36, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      t.anchor.set(0.5);
      t.x = boardW / 2;
      t.y = boardH / 2 - 20;
      overlay.addChild(t);
      const s = new PIXI.Text({
        text: `Final: ${score}`,
        style: { fontSize: 18, fill: 0xcccccc, fontFamily: 'monospace' },
      });
      s.anchor.set(0.5);
      s.x = boardW / 2;
      s.y = boardH / 2 + 20;
      overlay.addChild(s);
      gameOverOverlay = overlay;
      boardRegion.stage.addChild(overlay);
    }

    const destroyApp = startPixiApp((proxy) => {
      if (destroyed) return;
      const controlH = 110;
      controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: controlH });
      boardRegion = proxy.createRegion({ x: 0, y: controlH, width: W, height: H - controlH });

      const GAP = 10;
      const availW = W - 20;
      const availH = H - controlH - 20;
      const cellWMax = (availW - GAP * (cols + 1)) / cols;
      const cellHMax = (availH - GAP * (rows + 1)) / rows;
      const cellSize = Math.max(20, Math.floor(Math.min(cellWMax, cellHMax)));
      cellW = cellSize;
      cellH = cellSize;
      boardW = cols * cellSize + (cols + 1) * GAP;
      boardH = rows * cellSize + (rows + 1) * GAP;
      boardOX = (W - boardW) / 2;
      boardOY = controlH + (H - controlH - boardH) / 2;

      const title = new PIXI.Text({
        text: '2048',
        style: { fontSize: 28, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      title.x = 20;
      title.y = 8;
      controlRegion.stage.addChild(title);

      const scoreBg = new PIXI.Graphics().roundRect(0, 0, 120, 56, 6).fill({ color: 0xbbada0 });
      scoreBg.x = W - 140;
      scoreBg.y = 8;
      controlRegion.stage.addChild(scoreBg);
      const scoreLabel = new PIXI.Text({
        text: 'SCORE',
        style: { fontSize: 10, fill: 0xeee4da, fontFamily: 'monospace' },
      });
      scoreLabel.anchor.set(0.5, 0);
      scoreLabel.x = W - 80;
      scoreLabel.y = 14;
      controlRegion.stage.addChild(scoreLabel);
      scoreText = new PIXI.Text({
        text: `Score: ${score}`,
        style: { fontSize: 16, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      scoreText.anchor.set(0.5, 0);
      scoreText.x = W - 80;
      scoreText.y = 32;
      controlRegion.stage.addChild(scoreText);

      const rowsStepper = makeStepper('Rows', rows, (v) => setRows(v), 0);
      rowsStepper.x = 20;
      rowsStepper.y = 50;
      controlRegion.stage.addChild(rowsStepper);

      const colsStepper = makeStepper('Cols', cols, (v) => setCols(v), 0);
      colsStepper.x = rowsStepper.x + rowsStepper.width + 24;
      colsStepper.y = 50;
      controlRegion.stage.addChild(colsStepper);

      const resetBtn = makeButton('Reset', 72, 28, () => {
        board = spawnTile(spawnTile(newBoard(rows, cols)));
        score = 0;
        gameOver = false;
        if (scoreText) scoreText.text = `Score: ${score}`;
        if (gameOverOverlay) {
          boardRegion?.stage.removeChild(gameOverOverlay);
          gameOverOverlay.destroy({ children: true });
          gameOverOverlay = null;
        }
        updateTiles();
      }, 0x4a3a2e);
      resetBtn.x = colsStepper.x + colsStepper.width + 24;
      resetBtn.y = 50 + 32;
      controlRegion.stage.addChild(resetBtn);

      boardRegion.onPress((e) => {
        pressStart = { x: e.x, y: e.y };
      });
      boardRegion.onRelease((e) => {
        if (!pressStart) return;
        const dx = e.x - pressStart.x;
        const dy = e.y - pressStart.y;
        pressStart = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          tryMove(dx > 0 ? 'right' : 'left');
        } else {
          tryMove(dy > 0 ? 'down' : 'up');
        }
      });

      const onKey = (ke: KeyboardEvent) => {
        if (ke.key === 'ArrowLeft' || ke.key === 'a') tryMove('left');
        else if (ke.key === 'ArrowRight' || ke.key === 'd') tryMove('right');
        else if (ke.key === 'ArrowUp' || ke.key === 'w') tryMove('up');
        else if (ke.key === 'ArrowDown' || ke.key === 's') tryMove('down');
      };
      window.addEventListener('keydown', onKey);
      keyCleanups.push(() => window.removeEventListener('keydown', onKey));

      renderTiles();
    });

    return () => {
      destroyed = true;
      keyCleanups.forEach((fn) => fn());
      destroyApp();
    };
  }, [rows, cols]);

  return <></>;
}

Component2048Display.head = {
  title: 'Component: 2048',
  description: 'Classic 2048 sliding tile game. Touch swipe (or arrow keys / WASD) to merge tiles. Customizable board dimensions 3-10.',
};
