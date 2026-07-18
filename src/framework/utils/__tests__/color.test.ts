import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbaToHex,
  parseHexString,
  formatHexString,
  blendColors,
  luminance,
  isLight,
  contrastTextColor,
} from '../color';

describe('hexToRgb / rgbToHex', () => {
  it('converts hex to RGB and back', () => {
    const hex = 0xff5577;
    const rgb = hexToRgb(hex);
    expect(rgb).toEqual({ r: 255, g: 85, b: 119 });
    expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe(hex);
  });
  it('handles black', () => {
    expect(hexToRgb(0x000000)).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('handles white', () => {
    expect(hexToRgb(0xffffff)).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('rgbaToHex', () => {
  it('packs RGBA into a number', () => {
    const result = rgbaToHex(255, 85, 119, 128);
    expect(result).toBe(0x80ff5577);
  });
});

describe('parseHexString / formatHexString', () => {
  it('parses and formats hex strings', () => {
    expect(parseHexString('#ff5577')).toBe(0xff5577);
    expect(formatHexString(0xff5577)).toBe('#ff5577');
  });
  it('handles shorthand hex strings', () => {
    expect(parseHexString('#f57')).toBe(0xff5577);
  });
  it('handles hex strings without hash', () => {
    expect(parseHexString('ff5577')).toBe(0xff5577);
  });
});

describe('blendColors', () => {
  it('returns first color at t=0', () => {
    const a = { r: 0, g: 0, b: 0 };
    const b = { r: 255, g: 255, b: 255 };
    expect(blendColors(a, b, 0)).toEqual(a);
  });
  it('returns second color at t=1', () => {
    const a = { r: 0, g: 0, b: 0 };
    const b = { r: 255, g: 255, b: 255 };
    expect(blendColors(a, b, 1)).toEqual(b);
  });
  it('returns midpoint at t=0.5', () => {
    const a = { r: 0, g: 0, b: 0 };
    const b = { r: 100, g: 100, b: 100 };
    expect(blendColors(a, b, 0.5)).toEqual({ r: 50, g: 50, b: 50 });
  });
});

describe('luminance / isLight', () => {
  it('is light for white', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBe(255);
    expect(isLight({ r: 255, g: 255, b: 255 })).toBe(true);
  });
  it('is dark for black', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(isLight({ r: 0, g: 0, b: 0 })).toBe(false);
  });
});

describe('contrastTextColor', () => {
  it('returns white for dark backgrounds', () => {
    expect(contrastTextColor({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('returns black for light backgrounds', () => {
    expect(contrastTextColor({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });
});
