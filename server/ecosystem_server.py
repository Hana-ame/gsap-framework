#!/usr/bin/env python3
from __future__ import annotations
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

T_GRASS, T_HERB, T_CARN = range(3)
_TYPE_NAMES = ("grass", "herbivore", "carnivore")
_TYPE_FROM_NAME = {"grass": T_GRASS, "herbivore": T_HERB, "carnivore": T_CARN}

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
    T_PLAIN:  (1.0, 1.0, 1.0, 1.0),
    T_FOREST: (0.7, 1.3, 0.8, 1.5),
    T_DESERT: (1.3, 0.7, 1.3, 0.3),
    T_WATER:  (0.4, 0.5, 1.6, 0.0),
}
# (speedMul, visionMul, metaMul, grassMul)
_GRASS_MUL = (1.0, 1.5, 0.3, 0.0)

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


@dataclass(slots=True)
class Entity:
    id: int = field(default_factory=lambda: globals().update(_next_id=_next_id + 1) or _next_id - 1)
    type: int = T_GRASS
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
    _te: int = 0           # cached terrain index (grass only)
    _xs: str = ""          # cached x string for JSON (grass only)
    _ys: str = ""          # cached y string for JSON (grass only)
    _ckey: int = 0         # cached chunk key (grass only)
    _ng: Optional[Entity] = None   # cached nearest grass (herbivore)
    _ng_dx: float = 0; _ng_dy: float = 0; _ng_d2: float = 0
    _ng_ckey: int = -1
    _px: float = 0          # prev x for delta tracking
    _py: float = 0          # prev y for delta tracking

    def pack(self) -> dict:
        return {
            "i": self.id, "t": _TYPE_NAMES[self.type],
            "x": round(self.x, 1), "y": round(self.y, 1),
            "e": round(self.energy, 1),
            "r": round(self.regrowTimer, 0),
        }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _vary(val: float, r: float, lo: float, hi: float) -> float:
    return _clamp(val * (1 - r + random.random() * r * 2), lo, hi)


def _apply_terrain(e) -> tuple[float, float, float, float]:
    return TERRAIN_EFFECTS[_terrain_at(e.x, e.y)]


def _calc_metabolism(speed: float, vision: float, mm: float) -> float:
    return speed * 0.0015 + vision * 0.001 * mm


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

