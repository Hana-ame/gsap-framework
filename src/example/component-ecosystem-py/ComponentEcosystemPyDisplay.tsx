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

export function ComponentEcosystemPyDisplay() {
  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      const CHUNK = 400;

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
      const sprites = new Map<number, PIXI.Container>();
      let worldB = 3000;
      let lineageData: { i: number; p: number | null; t: string; g: number; s: number; v: number }[] = [];
      let evoWin: GameWindow | null = null;

      function drawTerrain(data: { x: number; y: number; t: number }[], cell: number) {
        terrainLayer.clear();
        for (const c of data) {
          const color = TERRAIN_COLORS[c.t] ?? 0x3a5a3a;
          terrainLayer.rect(c.x - cell / 2, c.y - cell / 2, cell, cell)
            .fill({ color, alpha: 0.3 });
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
        const visionR = entries.map(e => e.v); const minV = Math.min(...visionR), maxV = Math.max(...visionR);
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

      function connect() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        textStatus.text = 'Connecting...';
        ws = new WebSocket(WS_URL);
        ws.onopen = () => {
          textStatus.text = 'Connected';
          ws!.send(JSON.stringify({ type: 'start' }));
        };
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);

            // terrain message (sent once on connect)
            if (data.type === 'terrain' || data.terrain) {
              drawTerrain(data.terrain, data.terrainCell ?? 200);
              return;
            }
            // full lineage history (sent once on connect)
            if (data.ty === 'l' && data.b) {
              lineageData = data.b;
              if (evoWin && !evoWin.destroyed) drawEvoTree();
              return;
            }
            // state message (compact format)
            if (data.e === undefined) return;

            worldB = 3000;
            if (data.c) {
              textCount.text = `🌿 ${data.c.g ?? 0}  🐇 ${data.c.h ?? 0}  🦊 ${data.c.c ?? 0}`;
            }

            // handle new births for evolution tree
            if (data.b && data.b.length > 0) {
              for (const b of data.b) {
                lineageData.push(b);
              }
              if (lineageData.length > 2000) {
                lineageData = lineageData.slice(-2000);
              }
              if (evoWin && !evoWin.destroyed) drawEvoTree();
            }

            const currentIds = new Set<number>();
            for (const ed of data.e) {
              currentIds.add(ed.i);
              let g = sprites.get(ed.i);
              if (!g) {
                g = new PIXI.Container();
                g.addChild(new PIXI.Graphics());
                entityLayer.addChild(g);
                sprites.set(ed.i, g);
              }
              const body = g.children[0] as PIXI.Graphics;
              const size = ed.t === 'grass' ? 4 : 7;
              const col = ENTITY_COLORS[ed.t] ?? 0xffffff;
              body.clear();
              if (ed.t === 'grass') {
                body.poly([0, -size, size, 0, 0, size, -size, 0]).fill({ color: col, alpha: 0.9 });
              } else {
                body.circle(0, 0, size).fill({ color: col, alpha: 0.9 });
                body.circle(0, 0, size * 0.45).fill({ color: 0xffffff, alpha: 0.4 });
              }
              g.x = ed.x; g.y = ed.y;
            }
            // remove dead entities
            if (data.d) {
              for (const id of data.d) {
                const g = sprites.get(id);
                if (g) {
                  entityLayer.removeChild(g); g.destroy({ children: true }); sprites.delete(id);
                }
              }
            }
            for (const [id, g] of sprites) {
              if (!currentIds.has(id)) {
                entityLayer.removeChild(g); g.destroy({ children: true }); sprites.delete(id);
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

      root.ticker.add(() => {
        const vpCX = (root.bounds.width / 2 - ic.worldContainer.x) / ic.zoom;
        const vpCY = (root.bounds.height / 2 - ic.worldContainer.y) / ic.zoom;
        const b = worldB;
        for (const [, g] of sprites) {
          let x = g.x, y = g.y;
          while (x - vpCX > b) x -= b * 2;
          while (x - vpCX < -b) x += b * 2;
          while (y - vpCY > b) y -= b * 2;
          while (y - vpCY < -b) y += b * 2;
          g.x = x; g.y = y;
        }
      });

      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws) ws.close();
        if (evoWin && !evoWin.destroyed) evoWin.destroy();
        for (const [, g] of sprites) g.destroy({ children: true });
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
