import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, type SubCanvasProxy, type SubPointerEvent } from '@framework';

type UnitType = 'soldier' | 'tank' | 'artillery' | 'aa';

const UNIT_DEFS: Record<UnitType, { hp: number; damage: number; range: number; speed: number; size: number; cost: number }> = {
  soldier: { hp: 60, damage: 10, range: 80, speed: 100, size: 24, cost: 30 },
  tank: { hp: 250, damage: 40, range: 120, speed: 65, size: 40, cost: 80 },
  artillery: { hp: 80, damage: 70, range: 280, speed: 40, size: 32, cost: 140 },
  aa: { hp: 70, damage: 22, range: 200, speed: 75, size: 28, cost: 65 },
};

const WORLD = 2000;
const TEAM_COLORS = [0x4488ff, 0xcc44cc, 0xff5555, 0x44cc55];
const TEAM_NAMES = ['BLUE', 'PURPLE', 'RED', 'GREEN'];
const TERRAIN_FACTOR: Record<number, number> = { 0: 1, 1: 0.45, 2: 0.15 };
const GOLD_RATE = 3;
const CAPTURE_RADIUS = 130;
const CAPTURE_TIME = 5000;
const UNIT_TYPES: UnitType[] = ['soldier', 'tank', 'artillery', 'aa'];
const START_GOLD = 100;
let nextId = 1;

interface Unit {
  id: number; team: number; type: UnitType;
  x: number; y: number; tx: number; ty: number;
  hp: number; maxHp: number; damage: number; range: number; speed: number;
  size: number; atkCd: number; alive: boolean;
  c: PIXI.Container; body: PIXI.Graphics; hpBar: PIXI.Graphics;
}

interface ControlPoint {
  cx: number; cy: number; owner: number; // -1 = neutral, 0-3 = team
  capProgress: number;
  c: PIXI.Container; ring: PIXI.Graphics;
}

function makeUnit(team: number, type: UnitType, x: number, y: number, layer: PIXI.Container): Unit {
  const def = UNIT_DEFS[type];
  const body = new PIXI.Graphics();
  const hpBar = new PIXI.Graphics();
  const c = new PIXI.Container();
  c.addChild(body, hpBar);
  c.x = x; c.y = y;
  layer.addChild(c);
  const color = TEAM_COLORS[team];
  body.circle(0, 0, def.size).fill({ color, alpha: 0.9 });
  body.circle(0, 0, def.size * 0.45).fill({ color: 0xffffff, alpha: 0.3 });
  if (type === 'tank') body.rect(-def.size, -2, def.size * 2, 4).fill({ color: 0xffffff, alpha: 0.2 });
  hpBar.y = -def.size - 6;
  return { id: nextId++, team, type, x, y, tx: x, ty: y,
    hp: def.hp, maxHp: def.hp, damage: def.damage, range: def.range,
    speed: def.speed, size: def.size, atkCd: 0, alive: true, c, body, hpBar };
}

