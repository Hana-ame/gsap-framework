/**
 * 场景预取 — 跳转目标场景前预加载其脚本 + 资源（对齐 WebGAL「一层子场景预加载」）。
 *
 * 场景形态支持动态 js / json / ts：注册表由应用层提供「场景名 → 脚本加载器」，
 * 播放器跳转前调用 prefetchScene，提前下载目标脚本（React.lazy chunk）并按其
 * preload 声明预热资源，缓解慢网下「黑一下」。
 */

import type { VnScript } from './types';

type SceneScriptLoader = () => Promise<VnScript> | VnScript;

const registry = new Map<string, SceneScriptLoader>();
const prefetched = new Set<string>();
const warmCache = new Set<string>();

/** 场景变化计数（用于 countdown 清理）。 */
let sceneChangeCount = 0;
/** 默认清理阈值：经历 N 次场景变化后清空预加载栏。 */
let sceneChangeLimit = 4;

/** 注册场景脚本加载器（应用层在 examples/hscene 注册时调用）。 */
export function registerSceneScript(key: string, loader: SceneScriptLoader): void {
  registry.set(key, loader);
}

/**
 * 预取场景脚本并按其 preload 声明预热资源。幂等。
 * 每次调用记一次场景变化；达到 countdown 阈值后自动清理预加载栏。
 */
export async function prefetchScene(key: string): Promise<void> {
  sceneChangeCount += 1;
  if (sceneChangeLimit > 0 && sceneChangeCount >= sceneChangeLimit) {
    clearWarmLayer();
    sceneChangeCount = 0;
  }

  if (prefetched.has(key)) return;
  const loader = registry.get(key);
  if (!loader) return;

  prefetched.add(key);
  try {
    const script = await loader();
    for (const line of script.lines) {
      if (line.type === 'preload') {
        for (const a of line.assets) warmUrl(a.url);
      }
    }
  } catch {
    // 预取失败不阻断主流程
    prefetched.delete(key);
  }
}

/** 设置 countdown 阈值（经历多少次场景变化后清理预加载栏）。0=不自动清理。 */
export function setWarmLayerCountdown(limit: number): void {
  sceneChangeLimit = limit;
  sceneChangeCount = 0;
}

/** 预加载栏 DOM 容器（隐藏层）。 */
let warmLayer: HTMLDivElement | null = null;

/** 手动清理预加载栏：移除全部已解码 img 与容器，释放 DOM/内存。 */
export function clearWarmLayer(): void {
  warmLayer?.remove();
  warmLayer = null;
}

/** 预加载单个 URL：在页面生成不可见 DOM 内显示 <img>（隐藏层），图片已解码进 DOM/浏览器缓存，切换时无感。 */
function warmUrl(url: string): void {
  if (warmCache.has(url) || typeof document === 'undefined') return;
  warmCache.add(url);

  if (!warmLayer) {
    warmLayer = document.createElement('div');
    warmLayer.setAttribute('data-vn-prefetch', '');
    warmLayer.style.cssText =
      'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;';
    document.body.appendChild(warmLayer);
  }

  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.decoding = 'async';
  warmLayer.appendChild(img);
  // 解码完成后从隐藏层移除，避免 DOM 堆积（图片仍留在浏览器缓存中）
  img.addEventListener('load', () => img.remove(), { once: true });
  img.addEventListener('error', () => img.remove(), { once: true });
}

/** 已知场景清单（供测试/调试）。 */
export function knownSceneKeys(): string[] {
  return [...registry.keys()];
}

/** 清空注册表（测试用）。 */
export function resetSceneRegistry(): void {
  registry.clear();
  prefetched.clear();
  warmCache.clear();
  warmLayer?.remove();
  warmLayer = null;
}
