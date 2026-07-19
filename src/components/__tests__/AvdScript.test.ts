import { describe, it, expect, vi } from 'vitest';

import { parseAvdScriptJSON } from '../AvdScript';
import * as PIXI from 'pixi.js';

function mockResolver(textureMap: Record<string, PIXI.Texture>) {
  return {
    loadTexture: vi.fn(async (key: string) => textureMap[key] ?? new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 100 }))),
  };
}

describe('parseAvdScriptJSON', () => {
  it('parses basic script with text lines', async () => {
    const json = {
      meta: { width: 800, height: 600 },
      lines: [
        { speaker: 'Alice', text: 'Hello' },
        { speaker: 'Bob', text: 'Hi' },
      ],
    };
    const res = await parseAvdScriptJSON(json, mockResolver({}));
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
    const res = await parseAvdScriptJSON(json, mockResolver({ alice: tex }));
    expect(res.roster.Alice).toBeDefined();
    expect(res.roster.Alice.pos).toBe('left');
    expect(res.roster.Alice.texture).toBe(tex);
  });

  it('resolves portraitKey to texture', async () => {
    const tex = new PIXI.Texture(new PIXI.TextureSource({ width: 100, height: 200 }));
    const json = {
      lines: [{ speaker: 'Alice', text: 'Hi', portraitKey: 'alice', portraitPos: 'center' as const }],
    };
    const res = await parseAvdScriptJSON(json, mockResolver({ alice: tex }));
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
    const res = await parseAvdScriptJSON(json, mockResolver({ icon: tex }));
    expect(Array.isArray(res.lines[0].text)).toBe(true);
    const segments = res.lines[0].text as Array<{ kind: string }>;
    expect(segments.length).toBe(2);
    expect(segments[0].kind).toBe('text');
    expect(segments[1].kind).toBe('image');
  });

  it('defaults rosterMode to speaker-only', async () => {
    const json = { lines: [{ text: 'Hello' }] };
    const res = await parseAvdScriptJSON(json, mockResolver({}));
    expect(res.rosterMode).toBe('speaker-only');
  });

  it('accepts persistent rosterMode', async () => {
    const json = { meta: { rosterMode: 'persistent' as const }, lines: [{ text: 'Hello' }] };
    const res = await parseAvdScriptJSON(json, mockResolver({}));
    expect(res.rosterMode).toBe('persistent');
  });

  it('loads all textures in parallel', async () => {
    const resolver = mockResolver({ a: new PIXI.Texture(new PIXI.TextureSource({ width: 1, height: 1 })) });
    const json = {
      roster: { X: { pos: 'left' as const, textureKey: 'a' } },
      lines: [{ text: 'Test' }],
    };
    await parseAvdScriptJSON(json, resolver);
    expect(resolver.loadTexture).toHaveBeenCalledWith('a');
  });

  it('handles empty lines', async () => {
    const json = { lines: [] };
    const res = await parseAvdScriptJSON(json, mockResolver({}));
    expect(res.lines.length).toBe(0);
  });

  it('handles missing portraitKey gracefully', async () => {
    const json = { lines: [{ speaker: 'Alice', text: 'Hi' }] };
    const res = await parseAvdScriptJSON(json, mockResolver({}));
    expect(res.lines[0].portrait).toBeUndefined();
  });
});