def _create_entity(type_: int, x: float, y: float, inherit: Optional[Entity] = None) -> Entity:
    is_grass = type_ == T_GRASS
    is_herb = type_ == T_HERB
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

    sc = 0.0 if (is_grass and inherit) else random.random() * CFG["splitCooldown"]
    e = Entity(
        type=type_, x=x, y=y, energy=energy, maxEnergy=max_energy,
        speed=speed, visionRange=vision, size=size,
        parent_id=parent, generation=gen,
        birth_speed=speed, birth_vision=vision,
        splitCooldown=sc,
    )
    if is_grass:
        sp = SPATIAL_CHUNK; n = _SPATIAL_N
        e._te = _terrain_at(x, y)
        e._xs = f'{x:.1f}'
        e._ys = f'{y:.1f}'
        cx = int((x + CFG["worldBounds"]) // sp) % n
        cy = int((y + CFG["worldBounds"]) // sp) % n
        e._ckey = cx * n + cy
    return e


# ── Spatial grid ─────────────────────────────────────────────────────────────

SPATIAL_CHUNK = 300
_SPATIAL_N = math.ceil(CFG["worldBounds"] * 2 / SPATIAL_CHUNK)


def _nearest_in_chunks(e: Entity, grid: dict, target_type: int, max_dist: float,
                       radius: int = 0) -> Optional[tuple[Entity, float, float, float]]:
    n = _SPATIAL_N
    cx = int((e.x + CFG["worldBounds"]) // SPATIAL_CHUNK)
    cy = int((e.y + CFG["worldBounds"]) // SPATIAL_CHUNK)
    eid = e.id; ex = e.x; ey = e.y
    best_d2 = max_dist * max_dist
    best: Optional[Entity] = None
    best_dx = best_dy = 0.0
    check_dead = target_type == T_GRASS
    same_type = target_type == e.type
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            key = (cx + dx) % n * n + (cy + dy) % n
            for other in grid[key][target_type]:
                if same_type and other.id == eid: continue
                if check_dead and other.energy <= 0: continue
                dx_ = other.x - ex; dy_ = other.y - ey
                d2 = dx_ * dx_ + dy_ * dy_
                if d2 < best_d2:
                    best_d2 = d2; best = other; best_dx = dx_; best_dy = dy_
    if best is None:
        return None
    return (best, best_dx, best_dy, best_d2)


# ── Steering (accepts pre-computed dx/dy/d) ────────────────────────────────

def _steer_toward(dx: float, dy: float, d: float, max_speed: float) -> tuple[float, float]:
    if d < 0.1: return (0, 0)
    return (dx / d * max_speed, dy / d * max_speed)


def _steer_away(dx: float, dy: float, d: float, max_speed: float) -> tuple[float, float]:
    if d < 0.1: return (0, 0)
    return (-dx / d * max_speed, -dy / d * max_speed)


# ── Lineage tracking (incremental) ──────────────────────────────────────────

_all_lineage: list[dict] = []   # accumulated births
_new_births: list[dict] = []    # births since last tick

def _record_birth(child: Entity) -> None:
    entry = {
        "i": child.id, "p": child.parent_id,
        "t": _TYPE_NAMES[child.type], "g": child.generation,
        "s": round(child.speed, 1), "v": round(child.visionRange, 1),
    }
    _new_births.append(entry)
    _all_lineage.append(entry)


# ── Update functions ─────────────────────────────────────────────────────────

def update_herbivore(e: Entity, dt: float, entities: list[Entity], grid: dict) -> None:
    sm, vm, mm, _ = _apply_terrain(e)
    dt_s = dt / 1000
    e.energy -= _calc_metabolism(e.speed, e.visionRange, mm) * dt_s
    if e.energy <= 0:
        e.alive = False
        return

    vision = e.visionRange * vm
    espeed = e.speed
    max_spd = espeed * sm
    fx = fy = 0.0

    r_pred = _nearest_in_chunks(e, grid, T_CARN, vision)
    if r_pred:
        _, pdx, pdy, pd2 = r_pred
        d_pred = math.sqrt(pd2)
        flee_str = max(0, 1 - d_pred / vision) * 2
        ax, ay = _steer_away(pdx, pdy, d_pred, max_spd * flee_str)
        fx += ax; fy += ay

    n = _SPATIAL_N; sp = SPATIAL_CHUNK; b = CFG["worldBounds"]
    ckey = int((e.x + b) // sp) % n * n + int((e.y + b) // sp) % n
    if e._ng is not None and e._ng_ckey == ckey and e._ng.alive:
        food = e._ng
        fdx = food.x - e.x; fdy = food.y - e.y
        fd2 = fdx * fdx + fdy * fdy
        e._ng_dx = fdx; e._ng_dy = fdy; e._ng_d2 = fd2
    else:
        e._ng = None
        r_food = _nearest_in_chunks(e, grid, T_GRASS, vision)
        if r_food:
            food, fdx, fdy, fd2 = r_food
            e._ng = food; e._ng_ckey = ckey
            e._ng_dx = fdx; e._ng_dy = fdy; e._ng_d2 = fd2
        else:
            food = None
    if food:
        d_food = math.sqrt(fd2)
        chase_str = max(0, 1 - d_food / vision)
        tx, ty = _steer_toward(fdx, fdy, d_food, max_spd * chase_str)
        fx += tx; fy += ty
        if fd2 < 64 and food.energy > 0:
            food.energy -= CFG["eatGrassEnergy"]
            e.energy = min(e.maxEnergy, e.energy + CFG["eatGrassEnergy"])
            food.alive = False
            food.regrowTimer = 5000

    if fx == 0 and fy == 0:
        w = dt_s * 18  # 0.3 * 60 * dt_s
        e.vx += (random.random() - 0.5) * w
        e.vy += (random.random() - 0.5) * w
    else:
        damp = 3 * dt_s
        e.vx += (fx - e.vx) * damp
        e.vy += (fy - e.vy) * damp

    spd2 = e.vx * e.vx + e.vy * e.vy
    max_spd2 = max_spd * max_spd
    if spd2 > max_spd2:
        spd = math.sqrt(spd2)
        e.vx = e.vx / spd * max_spd
        e.vy = e.vy / spd * max_spd

    e.x += e.vx * dt_s; e.y += e.vy * dt_s
    _wrap_world(e)
    _try_split(e, entities, dt)


def update_carnivore(e: Entity, dt: float, entities: list[Entity], grid: dict) -> None:
    sm, vm, mm, _ = _apply_terrain(e)
    dt_s = dt / 1000
    e.energy -= _calc_metabolism(e.speed, e.visionRange, mm) * dt_s
    if e.energy <= 0:
        e.alive = False
        return

    vision = e.visionRange * vm
    espeed = e.speed
    max_spd = espeed * sm
    fx = fy = 0.0

    r_food = _nearest_in_chunks(e, grid, T_HERB, vision)
    if not r_food:
        r_rival = _nearest_in_chunks(e, grid, T_CARN, vision)
        if r_rival:
            _, rdx, rdy, rd2 = r_rival
            d_rival = math.sqrt(rd2)
            flee_str = max(0, 1 - d_rival / vision)
            ax, ay = _steer_away(rdx, rdy, d_rival, max_spd * flee_str)
            fx += ax; fy += ay

    if r_food:
        food, fdx, fdy, fd2 = r_food
        d_food = math.sqrt(fd2)
        chase_str = max(0, 1 - d_food / vision)
        tx, ty = _steer_toward(fdx, fdy, d_food, max_spd * chase_str)
        fx += tx; fy += ty
        if fd2 < 64 and food.energy > 0:
            food.alive = False
            e.energy = min(e.maxEnergy, e.energy + CFG["eatHerbivoreEnergy"])

    if fx == 0 and fy == 0:
        w = dt_s * 18
        e.vx += (random.random() - 0.5) * w
        e.vy += (random.random() - 0.5) * w
    else:
        damp = 3 * dt_s
        e.vx += (fx - e.vx) * damp
        e.vy += (fy - e.vy) * damp

    spd2 = e.vx * e.vx + e.vy * e.vy
    max_spd2 = max_spd * max_spd
    if spd2 > max_spd2:
        spd = math.sqrt(spd2)
        e.vx = e.vx / spd * max_spd
        e.vy = e.vy / spd * max_spd

    e.x += e.vx * dt_s; e.y += e.vy * dt_s
    _wrap_world(e)
    _try_split(e, entities, dt)


def _coast(e: Entity, dt: float) -> None:
    """Minimal tick: metabolism + coast with current velocity."""
    sm, vm, mm, _ = _apply_terrain(e)
    dt_s = dt / 1000
    e.energy -= _calc_metabolism(e.speed, e.visionRange, mm) * dt_s
    if e.energy <= 0:
        e.alive = False
        return
    e.x += e.vx * dt_s; e.y += e.vy * dt_s
    _wrap_world(e)


SEARCH_INTERVAL = 2


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
        self.grass: list[Entity] = []
        self.animals: list[Entity] = []
        self.running = False
        self.paused = False
        self.tick_count = 0
        self._prev_ids: set[int] | None = None

    def reset(self) -> None:
        self.grass.clear()
        self.animals.clear()
        for _ in range(CFG["initialGrass"]):
            x, y = _random_in_bounds()
            self.grass.append(_create_entity(T_GRASS, x, y))
        for _ in range(CFG["initialHerbivores"]):
            x, y = _random_in_bounds()
            self.animals.append(_create_entity(T_HERB, x, y))
        for _ in range(CFG["initialCarnivores"]):
            x, y = _random_in_bounds()
            self.animals.append(_create_entity(T_CARN, x, y))
        self.tick_count = 0
        self._prev_ids = None
        _all_lineage.clear()
        _new_births.clear()

    def step(self, dt: float) -> None:
        if self.paused or not self.running:
            return

        _new_births.clear()
        b = CFG["worldBounds"]
        sp = SPATIAL_CHUNK
        n = math.ceil(b * 2 / sp)

        grass_count = 0
        alive_grass = 0
        dt_s = dt / 1000
        for e in self.grass:
            if e.regrowTimer > 0:
                e.regrowTimer -= dt
                if e.regrowTimer <= 0:
                    e.energy = CFG["grassMaxEnergy"]
                    e.alive = True
            else:
                e.energy = min(e.maxEnergy, e.energy + CFG["grassGrowRate"] * _GRASS_MUL[e._te] * dt_s)
                e.splitCooldown -= dt
                if e.splitCooldown <= 0 and e.energy >= e.maxEnergy * CFG["splitThreshold"]:
                    angle = random.random() * math.pi * 2
                    d2 = 20 + random.random() * 30
                    cx = e.x + math.cos(angle) * d2
                    cy = e.y + math.sin(angle) * d2
                    e.energy *= 0.5
                    e.splitCooldown = CFG["splitCooldown"]
                    child = _create_entity(e.type, cx, cy, inherit=e)
                    child.energy = e.energy
                    child.splitCooldown = CFG["splitCooldown"]
                    self.grass.append(child)
                    _record_birth(child)
            grass_count += 1
            if e.energy > 0:
                alive_grass += 1

        grid = {i: ([], [], []) for i in range(n * n)}
        for e in self.grass:
            if not e.alive: continue
            grid[e._ckey][0].append(e)
        for e in self.animals:
            cx = int((e.x + b) // sp) % n
            cy = int((e.y + b) // sp) % n
            grid[cx * n + cy][e.type].append(e)

        search = (self.tick_count % SEARCH_INTERVAL) == 0
        if search:
            for e in self.animals:
                if e.type == T_HERB:
                    update_herbivore(e, dt, self.animals, grid)
                else:
                    update_carnivore(e, dt, self.animals, grid)
        else:
            for e in self.animals:
                _coast(e, dt)

        self.animals = [e for e in self.animals if e.alive]

        if alive_grass < CFG["maxGrass"] and grass_count < CFG["maxGrass"]:
            chance = 1 - alive_grass / max(CFG["maxGrass"], 1)
            if random.random() < chance * 0.08:
                x, y = _random_in_bounds()
                self.grass.append(_create_entity(T_GRASS, x, y))
        self.tick_count += 1

    def pack_state(self) -> str:
        c = [0, 0, 0]
        e_parts: list[str] = []
        d_parts: list[str] = []
        first = True
        tn = _TYPE_NAMES
        for e in self.grass:
            if e.alive:
                c[0] += 1
                if first:
                    e_parts.append('[')
                    first = False
                else:
                    e_parts.append(',')
                e_parts.append('{"i":')
                e_parts.append(str(e.id))
                e_parts.append(',"t":"grass","x":')
                e_parts.append(e._xs)
                e_parts.append(',"y":')
                e_parts.append(e._ys)
                e_parts.append(',"e":')
                e_parts.append(f'{e.energy:.1f}')
                e_parts.append(',"r":')
                e_parts.append(f'{e.regrowTimer:.0f}')
                e_parts.append('}')
            else:
                d_parts.append(str(e.id))
        for e in self.animals:
            c[e.type] += 1
            if first:
                e_parts.append('[')
                first = False
            else:
                e_parts.append(',')
            e_parts.append('{"i":')
            e_parts.append(str(e.id))
            e_parts.append(',"t":"')
            e_parts.append(tn[e.type])
            e_parts.append('","x":')
            e_parts.append(f'{e.x:.1f}')
            e_parts.append(',"y":')
            e_parts.append(f'{e.y:.1f}')
            e_parts.append(',"e":')
            e_parts.append(f'{e.energy:.1f}')
            e_parts.append(',"r":')
            e_parts.append(f'{e.regrowTimer:.0f}')
            e_parts.append('}')
        if first:
            e_parts.append('[]')
        else:
            e_parts.append(']')

        parts = [
            '{"t":', str(self.tick_count),
            ',"c":{"g":', str(c[0]), ',"h":', str(c[1]), ',"c":', str(c[2]), '}',
            ',"p":', 'true' if self.paused else 'false',
            ',"e":',
        ]
        parts.extend(e_parts)

        if d_parts:
            parts.append(',"d":[')
            parts.append(','.join(d_parts))
            parts.append(']')

        if _new_births:
            parts.append(',"b":')
            parts.append(json.dumps(_new_births, separators=(",", ":")))

        parts.append('}')
        for e in self.grass:
            if e.alive:
                e._px = e.x; e._py = e.y
        for e in self.animals:
            e._px = e.x; e._py = e.y
        ids = set()
        for e in self.grass:
            if e.alive: ids.add(e.id)
        for e in self.animals: ids.add(e.id)
        self._prev_ids = ids
        return ''.join(parts)

    def pack_delta(self) -> str:
        if self._prev_ids is None:
            return self.pack_state()

        c = [0, 0, 0]
        e_parts: list[str] = []
        prev_ids = self._prev_ids
        tn = _TYPE_NAMES
        first = True
        current_ids: set[int] = set()

        for e in self.grass:
            if not e.alive:
                continue
            c[0] += 1
            current_ids.add(e.id)
            if e.id not in prev_ids or e.x != e._px or e.y != e._py:
                if first:
                    e_parts.append('['); first = False
                else:
                    e_parts.append(',')
                e_parts.append('{"i":'); e_parts.append(str(e.id))
                e_parts.append(',"t":"grass","x":'); e_parts.append(e._xs)
                e_parts.append(',"y":'); e_parts.append(e._ys)
                e_parts.append(',"e":'); e_parts.append(f'{e.energy:.1f}')
                e_parts.append(',"r":'); e_parts.append(f'{e.regrowTimer:.0f}')
                e_parts.append('}')
                e._px = e.x; e._py = e.y

        for e in self.animals:
            c[e.type] += 1
            current_ids.add(e.id)
            if e.id not in prev_ids or e.x != e._px or e.y != e._py:
                if first:
                    e_parts.append('['); first = False
                else:
                    e_parts.append(',')
                e_parts.append('{"i":'); e_parts.append(str(e.id))
                e_parts.append(',"t":"'); e_parts.append(tn[e.type])
                e_parts.append('","x":'); e_parts.append(f'{e.x:.1f}')
                e_parts.append(',"y":'); e_parts.append(f'{e.y:.1f}')
                e_parts.append(',"e":'); e_parts.append(f'{e.energy:.1f}')
                e_parts.append(',"r":'); e_parts.append(f'{e.regrowTimer:.0f}')
                e_parts.append('}')
                e._px = e.x; e._py = e.y

        if first:
            e_parts.append('[]')
        else:
            e_parts.append(']')

        removed = prev_ids - current_ids
        d_part = ''
        if removed:
            d_part = ',"d":[' + ','.join(str(id) for id in removed) + ']'

        births_part = ''
        if _new_births:
            births_part = ',"b":' + json.dumps(_new_births, separators=(",", ":"))

        parts = [
            '{"t":', str(self.tick_count),
            ',"f":false',
            ',"c":{"g":', str(c[0]), ',"h":', str(c[1]), ',"c":', str(c[2]), '}',
            ',"p":', 'true' if self.paused else 'false',
            ',"e":',
        ]
        parts.extend(e_parts)
        if d_part:
            parts.append(d_part)
        if births_part:
            parts.append(births_part)
        parts.append('}')

        self._prev_ids = current_ids
        return ''.join(parts)


# ── WebSocket server ─────────────────────────────────────────────────────────

TICK_RATE = 30
SEND_INTERVAL = 3           # send state every N ticks (~10 fps send)
FULL_STATE_INTERVAL = 10    # full state every N delta sends (~1 sec re-sync)


class EcosystemServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.sim = EcosystemSim()
        self.clients: set[websockets.WebSocketServerProtocol] = set()
        self.executor = ThreadPoolExecutor(max_workers=1)
        self._send_counter = 0
        self._pack_counter = 0
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
                if not self.sim.paused:
                    await loop.run_in_executor(
                        self.executor, lambda: self.sim.step(1000.0 / TICK_RATE),
                    )

                self._send_counter += 1
                if self._send_counter % SEND_INTERVAL == 0 and self.clients:
                    self._pack_counter += 1
                    if self._pack_counter % FULL_STATE_INTERVAL == 0:
                        state_json = await loop.run_in_executor(
                            self.executor, self.sim.pack_state,
                        )
                    else:
                        state_json = await loop.run_in_executor(
                            self.executor, self.sim.pack_delta,
                        )
                    await self._broadcast(state_json)

                fps_count += 1

            now = time.monotonic()
            if now - fps_t0 >= 1.0:
                g = sum(1 for e in self.sim.grass if e.alive)
                h = c = 0
                for e in self.sim.animals:
                    if e.type == T_HERB: h += 1
                    else: c += 1
                print(f"[{fps_count} fps]  total={len(self.sim.grass) + len(self.sim.animals)} alive={g+h+c}  🌿{g}  🐇{h}  🦊{c}")
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
                        etype = _TYPE_FROM_NAME.get(data.get("entity", ""), T_GRASS)
                        cnt = data.get("count", 1)
                        target = self.sim.grass if etype == T_GRASS else self.sim.animals
                        for _ in range(cnt):
                            x, y = _random_in_bounds()
                            target.append(_create_entity(etype, x, y))
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
