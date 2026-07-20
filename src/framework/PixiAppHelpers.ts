/** PixiAppHelpers — PixiApp 的工具函数：pointer 类型列表与全局坐标转换。 */
import type { SubPointerType } from './SubCanvasTypes';

export const POINTER_TYPES: SubPointerType[] = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointerleave',
];

export const bodyCanvases = new Set<HTMLCanvasElement>();

export function listBodyCanvases(): HTMLCanvasElement[] {
  if (typeof document === 'undefined') return [];
  return Array.from(document.body.querySelectorAll('canvas'));
}

export function assertSingleBodyCanvas(incoming?: HTMLCanvasElement): void {
  if (typeof document === 'undefined') return;
  const all = listBodyCanvases();
  const others = incoming ? all.filter((c) => c !== incoming) : all;
  if (others.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(`[PixiApp] body 已有 ${others.length} 个 canvas，强制清理`, others);
    }
    others.forEach((c) => {
      bodyCanvases.delete(c);
      if (c.parentNode) c.parentNode.removeChild(c);
    });
  }
}

export interface WebGLReport {
  ok: boolean;
  vendor?: string;
  renderer?: string;
  version?: string;
  err?: string;
}

export function probeWebGL(): WebGLReport {
  if (typeof document === 'undefined') return { ok: false, err: 'no document' };
  const canvas = document.createElement('canvas');
  const release = (gl: WebGLRenderingContext | null) => {
    if (!gl) return;
    try {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    } catch { /* ignore */ }
  };
  try {
    const gl = (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false })) as WebGLRenderingContext | null;
    if (!gl) {
      release(null);
      return { ok: false, err: 'WebGL context creation failed' };
    }
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = dbg ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : '';
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const version = String(gl.getParameter(gl.VERSION) || '');
    release(gl);
    return { ok: true, vendor, renderer, version };
  } catch (e) {
    release(null);
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

export function showFatalOverlay(title: string, body: string): void {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.dataset.pixiFatal = '1';
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'background:#1a0a14',
    'color:#ffd0d0',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
    'font-family:ui-monospace,monospace',
    'text-align:left',
    'overflow:auto',
    'gap:12px',
  ].join(';');
  const h = document.createElement('h1');
  h.textContent = title;
  h.style.cssText = 'margin:0;font-family:system-ui,sans-serif;font-size:1.1rem;';
  const pre = document.createElement('pre');
  pre.textContent = body;
  pre.style.cssText = 'font-size:0.78rem;max-width:92vw;white-space:pre-wrap;background:#0a0a14;padding:12px;border-radius:8px;border:1px solid #4a1a1a;margin:0;';
  const tip = document.createElement('p');
  tip.textContent = 'Screenshot this and share — it tells us what the device refused.';
  tip.style.cssText = 'font-family:system-ui,sans-serif;font-size:0.8rem;opacity:0.7;margin:0;';
  el.appendChild(h);
  el.appendChild(pre);
  el.appendChild(tip);
  document.body.appendChild(el);
}
