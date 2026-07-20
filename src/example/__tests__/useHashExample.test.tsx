import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const useHashExample = (await import('../useHashExample')).useHashExample;

function Harness({ onResult }: { onResult: (v: string | null) => void }) {
  const ex = useHashExample();
  useEffect(() => { onResult(ex); }, [ex, onResult]);
  return null;
}

describe('useHashExample', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.location.hash = '';
  });

  afterEach(async () => {
    const { act } = await import('react');
    await act(async () => { root?.unmount(); });
    container?.remove();
    window.location.hash = '';
  });

  async function render(): Promise<string | null> {
    const { act } = await import('react');
    let resolve: (v: string | null) => void;
    const promise = new Promise<string | null>(r => { resolve = r; });
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness, {
        onResult: (v) => setTimeout(() => resolve(v), 0),
      }));
    });
    return promise;
  }

  it('returns null when no hash', async () => {
    const val = await render();
    expect(val).toBeNull();
  });

  it('returns the example when hash matches', async () => {
    window.location.hash = '#single';
    const val = await render();
    expect(val).toBe('single');
  });

  it('returns null for unknown hash', async () => {
    window.location.hash = '#nonexistent';
    const val = await render();
    expect(val).toBeNull();
  });

  it('returns null for empty hash after #', async () => {
    window.location.hash = '#';
    const val = await render();
    expect(val).toBeNull();
  });
});
