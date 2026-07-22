import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, type SubCanvasProxy } from '@framework';
import { createWindow, makeButton, createScrollable } from '@components';
import type { GameWindow } from '@components/PixiWindow';

type EntityType = 'grass' | 'herbivore' | 'carnivore';

interface Entity {
  id: number;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  maxEnergy: number;
  visionRange: number;
  speed: number;
  size: number;
  container: PIXI.Container;
  body: PIXI.Graphics;
  alive: boolean;
  regrowTimer: number;
  splitCooldown: number;
}

const COLORS = {
  grass: 0x44cc44,
  grassInner: 0x66ee66,
  herbivore: 0x4488ff,
  herbivoreInner: 0x77aaff,
  carnivore: 0xff4444,
  carnivoreInner: 0xff6666,
};

const CFG = {
  grassSize: 4,
  herbivoreSize: 7,
  carnivoreSize: 9,
  herbivoreVision: 200,
  carnivoreVision: 280,
  herbivoreSpeed: 220,
  carnivoreSpeed: 300,
  herbivoreMaxEnergy: 120,
  carnivoreMaxEnergy: 150,
  grassMaxEnergy: 50,
  eatGrassEnergy: 5,
  eatHerbivoreEnergy: 60,
  eatRange: 8,
  initialGrass: 25,
  initialHerbivores: 3,
  initialCarnivores: 1,
  maxGrass: 40,
  grassGrowRate: 0.05,
  variationRange: 0.2,
  splitThreshold: 0.9,
  splitCooldown: 3000,
  worldBounds: 600,
};

const WORLD_SIZE = CFG.worldBounds * 2;

let nextId = 0;

function dist(x1: number, y1: number, x2: number, y2: number): number {
  let dx = x2 - x1;
  let dy = y2 - y1;
  if (Math.abs(dx) > CFG.worldBounds) dx -= Math.sign(dx) * WORLD_SIZE;
  if (Math.abs(dy) > CFG.worldBounds) dy -= Math.sign(dy) * WORLD_SIZE;
  return Math.sqrt(dx * dx + dy * dy);
}

function wrapClosestTo(v: number, ref: number): number {
  while (v - ref > CFG.worldBounds) v -= WORLD_SIZE;
  while (v - ref < -CFG.worldBounds) v += WORLD_SIZE;
  return v;
}

function randomInBounds(): { x: number; y: number } {
  const b = CFG.worldBounds;
  return { x: (Math.random() - 0.5) * b * 2, y: (Math.random() - 0.5) * b * 2 };
}


function vary(val: number, range: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val * (1 - range + Math.random() * range * 2)));
}

function calcMetabolism(speed: number, vision: number): number {
  return speed * 0.0015 + vision * 0.001;
}

function createEntity(type: EntityType, x: number, y: number, layer: PIXI.Container, inheritFrom?: Entity): Entity {
  const isGrass = type === 'grass';
  const isHerb = type === 'herbivore';
  const container = new PIXI.Container();
  const body = new PIXI.Graphics();
  const size = isGrass ? CFG.grassSize : isHerb ? CFG.herbivoreSize : CFG.carnivoreSize;
  const color = isGrass ? COLORS.grass : isHerb ? COLORS.herbivore : COLORS.carnivore;
  const inner = isGrass ? COLORS.grassInner : isHerb ? COLORS.herbivoreInner : COLORS.carnivoreInner;

  if (isGrass) {
    body.poly([0, -size, size, 0, 0, size, -size, 0]).fill({ color, alpha: 0.9 });
  } else {
    body.circle(0, 0, size).fill({ color, alpha: 0.9 });
    body.circle(0, 0, size * 0.45).fill({ color: inner, alpha: 0.6 });
    if (isHerb) {
      body.circle(-size * 0.3, -size * 0.2, 1.5).fill({ color: 0xffffff });
      body.circle(size * 0.3, -size * 0.2, 1.5).fill({ color: 0xffffff });
    } else {
      body.circle(-size * 0.25, -size * 0.2, 1.2).fill({ color: 0xffdd88 });
      body.circle(size * 0.25, -size * 0.2, 1.2).fill({ color: 0xffdd88 });
    }
  }

  let speed: number;
  let visionRange: number;
  if (isGrass) {
    speed = 0;
    visionRange = 0;
  } else if (inheritFrom) {
    const r = CFG.variationRange * 0.75;
    speed = vary(inheritFrom.speed, r, 20, 800);
    visionRange = vary(inheritFrom.visionRange, r, 20, 600);
  } else {
    const r = CFG.variationRange;
    const bs = isHerb ? CFG.herbivoreSpeed : CFG.carnivoreSpeed;
    const bv = isHerb ? CFG.herbivoreVision : CFG.carnivoreVision;
    speed = vary(bs, r, 20, 800);
    visionRange = vary(bv, r, 20, 600);
  }

  container.addChild(body);
  container.x = x;
  container.y = y;
  layer.addChild(container);

  return {
    id: nextId++,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    energy: isGrass ? CFG.grassMaxEnergy : isHerb ? CFG.herbivoreMaxEnergy * 0.7 : CFG.carnivoreMaxEnergy * 0.6,
    maxEnergy: isGrass ? CFG.grassMaxEnergy : isHerb ? CFG.herbivoreMaxEnergy : CFG.carnivoreMaxEnergy,
    visionRange,
    speed,
    size,
    container,
    body,
    alive: true,
    regrowTimer: 0,
    splitCooldown: 0,
  };
}

