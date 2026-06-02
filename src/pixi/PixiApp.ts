import * as PIXI from 'pixi.js';
import { SubCanvasProxy } from './SubCanvasProxy';
import { SubPointerType } from './SubCanvas';

const POINTER_TYPES: SubPointerType[] = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointerleave',
];

const bodyCanvases = new Set<HTMLCanvasElement>();

function listBodyCanvases(): HTMLCanvasElement[] {
  if (typeof document === 'undefined') return [];
  return Array.from(document.body.querySelectorAll('canvas'));
}

function assertSingleBodyCanvas(incoming?: HTMLCanvasElement): void {
  if (typeof document === 'undefined') return;
  const all = listBodyCanvases();
  const others = incoming
    ? all.filter((c) => c !== incoming)
    : all;
  if (others.length > 0) {
    const msg = `[PixiApp] body 已有 ${others.length} 个 canvas，强制清理`;
    if (import.meta.env.DEV) {
      console.warn(msg, others);
    }
    others.forEach((c) => {
      bodyCanvases.delete(c);
      if (c.parentNode) c.parentNode.removeChild(c);
    });
  }
}

export function startPixiApp(onReady?: (proxy: SubCanvasProxy) => void): () => void {
  assertSingleBodyCanvas();

  const app = new PIXI.Application();
  let mounted = false;
  let destroyed = false;
  let proxy: SubCanvasProxy | null = null;

  const onResize = () => {
    if (!mounted) return;
    app.renderer.resize(window.innerWidth, window.innerHeight);
  };

  const makePointerHandler = (type: SubPointerType) => (e: PointerEvent) => {
    if (!proxy) return;
    if (e.target !== proxy.canvas) return;
    proxy.routePointer(type, e);
  };

  POINTER_TYPES.forEach((type) => {
    window.addEventListener(type, makePointerHandler(type));
  });
  window.addEventListener('resize', onResize);

  app
    .init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    .then(() => {
      if (destroyed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.display = 'block';
      canvas.style.zIndex = '0';

      assertSingleBodyCanvas(canvas);
      bodyCanvases.add(canvas);
      document.body.appendChild(canvas);
      mounted = true;

      proxy = new SubCanvasProxy({ app });
      onReady?.(proxy);
    })
    .catch((err) => {
      if (destroyed) return;
      console.error('Pixi 初始化失败:', err);
    });

  return () => {
    destroyed = true;
    POINTER_TYPES.forEach((type) => {
      window.removeEventListener(type, makePointerHandler(type));
    });
    window.removeEventListener('resize', onResize);
    proxy?.destroyAll();
    proxy = null;
    if (mounted) {
      const c = app.canvas as HTMLCanvasElement | undefined;
      if (c && c.parentNode) {
        c.parentNode.removeChild(c);
        bodyCanvases.delete(c);
      }
    }
    try {
      app.destroy(true, { children: true, texture: true });
    } catch {
      // already destroyed
    }
  };
}

export function debugBodyCanvases(): HTMLCanvasElement[] {
  return listBodyCanvases();
}
