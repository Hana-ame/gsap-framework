# Ecosystem Simulation Server

Real-time toroidal ecosystem server with WebSocket broadcast. Grass, herbivores, and carnivores evolve on a procedurally generated terrain with spatial chunking for efficient nearest-neighbor queries.

## Quick Start

```sh
pip install websockets
python ecosystem_server.py
```

Listens on `ws://0.0.0.0:8765`. The frontend connects and receives full state snapshots at ~15 Hz (simulation ticks at 30 Hz).

## WebSocket Protocol

### Server → Client

| Message | Description |
|---------|-------------|
| `{ "ty": "terrain", "terrain": [...], "terrainCell": 200 }` | Terrain grid (sent once on connect) |
| `{ "ty": "l", "b": [...] }` | Lineage history (sent once on connect) |
| `{ "t": <tick>, "c": {"g":N, "h":N, "c":N}, "p": bool, "e": [...], "d": [...], "b": [...] }` | Full state snapshot every 2 ticks |

**State fields:**

- `t` — tick number
- `c` — counts: `g` grass, `h` herbivore, `c` carnivore
- `p` — paused
- `e` — array of alive entities: `{ i, t, x, y, e, r }`
- `d` — dead entity IDs to remove from display (grass only; dead animals are filtered server-side)
- `b` — new births since last snapshot: `{ i, p, t, g, s, v }`

### Client → Server

```json
{"type": "start"}        // reset & run
{"type": "stop"}         // pause simulation
{"type": "pause"}        // freeze updates
{"type": "resume"}       // unfreeze
{"type": "reset"}        // reinitialize
{"type": "set_cfg", "key": "...", "value": ...}  // live config change
{"type": "spawn", "entity": "grass|herbivore|carnivore", "count": N}  // spawn entities
```

## Architecture

```
ThreadPoolExecutor (1 worker)
  └── sim.step()     → 30 Hz tick: grass update + animal update + spatial grid
  └── sim.pack_state() → every 2 ticks: manual JSON serialization

asyncio event loop
  └── tick_loop()       → schedule step/pack, broadcast, FPS logging
  └── handle(ws)        → per-connection command processing
```

### Key optimizations

- **Split entity lists** — grass and animals stored in separate lists; avoids type checks during iteration
- **Per-entity caches** — grass caches terrain index, chunk key, and formatted x/y strings at creation
- **Manual JSON** — `pack_state` builds state string piecewise instead of `json.dumps` on thousands of dicts
- **Spatial grid** — entities bucketed into 300px chunks; nearest-neighbor searches scan only the entity's own chunk (radius=0)
- **Incremental lineage** — births tracked in `_new_births` list; full history accumulated in `_all_lineage` for new connections

### Entity lifecycle

- **Grass**: regrows after being eaten (5s timer). Dead grass stays in the list for regrow tracking.
- **Herbivores/Carnivores**: removed from list when dead (energy ≤ 0). Their IDs never appear in `d`.
- **Split**: when energy ≥ 90% of max, entity spawns a child with inherited traits + mutation.
- **Terrain**: 4 biomes (plain, forest, desert, water) affect speed, vision, metabolism, and grass growth rate.
