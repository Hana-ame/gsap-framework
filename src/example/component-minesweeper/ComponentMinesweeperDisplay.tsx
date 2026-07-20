// Example: Minesweeper game on SubCanvas
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { makeButton, makeInfoPanel } from '@components';

const ROWS = 12;
const COLS = 12;
const MINES = 20;
const CELL = 32;

const COLORS = {
  bg: 0x0a0a14,
  hidden: 0x1a1a2e,
  revealed: 0x0f0f1e,
  flag: 0xff4455,
  mine: 0xcc3333,
  num: [0x8888cc, 0x44aaff, 0x44ff88, 0xff4455, 0x8866ff, 0xff8844, 0x44ffff, 0x888888] as const,
};

export function ComponentMinesweeperDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '扫雷', lines: ['用途：经典扫雷——在不踩雷的前提下揭开所有单元格', '测试方法：左键揭开，右键标记旗帜，数字显示相邻地雷数量', '预期效果：踩雷则游戏结束，数字正确指示相邻地雷数，标记可防止误揭'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const boardW = COLS * CELL;
      const boardH = ROWS * CELL;
      const ox = Math.floor((W - boardW) / 2);
      const oy = Math.floor((H - boardH) / 2);

      let board: number[][] = [];
      let revealed: boolean[][] = [];
      let flagged: boolean[][] = [];
      let gameOver = false;
      let firstClick = true;
      let flagCount = 0;
      let revealCount = 0;

      function initBoard(sr: number, sc: number) {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        gameOver = false;
        firstClick = false;
        flagCount = 0;
        revealCount = 0;

        let placed = 0;
        while (placed < MINES) {
          const r = Math.floor(Math.random() * ROWS);
          const c = Math.floor(Math.random() * COLS);
          if (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) continue;
          if (board[r][c] === -1) continue;
          board[r][c] = -1;
          placed++;
        }

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (board[r][c] === -1) continue;
            let n = 0;
            for (let dr = -1; dr <= 1; dr++)
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) n++;
              }
            board[r][c] = n;
          }
        }
      }

      function reveal(r: number, c: number) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || revealed[r][c] || flagged[r][c]) return;
        revealed[r][c] = true;
        revealCount++;
        if (board[r][c] === 0) {
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
              reveal(r + dr, c + dc);
        }
      }

      function floodReveal(sr: number, sc: number) {
        reveal(sr, sc);
      }

      function checkWin() {
        return revealCount >= ROWS * COLS - MINES;
      }

      function revealAllMines() {
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            if (board[r][c] === -1) revealed[r][c] = true;
      }

      function restart() {
        firstClick = true;
        if (overlay) { root.stage.removeChild(overlay); overlay.destroy({ children: true }); overlay = null; }
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        gameOver = false;
        flagCount = 0;
        revealCount = 0;
        flagText.text = 'flags: 0';
        renderBoard();
      }

      let overlay: PIXI.Container | null = null;

      function showOverlay(text: string, color: number) {
        if (overlay) root.stage.removeChild(overlay);
        overlay = new PIXI.Container();
        const dim = new PIXI.Graphics()
          .rect(ox, oy, boardW, boardH)
          .fill({ color: 0x000000, alpha: 0.6 });
        overlay.addChild(dim);
        const t = new PIXI.Text({
          text,
          style: { fontSize: 32, fill: color, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        t.anchor.set(0.5);
        t.x = ox + boardW / 2;
        t.y = oy + boardH / 2;
        overlay.addChild(t);
        root.stage.addChild(overlay);
      }

      const cells: PIXI.Container[] = [];

      function renderBoard() {
        for (const c of cells) {
          root.stage.removeChild(c);
          c.destroy({ children: true });
        }
        cells.length = 0;

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const cell = new PIXI.Container();
            cell.x = ox + c * CELL;
            cell.y = oy + r * CELL;
            cell.eventMode = 'static';
            cell.hitArea = new PIXI.Rectangle(0, 0, CELL, CELL);
            cell.cursor = 'pointer';

            const bg = new PIXI.Graphics();
            cell.addChild(bg);

            if (revealed[r][c]) {
              bg.rect(0, 0, CELL, CELL).fill({ color: COLORS.revealed }).stroke({ width: 0.5, color: 0x2a2a3a });
              if (board[r][c] === -1) {
                bg.circle(CELL / 2, CELL / 2, 6).fill({ color: COLORS.mine });
              } else if (board[r][c] > 0) {
                const num = new PIXI.Text({
                  text: String(board[r][c]),
                  style: { fontSize: 14, fill: COLORS.num[board[r][c]], fontFamily: 'monospace', fontWeight: 'bold' },
                });
                num.anchor.set(0.5);
                num.x = CELL / 2;
                num.y = CELL / 2;
                cell.addChild(num);
              }
            } else if (flagged[r][c]) {
              bg.rect(0, 0, CELL, CELL).fill({ color: COLORS.hidden }).stroke({ width: 0.5, color: 0x3a2a2a });
              bg.circle(CELL / 2, CELL / 2, 6).fill({ color: COLORS.flag });
            } else {
              bg.rect(0, 0, CELL, CELL).fill({ color: COLORS.hidden }).stroke({ width: 0.5, color: 0x2a2a3a });
            }

            cell.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
              e.stopPropagation();
              if (gameOver) {
                if (overlay) { root.stage.removeChild(overlay); overlay.destroy({ children: true }); overlay = null; }
                flagCount = 0;
                revealCount = 0;
                flagText.text = 'flags: 0';
                initBoard(r, c);
                if (board[r][c] === 0) floodReveal(r, c);
                else reveal(r, c);
                renderBoard();
                return;
              }
              if (e.button === 2) {
                if (revealed[r][c]) return;
                flagged[r][c] = !flagged[r][c];
                flagCount += flagged[r][c] ? 1 : -1;
                flagText.text = `flags: ${flagCount}`;
                renderBoard();
                return;
              }
              if (flagged[r][c]) return;
              if (firstClick) {
                initBoard(r, c);
                firstClick = false;
              }
              if (board[r][c] === -1) {
                gameOver = true;
                revealAllMines();
                renderBoard();
                showOverlay('Game Over', 0xff4455);
                return;
              }
              if (board[r][c] === 0) floodReveal(r, c);
              else reveal(r, c);
              renderBoard();
              if (checkWin()) {
                gameOver = true;
                showOverlay('You Win!', 0x44ff88);
              }
            });

            root.stage.addChild(cell);
            cells.push(cell);
          }
        }
      }

      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

      const flagText = new PIXI.Text({
        text: 'flags: 0',
        style: { fontSize: 14, fill: 0xaaaacc, fontFamily: 'monospace' },
      });
      flagText.x = 12;
      flagText.y = 12;
      root.stage.addChild(flagText);

      const resetBtn = makeButton('Reset', 80, 28, restart, 0x4a3a2e);
      resetBtn.x = W - 100;
      resetBtn.y = 12;
      root.stage.addChild(resetBtn);

      const hint = new PIXI.Text({
        text: 'left=reveal · right=flag',
        style: { fontSize: 11, fill: 0x556688, fontFamily: 'monospace' },
      });
      hint.x = W - 220;
      hint.y = 18;
      root.stage.addChild(hint);

      renderBoard();

      const onCtx = (e: MouseEvent) => e.preventDefault();
      window.addEventListener('contextmenu', onCtx);
      renderBoard();

      return () => {
        window.removeEventListener('contextmenu', onCtx);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentMinesweeperDisplay.head = {
  title: 'Minesweeper',
  description: 'Classic minesweeper — left click to reveal, right click to flag, first click safe, win/loss detection.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
