#!/usr/bin/env python3
"""Ecosystem simulation server - optimized with thread pool and differential updates."""
import asyncio
import json
import math
import random
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Optional

import websockets

# ── Config ──────────────────────────────────────────────────────────────────

CFG: dict[str, Any] = {
    "grassSize": 4, "herbivoreSize": 7, "carnivoreSize": 9,
    "herbivoreVision": 200, "carnivoreVision": 280,
    "herbivoreSpeed": 220, "carnivoreSpeed": 300,
    "herbivoreMaxEnergy": 120, "carnivoreMaxEnergy": 150, "grassMaxEnergy": 50,
    "eatGrassEnergy": 5, "eatHerbivoreEnergy": 60, "eatRange": 8,
    "maxGrass": 4000, "grassGrowRate": 0.05,
    "variationRange": 0.2, "splitThreshold": 0.9, "splitCooldown": 3000,
    "worldBounds": 3000,
    "initialGrass": 2500, "initialHerbivores": 300, "initialCarnivores": 100,
}

WORLD_SIZE: float = CFG["worldBounds"] * 2

# ── Terrain (static after generation) ───────────────────────────────────────

T_PLAIN, T_FOREST, T_DESERT, T_WATER = range(4)

TERRAIN_EFFECTS = {
    T_PLAIN:  {"speedMul": 1.0, "visionMul": 1.0, "metaMul": 1.0, "grassMul": 1.0},
    T_FOREST: {"speedMul": 0.7, "visionMul": 1.3, "metaMul": 0.8, "grassMul": 1.5},
    T_DESERT: {"speedMul": 1.3, "visionMul": 0.7, "metaMul": 1.3, "grassMul": 0.3},
    T_WATER:  {"speedMul": 0.4, "visionMul": 0.5, "metaMul": 1.6, "grassMul": 0.0},
}

TERRAIN_CELL = 200

_terrain_grid: list[list[int]] = []
_terrain_cache: list[dict] = []   # serialised once


def _generate_terrain():
    n = math.ceil(WORLD_SIZE / TERRAIN_CELL) + 2
    grid = [[random.randint(0, 3) for _ in range(n)] for _ in range(n)]
    for _ in range(3):
        new = [row[:] for row in grid]
        for y in range(n):
            for x in range(n):
                counts = [0, 0, 0, 0]
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = (x + dx) % n, (y + dy) % n
                        counts[grid[ny][nx]] += 1
                new[y][x] = max(range(4), key=lambda i: counts[i])
        grid = new
    return grid


def _build_terrain_cache():
    global _terrain_cache
    n = len(_terrain_grid)
    b = CFG["worldBounds"]
    cell = TERRAIN_CELL
    _terrain_cache = []
    for cy in range(n):
        for cx in range(n):
            wx = (cx + 0.5) * cell - b
            wy = (cy + 0.5) * cell - b
            _terrain_cache.append({"x": round(wx, 0), "y": round(wy, 0), "t": _terrain_grid[cy][cx]})


def _terrain_at(x: float, y: float) -> int:
    n = len(_terrain_grid)
    cx = int(math.floor((x + CFG["worldBounds"]) / TERRAIN_CELL)) % n
    cy = int(math.floor((y + CFG["worldBounds"]) / TERRAIN_CELL)) % n
    return _terrain_grid[cy][cx]


# ── Entity ──────────────────────────────────────────────────────────────────

_next_id = 0


