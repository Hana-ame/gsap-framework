import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, type SubCanvasProxy } from '../../framework';

const CELL = 24;
const GRID_W = 25;
const GRID_H = 25;
const TICK_MS = 150;
const HEAD_COLOR = 0x44ff88;
const BODY_COLOR = 0x22aa66;
const FOOD_COLOR = 0xff4455;
const BG_COLOR = 0x0a0a14;

type Dir = 'up' | 'down' | 'left' | 'right';

interface Pos { x: number; y: number }

function posEq(a: Pos, b: Pos) { return a.x === b.x && a.y === b.y; }

export function ComponentSnakeDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const boardW = GRID_W * CELL;
      const boardH = GRID_H * CELL;
      const ox = (W - boardW) / 2;
      const oy = (H - boardH) / 2;

      const snake: Pos[] = [
        { x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) },
        { x: Math.floor(GRID_W / 2) - 1, y: Math.floor(GRID_H / 2) },
        { x: Math.floor(GRID_W / 2) - 2, y: Math.floor(GRID_H / 2) },
      ];
      let food: Pos = { x: 0, y: 0 };
      let dir: Dir = 'right';
      let nextDir: Dir = 'right';
      let score = 0;
      let gameOver = false;
      let alive = true;

      function randomFood(): Pos {
        const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
        const free: Pos[] = [];
        for (let x = 0; x < GRID_W; x++) {
          for (let y = 0; y < GRID_H; y++) {
            if (!occupied.has(`${x},${y}`)) free.push({ x, y });
          }
        }
        return free[Math.floor(Math.random() * free.length)] || { x: 0, y: 0 };
      }
      food = randomFood();

      const board = new PIXI.Container();
      board.x = ox;
      board.y = oy;
      board.eventMode = 'none';
      root.stage.addChild(board);

      const bg = new PIXI.Graphics()
        .rect(-4, -4, boardW + 8, boardH + 8)
        .fill({ color: BG_COLOR })
        .stroke({ width: 1, color: 0x2a3a4a });
      board.addChild(bg);

      for (let x = 0; x < GRID_W; x++) {
        for (let y = 0; y < GRID_H; y++) {
          const cell = new PIXI.Graphics()
            .rect(x * CELL, y * CELL, CELL, CELL)
            .stroke({ width: 0.5, color: 0x111a22 });
          board.addChild(cell);
        }
      }

      const foodG = new PIXI.Graphics();
      board.addChild(foodG);
      const snakeG = new PIXI.Graphics();
      board.addChild(snakeG);

      const scoreText = new PIXI.Text({
        text: 'Score: 0',
        style: { fontSize: 16, fill: 0xaaaacc, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      scoreText.x = 12;
      scoreText.y = 12;
      root.stage.addChild(scoreText);

      let gameOverOverlay: PIXI.Container | null = null;

      function showGameOver() {
        if (gameOverOverlay) return;
        gameOverOverlay = new PIXI.Container();
        const dim = new PIXI.Graphics()
          .rect(ox - 4, oy - 4, boardW + 8, boardH + 8)
          .fill({ color: 0x000000, alpha: 0.6 });
        gameOverOverlay.addChild(dim);
        const t = new PIXI.Text({
          text: 'Game Over',
          style: { fontSize: 40, fill: 0xff4455, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        t.anchor.set(0.5);
        t.x = ox + boardW / 2;
        t.y = oy + boardH / 2 - 20;
        gameOverOverlay.addChild(t);
        const s = new PIXI.Text({
          text: `Score: ${score}`,
          style: { fontSize: 20, fill: 0xcccccc, fontFamily: 'monospace' },
        });
        s.anchor.set(0.5);
        s.x = ox + boardW / 2;
        s.y = oy + boardH / 2 + 30;
        gameOverOverlay.addChild(s);
        gameOverOverlay.eventMode = 'none';
        root.stage.addChild(gameOverOverlay);
      }

      function draw() {
        snakeG.clear();
        for (let i = snake.length - 1; i >= 0; i--) {
          const p = snake[i];
          const color = i === 0 ? HEAD_COLOR : BODY_COLOR;
          const m = i === 0 ? 2 : 3;
          snakeG.rect(p.x * CELL + m, p.y * CELL + m, CELL - m * 2, CELL - m * 2).fill({ color });
        }
        foodG.clear();
        foodG.circle(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3).fill({ color: FOOD_COLOR });
      }

      function step() {
        if (!alive) return;
        dir = nextDir;

        const head = snake[0];
        const nh: Pos = { x: head.x, y: head.y };
        switch (dir) {
          case 'up': nh.y--; break;
          case 'down': nh.y++; break;
          case 'left': nh.x--; break;
          case 'right': nh.x++; break;
        }

        if (nh.x < 0 || nh.x >= GRID_W || nh.y < 0 || nh.y >= GRID_H) {
          gameOver = true;
          alive = false;
          showGameOver();
          return;
        }

        if (snake.some((p) => posEq(p, nh))) {
          gameOver = true;
          alive = false;
          showGameOver();
          return;
        }

        snake.unshift(nh);

        if (posEq(nh, food)) {
          score++;
          scoreText.text = `Score: ${score}`;
          food = randomFood();
        } else {
          snake.pop();
        }

        draw();
      }

      function reset() {
        snake.length = 0;
        snake.push(
          { x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) },
          { x: Math.floor(GRID_W / 2) - 1, y: Math.floor(GRID_H / 2) },
          { x: Math.floor(GRID_W / 2) - 2, y: Math.floor(GRID_H / 2) },
        );
        dir = 'right';
        nextDir = 'right';
        score = 0;
        gameOver = false;
        alive = true;
        scoreText.text = 'Score: 0';
        food = randomFood();
        if (gameOverOverlay) {
          root.stage.removeChild(gameOverOverlay);
          gameOverOverlay.destroy({ children: true });
          gameOverOverlay = null;
        }
        draw();
      }

      function onKey(e: KeyboardEvent) {
        if (!alive) return;
        const nd: Record<string, Dir> = {
          ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
          w: 'up', s: 'down', a: 'left', d: 'right',
        };
        const d = nd[e.key];
        if (!d) return;
        e.preventDefault();
        const opposites: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[d] !== dir) nextDir = d;
      }
      window.addEventListener('keydown', onKey);

      const ticker = proxy.ticker;
      let lastTick = 0;
      const tickFn = () => {
        if (gameOver) return;
        const now = performance.now();
        if (now - lastTick >= TICK_MS) {
          step();
          lastTick = now;
        }
      };
      ticker.add(tickFn);

      draw();

      const resetBtn = makeButton('Restart', 90, 30, reset, 0x4a3a2e);
      resetBtn.x = W - 110;
      resetBtn.y = 12;
      root.stage.addChild(resetBtn);

      const hint = new PIXI.Text({
        text: 'arrow keys / WASD',
        style: { fontSize: 11, fill: 0x556688, fontFamily: 'monospace' },
      });
      hint.x = W - 210;
      hint.y = 18;
      root.stage.addChild(hint);

      return () => {
        ticker.remove(tickFn);
        window.removeEventListener('keydown', onKey);
      };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentSnakeDisplay.head = {
  title: 'Snake Game',
  description: 'Classic snake game — arrow keys / WASD to move, eat food to grow. All PIXI-rendered.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
