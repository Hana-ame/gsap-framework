import { describe, it, expect, vi } from 'vitest';

import { parseScript } from '../AvdScript';
import * as PIXI from 'pixi.js';

function mockResolver(textureMap: Record<string, PIXI.Texture>) {
  return {
    loadTexture: vi.fn(async (key: string) => textureMap[key] ?? new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 100 }))),
  };
}

describe('parseScript', () => {
  it('parses basic script with text lines', async () => {
    const json = {
      meta: { width: 800, height: 600 },
      lines: [
        { speaker: 'Alice', text: 'Hello' },
        { speaker: 'Bob', text: 'Hi' },
      ],
    };
    const res = await parseScript(json, mockResolver({}));
    expect(res.lines.length).toBe(2);
    expect(res.lines[0].speaker).toBe('Alice');
    expect(res.lines[0].text).toBe('Hello');
    expect(res.meta.width).toBe(800);
  });

  it('parses roster entries', async () => {
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    const json = {
      roster: { Alice: { pos: 'left' as const, textureKey: 'alice' } },
      lines: [{ speaker: 'Alice', text: 'Hello' }],
    };
    const res = await parseScript(json, mockResolver({ alice: tex }));
    expect(res.roster.Alice).toBeDefined();
    expect(res.roster.Alice.pos).toBe('left');
    expect(res.roster.Alice.texture).toBe(tex);
  });

  it('resolves portraitKey to texture', async () => {
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    const json = {
      lines: [{ speaker: 'Alice', text: 'Hi', portraitKey: 'alice', portraitPos: 'center' as const }],
    };
    const res = await parseScript(json, mockResolver({ alice: tex }));
    expect(res.lines[0].portrait).toBe(tex);
    expect(res.lines[0].portraitPos).toBe('center');
  });

  it('parses segmented text with images', async () => {
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 50, height: 50 }));
    const json = {
      lines: [{
        speaker: 'Alice',
        text: [
          { kind: 'text' as const, text: 'Look: ' },
          { kind: 'image' as const, textureKey: 'icon' },
        ],
      }],
    };
    const res = await parseScript(json, mockResolver({ icon: tex }));
    expect(Array.isArray(res.lines[0].text)).toBe(true);
    const segments = res.lines[0].text as Array<{ kind: string }>;
    expect(segments.length).toBe(2);
    expect(segments[0].kind).toBe('text');
    expect(segments[1].kind).toBe('image');
  });

  it('defaults rosterMode to speaker-only', async () => {
    const json = { lines: [{ text: 'Hello' }] };
    const res = await parseScript(json, mockResolver({}));
    expect(res.rosterMode).toBe('speaker-only');
  });

  it('accepts persistent rosterMode', async () => {
    const json = { meta: { rosterMode: 'persistent' as const }, lines: [{ text: 'Hello' }] };
    const res = await parseScript(json, mockResolver({}));
    expect(res.rosterMode).toBe('persistent');
  });

  it('loads all textures in parallel', async () => {
    const resolver = mockResolver({ a: new PIXI.Texture(new PIXI.TextureSource({ width: 1, height: 1 })) });
    const json = {
      roster: { X: { pos: 'left' as const, textureKey: 'a' } },
      lines: [{ text: 'Test' }],
    };
    await parseScript(json, resolver);
    expect(resolver.loadTexture).toHaveBeenCalledWith('a');
  });

  it('handles empty lines', async () => {
    const json = { lines: [] };
    const res = await parseScript(json, mockResolver({}));
    expect(res.lines.length).toBe(0);
  });

  it('handles missing portraitKey gracefully', async () => {
    const json = { lines: [{ speaker: 'Alice', text: 'Hi' }] };
    const res = await parseScript(json, mockResolver({}));
    expect(res.lines[0].portrait).toBeUndefined();
  });

  it('preserves segment and end fields through parseScript', async () => {
    const json = {
      lines: [
        { speaker: 'A', text: 'start' },
        { segment: 'mid', speaker: 'B', text: 'middle', choices: [{ text: 'go', targetSegment: 'end' }] },
        { segment: 'end', speaker: 'C', text: 'done', end: true },
      ],
    };
    const res = await parseScript(json, mockResolver({}));
    expect(res.lines[0].segment).toBeUndefined();
    expect(res.lines[0].end).toBeUndefined();
    expect(res.lines[1].segment).toBe('mid');
    expect(res.lines[1].choices?.[0].targetSegment).toBe('end');
    expect(res.lines[2].segment).toBe('end');
    expect(res.lines[2].end).toBe(true);
  });

  it('preserves voiceKey, bgmKey, sfxKey through parseScript', async () => {
    const json = {
      lines: [
        { speaker: 'A', text: 'hello', voiceKey: 'v_hello', bgmKey: 'bgm_cave', sfxKey: 'sfx_drip' },
        { speaker: 'B', text: 'world' },
      ],
    };
    const res = await parseScript(json, mockResolver({}));
    expect(res.lines[0].voiceKey).toBe('v_hello');
    expect(res.lines[0].bgmKey).toBe('bgm_cave');
    expect(res.lines[0].sfxKey).toBe('sfx_drip');
    expect(res.lines[1].voiceKey).toBeUndefined();
    expect(res.lines[1].bgmKey).toBeUndefined();
    expect(res.lines[1].sfxKey).toBeUndefined();
  });
});