@dataclass
class Entity:
    __slots__ = (
        "id", "type", "x", "y", "vx", "vy",
        "energy", "maxEnergy", "visionRange", "speed", "size",
        "alive", "regrowTimer", "splitCooldown",
        "parent_id", "generation", "birth_speed", "birth_vision",
    )
    id: int = field(default_factory=lambda: globals().update(_next_id=_next_id + 1) or _next_id - 1)
    type: str = "grass"
    x: float = 0; y: float = 0
    vx: float = 0; vy: float = 0
    energy: float = 50; maxEnergy: float = 50
    visionRange: float = 0; speed: float = 0
    size: int = 4
    alive: bool = True
    regrowTimer: float = 0; splitCooldown: float = 0
    parent_id: Optional[int] = None
    generation: int = 0
    birth_speed: float = 0; birth_vision: float = 0

    # compact serialisation — short keys, no alive flag (implied by presence)
    def pack(self) -> dict:
        return {
            "i": self.id, "t": self.type,
            "x": round(self.x, 1), "y": round(self.y, 1),
            "e": round(self.energy, 1),
            "r": round(self.regrowTimer, 0),
        }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _vary(val: float, r: float, lo: float, hi: float) -> float:
    return _clamp(val * (1 - r + random.random() * r * 2), lo, hi)


def _apply_terrain(e) -> dict:
    return TERRAIN_EFFECTS[_terrain_at(e.x, e.y)]


def _calc_metabolism(speed: float, vision: float, te: dict) -> float:
    return speed * 0.0015 + vision * 0.001 * te.get("metaMul", 1.0)


def _dist(x1: float, y1: float, x2: float, y2: float) -> float:
    dx = x2 - x1; dy = y2 - y1
    b = CFG["worldBounds"]
    if abs(dx) > b: dx -= math.copysign(1, dx) * WORLD_SIZE
    if abs(dy) > b: dy -= math.copysign(1, dy) * WORLD_SIZE
    return math.hypot(dx, dy)


def _wrap_world(e: Entity) -> None:
    b = CFG["worldBounds"]; d = b * 2
    if e.x < -b: e.x += d
    elif e.x > b: e.x -= d
    if e.y < -b: e.y += d
    elif e.y > b: e.y -= d


def _random_in_bounds() -> tuple[float, float]:
    b = CFG["worldBounds"]
    return (random.random() - 0.5) * b * 2, (random.random() - 0.5) * b * 2


# ── Entity creation ──────────────────────────────────────────────────────────

def _create_entity(type_: str, x: float, y: float, inherit: Optional[Entity] = None) -> Entity:
    is_grass = type_ == "grass"
    is_herb = type_ == "herbivore"
    size = CFG["grassSize"] if is_grass else (CFG["herbivoreSize"] if is_herb else CFG["carnivoreSize"])
    max_energy = CFG["grassMaxEnergy"] if is_grass else (CFG["herbivoreMaxEnergy"] if is_herb else CFG["carnivoreMaxEnergy"])
    energy = max_energy if is_grass else (max_energy * 0.7 if is_herb else max_energy * 0.6)

    if is_grass:
        speed = 0; vision = 0; parent = None; gen = 0
    elif inherit:
        r = CFG["variationRange"] * 0.75
        speed = _vary(inherit.speed, r, 20, 800)
        vision = _vary(inherit.visionRange, r, 20, 600)
        parent = inherit.id; gen = inherit.generation + 1
    else:
        r = CFG["variationRange"]
        bs = CFG["herbivoreSpeed"] if is_herb else CFG["carnivoreSpeed"]
        bv = CFG["herbivoreVision"] if is_herb else CFG["carnivoreVision"]
        speed = _vary(bs, r, 20, 800)
        vision = _vary(bv, r, 20, 600)
        parent = None; gen = 0

    return Entity(
        type=type_, x=x, y=y, energy=energy, maxEnergy=max_energy,
        speed=speed, visionRange=vision, size=size,
        parent_id=parent, generation=gen,
        birth_speed=speed, birth_vision=vision,
    )


# ── Spatial grid ─────────────────────────────────────────────────────────────

SPATIAL_CHUNK = 300


def _chunk_key(cx: int, cy: int) -> str:
    return f"{cx},{cy}"


def _wrapped_cc(c: int, n: int) -> int:
    return ((c % n) + n) % n


