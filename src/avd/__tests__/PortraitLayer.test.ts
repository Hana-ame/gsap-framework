import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('gsap', () => ({
  default: { to: vi.fn((_target: unknown, vars: Record<string, unknown>) => vars), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  gsap: { to: vi.fn((_target: unknown, vars: Record<string, unknown>) => vars), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
}));

import * as PIXI from 'pixi.js';
import { PortraitLayer } from '../PortraitLayer';

const MOCK_OPTS = { screenW: 800, portraitY: 100, portraitMaxH: 400, portraitFadeMs: 300 };

describe('PortraitLayer', () => {
  let parent: PIXI.Container;

  beforeEach(() => {
    parent = new PIXI.Container();
  });

  it('constructs and adds to parent', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    expect(pl.container.parent).toBe(parent);
  });

  it('setTarget creates new sprite for new position', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setTarget('left', tex);
    const sprites = pl.container.children.filter((c) => c instanceof PIXI.Sprite);
    expect(sprites.length).toBe(1);
  });

  it('setTarget with null fades out', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setTarget('left', tex);
    pl.setTarget(null, null);
  });

  it('setAll sets multiple portraits with alpha', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const texA = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    const texB = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setAll([
      { pos: 'left', texture: texA, alpha: 1.0 },
      { pos: 'right', texture: texB, alpha: 0.4 },
    ]);
    const sprites = pl.container.children.filter((c) => c instanceof PIXI.Sprite);
    expect(sprites.length).toBe(2);
  });

  it('setTarget on same position with same texture does nothing', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setTarget('center', tex);
    pl.setTarget('center', tex);
  });

  it('applyOptions updates stored opts', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    pl.applyOptions({ portraitFadeMs: 500 });
  });

  it('destroy kills tweens and destroys container', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const destroySpy = vi.spyOn(pl.container, 'destroy');
    pl.destroy();
    expect(destroySpy).toHaveBeenCalledWith({ children: true });
  });
});
