import * as PIXI from 'pixi.js';
import { mountDisplays } from './Displays';

export function startPixiApp(): () => void {
  const app = new PIXI.Application();
  let mounted = false;
  let cleanupDisplays: (() => void) | null = null;

  const onResize = () => {
    if (!mounted) return;
    app.renderer.resize(window.innerWidth, window.innerHeight);
  };

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

      cleanupDisplays = mountDisplays(app);
    })
    .catch((err) => {
      console.error('Pixi 初始化失败:', err);
    });

  return () => {
    window.removeEventListener('resize', onResize);
    cleanupDisplays?.();
    if (mounted) {
      document.body.removeChild(app.canvas);
    }
    app.destroy(true, { children: true, texture: true });
  };
}
