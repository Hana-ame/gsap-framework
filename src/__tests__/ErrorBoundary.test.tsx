import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, useEffect, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    container?.remove();
  });

  it('renders children when no error', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorBoundary, null,
        createElement('div', { 'data-testid': 'child' }, 'Hello'),
      ));
    });
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(container.textContent).toContain('Hello');
  });

  it('renders error UI after child throws', async () => {
    function Thrower() {
      useEffect(() => { throw new Error('boom'); }, []);
      return null;
    }
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorBoundary, null, createElement(Thrower)));
    });
    expect(container.textContent).toContain('App crashed');
    expect(container.textContent).toContain('boom');
  });

  it('reset button clears error', async () => {
    let hasThrown = false;
    function Thrower() {
      useEffect(() => {
        if (!hasThrown) { hasThrown = true; throw new Error('boom'); }
      }, []);
      return createElement('div', null, 'recovered');
    }
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorBoundary, null, createElement(Thrower)));
    });
    expect(container.textContent).toContain('App crashed');
    const btn = container.querySelector('button');
    expect(btn).toBeTruthy();
    await act(async () => { btn?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(container.textContent).toContain('recovered');
  });

  it('has role="alert" on error', async () => {
    function Thrower() {
      useEffect(() => { throw new Error('test'); }, []);
      return null;
    }
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorBoundary, null, createElement(Thrower)));
    });
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('pre element allows copy on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    function Thrower() {
      useEffect(() => { throw new Error('copy test'); }, []);
      return null;
    }
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorBoundary, null, createElement(Thrower)));
    });
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    await act(async () => { pre?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(writeText).toHaveBeenCalled();
  });
});
