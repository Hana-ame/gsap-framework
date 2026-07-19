// PixiApp — PIXI.Application 的启动/销毁编排层。
// 职责：WebGL 探测、画布注入、窗口 resize 节流、
// window 级 pointer 路由、dev 健康检查、崩溃兜底遮罩。

import * as PIXI from 'pixi.js';
import { SubCanvasProxy } from './SubCanvasProxy';
import { SubPointerType } from './SubCanvas';
import { PerfDisplay, setRootDisplay } from './perf';

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

// 保证 body 中只有一个 PIXI canvas，避免 HMR / 重复 init 导致多个画布叠加
function assertSingleBodyCanvas(incoming?: HTMLCanvasElement): void {
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

interface WebGLReport {
  ok: boolean;
  vendor?: string;
  renderer?: string;
  version?: string;
  err?: string;
}

// 在 PIXI 初始化前先探测 WebGL 能力，失败时可提前给出兼容性提示
function probeWebGL(): WebGLReport {
  if (typeof document === 'undefined') return { ok: false, err: 'no document' };
  const canvas = document.createElement('canvas');
  // Explicitly release the test context to avoid context exhaustion when
  // PIXI Application.init creates its own context immediately after.
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

// 致命错误全屏覆盖层，用户可截图上报，避免白屏无从排查
function showFatalOverlay(title: string, body: string): void {
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

export function startPixiApp(onReady?: (proxy: SubCanvasProxy) => (() => void) | void): () => void {
  assertSingleBodyCanvas();

  const report = probeWebGL();
  if (!report.ok) {
    console.warn('[PixiApp] WebGL probe failed, trying init with fallback renderer', report.err);
  }

  const app = new PIXI.Application();
  let mounted = false;
  let destroyed = false;
  let proxy: SubCanvasProxy | null = null;
  let innerCleanup: (() => void) | undefined;
  let perfDisplay: PerfDisplay | null = null;

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onResize = () => {
    if (!mounted) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      if (!mounted) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      app.renderer.resize(w, h, dpr);
    }, 80);
  };

  // 在 window 层监听 pointer 而非 canvas 层，原因：
  // 1. 鼠标快速移出 canvas 时仍能收到 pointerup，不会"卡键"
  // 2. 多指/多 region 场景下统一分发
  const makePointerHandler = (type: SubPointerType) => (e: PointerEvent) => {
    if (!proxy) return;
    if (e.target !== proxy.canvas) return;
    proxy.routePointer(type, e);
  };

  POINTER_TYPES.forEach((type) => {
    window.addEventListener(type, makePointerHandler(type));
  });
  window.addEventListener('resize', onResize);

  // 固定全屏 + 设备像素对齐 + high-performance 策略
  const initOpts: Partial<PIXI.ApplicationOptions> = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgl',
    powerPreference: 'high-performance',
    hello: false,
  };

  // 异步 init 是 v8 的必要变化；init 成功后才可操作 stage/renderer
  app
    .init(initOpts)
    .then(() => {
      if (destroyed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.zIndex = '0';
      canvas.dataset.pixiReady = '1';

      app.stage.eventMode = 'static';

      perfDisplay = new PerfDisplay(app.ticker, () => app.stage);
      setRootDisplay(perfDisplay);

      assertSingleBodyCanvas(canvas);
      bodyCanvases.add(canvas);
      document.body.appendChild(canvas);
      mounted = true;

      try {
        app.start();
      } catch {
        // already started by default; ignore
      }

      try {
        proxy = new SubCanvasProxy({ app });
        const returned = onReady?.(proxy);
        if (typeof returned === 'function') innerCleanup = returned;
        if (typeof app.ticker.maxFPS === 'number' && app.ticker.maxFPS > 0) {
          // ok
        }
        app.ticker.addOnce((_ticker: PIXI.Ticker) => {
          if (import.meta.env.DEV) {
            console.log('[PixiApp] first tick fired', {
              stageChildren: app.stage.children.length,
              renderer: app.renderer.type,
              size: { w: app.renderer.width, h: app.renderer.height },
            });
          }
        });

        // dev 下的健康检查：采样 32x32 区域，若有子节点但全黑则告警
        if (import.meta.env.DEV) {
          setTimeout(() => {
            if (destroyed) return;
            let c: HTMLCanvasElement | null;
            try { c = app.canvas as HTMLCanvasElement; } catch { return; }
            if (!c) return;
            try {
              const tmp = document.createElement('canvas');
              tmp.width = 32;
              tmp.height = 32;
              const ctx = tmp.getContext('2d');
              if (!ctx) return;
              ctx.drawImage(c, 0, 0, 32, 32);
              const data = ctx.getImageData(0, 0, 32, 32).data;
              let nonBlack = 0;
              for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 16 || data[i + 1] > 16 || data[i + 2] > 16) nonBlack++;
              }
              console.log('[PixiApp] canvas sample', {
                nonBlackPixels: nonBlack,
                total: data.length / 4,
                stageChildren: app.stage.children.length,
              });
              if (nonBlack === 0 && app.stage.children.length > 0) {
                console.warn('[PixiApp] canvas may be blank', {
                  stageChildren: app.stage.children.length,
                  nonBlackPixels: 0,
                  sample: '32x32 top-left — may be false positive for dark/small content',
                });
              }
            } catch (e) {
              console.warn('[PixiApp] health check failed', e);
            }
          }, 2000);
        }
      } catch (err) {
        console.error('[PixiApp] onReady threw:', err);
        showFatalOverlay(
          'Display init failed',
          `${err instanceof Error ? err.message : String(err)}\n\n${err instanceof Error ? err.stack || '' : ''}`,
        );
      }
    })
    .catch((err) => {
      if (destroyed) return;
      console.error('[PixiApp] init failed:', err);
      const renderer = (app as { renderer?: { name?: string } }).renderer?.name;
      showFatalOverlay(
        'PIXI init failed',
        [
          `error: ${err instanceof Error ? err.message : String(err)}`,
          `stack: ${err instanceof Error ? err.stack || '' : ''}`,
          '',
          `webgl: ${report.version || '?'}`,
          `vendor: ${report.vendor || '?'}`,
          `renderer: ${report.renderer || '?'}`,
          `pixi-renderer: ${renderer || 'unknown (init failed before renderer created)'}`,
          '',
          `dpr: ${window.devicePixelRatio}`,
          `viewport: ${window.innerWidth}x${window.innerHeight}`,
          `ua: ${navigator.userAgent}`,
        ].join('\n'),
      );
    });

  // 销毁顺序：事件 → proxy → perf → app.destroy，避免 cleanup 中引用已释放资源
  return () => {
    destroyed = true;
    POINTER_TYPES.forEach((type) => {
      window.removeEventListener(type, makePointerHandler(type));
    });
    window.removeEventListener('resize', onResize);
    innerCleanup?.();
    proxy?.destroyAll();
    proxy = null;
    perfDisplay?.destroy();
    perfDisplay = null;
    setRootDisplay(null);
    // Let app.destroy handle canvas removal (removeView=true) to avoid
    // NotFoundError from double-removal.
    if (mounted) {
      bodyCanvases.delete(app.canvas as HTMLCanvasElement);
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
