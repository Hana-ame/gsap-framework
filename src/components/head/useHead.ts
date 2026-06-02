import { useEffect } from 'react';
import { FALLBACK_HEAD, type HeadConfig } from './types';

const OWNED_META_SELECTOR = 'meta[data-managed-head="true"]';
const OWNED_DESCRIPTION_NAME = 'description';

const setTitle = (title: string) => {
  if (document.title !== title) document.title = title;
};

const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    el.setAttribute('data-managed-head', 'true');
    document.head.appendChild(el);
  }
  if (el.getAttribute('content') !== content) el.setAttribute('content', content);
};

const setOwnedMetaTag = (id: string, attrs: Record<string, string>) => {
  const sel = `meta[data-managed-head-id="${id}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('data-managed-head', 'true');
    el.setAttribute('data-managed-head-id', id);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => {
    if (el!.getAttribute(k) !== v) el!.setAttribute(k, v);
  });
};

const clearOwnedExtras = (activeIds: Set<string>) => {
  document.head.querySelectorAll<HTMLMetaElement>(`meta[data-managed-head-id]`).forEach((el) => {
    if (!activeIds.has(el.getAttribute('data-managed-head-id') ?? '')) {
      el.remove();
    }
  });
};

export function useHead(config: HeadConfig | undefined | null): void {
  const title = config?.title;
  const description = config?.description;
  const meta = config?.meta;
  useEffect(() => {
    const head: HeadConfig = config ?? FALLBACK_HEAD;
    setTitle(head.title);
    if (head.description) {
      setMeta(OWNED_DESCRIPTION_NAME, head.description);
    } else {
      document.head.querySelector(`meta[name="${OWNED_DESCRIPTION_NAME}"]`)?.remove();
    }
    const ids = new Set<string>();
    head.meta?.forEach((m, i) => {
      const id = `m${i}-${m.name ?? m.property ?? m.httpEquiv ?? ''}`;
      ids.add(id);
      const attrs: Record<string, string> = {};
      if (m.name) attrs.name = m.name;
      if (m.property) attrs.property = m.property;
      if (m.httpEquiv) attrs.httpEquiv = m.httpEquiv;
      attrs.content = m.content;
      setOwnedMetaTag(id, attrs);
    });
    clearOwnedExtras(ids);
  }, [title, description, meta]);
}
