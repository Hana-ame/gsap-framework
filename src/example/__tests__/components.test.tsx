import { describe, it, expect } from 'vitest';
import { createElement, type FunctionComponent } from 'react';

type DisplayComp = FunctionComponent & {
  head?: { title: string; description: string; meta?: Array<{ name: string; content: string }> };
};

import { EXAMPLES, exampleMap } from '../examples';

describe('all example components', () => {
  it.each(EXAMPLES)('%s has head metadata with title and description', (key) => {
    const Comp = exampleMap[key] as DisplayComp;
    expect(Comp).toBeDefined();
    expect(Comp.head).toBeDefined();
    expect(typeof Comp.head!.title).toBe('string');
    expect(Comp.head!.title.length).toBeGreaterThan(0);
    expect(typeof Comp.head!.description).toBe('string');
    expect(Comp.head!.description.length).toBeGreaterThan(0);
  });

  it.each(EXAMPLES)('%s is a function component', (key) => {
    const Comp = exampleMap[key];
    expect(typeof Comp).toBe('function');
    const element = createElement(Comp);
    expect(element).toBeDefined();
    expect(element.type).toBe(Comp);
  });
});

describe('non-example components', () => {
  it('ExampleApp renders without throwing', async () => {
    const mod = await import('../ExampleApp');
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react');
    const c = document.createElement('div');
    await act(async () => {
      const root = createRoot(c);
      root.render(createElement(mod.ExampleApp));
    });
  });
});
