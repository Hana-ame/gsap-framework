// Example: Tetris game on SubCanvas
import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { makeButton, makeInfoPanel } from '@components';

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const SIDE = 120;

type Board = number[][];

const PIECES: number[][][] = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
];

const COLORS = [0x44ffff, 0xffff44, 0xaa44ff, 0x4488ff, 0xff8844, 0x44ff88, 0xff4455];

export function ComponentTetrisDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '俄罗斯方块', lines: ['目的：经典俄罗斯方块堆叠游戏。', '操作：方向键移动/旋转。向下加速。消除行得分。', '预期：方块下落并堆叠。完整行消除。游戏随时间加速。方块堆到顶部时游戏结束。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const ox = (W - COLS * CELL) / 2 - SIDE / 2;
      const oy = (H - ROWS * CELL) / 2;

      let board: Board;
      let piece: number[][];
      let pieceType: number;
      let px: number, py: number;
      let score = 0;
      let level = 1;
      let lines = 0;
      let gameOver = false;
      let dropTimer = 0;

      function newBoard(): Board {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      }

      function spawn() {
        pieceType = Math.floor(Math.random() * PIECES.length);
        piece = PIECES[pieceType].map((r) => [...r]);
        px = Math.floor((COLS - piece[0].length) / 2);
        py = 0;
        if (collides(piece, px, py)) { gameOver = true; showOverlay(); }
      }

      function collides(p: number[][], x: number, y: number): boolean {
        for (let r = 0; r < p.length; r++)
          for (let c = 0; c < p[r].length; c++)
            if (p[r][c] && (x + c < 0 || x + c >= COLS || y + r >= ROWS || (y + r >= 0 && board[y + r][x + c])))
              return true;
        return false;
      }

      function lockPiece() {
        for (let r = 0; r < piece.length; r++)
          for (let c = 0; c < piece[r].length; c++)
            if (piece[r][c]) board[py + r][px + c] = pieceType + 1;

        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every((v) => v !== 0)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            r++;
          }
        }

        if (cleared > 0) {
          lines += cleared;
          score += cleared * 100 * level;
          level = Math.floor(lines / 10) + 1;
        }

        spawn();
        draw();
      }

      function rotate() {
        const rotated = piece[0].map((_, i) => piece.map((r) => r[i]).reverse());
        if (!collides(rotated, px, py)) piece = rotated;
      }

      function movePiece(dx: number, dy: number) {
        if (!collides(piece, px + dx, py + dy)) { px += dx; py += dy; return true; }
        if (dy > 0) { lockPiece(); draw(); }
        return false;
      }

      function hardDrop() {
        while (!collides(piece, px, py + 1)) py++;
        lockPiece();
        draw();
      }

      function draw() {
        root.stage.removeChildren();
        drawBoard();
        drawPiece();
        drawSidebar();
      }

      let overlay: PIXI.Container | null = null;
      function showOverlay() {
        if (overlay) return;
        overlay = new PIXI.Container();
        const dim = new PIXI.Graphics().rect(ox, oy, COLS * CELL, ROWS * CELL).fill({ color: 0x000000, alpha: 0.6 });
        overlay.addChild(dim);
        const t = new PIXI.Text({
          text: 'Game Over',
          style: { fontSize: 28, fill: 0xff4455, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        t.anchor.set(0.5);
        t.x = ox + COLS * CELL / 2;
        t.y = oy + ROWS * CELL / 2 - 20;
        overlay.addChild(t);
        const s = new PIXI.Text({
          text: `Score: ${score}`,
          style: { fontSize: 16, fill: 0xcccccc, fontFamily: 'monospace' },
        });
        s.anchor.set(0.5);
        s.x = ox + COLS * CELL / 2;
        s.y = oy + ROWS * CELL / 2 + 20;
        overlay.addChild(s);
        root.stage.addChild(overlay);
      }

      function drawBoard() {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const g = new PIXI.Graphics();
            if (board[r][c]) {
              g.rect(ox + c * CELL, oy + r * CELL, CELL, CELL).fill({ color: COLORS[board[r][c] - 1], alpha: 0.85 });
            } else {
              g.rect(ox + c * CELL, oy + r * CELL, CELL, CELL).stroke({ width: 0.5, color: 0x1a1a2a });
            }
            g.eventMode = 'none';
            root.stage.addChild(g);
          }
        }
      }

      function drawPiece() {
        for (let r = 0; r < piece.length; r++) {
          for (let c = 0; c < piece[r].length; c++) {
            if (!piece[r][c]) continue;
            const g = new PIXI.Graphics()
              .rect(ox + (px + c) * CELL, oy + (py + r) * CELL, CELL, CELL)
              .fill({ color: COLORS[pieceType], alpha: 0.85 });
            g.eventMode = 'none';
            root.stage.addChild(g);
          }
        }
      }

      function drawSidebar() {
        const sx = ox + COLS * CELL + 20;
        const title = new PIXI.Text({
          text: 'TETRIS',
          style: { fontSize: 22, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        title.x = sx;
        title.y = oy + 10;
        root.stage.addChild(title);

        const scoreLbl = new PIXI.Text({ text: 'Score', style: { fontSize: 11, fill: 0x666888, fontFamily: 'monospace' } });
        scoreLbl.x = sx; scoreLbl.y = oy + 50;
        root.stage.addChild(scoreLbl);
        const scoreV = new PIXI.Text({ text: String(score), style: { fontSize: 18, fill: 0x88aacc, fontFamily: 'monospace', fontWeight: 'bold' } });
        scoreV.x = sx; scoreV.y = oy + 66;
        root.stage.addChild(scoreV);

        const linesLbl = new PIXI.Text({ text: 'Lines', style: { fontSize: 11, fill: 0x666888, fontFamily: 'monospace' } });
        linesLbl.x = sx; linesLbl.y = oy + 100;
        root.stage.addChild(linesLbl);
        const linesV = new PIXI.Text({ text: String(lines), style: { fontSize: 18, fill: 0x88aacc, fontFamily: 'monospace', fontWeight: 'bold' } });
        linesV.x = sx; linesV.y = oy + 116;
        root.stage.addChild(linesV);

        const lvlLbl = new PIXI.Text({ text: 'Level', style: { fontSize: 11, fill: 0x666888, fontFamily: 'monospace' } });
        lvlLbl.x = sx; lvlLbl.y = oy + 150;
        root.stage.addChild(lvlLbl);
        const lvlV = new PIXI.Text({ text: String(level), style: { fontSize: 18, fill: 0x88aacc, fontFamily: 'monospace', fontWeight: 'bold' } });
        lvlV.x = sx; lvlV.y = oy + 166;
        root.stage.addChild(lvlV);

        const resetBtn = makeButton('Restart', 90, 28, () => {
          board = newBoard();
          score = 0; level = 1; lines = 0;
          gameOver = false;
          if (overlay) { root.stage.removeChild(overlay); overlay.destroy({ children: true }); overlay = null; }
          spawn();
          drawBoard();
          drawPiece();
          drawSidebar();
        }, 0x4a3a2e);
        resetBtn.x = sx;
        resetBtn.y = oy + 210;
        root.stage.addChild(resetBtn);
      }

      function onKey(e: KeyboardEvent) {
        if (gameOver) return;
        switch (e.key) {
          case 'ArrowLeft': movePiece(-1, 0); draw(); break;
          case 'ArrowRight': movePiece(1, 0); draw(); break;
          case 'ArrowDown': movePiece(0, 1); draw(); break;
          case 'ArrowUp': rotate(); draw(); break;
          case ' ': hardDrop(); draw(); break;
        }
      }
      window.addEventListener('keydown', onKey);

      board = newBoard();
      spawn();
      draw();

      const ticker = proxy.ticker;
      const tickFn = () => {
        if (gameOver) return;
        dropTimer += ticker.deltaTime;
        const speed = Math.max(2, 20 - level);
        if (dropTimer >= speed) {
          dropTimer = 0;
          movePiece(0, 1);
          draw();
        }
      };
      ticker.add(tickFn);

      return () => {
        ticker.remove(tickFn);
        window.removeEventListener('keydown', onKey);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentTetrisDisplay.head = {
  title: 'Tetris',
  description: 'Classic tetris — arrow keys to move/rotate, space to hard-drop, line clearing, scoring, levels, game over.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
