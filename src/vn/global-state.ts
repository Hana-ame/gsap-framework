/**
 * 全局跨场景状态（对齐 WebGAL userData）：localStorage 持久化，所有场景共享。
 * 用途：通关解锁（markSceneSeen + showWhen 条件）、跨场景成就/统计。
 */

import type { VnValue } from './types';

const KEY = 'hana-vn:global-state';

let cache: Record<string, VnValue> | null = null;
let version = 0;
const listeners = new Set<() => void>();

function load(): Record<string, VnValue> {
  if (cache) return cache;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    cache = raw ? (JSON.parse(raw) as Record<string, VnValue>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function persist() {
  version++;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(cache ?? {}));
    }
  } catch {
    // 持久化失败不影响运行时
  }
  listeners.forEach((l) => l());
}

/** 快照（供 useSyncExternalStore）。 */
export function getGlobalVars(): Record<string, VnValue> {
  return load();
}

/** 订阅全局状态变更（供 useSyncExternalStore）。 */
export function subscribeGlobalVars(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 合并写全局变量（不触发版本变化的原子 patch，persist 统一 bump）。 */
export function setGlobalVars(patch: Record<string, VnValue>): void {
  load();
  cache = { ...cache, ...patch };
  persist();
}

/** 标记场景已通关（解锁回想等）。 */
export function markSceneSeen(sceneKey: string): void {
  setGlobalVars({ [`seen_${sceneKey}`]: true });
}

/** 查询场景是否已通关。 */
export function isSceneSeen(sceneKey: string): boolean {
  return load()[`seen_${sceneKey}`] === true;
}

/** 清空全局状态。 */
export function resetGlobalVars(): void {
  cache = {};
  persist();
}

/** 当前版本号（测试/调试用）。 */
export function getGlobalVersion(): number {
  return version;
}