function wrapWorld(e: Entity): void {
  const b = CFG.worldBounds;
  const d = b * 2;
  if (e.x < -b) e.x += d;
  else if (e.x > b) e.x -= d;
  if (e.y < -b) e.y += d;
  else if (e.y > b) e.y -= d;
}

function updateGrass(e: Entity, dt: number, entities: Entity[], layer: PIXI.Container): void {
  if (e.regrowTimer > 0) {
    e.regrowTimer -= dt;
    if (e.regrowTimer <= 0) {
      e.energy = CFG.grassMaxEnergy;
      e.body.alpha = 1;
      e.container.visible = true;
      e.alive = true;
    } else {
      e.body.alpha = 0.2 + 0.8 * (1 - e.regrowTimer / 5000);
    }
    return;
  }
  e.energy = Math.min(e.maxEnergy, e.energy + CFG.grassGrowRate * (dt / 1000));
  trySplit(e, entities, layer, dt);
}

function trySplit(e: Entity, entities: Entity[], layer: PIXI.Container, dt: number): void {
  e.splitCooldown -= dt;
  if (e.splitCooldown > 0) return;
  if (e.energy < e.maxEnergy * CFG.splitThreshold) return;
  const angle = Math.random() * Math.PI * 2;
  const dist2 = 20 + Math.random() * 30;
  const cx = e.x + Math.cos(angle) * dist2;
  const cy = e.y + Math.sin(angle) * dist2;
  e.energy *= 0.5;
  e.splitCooldown = CFG.splitCooldown;
  const child = createEntity(e.type, cx, cy, layer, e);
  child.energy = e.energy;
  child.splitCooldown = CFG.splitCooldown;
  entities.push(child);
}

function nearestOfType(e: Entity, entities: Entity[], targetType: EntityType, maxDist: number): Entity | null {
  let best: Entity | null = null;
  let bestD = maxDist;
  for (const other of entities) {
    if (!other.alive || other.id === e.id) continue;
    if (other.type !== targetType) continue;

    // energy check: only chase/eat living things with energy
    if (targetType === 'grass' && other.energy <= 0) continue;

    const d = dist(e.x, e.y, other.x, other.y);
    if (d <= bestD) {
      bestD = d;
      best = other;
    }
  }
  return best;
}

function steerToward(from: { x: number; y: number }, to: { x: number; y: number }, maxSpeed: number): { vx: number; vy: number } {
  const d = dist(from.x, from.y, to.x, to.y);
  if (d < 0.1) return { vx: 0, vy: 0 };
  const scale = Math.min(maxSpeed * 4, maxSpeed / Math.max(d, 1));
  return { vx: ((to.x - from.x) / d) * maxSpeed, vy: ((to.y - from.y) / d) * maxSpeed };
}