function drawHpBar(u: Unit): void {
  const w = u.size * 2.4, pct = u.hp / u.maxHp;
  u.hpBar.clear();
  u.hpBar.rect(-w / 2, 0, w, 3).fill({ color: 0x111111, alpha: 0.7 });
  const col = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444;
  u.hpBar.rect(-w / 2, 0, w * pct, 3).fill({ color: col, alpha: 0.9 });
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function ComponentRtsDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      const ic = new InfiniteCanvas({
        parent: root, viewport: root.bounds, chunkSize: 400,
        preloadMargin: 2, chunkCreate: () => {}, chunkDestroy: () => {},
        decelerate: true, minZoom: 0.1, maxZoom: 4,
      });
      ic.setZoom(0.35, root.bounds.width / 2, root.bounds.height / 2);
      const terrainLayer = new PIXI.Graphics();
      ic.worldContainer.addChild(terrainLayer);
      const unitLayer = new PIXI.Container();
      ic.worldContainer.addChild(unitLayer);
      const cpLayer = new PIXI.Container();
      ic.worldContainer.addChild(cpLayer);

      const CELL = 200, N = Math.ceil(WORLD * 2 / CELL) + 2;
      const grid: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) grid[y][x] = Math.random() < 0.12 ? 1 : Math.random() < 0.08 ? 2 : 0;
      const T_C: Record<number, number> = { 0: 0x2a4a2a, 1: 0x6a5a3a, 2: 0x2a3a5a };
      let lastTR = { minCx: 0, maxCx: 0, minCy: 0, maxCy: 0 };
      function drawTerrain() {
        const tl = ic.screenToWorld(0, 0), br = ic.screenToWorld(root.bounds.width, root.bounds.height);
        const minCx = Math.floor(tl.x / CELL) - 1, maxCx = Math.ceil(br.x / CELL) + 1;
        const minCy = Math.floor(tl.y / CELL) - 1, maxCy = Math.ceil(br.y / CELL) + 1;
        const r = lastTR;
        if (r.minCx === minCx && r.maxCx === maxCx && r.minCy === minCy && r.maxCy === maxCy) return;
        lastTR = { minCx, maxCx, minCy, maxCy };
        terrainLayer.clear();
        for (let cx = minCx; cx <= maxCx; cx++)
          for (let cy = minCy; cy <= maxCy; cy++) {
            const nx = ((cx % N) + N) % N, ny = ((cy % N) + N) % N;
            const t = grid[ny][nx];
            const c = T_C[t] ?? 0x2a4a2a;
            terrainLayer.rect(cx * CELL, cy * CELL, CELL, CELL).fill({ color: c, alpha: 1 });
            terrainLayer.rect(cx * CELL, cy * CELL, CELL, CELL).stroke({ width: 1, color: 0x000000, alpha: 0.1 });
          }
      }

      const units: Unit[] = [];
      const teamGold = [0, 0, 0, 0];

      // ── 4 bases at corners ──
      const BO = WORLD * 0.65;
      const basePositions = [
        { cx: -BO, cy: -BO, team: 0 },
        { cx: BO, cy: -BO, team: 1 },
        { cx: BO, cy: BO, team: 2 },
        { cx: -BO, cy: BO, team: 3 },
      ];
      // CPs: 4 bases + 4 mid-points + center = 9
      const cpPositions = [
        ...basePositions.map(p => ({ cx: p.cx, cy: p.cy, owner: p.team })),
        { cx: -BO * 0.5, cy: -BO * 0.5, owner: -1 },
        { cx: BO * 0.5, cy: -BO * 0.5, owner: -1 },
        { cx: BO * 0.5, cy: BO * 0.5, owner: -1 },
        { cx: -BO * 0.5, cy: BO * 0.5, owner: -1 },
        { cx: 0, cy: 0, owner: -1 },
      ];

      const cps: ControlPoint[] = cpPositions.map(p => {
        const ring = new PIXI.Graphics();
        const c = new PIXI.Container();
        c.addChild(ring);
        c.x = p.cx; c.y = p.cy;
        cpLayer.addChild(c);
        return { cx: p.cx, cy: p.cy, owner: p.owner, capProgress: 0, c, ring };
      });

      function drawCPs() {
        for (const cp of cps) {
          cp.ring.clear();
          const col = cp.owner === -1 ? 0x777777 : TEAM_COLORS[cp.owner];
          cp.ring.circle(0, 0, 14).fill({ color: col, alpha: 0.85 });
          cp.ring.circle(0, 0, CAPTURE_RADIUS).stroke({ width: 1.5, color: col, alpha: 0.2 });
          if (cp.owner === -1 && cp.capProgress > 0) {
            const pct = cp.capProgress / CAPTURE_TIME;
            cp.ring.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct)
              .stroke({ width: 2.5, color: 0xffff88, alpha: 0.7 });
          }
        }
      }

      // ── starting units ──
      for (let t = 0; t < 4; t++) {
        for (let i = 0; i < 5; i++) {
          const u = makeUnit(t, 'soldier', basePositions[t].cx + 50 + Math.cos(i * 1.3) * 70, basePositions[t].cy + 50 + Math.sin(i * 1.3) * 70, unitLayer);
          u.tx = 0; u.ty = 0;
          units.push(u);
        }
        for (let i = 0; i < 2; i++) {
          const u = makeUnit(t, 'tank', basePositions[t].cx + 50 + Math.cos(i * 3.1 + 0.5) * 100, basePositions[t].cy + 50 + Math.sin(i * 3.1 + 0.5) * 100, unitLayer);
          u.tx = 0; u.ty = 0;
          units.push(u);
        }
        teamGold[t] = START_GOLD;
      }

      // ── HUD ──
      const hudText = new PIXI.Text({
        text: '', style: { fontSize: 12, fill: 0xccccdd, fontFamily: 'monospace' },
      });
      hudText.x = 12; hudText.y = 10; root.stage.addChild(hudText);
      const infoText = new PIXI.Text({
        text: '', style: { fontSize: 11, fill: 0xaabbcc, fontFamily: 'monospace' },
      });
      infoText.x = 12; infoText.y = 28; root.stage.addChild(infoText);
      const zoomText = new PIXI.Text({
        text: '', style: { fontSize: 11, fill: 0x445566, fontFamily: 'monospace' },
      });
      zoomText.x = root.bounds.width - 180; zoomText.y = root.bounds.height - 24;
      root.stage.addChild(zoomText);

      // build buttons (always visible at bottom-left)
      const BTN_W = 82, BTN_H = 26;
      const buildBtns: { c: PIXI.Container; g: PIXI.Graphics; type: UnitType }[] = [];
      for (let i = 0; i < UNIT_TYPES.length; i++) {
        const t = UNIT_TYPES[i];
        const g = new PIXI.Graphics();
        g.rect(0, 0, BTN_W, BTN_H).fill({ color: 0x1a2a3a, alpha: 0.85 });
        g.rect(0, 0, BTN_W, BTN_H).stroke({ width: 1, color: 0x3a5a7a });
        const label = new PIXI.Text({
          text: `${i + 1} ${t.toUpperCase()} $${UNIT_DEFS[t].cost}`,
          style: { fontSize: 10, fill: 0x8899bb, fontFamily: 'monospace' },
        });
        label.x = 6; label.y = 6;
        const c = new PIXI.Container();
        c.addChild(g, label);
        c.x = 12; c.y = root.bounds.height - 48 - i * (BTN_H + 3);
        root.stage.addChild(c);
        buildBtns.push({ c, g, type: t });
      }

      // ── input ──
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      let attackTarget: { x: number; y: number } | null = null;

      function buildUnitForTeam(team: number, type: UnitType): boolean {
        const cost = UNIT_DEFS[type].cost;
        if (teamGold[team] < cost) return false;
        const owned = cps.filter(cp => cp.owner === team);
        if (owned.length === 0) return false;
        // pick closest owned CP to game center (or random)
        const cp = owned.reduce((a, b) => dist(a.cx, a.cy, 0, 0) < dist(b.cx, b.cy, 0, 0) ? a : b);
        teamGold[team] -= cost;
        const u = makeUnit(team, type, cp.cx + (Math.random() - 0.5) * 70, cp.cy + (Math.random() - 0.5) * 70, unitLayer);
        // default march toward nearest non-owned CP or center
        const nonOwned = cps.filter(c => c.owner !== team);
        const target = nonOwned.length > 0
          ? nonOwned.reduce((a, b) => dist(a.cx, a.cy, cp.cx, cp.cy) < dist(b.cx, b.cy, cp.cx, cp.cy) ? a : b)
          : { cx: 0, cy: 0 };
        u.tx = target.cx; u.ty = target.cy;
        units.push(u);
        return true;
      }

      root.onPress((e: SubPointerEvent) => {
        const orig = e.originalEvent;

        // check build button clicks
        for (let i = 0; i < buildBtns.length; i++) {
          const r = buildBtns[i].g.getBounds();
          if (e.x >= r.x && e.x <= r.x + r.width && e.y >= r.y && e.y <= r.y + r.height) {
            buildUnitForTeam(0, buildBtns[i].type);
            return;
          }
        }

        if (orig.button === 2) {
          attackTarget = ic.screenToWorld(e.x, e.y);
          return;
        }
      });

      // keyboard 1-4
      document.addEventListener('keydown', (e) => {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < UNIT_TYPES.length) buildUnitForTeam(0, UNIT_TYPES[idx]);
      });

      // ── AI ──
      let aiTimer = 0;
      function tickAI(dt: number) {
        aiTimer -= dt;
        if (aiTimer > 0) return;
        aiTimer = 1500 + Math.random() * 1000;

        for (let t = 1; t < 4; t++) {
          const owned = cps.filter(cp => cp.owner === t);
          if (owned.length === 0) continue;

          // build
          const types: UnitType[] = ['soldier', 'soldier', 'tank', 'aa', 'artillery'];
          const picked = types[Math.floor(Math.random() * types.length)];
          buildUnitForTeam(t, picked);

          // attack target: nearest non-owned CP
          const myUnits = units.filter(u => u.alive && u.team === t);
          const targetCP = cps.filter(cp => cp.owner !== t)
            .reduce((a, b) => dist(a.cx, a.cy, owned[0].cx, owned[0].cy) < dist(b.cx, b.cy, owned[0].cx, owned[0].cy) ? a : b);
          for (const u of myUnits) {
            if (Math.random() < 0.25) { u.tx = targetCP.cx; u.ty = targetCP.cy; }
          }
        }
      }

      // ── game loop ──
      root.ticker.add(() => {
        const dt = root.ticker.deltaMS;
        if (dt > 100) return;
        drawTerrain();
        drawCPs();
        tickAI(dt);
        const dtS = dt / 1000;

        // gold
        for (let t = 0; t < 4; t++) teamGold[t] += GOLD_RATE * dtS;

        // capture
        for (const cp of cps) {
          const counts = [0, 0, 0, 0];
          for (const u of units) {
            if (!u.alive) continue;
            if (dist(u.x, u.y, cp.cx, cp.cy) < CAPTURE_RADIUS) counts[u.team]++;
          }
          let maxCount = 0, maxTeam = -1, total = 0;
          for (let t = 0; t < 4; t++) {
            if (counts[t] > maxCount) { maxCount = counts[t]; maxTeam = t; }
            total += counts[t];
          }
          if (cp.owner === -1) {
            if (maxCount > 0 && maxCount === total) {
              cp.capProgress = Math.min(cp.capProgress + dt, CAPTURE_TIME);
              if (cp.capProgress >= CAPTURE_TIME) { cp.owner = maxTeam; cp.capProgress = 0; }
            } else {
              cp.capProgress = Math.max(cp.capProgress - dt * 1.5, 0);
            }
          } else {
            if (maxCount > 0 && maxTeam !== cp.owner && maxCount === total) {
              cp.capProgress += dt;
              if (cp.capProgress >= CAPTURE_TIME) { cp.owner = maxTeam; cp.capProgress = 0; }
            } else if (maxTeam === cp.owner) {
              cp.capProgress = Math.max(cp.capProgress - dt * 2, 0);
            } else {
              cp.capProgress = Math.max(cp.capProgress - dt * 2, 0);
            }
          }
        }

        for (const u of units) {
          if (!u.alive) continue;
          let nearest: Unit | null = null;
          let nearD = Infinity;
          for (const o of units) {
            if (!o.alive || o.team === u.team) continue;
            const d = dist(u.x, u.y, o.x, o.y);
            if (d < nearD) { nearD = d; nearest = o; }
          }

          u.atkCd -= dt;
          if (nearest && nearD <= u.range && u.atkCd <= 0) {
            nearest.hp -= u.damage;
            u.atkCd = 1200;
            if (nearest.hp <= 0) {
              nearest.alive = false; nearest.body.alpha = 0.1;
              nearest.hpBar.visible = false;
            }
          }

          if (u.speed > 0) {
            let tx = u.tx, ty = u.ty;
            if (u.team === 0 && attackTarget) { tx = attackTarget.x; ty = attackTarget.y; }
            if (nearest && nearD <= u.range * 1.5 && u.type !== 'artillery') {
              tx = nearest.x; ty = nearest.y;
            }
            const d = dist(u.x, u.y, tx, ty);
            if (d > 5) {
              const ux = ((Math.floor((u.x + WORLD) / CELL) % N + N) % N);
              const uy = ((Math.floor((u.y + WORLD) / CELL) % N + N) % N);
              const tf = TERRAIN_FACTOR[grid[uy][ux]] ?? 1;
              const step = u.speed * dtS * tf;
              const ratio = Math.min(step / Math.max(d, 1), 1);
              u.x += (tx - u.x) * ratio;
              u.y += (ty - u.y) * ratio;
            }
          }
          u.c.x = u.x; u.c.y = u.y;
          drawHpBar(u);
        }

        // cleanup dead
        for (let i = units.length - 1; i >= 0; i--) {
          if (!units[i].alive && units[i].body.alpha < 0.05) {
            units[i].c.parent?.removeChild(units[i].c);
            units[i].c.destroy({ children: true });
            units.splice(i, 1);
          }
        }

        // HUD
        const lines: string[] = [];
        const alive = units.filter(u => u.alive);
        for (let t = 0; t < 4; t++) {
          const cpc = cps.filter(c => c.owner === t).length;
          const uc = alive.filter(u => u.team === t).length;
          const mark = t === 0 ? '▶' : ' ';
          lines.push(`${mark}${TEAM_NAMES[t]} $${Math.floor(teamGold[t])} CP:${cpc} units:${uc}`);
        }
        hudText.text = lines.join('  |  ');
        infoText.text = attackTarget ? `R-click target: (${attackTarget.x.toFixed(0)}, ${attackTarget.y.toFixed(0)})` : 'R-click to attack  |  keys 1-4 to build';
        const vpCX = (root.bounds.width / 2 - ic.worldContainer.x) / ic.zoom;
        const vpCY = (root.bounds.height / 2 - ic.worldContainer.y) / ic.zoom;
        zoomText.text = `zoom: ${ic.zoom.toFixed(1)}x  (${vpCX.toFixed(0)}, ${vpCY.toFixed(0)})`;
      });

      return () => {
        for (const u of units) { u.c.parent?.removeChild(u.c); u.c.destroy({ children: true }); }
        units.length = 0;
      };
    });
    return () => stop();
  }, []);
  return null;
}

ComponentRtsDisplay.head = {
  title: 'Auto-Chess TD',
  description: '4 factions, control points, auto-battle. R-click to attack, 1-4 to build.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
