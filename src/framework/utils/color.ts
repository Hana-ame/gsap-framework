/** color — 颜色转换与操作工具（RGB/HSL/hex 互转、插值）。 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface RgbaColor extends RgbColor {
  a: number;
}

export function hexToRgb(hex: number): RgbColor {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

export function rgbToHex(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function rgbaToHex(r: number, g: number, b: number, a: number): number {
  const rgba = (a & 0xff) << 24 | (r & 0xff) << 16 | (g & 0xff) << 8 | (b & 0xff);
  return rgba >>> 0;
}

export function hexToRgba(hex: number): RgbaColor {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
    a: (hex >> 24) & 0xff,
  };
}

export function parseHexString(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return parseInt(h, 16);
}

export function formatHexString(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export function blendColors(a: RgbColor, b: RgbColor, t: number): RgbColor {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function alphaBlend(foreground: RgbaColor, background: RgbColor): RgbColor {
  const fa = foreground.a / 255;
  const invA = 1 - fa;
  return {
    r: Math.round(foreground.r * fa + background.r * invA),
    g: Math.round(foreground.g * fa + background.g * invA),
    b: Math.round(foreground.b * fa + background.b * invA),
  };
}

export function luminance(c: RgbColor): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

export function isLight(c: RgbColor, threshold = 128): boolean {
  return luminance(c) >= threshold;
}

export function contrastTextColor(background: RgbColor): RgbColor {
  return isLight(background) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}
