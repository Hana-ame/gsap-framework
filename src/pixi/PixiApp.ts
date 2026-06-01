import * as PIXI from 'pixi.js';
import { SubCanvasProxy } from './SubCanvasProxy';
import { SubPointerType } from './SubCanvas';

const POINTER_TYPES: SubPointerType[] = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointerleave',
];

export function startPixiApp(onReady?: (proxy: SubCanvasProxy) => void): () => void {
  const app = new PIXI.Application();
  let mounted = false;
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
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.display = 'block';

      document.body.appendChild(canvas);
      mounted = true;

      proxy = new SubCanvasProxy({ app });
      onReady?.(proxy);
    })
    .catch((err) => {
      console.error('Pixi 初始化失败:', err);
    });

  return () => {
    POINTER_TYPES.forEach((type) => {
      window.removeEventListener(type, makePointerHandler(type));
    });
    window.removeEventListener('resize', onResize);
    proxy?.destroyAll();
    if (mounted) {
      document.body.removeChild(app.canvas);
    }
    app.destroy(true, { children: true, texture: true });
  };
}
