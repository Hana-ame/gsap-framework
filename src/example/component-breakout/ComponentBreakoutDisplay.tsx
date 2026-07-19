import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, makeButton, makeInfoPanel, type SubCanvasProxy } from '@framework';

const PADDLE_W = 100;
const PADDLE_H = 14;
const BALL_R = 6;
const BRICK_W = 58;
const BRICK_H = 18;
const BRICK_GAP = 4;
const COLS = 10;
const ROWS = 6;
const TOP_OFFSET = 50;

const COLORS = [0xff4455, 0xff8844, 0xffdd44, 0x44ff88, 0x4488ff, 0x8844ff];

export function ComponentBreakoutDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      makeInfoPanel(root, { title: '打砖块', lines: ['用途：经典打砖块——弹球击碎所有砖块', '测试方法：用鼠标或方向键移动挡板，不要让球掉落', '预期效果：球在挡板和墙壁之间反弹，接触砖块即击碎，丢球减少生命值，清空所有砖块获胜'], x: window.innerWidth - 400, y: window.innerHeight - 150 });

      const W = window.innerWidth;
      const H = window.innerHeight;
      const ox = (W - COLS * (BRICK_W + BRICK_GAP)) / 2;

      let paddleX = (W - PADDLE_W) / 2;
      let lastPaddleDx = 0;
      let ball = { x: W / 2, y: H - 60, dx: 3, dy: -3, spin: 0, rotation: 0 };
      let score = 0;
      let lives = 3;
      let running = false;
      let gameOver = false;
      let bricks: boolean[][] = [];

      function initBricks() {
        bricks = [];
        for (let r = 0; r < ROWS; r++) {
          bricks[r] = [];
          for (let c = 0; c < COLS; c++) bricks[r][c] = true;
        }
      }
      initBricks();

      const paddleG = new PIXI.Graphics();
      paddleG.eventMode = 'none';
      root.stage.addChild(paddleG);

      const ballG = new PIXI.Graphics();
      ballG.eventMode = 'none';
      root.stage.addChild(ballG);

      const brickG = new PIXI.Graphics();
      brickG.eventMode = 'none';
      root.stage.addChild(brickG);

      const scoreText = new PIXI.Text({
        text: 'Score: 0',
        style: { fontSize: 16, fill: 0xaaaacc, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      scoreText.x = 12;
      scoreText.y = 12;
      root.stage.addChild(scoreText);

      const livesText = new PIXI.Text({
        text: 'Lives: 3',
        style: { fontSize: 16, fill: 0xff4455, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      livesText.x = W - 120;
      livesText.y = 12;
      root.stage.addChild(livesText);

      let overlay: PIXI.Container | null = null;

      function showMessage(text: string, color: number) {
        if (overlay) root.stage.removeChild(overlay);
        overlay = new PIXI.Container();
        const dim = new PIXI.Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.5 });
        overlay.addChild(dim);
        const t = new PIXI.Text({
          text,
          style: { fontSize: 36, fill: color, fontFamily: 'monospace', fontWeight: 'bold' },
        });
        t.anchor.set(0.5);
        t.x = W / 2;
        t.y = H / 2 - 30;
        overlay.addChild(t);
        const h = new PIXI.Text({
          text: 'click to start',
          style: { fontSize: 16, fill: 0x888888, fontFamily: 'monospace' },
        });
        h.anchor.set(0.5);
        h.x = W / 2;
        h.y = H / 2 + 20;
        overlay.addChild(h);
        overlay.eventMode = 'none';
        root.stage.addChild(overlay);
      }

      function draw() {
        paddleG.clear().roundRect(paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H, 6).fill({ color: 0x88aaff });
        ballG.clear();
        ballG.circle(ball.x, ball.y, BALL_R).fill({ color: 0xffffff });
        ballG.moveTo(ball.x, ball.y);
        ballG.lineTo(ball.x + Math.cos(ball.rotation) * BALL_R, ball.y + Math.sin(ball.rotation) * BALL_R);
        ballG.stroke({ width: 2, color: 0xffaa44 });
        brickG.clear();
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!bricks[r][c]) continue;
            const bx = ox + c * (BRICK_W + BRICK_GAP);
            const by = TOP_OFFSET + r * (BRICK_H + BRICK_GAP);
            brickG.rect(bx, by, BRICK_W, BRICK_H).fill({ color: COLORS[r], alpha: 0.9 });
          }
        }
        scoreText.text = `Score: ${score}`;
        livesText.text = `Lives: ${lives}`;
      }

      function resetBall() {
        ball = { x: W / 2, y: H - 60, dx: (Math.random() > 0.5 ? 3 : -3), dy: -3, spin: 0, rotation: 0 };
        running = false;
        showMessage('Get Ready!', 0x88aaff);
      }

      function reset() {
        initBricks();
        score = 0;
        lives = 3;
        gameOver = false;
        resetBall();
        draw();
      }

      root.onMove((e) => {
        const nx = Math.max(0, Math.min(W - PADDLE_W, e.x - PADDLE_W / 2));
        lastPaddleDx = nx - paddleX;
        paddleX = nx;
        draw();
      });

      root.onPress(() => {
        if (gameOver) { reset(); return; }
        if (!running) {
          running = true;
          if (overlay) { root.stage.removeChild(overlay); overlay.destroy({ children: true }); overlay = null; }
        }
      });

      const ticker = proxy.ticker;
      const tickFn = () => {
        if (!running || gameOver) return;

        ball.x += ball.dx;
        ball.y += ball.dy;
        ball.rotation += ball.spin;
        ball.dx += ball.spin * 0.015;
        ball.spin *= 0.99;

        if (ball.x < BALL_R) { ball.x = BALL_R; ball.dx = -ball.dx; ball.spin *= 0.5; }
        if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.dx = -ball.dx; ball.spin *= 0.5; }
        if (ball.y < BALL_R) { ball.y = BALL_R; ball.dy = -ball.dy; }

        if (ball.y + BALL_R > H - PADDLE_H - 10 && ball.dy > 0 &&
            ball.x > paddleX && ball.x < paddleX + PADDLE_W) {
          ball.dy = -ball.dy;
          const hit = (ball.x - paddleX) / PADDLE_W - 0.5;
          ball.dx += hit * 1.5;
          ball.spin += lastPaddleDx * 0.08 + hit * 0.5;
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const maxSpeed = 7;
          if (speed > maxSpeed) { ball.dx = (ball.dx / speed) * maxSpeed; ball.dy = (ball.dy / speed) * maxSpeed; }
          ball.y = H - PADDLE_H - 10 - BALL_R;
        }

        if (ball.y > H + 20) {
          lives--;
          if (lives <= 0) { gameOver = true; showMessage('Game Over', 0xff4455); }
          else resetBall();
          draw();
          return;
        }

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!bricks[r][c]) continue;
            const bx = ox + c * (BRICK_W + BRICK_GAP);
            const by = TOP_OFFSET + r * (BRICK_H + BRICK_GAP);
            if (ball.x + BALL_R > bx && ball.x - BALL_R < bx + BRICK_W &&
                ball.y + BALL_R > by && ball.y - BALL_R < by + BRICK_H) {
              bricks[r][c] = false;
              score += 10;
              const overlapX = (ball.x - bx - BRICK_W / 2) / (BRICK_W / 2);
              const overlapY = (ball.y - by - BRICK_H / 2) / (BRICK_H / 2);
              if (Math.abs(overlapX) > Math.abs(overlapY)) ball.dx = -ball.dx;
              else ball.dy = -ball.dy;

              if (!bricks.some((row) => row.some((b) => b))) {
                gameOver = true;
                showMessage('You Win!', 0x44ff88);
              }
              draw();
              return;
            }
          }
        }
        draw();
      };
      ticker.add(tickFn);

      draw();
      showMessage('Breakout', 0x88aaff);

      const resetBtn = makeButton('Reset', 80, 28, reset, 0x4a3a2e);
      resetBtn.x = W - 210;
      resetBtn.y = 12;
      root.stage.addChild(resetBtn);

      return () => { ticker.remove(tickFn); };
    });

    return () => stop();
  }, []);

  return null;
}

ComponentBreakoutDisplay.head = {
  title: 'Breakout',
  description: 'Classic breakout/arkanoid — move paddle with mouse, break all bricks, 3 lives, score, speed scaling.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