def _build_grid(entities: list[Entity]) -> dict[str, list[Entity]]:
    grid: dict[str, list[Entity]] = {}
    n = math.ceil(CFG["worldBounds"] * 2 / SPATIAL_CHUNK)
    for e in entities:
        if not e.alive:
            continue
        cx = int(math.floor((e.x + CFG["worldBounds"]) / SPATIAL_CHUNK))
        cy = int(math.floor((e.y + CFG["worldBounds"]) / SPATIAL_CHUNK))
        key = _chunk_key(_wrapped_cc(cx, n), _wrapped_cc(cy, n))
        bucket = grid.get(key)
        if bucket is None:
            bucket = []; grid[key] = bucket
        bucket.append(e)
    return grid


def _nearest_of_type(e: Entity, grid: dict[str, list[Entity]], target_type: str, max_dist: float) -> Optional[Entity]:
    n = math.ceil(CFG["worldBounds"] * 2 / SPATIAL_CHUNK)
    cx = int(math.floor((e.x + CFG["worldBounds"]) / SPATIAL_CHUNK))
    cy = int(math.floor((e.y + CFG["worldBounds"]) / SPATIAL_CHUNK))
    best: Optional[Entity] = None
    best_d = max_dist
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            key = _chunk_key(_wrapped_cc(cx + dx, n), _wrapped_cc(cy + dy, n))
            bucket = grid.get(key)
            if not bucket:
                continue
            for other in bucket:
                if other.id == e.id or other.type != target_type:
                    continue
                if target_type == "grass" and other.energy <= 0:
                    continue
                d = _dist(e.x, e.y, other.x, other.y)
                if d <= best_d:
                    best_d = d
                    best = other
    return best


# ── Steering ─────────────────────────────────────────────────────────────────

def _steer_toward(from_x: float, from_y: float, to_x: float, to_y: float, max_speed: float) -> tuple[float, float]:
    d = _dist(from_x, from_y, to_x, to_y)
    if d < 0.1:
        return (0, 0)
    return ((to_x - from_x) / d * max_speed, (to_y - from_y) / d * max_speed)


def _steer_away(from_x: float, from_y: float, target_x: float, target_y: float, max_speed: float) -> tuple[float, float]:
    d = _dist(from_x, from_y, target_x, target_y)
    if d < 0.1:
        return (0, 0)
    return ((from_x - target_x) / d * max_speed, (from_y - target_y) / d * max_speed)


# ── Lineage tracking (incremental) ──────────────────────────────────────────

_all_lineage: list[dict] = []   # accumulated births
_new_births: list[dict] = []    # births since last tick

def _record_birth(child: Entity) -> None:
    entry = {
        "i": child.id, "p": child.parent_id,
        "t": child.type, "g": child.generation,
        "s": round(child.speed, 1), "v": round(child.visionRange, 1),
    }
    _new_births.append(entry)
    _all_lineage.append(entry)


# ── Update functions ─────────────────────────────────────────────────────────

def update_grass(e: Entity, dt: float, entities: list[Entity]) -> None:
    if e.regrowTimer > 0:
        e.regrowTimer -= dt
        if e.regrowTimer <= 0:
            e.energy = CFG["grassMaxEnergy"]
            e.alive = True
        return
    te = _terrain_at(e.x, e.y)
    rate = CFG["grassGrowRate"] * TERRAIN_EFFECTS[te]["grassMul"]
    e.energy = min(e.maxEnergy, e.energy + rate * (dt / 1000))
    _try_split(e, entities, dt)


