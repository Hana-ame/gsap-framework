import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_EXAMPLE, type Example } from '../examples';

const useHashExample = (await import('../useHashExample')).useHashExample;

function Harness({ onResult }: { onResult: (v: Example) => void }) {
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

  async function render(): Promise<Example> {
    const { act } = await import('react');
    let resolve: (v: Example) => void;
    const promise = new Promise<Example>(r => { resolve = r; });
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(Harness, {
        onResult: (v) => setTimeout(() => resolve(v), 0),
      }));
    });
    return promise;
  }

  it('falls back to DEFAULT_EXAMPLE when no hash', async () => {
    const val = await render();
    expect(val).toBe(DEFAULT_EXAMPLE);
  });

  it('returns the example when hash matches', async () => {
    window.location.hash = '#component-vn';
    const val = await render();
    expect(val).toBe('component-vn');
  });

  it('falls back to DEFAULT_EXAMPLE for unknown hash', async () => {
    window.location.hash = '#nonexistent';
    const val = await render();
    expect(val).toBe(DEFAULT_EXAMPLE);
  });

  it('falls back to DEFAULT_EXAMPLE for empty hash after #', async () => {
    window.location.hash = '#';
    const val = await render();
    expect(val).toBe(DEFAULT_EXAMPLE);
  });
});