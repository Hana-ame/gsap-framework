import { describe, expect, it } from 'vitest';
import * as PIXI from 'pixi.js';
import { ParticleSystem } from '../ParticleSystem';

describe('ParticleSystem', () => {
  it('creates and updates emitters', () => {
    const container = new PIXI.Container();
    const ps = new ParticleSystem();

    const e = ps.createEmitter(container, 'snow', { x: 0, y: 0, width: 800, height: 600 });
    expect(e.playing).toBe(false);

    e.play();
    expect(e.playing).toBe(true);

    // Run a few update frames to spawn particles
    for (let i = 0; i < 10; i++) {
      ps.update(100);
    }

    expect(container.children.length).toBeGreaterThan(0);
    expect(container.children.every((c) => c instanceof PIXI.Graphics)).toBe(true);

    ps.destroy();
  });

  it('supports multiple emitters', () => {
    const container = new PIXI.Container();
    const ps = new ParticleSystem();

    const e1 = ps.createEmitter(container, 'rain', { x: 0, y: 0, width: 400, height: 300 });
    const e2 = ps.createEmitter(container, 'magic', { x: 200, y: 0, width: 400, height: 300 });

    e1.play();
    e2.play();

    for (let i = 0; i < 5; i++) ps.update(100);

    expect(container.children.length).toBeGreaterThanOrEqual(2);

    ps.destroy();
    expect(container.children.length).toBe(0);
  });

  it('stops spawning when stopped', () => {
    const container = new PIXI.Container();
    const ps = new ParticleSystem();

    const e = ps.createEmitter(container, 'snow', { x: 0, y: 0, width: 800, height: 600 });
    e.play();
    for (let i = 0; i < 5; i++) ps.update(100);
    const countAfter = container.children.filter((c) => c.visible).length;

    e.stop();
    for (let i = 0; i < 20; i++) ps.update(100);
    // No new particles should spawn, old ones die off
    expect(container.children.filter((c) => c.visible).length).toBeLessThanOrEqual(countAfter);

    ps.destroy();
  });
});