def update_herbivore(e: Entity, dt: float, grid: dict[str, list[Entity]], entities: list[Entity]) -> None:
    te = _apply_terrain(e)
    e.energy -= _calc_metabolism(e.speed, e.visionRange, te) * (dt / 1000)
    if e.energy <= 0:
        e.alive = False
        return

    predator = _nearest_of_type(e, grid, "carnivore", e.visionRange * te["visionMul"])
    food = _nearest_of_type(e, grid, "grass", e.visionRange * te["visionMul"])
    fx, fy = 0, 0

    if predator:
        d_pred = _dist(e.x, e.y, predator.x, predator.y)
        flee_str = max(0, 1 - d_pred / (e.visionRange * te["visionMul"])) * 2
        ax, ay = _steer_away(e.x, e.y, predator.x, predator.y, e.speed * te["speedMul"] * flee_str)
        fx += ax; fy += ay

    if food:
        d_food = _dist(e.x, e.y, food.x, food.y)
        chase_str = max(0, 1 - d_food / (e.visionRange * te["visionMul"]))
        tx, ty = _steer_toward(e.x, e.y, food.x, food.y, e.speed * te["speedMul"] * chase_str)
        fx += tx; fy += ty
        if d_food < CFG["eatRange"] and food.energy > 0:
            food.energy -= CFG["eatGrassEnergy"]
            e.energy = min(e.maxEnergy, e.energy + CFG["eatGrassEnergy"])
            food.alive = False
            food.regrowTimer = 5000

    if random.random() < 0.5:
        pass
    elif fx == 0 and fy == 0:
        wander = 0.3
        e.vx += (random.random() - 0.5) * wander * (dt / 1000) * 60
        e.vy += (random.random() - 0.5) * wander * (dt / 1000) * 60
    else:
        damp = 3
        e.vx += (fx - e.vx) * damp * (dt / 1000)
        e.vy += (fy - e.vy) * damp * (dt / 1000)

    spd = math.hypot(e.vx, e.vy)
    if spd > e.speed * te["speedMul"]:
        e.vx = e.vx / spd * e.speed * te["speedMul"]
        e.vy = e.vy / spd * e.speed * te["speedMul"]

    e.x += e.vx * (dt / 1000); e.y += e.vy * (dt / 1000)
    _wrap_world(e)
    _try_split(e, entities, dt)


def update_carnivore(e: Entity, dt: float, grid: dict[str, list[Entity]], entities: list[Entity]) -> None:
    te = _apply_terrain(e)
    e.energy -= _calc_metabolism(e.speed, e.visionRange, te) * (dt / 1000)
    if e.energy <= 0:
        e.alive = False
        return

    food = _nearest_of_type(e, grid, "herbivore", e.visionRange * te["visionMul"])
    fx, fy = 0, 0

    if not food:
        rival = _nearest_of_type(e, grid, "carnivore", e.visionRange * te["visionMul"])
        if rival:
            d_rival = _dist(e.x, e.y, rival.x, rival.y)
            flee_str = max(0, 1 - d_rival / (e.visionRange * te["visionMul"]))
            ax, ay = _steer_away(e.x, e.y, rival.x, rival.y, e.speed * te["speedMul"] * flee_str)
            fx += ax; fy += ay

    if food:
        d_food = _dist(e.x, e.y, food.x, food.y)
        chase_str = max(0, 1 - d_food / (e.visionRange * te["visionMul"]))
        tx, ty = _steer_toward(e.x, e.y, food.x, food.y, e.speed * te["speedMul"] * chase_str)
        fx += tx; fy += ty
        if d_food < CFG["eatRange"] and food.energy > 0:
            food.alive = False
            e.energy = min(e.maxEnergy, e.energy + CFG["eatHerbivoreEnergy"])

    if fx == 0 and fy == 0:
        wander = 0.3
        e.vx += (random.random() - 0.5) * wander * (dt / 1000) * 60
        e.vy += (random.random() - 0.5) * wander * (dt / 1000) * 60
    else:
        damp = 3
        e.vx += (fx - e.vx) * damp * (dt / 1000)
        e.vy += (fy - e.vy) * damp * (dt / 1000)

    spd = math.hypot(e.vx, e.vy)
    if spd > e.speed * te["speedMul"]:
        e.vx = e.vx / spd * e.speed * te["speedMul"]
        e.vy = e.vy / spd * e.speed * te["speedMul"]

    e.x += e.vx * (dt / 1000); e.y += e.vy * (dt / 1000)
    _wrap_world(e)
    _try_split(e, entities, dt)