function steerAway(from: { x: number; y: number }, target: { x: number; y: number }, maxSpeed: number): { vx: number; vy: number } {
  const d = dist(from.x, from.y, target.x, target.y);
  if (d < 0.1) return { vx: 0, vy: 0 };
  const scale = Math.min(maxSpeed * 4, maxSpeed / Math.max(d, 1));
  return { vx: ((from.x - target.x) / d) * maxSpeed, vy: ((from.y - target.y) / d) * maxSpeed };
}

function updateHerbivore(e: Entity, dt: number, entities: Entity[], layer: PIXI.Container): void {
  e.energy -= calcMetabolism(e.speed, e.visionRange) * (dt / 1000);
  if (e.energy <= 0) { e.alive = false; return; }

  const predator = nearestOfType(e, entities, 'carnivore', e.visionRange);
  const food = nearestOfType(e, entities, 'grass', e.visionRange);

  let fx = 0, fy = 0;

  if (predator) {
    const dPred = dist(e.x, e.y, predator.x, predator.y);
    const fleeStrength = Math.max(0, 1 - dPred / e.visionRange) * 2;
    const away = steerAway(e, predator, e.speed * fleeStrength);
    fx += away.vx;
    fy += away.vy;
  }

  if (food) {
    const dFood = dist(e.x, e.y, food.x, food.y);
    const chaseStrength = Math.max(0, 1 - dFood / e.visionRange);
    const toward = steerToward(e, food, e.speed * chaseStrength);
    fx += toward.vx;
    fy += toward.vy;

    if (dFood < CFG.eatRange && food.energy > 0) {
      food.energy -= CFG.eatGrassEnergy;
      e.energy = Math.min(e.maxEnergy, e.energy + CFG.eatGrassEnergy);
      food.alive = false;
      food.regrowTimer = 5000;
      food.container.visible = false;
    }
  }

  if (Math.random() < 0.5) {
    // 保持当前速度方向
  } else if (fx === 0 && fy === 0) {
    const wander = 0.3;
    e.vx += (Math.random() - 0.5) * wander * (dt / 1000) * 60;
    e.vy += (Math.random() - 0.5) * wander * (dt / 1000) * 60;
  } else {
    const damping = 3;
    e.vx += (fx - e.vx) * damping * (dt / 1000);
    e.vy += (fy - e.vy) * damping * (dt / 1000);
  }

  const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
  if (spd > e.speed) {
    e.vx = (e.vx / spd) * e.speed;
    e.vy = (e.vy / spd) * e.speed;
  }

  e.x += e.vx * (dt / 1000);
  e.y += e.vy * (dt / 1000);
  wrapWorld(e);
  trySplit(e, entities, layer, dt);
}

function updateCarnivore(e: Entity, dt: number, entities: Entity[], layer: PIXI.Container): void {
  e.energy -= calcMetabolism(e.speed, e.visionRange) * (dt / 1000);
  if (e.energy <= 0) { e.alive = false; return; }

  const food = nearestOfType(e, entities, 'herbivore', e.visionRange);

  let fx = 0, fy = 0;

  if (!food) {
    const rival = nearestOfType(e, entities, 'carnivore', e.visionRange);
    if (rival) {
      const dRival = dist(e.x, e.y, rival.x, rival.y);
      const fleeStrength = Math.max(0, 1 - dRival / e.visionRange);
      const away = steerAway(e, rival, e.speed * fleeStrength);
      fx += away.vx;
      fy += away.vy;
    }
  }

  if (food) {
    const dFood = dist(e.x, e.y, food.x, food.y);
    const chaseStrength = Math.max(0, 1 - dFood / e.visionRange);
    const toward = steerToward(e, food, e.speed * chaseStrength);
    fx += toward.vx;
    fy += toward.vy;

    if (dFood < CFG.eatRange && food.energy > 0) {
      food.alive = false;
      food.container.visible = false;
      e.energy = Math.min(e.maxEnergy, e.energy + CFG.eatHerbivoreEnergy);
    }
  }

  if (fx === 0 && fy === 0) {
    const wander = 0.3;
    e.vx += (Math.random() - 0.5) * wander * (dt / 1000) * 60;
    e.vy += (Math.random() - 0.5) * wander * (dt / 1000) * 60;
  } else {
    const damping = 3;
    e.vx += (fx - e.vx) * damping * (dt / 1000);
    e.vy += (fy - e.vy) * damping * (dt / 1000);
  }

  const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
  if (spd > e.speed) {
    e.vx = (e.vx / spd) * e.speed;
    e.vy = (e.vy / spd) * e.speed;
  }

  e.x += e.vx * (dt / 1000);
  e.y += e.vy * (dt / 1000);
  wrapWorld(e);
  trySplit(e, entities, layer, dt);
}

