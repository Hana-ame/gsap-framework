import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveGame, loadGame, listSaves, deleteSave, resetSaveDb } from '../save';

// 内存版 IndexedDB mock：store 模块级、open/get/getAll/put/delete 的
// success/complete 事件都在宏任务中异步触发（兼容调用方同步赋值回调）。
const store = new Map<number, unknown>();

function installIndexedDBMock() {
  const fire = (fn?: (() => void) | null) => {
    if (typeof fn === 'function') setTimeout(fn, 0);
  };

  const makeReq = (result: unknown) => {
    const req: any = { result, onsuccess: null, onerror: null };
    setTimeout(() => fire(req.onsuccess), 0);
    return req;
  };

  const mockStore: any = {
    put: (v: unknown) => {
      store.set((v as { slot: number }).slot, v);
    },
    get: (k: IDBValidKey) => makeReq(store.get(k as number)),
    getAll: () => makeReq([...store.values()]),
    delete: (k: IDBValidKey) => {
      store.delete(k as number);
    },
  };

  const mockDb: any = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const tx: any = { objectStore: () => mockStore, oncomplete: null, onerror: null };
      setTimeout(() => fire(tx.oncomplete), 0);
      return tx;
    },
  };

  (globalThis as any).indexedDB = {
    open: () => {
      const req: any = { result: mockDb, onupgradeneeded: null, onsuccess: null, onerror: null };
      setTimeout(() => fire(req.onsuccess), 0);
      return req;
    },
  };
}

function sample(slot: number) {
  return {
    slot,
    scriptKey: 'demo',
    lineIndex: 5,
    vars: { flag: 'a' },
    layers: [{ key: 'bg1', kind: 'bg' as const, index: 0, zIndex: 0, fadeMs: 0 }],
    stands: [],
    speaker: '梓',
    text: '台词',
    shown: 2,
    phase: 'idle' as const,
    choices: [],
    audio: { bgm: 'music1' },
    savedAt: 1000 + slot,
  };
}

describe('save (IndexedDB mock)', () => {
  beforeEach(() => {
    store.clear();
    resetSaveDb();
    installIndexedDBMock();
  });
  afterEach(() => {
    delete (globalThis as any).indexedDB;
  });

  it('saveGame then loadGame round-trips', async () => {
    await saveGame(sample(1));
    const data = await loadGame(1);
    expect(data).not.toBeNull();
    expect(data!.slot).toBe(1);
    expect(data!.lineIndex).toBe(5);
    expect(data!.vars).toEqual({ flag: 'a' });
    expect(data!.audio.bgm).toBe('music1');
  });

  it('overwrites same slot', async () => {
    await saveGame({ ...sample(1), text: '一' });
    await saveGame({ ...sample(1), text: '二' });
    const data = await loadGame(1);
    expect(data!.text).toBe('二');
  });

  it('loadGame returns null for empty slot', async () => {
    expect(await loadGame(99)).toBeNull();
  });

  it('listSaves returns all slots sorted by savedAt desc', async () => {
    await saveGame(sample(1));
    await saveGame(sample(2));
    const all = await listSaves();
    expect(all.length).toBe(2);
    expect(all[0].slot).toBe(2);
    expect(all[1].slot).toBe(1);
  });

  it('deleteSave removes a slot', async () => {
    await saveGame(sample(1));
    await deleteSave(1);
    expect(await loadGame(1)).toBeNull();
    expect((await listSaves()).length).toBe(0);
  });
});
