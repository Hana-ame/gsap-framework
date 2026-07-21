import * as PIXI from 'pixi.js';

export interface ParticleConfig {
  count: number;
  spawnRate: number;
  lifetime: [number, number];
  speed: [number, number];
  direction: [number, number];
  gravity: number;
  wind: number;
  size: [number, number];
  color: number;
  alpha: [number, number];
  fadeOut: boolean;
}

export type ParticlePreset = 'snow' | 'sparkle' | 'dust' | 'cherry' | 'magic' | 'rain' | 'embers';

export interface EmitterPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Particle {
  gfx: PIXI.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startSize: number;
  endSize: number;
  startAlpha: number;
  endAlpha: number;
  color: number;
  active: boolean;
}

export class ParticleEmitter {
  private _pool: Particle[] = [];
  private _active: Particle[] = [];
  private _spawnAccum = 0;
  private _playing = false;
  private _config: ParticleConfig;
  private _position: EmitterPosition;
  private _container: PIXI.Container;

  constructor(
    container: PIXI.Container,
    config: ParticleConfig,
    position: EmitterPosition,
  ) {
    this._container = container;
    this._config = config;
    this._position = position;
    for (let i = 0; i < config.count; i++) {
      const gfx = new PIXI.Graphics();
      gfx.eventMode = 'none';
      gfx.visible = false;
      container.addChild(gfx);
      this._pool.push({
        gfx,
        vx: 0, vy: 0, life: 0, maxLife: 0,
        startSize: 0, endSize: 0,
        startAlpha: 0, endAlpha: 0,
        color: 0, active: false,
      });
    }
  }

  play(): void { this._playing = true; }
  stop(): void { this._playing = false; }
  get playing(): boolean { return this._playing; }

  setPosition(pos: Partial<EmitterPosition>): void {
    Object.assign(this._position, pos);
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;

    // Update active particles
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.gfx.visible = false;
        this._active.splice(i, 1);
        this._pool.push(p);
        continue;
      }
      const t = 1 - p.life / p.maxLife;
      p.vy += this._config.gravity * dt;
      p.vx += this._config.wind * dt;
      p.gfx.x += p.vx * dt;
      p.gfx.y += p.vy * dt;

      if (this._config.fadeOut) {
        p.gfx.alpha = p.startAlpha + (p.endAlpha - p.startAlpha) * t;
      }
      const size = p.startSize + (p.endSize - p.startSize) * t;
      p.gfx.scale.set(size / p.startSize);
    }

    // Spawn new particles
    if (!this._playing) return;
    this._spawnAccum += this._config.spawnRate * dt;
    while (this._spawnAccum >= 1 && this._pool.length > 0) {
      this._spawnAccum -= 1;
      const p = this._pool.pop()!;
      p.active = true;
      p.maxLife = rand(...this._config.lifetime);
      p.life = p.maxLife;

      const angle = rand(...this._config.direction) - Math.PI / 2;
      const speed = rand(...this._config.speed);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;

      p.startSize = rand(...this._config.size);
      p.endSize = p.startSize * 0.3;
      p.startAlpha = rand(...this._config.alpha);
      p.endAlpha = 0;

      p.color = this._config.color;
      p.gfx.clear();
      p.gfx.circle(0, 0, p.startSize).fill({ color: p.color, alpha: p.startAlpha });
      p.gfx.x = this._position.x + Math.random() * this._position.width;
      p.gfx.y = this._position.y + Math.random() * this._position.height;
      p.gfx.alpha = p.startAlpha;
      p.gfx.visible = true;
      this._active.push(p);
    }
  }

  destroy(): void {
    for (const p of this._pool) {
      p.gfx.destroy();
    }
    for (const p of this._active) {
      p.gfx.destroy();
    }
    this._pool.length = 0;
    this._active.length = 0;
  }
}

export class ParticleSystem {
  private _emitters: ParticleEmitter[] = [];

  createEmitter(
    container: PIXI.Container,
    preset: ParticlePreset,
    position: EmitterPosition,
    overrides?: Partial<ParticleConfig>,
  ): ParticleEmitter {
    const config = { ...PRESETS[preset], ...overrides };
    const emitter = new ParticleEmitter(container, config, position);
    this._emitters.push(emitter);
    return emitter;
  }

  update(dtMs: number): void {
    for (const e of this._emitters) {
      e.update(dtMs);
    }
  }

  destroy(): void {
    for (const e of this._emitters) {
      e.destroy();
    }
    this._emitters.length = 0;
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

const PRESETS: Record<ParticlePreset, ParticleConfig> = {
  snow: {
    count: 100, spawnRate: 15,
    lifetime: [5, 10], speed: [20, 60],
    direction: [0.2, 0.8], gravity: 8, wind: 5,
    size: [1.5, 4], color: 0xffffff, alpha: [0.4, 0.9],
    fadeOut: false,
  },
  sparkle: {
    count: 40, spawnRate: 8,
    lifetime: [1, 3], speed: [10, 30],
    direction: [0, Math.PI * 2], gravity: -2, wind: 0,
    size: [1, 3], color: 0xffee88, alpha: [0.8, 1],
    fadeOut: true,
  },
  dust: {
    count: 30, spawnRate: 3,
    lifetime: [3, 6], speed: [2, 8],
    direction: [0, Math.PI * 2], gravity: 0, wind: 2,
    size: [1, 2.5], color: 0x998866, alpha: [0.1, 0.4],
    fadeOut: false,
  },
  cherry: {
    count: 60, spawnRate: 10,
    lifetime: [4, 8], speed: [15, 40],
    direction: [0.3, 0.9], gravity: 5, wind: 8,
    size: [2, 4], color: 0xffaacc, alpha: [0.5, 0.9],
    fadeOut: false,
  },
  magic: {
    count: 50, spawnRate: 12,
    lifetime: [1, 2.5], speed: [20, 60],
    direction: [0, Math.PI * 2], gravity: -5, wind: 0,
    size: [1, 3], color: 0x88ddff, alpha: [0.6, 1],
    fadeOut: true,
  },
  rain: {
    count: 80, spawnRate: 30,
    lifetime: [0.5, 1.2], speed: [200, 400],
    direction: [0.2, 0.5], gravity: 0, wind: 10,
    size: [1, 2], color: 0x6688cc, alpha: [0.3, 0.6],
    fadeOut: false,
  },
  embers: {
    count: 25, spawnRate: 4,
    lifetime: [2, 5], speed: [10, 30],
    direction: [0.5, Math.PI - 0.5], gravity: -12, wind: 3,
    size: [1.5, 3.5], color: 0xff6633, alpha: [0.7, 1],
    fadeOut: true,
  },
};
