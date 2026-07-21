import { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, InfiniteCanvas, type SubCanvasProxy } from '@framework';
import { createWindow, makeButton } from '@components';
import type { GameWindow } from '@components/PixiWindow';

const WS_URL = 'ws://172.29.89.192:8765';
const TERRAIN_COLORS: Record<number, number> = {
  0: 0x3a5a3a, 1: 0x2a4a2a, 2: 0x5a4a3a, 3: 0x2a3a5a,
};
const ENTITY_COLORS: Record<string, number> = {
  grass: 0x44cc44, herbivore: 0x4488ff, carnivore: 0xff4444,
};

function makeBtn(label: string, w: number, h: number, onClick: () => void): PIXI.Container {
  const c = new PIXI.Container();
  c.eventMode = 'static'; c.cursor = 'pointer';
  c.addChild(new PIXI.Graphics().roundRect(0, 0, w, h, 4).fill({ color: 0x1a1a2e }));
  const t = new PIXI.Text({ text: label, style: { fontSize: 11, fill: 0xffffff, fontFamily: 'monospace' } });
  t.anchor.set(0.5, 0.5); t.x = w / 2; t.y = h / 2;
  c.addChild(t);
  c.hitArea = new PIXI.Rectangle(0, 0, w, h);
  c.on('pointerdown', onClick);
  return c;
}

function wrapClosestTo(v: number, ref: number, b: number): number {
  const ws = b * 2;
  while (v - ref > b) v -= ws;
  while (v - ref < -b) v += ws;
  return v;
}