function syncEntityVisual(e: Entity, refX: number, refY: number): void {
  if (!e.alive) return;
  e.container.x = wrapClosestTo(e.x, refX);
  e.container.y = wrapClosestTo(e.y, refY);

  const pct = Math.max(0.3, e.energy / e.maxEnergy);
  e.body.alpha = pct * 0.3 + 0.5;
}

function rebuildCountText(t: PIXI.Text, entities: Entity[]): void {
  let gc = 0, hc = 0, cc = 0;
  for (const e of entities) {
    if (e.type === 'grass' && e.regrowTimer <= 0) gc++;
    else if (e.type === 'herbivore' && e.alive) hc++;
    else if (e.type === 'carnivore' && e.alive) cc++;
  }
  t.text = `G:${gc}  H:${hc}  C:${cc}`;
}

export function ComponentEcosystemDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const CHUNK = 400;

      const ic = new InfiniteCanvas({
        parent: root,
        viewport: root.bounds,
        chunkSize: CHUNK,
        preloadMargin: 2,
        chunkCreate: () => {},
        chunkDestroy: () => {},
        decelerate: true,
        minZoom: 0.15,
        maxZoom: 4,
      });

      const gridLayer = new PIXI.Graphics();
      ic.worldContainer.addChild(gridLayer);

      const entityLayer = new PIXI.Container();
      ic.worldContainer.addChild(entityLayer);

      const entities: Entity[] = [];

      for (let i = 0; i < CFG.initialGrass; i++) {
        const p = randomInBounds();
        entities.push(createEntity('grass', p.x, p.y, entityLayer));
      }
      for (let i = 0; i < CFG.initialHerbivores; i++) {
        const p = randomInBounds();
        entities.push(createEntity('herbivore', p.x, p.y, entityLayer));
      }
      for (let i = 0; i < CFG.initialCarnivores; i++) {
        const p = randomInBounds();
        entities.push(createEntity('carnivore', p.x, p.y, entityLayer));
      }

      const win = createWindow({
        parent: root,
        title: 'Ecosystem',
        x: 20,
        y: 20,
        width: 170,
        height: 200,
        draggable: true,
        closable: true,
        dragMode: 'title',
      });

      const countText = new PIXI.Text({
        text: '',
        style: { fontSize: 12, fill: 0xccccdd, fontFamily: 'monospace' },
      });
      countText.x = 10;
      countText.y = 10;
      win.content.stage.addChild(countText);
      rebuildCountText(countText, entities);

      const spawnBtn = (label: string, y: number, bg: number, onClick: () => void) => {
        const btn = makeButton(label, win.content.bounds.width - 20, 26, onClick, bg);
        btn.x = 10;
        btn.y = y;
        win.content.stage.addChild(btn);
        return btn;
      };

      spawnBtn('+ Grass x5', 40, 0x1a3a1a, () => {
        for (let i = 0; i < 5; i++) {
          const p = randomInBounds();
          entities.push(createEntity('grass', p.x, p.y, entityLayer));
        }
        rebuildCountText(countText, entities);
      });

      spawnBtn('+ Herbivore', 74, 0x1a2a4a, () => {
        const p = randomInBounds();
        entities.push(createEntity('herbivore', p.x, p.y, entityLayer));
        rebuildCountText(countText, entities);
      });

      spawnBtn('+ Carnivore', 108, 0x4a1a1a, () => {
        const p = randomInBounds();
        entities.push(createEntity('carnivore', p.x, p.y, entityLayer));
        rebuildCountText(countText, entities);
      });

      const resetBtn = makeButton('Reset', win.content.bounds.width - 20, 26, () => {
        for (const e of entities) {
          e.alive = false;
          e.container.visible = false;
        }
        entities.length = 0;
        for (let i = 0; i < CFG.initialGrass; i++) {
          const p = randomInBounds();
          entities.push(createEntity('grass', p.x, p.y, entityLayer));
        }
        for (let i = 0; i < CFG.initialHerbivores; i++) {
          const p = randomInBounds();
          entities.push(createEntity('herbivore', p.x, p.y, entityLayer));
        }
        for (let i = 0; i < CFG.initialCarnivores; i++) {
          const p = randomInBounds();
          entities.push(createEntity('carnivore', p.x, p.y, entityLayer));
        }
        rebuildCountText(countText, entities);
      }, 0x2a2a2a);
      resetBtn.x = 10;
      resetBtn.y = 142;
      win.content.stage.addChild(resetBtn);

      function makeParamRow(label: string, opts: {
        get: () => number; set: (v: number) => void; min: number; max: number; step: number; digits: number;
      }): PIXI.Container {
        const wrap = new PIXI.Container();

        let current = opts.get();
        const labelText = new PIXI.Text({
          text: `${label}: ${current}`,
          style: { fontSize: 11, fill: 0xffdd88, fontFamily: 'monospace' },
        });
        labelText.x = 0; labelText.y = 0;
        wrap.addChild(labelText);

        const btnW = 22, btnH = 22;
        const stepLabel = opts.step === 1 ? '' : String(opts.step);
        const btnW2 = opts.step > 9 ? 28 : btnW;

        const clamp = (v: number) => Math.round(Math.max(opts.min, Math.min(opts.max, v)) * 100) / 100;

        const next = (delta: number) => {
          current = clamp(current + delta);
          labelText.text = `${label}: ${current}`;
          opts.set(current);
        };

        const minus = makeButton('−' + stepLabel, btnW2, btnH, () => next(-opts.step), 0x1a1a2e);
        minus.x = 0; minus.y = 16;
        wrap.addChild(minus);

        const plus = makeButton('+' + stepLabel, btnW2, btnH, () => next(opts.step), 0x1a1a2e);
        plus.x = btnW2 + 4; plus.y = 16;
        wrap.addChild(plus);

        return wrap;
      }

      let settingsWin: GameWindow | null = null;

      const toggleSettings = () => {
        if (settingsWin && !settingsWin.destroyed) {
          settingsWin.destroy();
          settingsWin = null;
          return;
        }
        const w = createWindow({
          parent: root,
          title: 'Settings',
          x: 20,
          y: 180,
          width: 200,
          height: 340,
          draggable: true,
          closable: true,
          dragMode: 'title',
        });
        const scroll = createScrollable({ parent: w.content, width: 200, height: 318, scrollbar: true });
        let sy = 8;
        const addRow = (label: string, opts: { get: () => number; set: (v: number) => void; min: number; max: number; step: number; digits: number }) => {
          const row = makeParamRow(label, opts);
          row.x = 10; row.y = sy;
          scroll.content.addChild(row);
          sy += 42;
        };
        addRow('草上限', { get: () => CFG.maxGrass, set: v => CFG.maxGrass = v, min: 10, max: 10000, step: 10, digits: 5 });
        addRow('草生长', { get: () => CFG.grassGrowRate, set: v => CFG.grassGrowRate = v, min: 0, max: 2, step: 0.05, digits: 4 });
        addRow('草大小', { get: () => CFG.grassSize, set: v => CFG.grassSize = v, min: 1, max: 20, step: 1, digits: 2 });
        addRow('草能量', { get: () => CFG.grassMaxEnergy, set: v => CFG.grassMaxEnergy = v, min: 1, max: 200, step: 5, digits: 3 });
        addRow('草营养', { get: () => CFG.eatGrassEnergy, set: v => CFG.eatGrassEnergy = v, min: 1, max: 100, step: 1, digits: 3 });
        addRow('草食速度', { get: () => CFG.herbivoreSpeed, set: v => CFG.herbivoreSpeed = v, min: 20, max: 800, step: 20, digits: 3 });
        addRow('草食视野', { get: () => CFG.herbivoreVision, set: v => CFG.herbivoreVision = v, min: 20, max: 600, step: 20, digits: 3 });
        addRow('草食能量', { get: () => CFG.herbivoreMaxEnergy, set: v => CFG.herbivoreMaxEnergy = v, min: 10, max: 500, step: 10, digits: 3 });
        addRow('草食大小', { get: () => CFG.herbivoreSize, set: v => CFG.herbivoreSize = v, min: 2, max: 30, step: 1, digits: 2 });
        addRow('肉食速度', { get: () => CFG.carnivoreSpeed, set: v => CFG.carnivoreSpeed = v, min: 20, max: 800, step: 20, digits: 3 });
        addRow('肉食视野', { get: () => CFG.carnivoreVision, set: v => CFG.carnivoreVision = v, min: 20, max: 600, step: 20, digits: 3 });
        addRow('肉食能量', { get: () => CFG.carnivoreMaxEnergy, set: v => CFG.carnivoreMaxEnergy = v, min: 10, max: 500, step: 10, digits: 3 });
        addRow('肉食大小', { get: () => CFG.carnivoreSize, set: v => CFG.carnivoreSize = v, min: 2, max: 30, step: 1, digits: 2 });
        addRow('肉营养', { get: () => CFG.eatHerbivoreEnergy, set: v => CFG.eatHerbivoreEnergy = v, min: 1, max: 200, step: 5, digits: 3 });
        addRow('进食范围', { get: () => CFG.eatRange, set: v => CFG.eatRange = v, min: 1, max: 80, step: 2, digits: 2 });
        addRow('变异范围', { get: () => CFG.variationRange, set: v => CFG.variationRange = v, min: 0.05, max: 0.6, step: 0.05, digits: 3 });
        addRow('分裂阈值', { get: () => CFG.splitThreshold, set: v => CFG.splitThreshold = v, min: 0.1, max: 1, step: 0.05, digits: 3 });
        addRow('分裂冷却', { get: () => CFG.splitCooldown, set: v => CFG.splitCooldown = v, min: 500, max: 30000, step: 500, digits: 5 });
        scroll.recalc();
        settingsWin = w;
      };

      const coordText = new PIXI.Text({
        text: `world: (0, 0)  zoom: 1.0x`,
        style: { fontSize: 11, fill: 0x6688aa, fontFamily: 'monospace' },
      });
      coordText.x = 12;
      coordText.y = root.bounds.height - 24;
      root.stage.addChild(coordText);

      const legend = new PIXI.Text({
        text: '● Grass    ● Herbivore    ● Carnivore',
        style: { fontSize: 11, fill: 0x8899aa, fontFamily: 'monospace' },
      });
      legend.x = 12;
      legend.y = root.bounds.height - 44;
      root.stage.addChild(legend);

      const grassDot = new PIXI.Graphics().circle(14, root.bounds.height - 38, 4).fill({ color: COLORS.grass });
      const herbDot = new PIXI.Graphics().circle(68, root.bounds.height - 38, 5).fill({ color: COLORS.herbivore });
      const carnDot = new PIXI.Graphics().circle(148, root.bounds.height - 38, 6).fill({ color: COLORS.carnivore });
      root.stage.addChild(grassDot, herbDot, carnDot);

      const zoomText = new PIXI.Text({
        text: 'zoom: 1.0x',
        style: { fontSize: 11, fill: 0x6688aa, fontFamily: 'monospace' },
      });
      zoomText.x = root.bounds.width - 200;
      zoomText.y = root.bounds.height - 24;
      root.stage.addChild(zoomText);

      const mkZoomBtn = (label: string, x: number, onClick: () => void) => {
        const btn = makeButton(label, 54, 24, onClick, 0x14142a);
        btn.x = x;
        btn.y = root.bounds.height - 50;
        root.stage.addChild(btn);
      };

      mkZoomBtn('+ zoom', root.bounds.width - 200, () => {
        ic.setZoom(ic.zoom * 1.5, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = `zoom: ${ic.zoom.toFixed(1)}x`;
      });
      mkZoomBtn('- zoom', root.bounds.width - 140, () => {
        ic.setZoom(ic.zoom / 1.5, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = `zoom: ${ic.zoom.toFixed(1)}x`;
      });
      mkZoomBtn('1x', root.bounds.width - 80, () => {
        ic.setZoom(1, root.bounds.width / 2, root.bounds.height / 2);
        zoomText.text = 'zoom: 1.0x';
      });
      mkZoomBtn('Settings', root.bounds.width - 280, toggleSettings);

      let lastGridRange = { minCx: 0, maxCx: 0, minCy: 0, maxCy: 0 };

      const updateGrid = () => {
        const cs = CHUNK;
        const tl = ic.screenToWorld(0, 0);
        const br = ic.screenToWorld(root.bounds.width, root.bounds.height);
        const minCx = Math.floor(tl.x / cs) - 1;
        const maxCx = Math.ceil(br.x / cs) + 1;
        const minCy = Math.floor(tl.y / cs) - 1;
        const maxCy = Math.ceil(br.y / cs) + 1;
        const r = lastGridRange;
        if (r.minCx === minCx && r.maxCx === maxCx && r.minCy === minCy && r.maxCy === maxCy) return;
        lastGridRange = { minCx, maxCx, minCy, maxCy };
        gridLayer.clear();
        for (let cx = minCx; cx <= maxCx; cx++) {
          for (let cy = minCy; cy <= maxCy; cy++) {
            const c = (cx + cy) % 2 === 0 ? 0x1a1a2e : 0x12121e;
            gridLayer.rect(cx * cs, cy * cs, cs, cs).fill({ color: c, alpha: 0.6 });
          }
        }
        for (let cx = minCx; cx <= maxCx; cx++) {
          gridLayer.moveTo(cx * cs, tl.y - cs).lineTo(cx * cs, br.y + cs);
        }
        for (let cy = minCy; cy <= maxCy; cy++) {
          gridLayer.moveTo(tl.x - cs, cy * cs).lineTo(br.x + cs, cy * cs);
        }
        gridLayer.stroke({ width: 1, color: 0x2a3a5a, alpha: 0.4 });
      };

      updateGrid();

      const tick = (ticker: PIXI.Ticker) => {
        const dt = ticker.deltaMS;
        if (dt > 100) return;
        updateGrid();

        let grassCount = 0;
        for (const e of entities) {
          if (e.type === 'grass') { updateGrass(e, dt, entities, entityLayer); grassCount++; }
        }

        const toRemove: number[] = [];
        for (let i = 0; i < entities.length; i++) {
          const e = entities[i];
          if (!e.alive) continue;
          if (e.type === 'herbivore') {
            updateHerbivore(e, dt, entities, entityLayer);
            if (!e.alive) toRemove.push(i);
          } else if (e.type === 'carnivore') {
            updateCarnivore(e, dt, entities, entityLayer);
            if (!e.alive) toRemove.push(i);
          }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
          const idx = toRemove[i];
          const e = entities[idx];
          e.container.parent?.removeChild(e.container);
          e.container.destroy({ children: true });
          entities.splice(idx, 1);
        }

        const aliveGrass = entities.filter(e => e.type === 'grass' && e.energy > 0).length;
        if (aliveGrass < CFG.maxGrass && grassCount < CFG.maxGrass) {
          const spawnChance = 1 - aliveGrass / CFG.maxGrass;
          if (Math.random() < spawnChance * 0.08) {
            const p = randomInBounds();
            entities.push(createEntity('grass', p.x, p.y, entityLayer));
          }
        }

        const vpCX = (root.bounds.width / 2 - ic.worldContainer.x) / ic.zoom;
        const vpCY = (root.bounds.height / 2 - ic.worldContainer.y) / ic.zoom;

        for (const e of entities) {
          if (e.alive) syncEntityVisual(e, vpCX, vpCY);
        }

        rebuildCountText(countText, entities);

        coordText.text = `world: (${vpCX.toFixed(0)}, ${vpCY.toFixed(0)})  zoom: ${ic.zoom.toFixed(1)}x`;
      };

      root.ticker.add(tick);
    });

    return () => stop();
  }, []);

  return null;
}

ComponentEcosystemDisplay.head = {
  title: 'Ecosystem',
  description: 'Food chain simulation with grass, herbivores, and carnivores on an infinite canvas.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
