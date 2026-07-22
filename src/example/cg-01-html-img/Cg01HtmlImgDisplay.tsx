import { useRef, useEffect } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';

const URL = IMAGE_MAP['HD2-1'];

export function Cg01HtmlImgDisplay() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.innerHTML = `<img src="${URL}" style="display:block;width:100%;height:100%;object-fit:contain;background:#000">`;
    return () => { el.innerHTML = ''; };
  }, []);

  return (
    <div ref={elRef}
      style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} />
  );
}

Cg01HtmlImgDisplay.head = {
  title: 'CG 01: HTML img',
  description: '从 imageMap CDN URL 直接用 <img> 显示 HD2-1',
};
