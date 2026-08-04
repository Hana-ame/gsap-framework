/**
 * 存档系统 — IndexedDB 分键存储（每槽位一个 key），对齐 WebGAL 分键方案。
 *
 * 存档 = 播放器状态快照（行号 / 变量 / 图层 / 立绘 / 台词 / 音频），
 * 不依赖剧本函数本身，js / json / ts 形态场景均可存读。
 */

import type { VnValue } from './types';

/** 存档数据（播放器状态快照）。 */
export interface VnSaveData {
  /** 槽位号。 */
  slot: number;
  /** 场景 key（读档时校验场景是否一致；跨场景读档由应用层导航到该场景）。 */
  scriptKey: string;
  lineIndex: number;
  vars: Record<string, VnValue>;
  layers: Array<{ key: string; kind: 'bg' | 'cg'; index: number; zIndex: number; fadeMs: number }>;
  stands: Array<{ key: string; pos: 'left' | 'center' | 'right' }>;
  speaker: string;
  text: string;
  /** 已显示字符数（打字机进度）。 */
  shown: number;
  phase: 'typing' | 'idle' | 'choice';
  choices: Array<{ text: string; to: string; set?: Record<string, VnValue>; showWhen?: string }>;
  /** 音频：bgm key + 正在播放的一次性音效 key 列表（含频道）。 */
  audio: { bgm?: string; oneshot?: Array<{ key: string; channel: 'sfx' | 'voice' }> };
  /** 视频演出层（可选，无视频时缺省）。 */
  video?: { key: string; url: string; loop: boolean; volume: number; fit: 'contain' | 'cover'; muted: boolean } | null;
  savedAt: number;
}

const DB_NAME = 'hana-vn';
const STORE = 'saves';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'slot' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** 重置 DB 连接缓存（测试/登出用）。 */
export function resetSaveDb(): void {
  dbPromise = null;
}

/** 写一档（覆盖同槽位）。 */
export async function saveGame(data: VnSaveData): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 读一档；无则返回 null。 */
export async function loadGame(slot: number): Promise<VnSaveData | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(slot);
    req.onsuccess = () => resolve((req.result as VnSaveData | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** 列出全部档位（按时间倒序）。 */
export async function listSaves(): Promise<VnSaveData[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as VnSaveData[]).sort((a, b) => b.savedAt - a.savedAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 删除一档。 */
export async function deleteSave(slot: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(slot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
