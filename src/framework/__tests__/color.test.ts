import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbaToHex,
  hexToRgba,
  parseHexString,
  formatHexString,
  blendColors,
  alphaBlend,
  luminance,
  isLight,
  contrastTextColor,
} from '../utils/color';

describe('hexToRgb', () => {
  it('converts white', () => {
    expect(hexToRgb(0xffffff)).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('converts black', () => {
    expect(hexToRgb(0x000000)).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('converts red', () => {
    expect(hexToRgb(0xff0000)).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('converts green', () => {
    expect(hexToRgb(0x00ff00)).toEqual({ r: 0, g: 255, b: 0 });
  });
  it('converts blue', () => {
    expect(hexToRgb(0x0000ff)).toEqual({ r: 0, g: 0, b: 255 });
  });
  it('converts a mid-range color', () => {
    expect(hexToRgb(0x88aaff)).toEqual({ r: 136, g: 170, b: 255 });
  });
});

describe('rgbToHex', () => {
  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe(0xffffff);
  });
  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe(0x000000);
  });
  it('converts red', () => {
    expect(rgbToHex(255, 0, 0)).toBe(0xff0000);
  });
  it('converts a mid-range color', () => {
    expect(rgbToHex(136, 170, 255)).toBe(0x88aaff);
  });
});

describe('rgbaToHex', () => {
  it('encodes RGBA into hex', () => {
    expect(rgbaToHex(255, 0, 0, 128)).toBe(0x80ff0000);
  });
  it('encodes fully opaque', () => {
    expect(rgbaToHex(255, 255, 255, 255)).toBe(0xffffffff);
  });
});

describe('hexToRgba', () => {
  it('decodes hex with alpha', () => {
    expect(hexToRgba(0x80ff0000)).toEqual({ r: 255, g: 0, b: 0, a: 128 });
  });
});

describe('parseHexString', () => {
  it('parses with hash', () => {
    expect(parseHexString('#ff0000')).toBe(0xff0000);
  });
  it('parses without hash', () => {
    expect(parseHexString('00ff00')).toBe(0x00ff00);
  });
  it('parses shorthand hex', () => {
    expect(parseHexString('#f00')).toBe(0xff0000);
  });
});

describe('formatHexString', () => {
  it('formats with hash prefix', () => {
    expect(formatHexString(0xff0000)).toBe('#ff0000');
  });
  it('pads with leading zeros', () => {
    expect(formatHexString(0x0000ff)).toBe('#0000ff');
  });
});

describe('blendColors', () => {
  it('returns a at t=0', () => {
    expect(blendColors({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 0)).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('returns b at t=1', () => {
    expect(blendColors({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 1)).toEqual({ r: 0, g: 0, b: 255 });
  });
  it('returns midpoint at t=0.5', () => {
    expect(blendColors({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }, 0.5)).toEqual({ r: 128, g: 0, b: 128 });
  });
  it('handles black to white', () => {
    expect(blendColors({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5)).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe('alphaBlend', () => {
  it('fully opaque foreground covers background', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 255 }, { r: 0, g: 255, b: 0 });
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('fully transparent foreground leaves background', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 255, b: 0 });
    expect(result).toEqual({ r: 0, g: 255, b: 0 });
  });
  it('50% alpha blends evenly', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 128 }, { r: 0, g: 0, b: 255 });
    expect(result.r).toBe(128);
    expect(result.g).toBe(0);
    expect(result.b).toBe(127);
  });
});

describe('luminance', () => {
  it('white has high luminance', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(200);
  });
  it('black has zero luminance', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
});

describe('isLight', () => {
  it('white is light', () => {
    expect(isLight({ r: 255, g: 255, b: 255 })).toBe(true);
  });
  it('black is not light', () => {
    expect(isLight({ r: 0, g: 0, b: 0 })).toBe(false);
  });
  it('yellow is light', () => {
    expect(isLight({ r: 255, g: 255, b: 0 })).toBe(true);
  });
});

describe('contrastTextColor', () => {
  it('returns black on light background', () => {
    expect(contrastTextColor({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('returns white on dark background', () => {
    expect(contrastTextColor({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 });
  });
});