export function ComponentEcosystemPyDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      const CHUNK = 400;
      const worldBounds = 3000;
      const worldSize = worldBounds * 2;

      const ic = new InfiniteCanvas({
        parent: root, viewport: root.bounds, chunkSize: CHUNK,
        preloadMargin: 2, chunkCreate: () => {}, chunkDestroy: () => {},
        decelerate: true, minZoom: 0.15, maxZoom: 4,
      });

      const terrainLayer = new PIXI.Graphics();
      terrainLayer.eventMode = 'none';
      ic.worldContainer.addChild(terrainLayer);

      const entityLayer = new PIXI.Container();
      entityLayer.eventMode = 'none';
      ic.worldContainer.addChild(entityLayer);

      const textStatus = new PIXI.Text({ text: 'Connecting...', style: { fontSize: 13, fill: 0x6688aa, fontFamily: 'monospace' } });
      textStatus.x = 12; textStatus.y = 12; root.stage.addChild(textStatus);

      const textCount = new PIXI.Text({ text: '', style: { fontSize: 12, fill: 0x8899aa, fontFamily: 'monospace' } });
      textCount.x = 12; textCount.y = 30; root.stage.addChild(textCount);

      const zoomText = new PIXI.Text({ text: 'zoom: 1.0x', style: { fontSize: 11, fill: 0x6688aa, fontFamily: 'monospace' } });
      zoomText.x = 12; zoomText.y = root.bounds.height - 24; root.stage.addChild(zoomText);

      let ws: WebSocket | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      const sprites = new Map<number, { c: PIXI.Container; wx: number; wy: number }>();
      let terrainCell = 200;
      let terrainGrid: number[][] = [];
      let gridN = 0;
      let lineageData: { i: number; p: number | null; t: string; g: number; s: number; v: number }[] = [];
      let evoWin: GameWindow | null = null;

      // ── terrain drawing (viewport-based, wraps at world boundary) ──

      let lastTerrainRange = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

      function updateTerrain() {
        if (gridN === 0) return;
        const tl = ic.screenToWorld(0, 0);
        const br = ic.screenToWorld(root.bounds.width, root.bounds.height);
        const cell = terrainCell;
        const minX = Math.floor(tl.x / cell) - 1;
        const maxX = Math.ceil(br.x / cell) + 1;
        const minY = Math.floor(tl.y / cell) - 1;
        const maxY = Math.ceil(br.y / cell) + 1;
        const r = lastTerrainRange;
        if (r.minX === minX && r.maxX === maxX && r.minY === minY && r.maxY === maxY) return;
        lastTerrainRange = { minX, maxX, minY, maxY };
        terrainLayer.clear();
        const n = gridN;
        for (let gx = minX; gx <= maxX; gx++) {
          for (let gy = minY; gy <= maxY; gy++) {
            const nx = ((gx % n) + n) % n;
            const ny = ((gy % n) + n) % n;
            const t = terrainGrid[ny][nx];
            const color = TERRAIN_COLORS[t] ?? 0x3a5a3a;
            terrainLayer.rect(gx * cell, gy * cell, cell, cell).fill({ color, alpha: 0.3 });
          }
        }
      }

      function drawEvoTree() {
        if (!evoWin || evoWin.destroyed) return;
        const st = evoWin.content.stage;
        st.removeChildren();
        const entries = lineageData.filter(e => e.t !== 'grass').slice(-500);
        if (entries.length === 0) {
          st.addChild(new PIXI.Text({ text: 'No evolution data yet', style: { fontSize: 11, fill: 0x6688aa, fontFamily: 'monospace' } }));
          return;
        }
        const maxGen = Math.max(...entries.map(e => e.g), 1);
        const w = 280, h = 380;
        const pad = 20;
        const genH = (h - pad * 2) / Math.max(maxGen, 1);

        const speedR = entries.map(e => e.s); const minS = Math.min(...speedR), maxS = Math.max(...speedR);
        const byParent = new Map<number | null, typeof entries>();
        for (const e of entries) {
          const list = byParent.get(e.p) ?? []; list.push(e); byParent.set(e.p, list);
        }

        const nodes = new Map<number, { x: number; y: number; e: typeof entries[0] }>();
        for (const e of entries) {
          const y = pad + e.g * genH;
          const sNorm = maxS > minS ? (e.s - minS) / (maxS - minS) : 0.5;
          const x = pad + sNorm * (w - pad * 2);
          nodes.set(e.i, { x, y, e });
        }

        const g = new PIXI.Graphics();
        for (const [, node] of nodes) {
          const children = byParent.get(node.e.i);
          if (children) {
            for (const child of children) {
              const cn = nodes.get(child.i);
              if (!cn) continue;
              g.moveTo(node.x, node.y).lineTo(cn.x, cn.y);
            }
          }
        }
        g.stroke({ width: 0.5, color: 0x556688, alpha: 0.5 });
        st.addChild(g);

        for (const [, node] of nodes) {
          const r = Math.max(2, 3 + (node.e.s / 200));
          const color = node.e.t === 'herbivore' ? 0x4488ff : 0xff4444;
          const dot = new PIXI.Graphics().circle(0, 0, r).fill({ color, alpha: 0.7 });
          dot.x = node.x; dot.y = node.y;
          st.addChild(dot);
        }
      }

      // ── websocket ──

      function connect() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        textStatus.text = 'Connecting...';
        ws = new WebSocket(WS_URL);
        ws.onopen = () => {
          textStatus.text = 'Connected';
          lastTerrainRange = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
          ws!.send(JSON.stringify({ type: 'start' }));
        };
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);

            // terrain message
            if (data.type === 'terrain' || data.terrain) {
              const cell = data.terrainCell ?? 200;
              terrainCell = cell;
              const flat: { x: number; y: number; t: number }[] = data.terrain;
              const b = worldBounds;
              const n = Math.ceil(worldSize / cell) + 2;
              gridN = n;
              terrainGrid = Array.from({ length: n }, () => Array(n).fill(0));
              for (const t of flat) {
                const cx = Math.round((t.x + b) / cell);
                const cy = Math.round((t.y + b) / cell);
                if (cx >= 0 && cx < n && cy >= 0 && cy < n) {
                  terrainGrid[cy][cx] = t.t;
                }
              }
              updateTerrain();
              return;
            }

            // full lineage history (once on connect)
            if (data.ty === 'l' && data.b) {
              lineageData = data.b;
              if (evoWin && !evoWin.destroyed) drawEvoTree();
              return;
            }

            // state message
            if (data.e === undefined) return;

            if (data.c) {
              textCount.text = `🌿 ${data.c.g ?? 0}  🐇 ${data.c.h ?? 0}  🦊 ${data.c.c ?? 0}`;
            }

            // new births
            if (data.b && data.b.length > 0) {
              for (const b of data.b) {
                lineageData.push(b);
              }
              if (lineageData.length > 2000) {
                lineageData = lineageData.slice(-2000);
              }
              if (evoWin && !evoWin.destroyed) drawEvoTree();
            }

            // upsert living entities
            const currentIds = new Set<number>();
            for (const ed of data.e) {
              currentIds.add(ed.i);
              let entry = sprites.get(ed.i);
              if (!entry) {
                const c = new PIXI.Container();
                c.addChild(new PIXI.Graphics());
                entityLayer.addChild(c);
                entry = { c, wx: ed.x, wy: ed.y };
                sprites.set(ed.i, entry);
              }
              entry.wx = ed.x;
              entry.wy = ed.y;
              const body = entry.c.children[0] as PIXI.Graphics;
              const size = ed.t === 'grass' ? 4 : 7;
              const col = ENTITY_COLORS[ed.t] ?? 0xffffff;
              body.clear();
              if (ed.t === 'grass') {
                body.poly([0, -size, size, 0, 0, size, -size, 0]).fill({ color: col, alpha: 0.9 });
              } else {
                body.circle(0, 0, size).fill({ color: col, alpha: 0.9 });
                body.circle(0, 0, size * 0.45).fill({ color: 0xffffff, alpha: 0.4 });
              }
            }

            // remove dead (explicit list)
            if (data.d) {
              for (const id of data.d) {
                const entry = sprites.get(id);
                if (entry) {
                  entityLayer.removeChild(entry.c); entry.c.destroy({ children: true }); sprites.delete(id);
                }
              }
            }
            // GC sweep: only on full state (f not set, or f:true)
            if (data.f !== false) {
              for (const [id, entry] of sprites) {
                if (!currentIds.has(id)) {
                  entityLayer.removeChild(entry.c); entry.c.destroy({ children: true }); sprites.delete(id);
                }
              }
            }
          } catch (e) { console.error('[ws]', e); }
        };
        ws.onclose = () => {
          textStatus.text = 'Disconnected'; ws = null;
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, 3000);
          }
        };
        ws.onerror = () => ws?.close();
      }

      function send(msg: Record<string, unknown>) {
        if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
      }

      connect();

      // ── buttons ──

      const mkZoomBtn = (label: string, x: number, onClick: () => void) => {
        const btn = makeBtn(label, 54, 24, onClick);
        btn.x = x; btn.y = root.bounds.height - 50; root.stage.addChild(btn);
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
      mkZoomBtn('Evo', root.bounds.width - 260, () => {
        if (evoWin && !evoWin.destroyed) { evoWin.destroy(); evoWin = null; return; }
        evoWin = createWindow({
          parent: root, title: 'Evolution Tree', x: root.bounds.width - 310, y: 20,
          width: 300, height: 420, draggable: true, closable: true, dragMode: 'title',
        });
        drawEvoTree();
      });

      const btnY = root.bounds.height - 44;
      [makeBtn('Pause', 54, 24, () => send({ type: 'pause' })),
       makeBtn('Reset', 54, 24, () => send({ type: 'reset' }))]
        .forEach((b, i) => { b.x = 10 + i * 58; b.y = btnY; root.stage.addChild(b); });

      // ── tick loop: wrap entities + redraw terrain ──

      root.ticker.add(() => {
        updateTerrain();

        const vpCX = (root.bounds.width / 2 - ic.worldContainer.x) / ic.zoom;
        const vpCY = (root.bounds.height / 2 - ic.worldContainer.y) / ic.zoom;

        for (const [, entry] of sprites) {
          entry.c.x = wrapClosestTo(entry.wx, vpCX, worldBounds);
          entry.c.y = wrapClosestTo(entry.wy, vpCY, worldBounds);
        }
      });

      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) ws.close();
        if (evoWin && !evoWin.destroyed) evoWin.destroy();
        for (const [, entry] of sprites) entry.c.destroy({ children: true });
        sprites.clear();
      };
    });
    return () => stop();
  }, []);

  return null;
}

ComponentEcosystemPyDisplay.head = {
  title: 'Ecosystem (Python)',
  description: 'Ecosystem simulation via Python backend + WebSocket.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
