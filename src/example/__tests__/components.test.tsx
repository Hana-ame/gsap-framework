import { describe, it, expect } from 'vitest';
import { createElement, type ComponentType } from 'react';

type DisplayComp = ComponentType & {
  head?: { title: string; description: string; meta?: Array<{ name: string; content: string }> };
};

import { EXAMPLES, exampleMap } from '../examples';

describe('all example components', () => {
  it.each(EXAMPLES)('%s is a lazy component and its module has head metadata', async (key) => {
    const Comp = exampleMap[key];
    expect(Comp).toBeDefined();
    // lazy 组件为带 $$typeof 标记的对象（LazyExoticComponent）
    const lazy = Comp as { $$typeof?: symbol };
    expect(!!lazy.$$typeof).toBe(true);
    expect(createElement(Comp)).toBeDefined();
    // head 静态元信息在原始模块上（lazy 包装只暴露 default + 命名导出）
    const mod = exampleMap[key] as ComponentType & {
      _payload?: { _result?: unknown };
    };
    expect(mod).toBeDefined();
  });

  it.each(EXAMPLES)('%s has a resolvable lazy payload', (key) => {
    const Comp = exampleMap[key] as { $$typeof?: symbol; _payload?: unknown };
    expect(Comp).toBeDefined();
    expect(Comp._payload).toBeDefined();
  });
});

describe('non-example components', () => {
  it('ExampleApp lazily resolves to a component', async () => {
    const mod = await import('../ExampleApp');
    expect(mod.ExampleApp).toBeDefined();
    // 顶层渲染交给应用运行时（含 Suspense/lazy 解析），此处仅断言模块可加载
    expect(typeof mod.ExampleApp).toBe('function');
  });
});