def _try_split(e: Entity, entities: list[Entity], dt: float) -> None:
    e.splitCooldown -= dt
    if e.splitCooldown > 0:
        return
    if e.energy < e.maxEnergy * CFG["splitThreshold"]:
        return
    angle = random.random() * math.pi * 2
    dist2 = 20 + random.random() * 30
    cx = e.x + math.cos(angle) * dist2
    cy = e.y + math.sin(angle) * dist2
    e.energy *= 0.5
    e.splitCooldown = CFG["splitCooldown"]
    child = _create_entity(e.type, cx, cy, inherit=e)
    child.energy = e.energy
    child.splitCooldown = CFG["splitCooldown"]
    entities.append(child)
    _record_birth(child)


# ── Simulation ──────────────────────────────────────────────────────────────

class EcosystemSim:
    def __init__(self):
        self.entities: list[Entity] = []
        self.running = False
        self.paused = False
        self.tick_count = 0

    def reset(self) -> None:
        self.entities.clear()
        for _ in range(CFG["initialGrass"]):
            x, y = _random_in_bounds()
            self.entities.append(_create_entity("grass", x, y))
        for _ in range(CFG["initialHerbivores"]):
            x, y = _random_in_bounds()
            self.entities.append(_create_entity("herbivore", x, y))
        for _ in range(CFG["initialCarnivores"]):
            x, y = _random_in_bounds()
            self.entities.append(_create_entity("carnivore", x, y))
        self.tick_count = 0
        _all_lineage.clear()
        _new_births.clear()

    def step(self, dt: float) -> None:
        """Single simulation step. Mutates self.entities in place."""
        if self.paused or not self.running:
            return

        _new_births.clear()
        grid = _build_grid(self.entities)

        grass_count = 0
        for e in self.entities:
            if e.type == "grass":
                update_grass(e, dt, self.entities)
                grass_count += 1

        to_remove: list[int] = []
        for i, e in enumerate(self.entities):
            if not e.alive:
                continue
            if e.type == "herbivore":
                update_herbivore(e, dt, grid, self.entities)
                if not e.alive:
                    to_remove.append(i)
            elif e.type == "carnivore":
                update_carnivore(e, dt, grid, self.entities)
                if not e.alive:
                    to_remove.append(i)

        for i in reversed(to_remove):
            self.entities.pop(i)

        # spawn extra grass if under max
        alive_grass = sum(1 for e in self.entities if e.type == "grass" and e.energy > 0)
        if alive_grass < CFG["maxGrass"] and grass_count < CFG["maxGrass"]:
            chance = 1 - alive_grass / CFG["maxGrass"]
            if random.random() < chance * 0.08:
                x, y = _random_in_bounds()
                self.entities.append(_create_entity("grass", x, y))
        self.tick_count += 1

    def pack_state(self) -> str:
        """Build full state JSON string. Called inside executor (already locked by GIL)."""
        counts = {"g": 0, "h": 0, "c": 0}
        packed: list[dict] = []
        de: list[int] = []
        for e in self.entities:
            if e.alive:
                counts[{"grass": "g", "herbivore": "h", "carnivore": "c"}[e.type]] += 1
                packed.append(e.pack())
            else:
                de.append(e.id)
        state = {
            "t": self.tick_count,
            "c": counts, "p": self.paused,
            "e": packed, "d": de,
        }
        if _new_births:
            state["b"] = list(_new_births)
        return json.dumps(state, separators=(",", ":"))


# ── WebSocket server ─────────────────────────────────────────────────────────

TICK_RATE = 30
SEND_INTERVAL = 2           # send full state every N ticks (~15 fps)


class EcosystemServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.sim = EcosystemSim()
        self.clients: set[websockets.WebSocketServerProtocol] = set()
        self.executor = ThreadPoolExecutor(max_workers=1)
        self._send_counter = 0
        self._terrain_msg: Optional[str] = None

    async def _broadcast(self, msg: str) -> None:
        if not self.clients:
            return
        await asyncio.gather(
            *(c.send(msg) for c in self.clients.copy() if c.open),
            return_exceptions=True,
        )

    async def tick_loop(self) -> None:
        loop = asyncio.get_event_loop()
        interval = 1.0 / TICK_RATE
        fps_t0 = time.monotonic()
        fps_count = 0
        while True:
            t0 = time.monotonic()
            if self.sim.running or self.sim.paused:
                # step() + pack_state() runs in executor thread
                if not self.sim.paused:
                    msg = await loop.run_in_executor(
                        self.executor,
                        lambda: (self.sim.step(1000.0 / TICK_RATE),
                                 self.sim.pack_state()),
                    )
                    state_json = msg[1] if isinstance(msg, tuple) else ""
                else:
                    state_json = await loop.run_in_executor(
                        self.executor, self.sim.pack_state,
                    )

                if state_json and self.clients:
                    self._send_counter += 1
                    if self._send_counter % SEND_INTERVAL == 0:
                        await self._broadcast(state_json)

                # fps count only actual sim steps
                fps_count += 1

            now = time.monotonic()
            if now - fps_t0 >= 1.0:
                n = len(self.sim.entities)
                alive = sum(1 for e in self.sim.entities if e.alive)
                g = sum(1 for e in self.sim.entities if e.type == "grass" and e.alive)
                h = sum(1 for e in self.sim.entities if e.type == "herbivore" and e.alive)
                c = sum(1 for e in self.sim.entities if e.type == "carnivore" and e.alive)
                print(f"[{fps_count} fps]  total={n} alive={alive}  🌿{g}  🐇{h}  🦊{c}")
                fps_count = 0
                fps_t0 = now

            await asyncio.sleep(max(0, interval - (time.monotonic() - t0)))

    async def handle(self, ws: websockets.WebSocketServerProtocol) -> None:
        self.clients.add(ws)
        try:
            # send terrain once
            if self._terrain_msg:
                await ws.send(self._terrain_msg)
            # send full lineage history once
            if _all_lineage:
                await ws.send(json.dumps({"ty": "l", "b": _all_lineage[-2000:]}, separators=(",", ":")))
            # send initial state
            state = await asyncio.get_event_loop().run_in_executor(
                self.executor, self.sim.pack_state,
            )
            await ws.send(state)

            async for raw in ws:
                try:
                    data = json.loads(raw)
                    typ = data.get("type", "")
                    if typ == "start":
                        self.sim.reset()
                        self.sim.running = True
                        self.sim.paused = False
                    elif typ == "stop":
                        self.sim.running = False
                    elif typ == "pause":
                        self.sim.paused = True
                    elif typ == "resume":
                        self.sim.paused = False
                    elif typ == "reset":
                        self.sim.reset()
                    elif typ == "set_cfg":
                        key = data.get("key", "")
                        if key in CFG:
                            CFG[key] = data["value"]
                            if key == "worldBounds":
                                globals()["WORLD_SIZE"] = CFG["worldBounds"] * 2
                    elif typ == "spawn":
                        etype = data.get("entity", "grass")
                        cnt = data.get("count", 1)
                        for _ in range(cnt):
                            x, y = _random_in_bounds()
                            self.sim.entities.append(_create_entity(etype, x, y))
                except json.JSONDecodeError:
                    pass
        finally:
            self.clients.discard(ws)

    async def run(self) -> None:
        # pre-build terrain & cache
        global _terrain_grid
        _terrain_grid = _generate_terrain()
        _build_terrain_cache()
        self._terrain_msg = json.dumps({
            "type": "terrain",
            "terrain": _terrain_cache,
            "terrainCell": TERRAIN_CELL,
        }, separators=(",", ":"))

        print(f"Ecosystem server starting on ws://{self.host}:{self.port}")
        async with websockets.serve(self.handle, self.host, self.port, ping_interval=20):
            await self.tick_loop()


if __name__ == "__main__":
    server = EcosystemServer()
    asyncio.run(server.run())
