import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: { to: vi.fn((target: unknown, vars: Record<string, unknown>) => vars), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

import * as PIXI from 'pixi.js';
import { PortraitLayer } from '../AvdPortraitLayer';
import { gsap } from '../../framework/gsap-pixi';

const MOCK_OPTS = { W: 800, portraitY: 100, portraitMaxH: 400, portraitFadeMs: 300 };

describe('PortraitLayer', () => {
  let parent: PIXI.Container;

  beforeEach(() => {
    parent = new PIXI.Container();
  });

  it('constructs and adds to parent', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    expect(pl.container.parent).toBe(parent);
  });

  it('setPortrait creates new sprite for new position', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('left', tex);
    const sprites = pl.container.children.filter((c) => c instanceof PIXI.Sprite);
    expect(sprites.length).toBe(1);
  });

  it('setPortrait(null) fades out existing', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('left', tex);
    pl.setPortrait(null, null);
    expect(pl.getSlotTexture('left')).toBeNull();
  });

  it('getSlotTexture returns current texture', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('center', tex);
    expect(pl.getSlotTexture('center')).toBe(tex);
  });

  it('setPortrait on same position with same texture does nothing', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('center', tex);
    (gsap.to as ReturnType<typeof vi.fn>).mockClear();
    pl.setPortrait('center', tex);
    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('setSlotAlpha changes alpha with animation', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('left', tex);
    (gsap.to as ReturnType<typeof vi.fn>).mockClear();
    pl.setSlotAlpha('left', 0.5, true);
    expect(gsap.to).toHaveBeenCalled();
  });

  it('setSlotAlpha without animation sets alpha directly', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    pl.setPortrait('left', tex);
    pl.setSlotAlpha('left', 0.5, false);
    const sprite = pl.container.children.find((c) => c instanceof PIXI.Sprite) as PIXI.Sprite;
    expect(sprite.alpha).toBe(0.5);
  });

  it('applyOptions updates stored opts', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    pl.applyOptions({ portraitFadeMs: 500 });
    pl.setPortrait('left', new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 })));
  });

  it('destroy kills tweens and destroys container', () => {
    const pl = new PortraitLayer(parent, MOCK_OPTS);
    const destroySpy = vi.spyOn(pl.container, 'destroy');
    pl.destroy();
    expect(destroySpy).toHaveBeenCalledWith({ children: true });
  });
});
