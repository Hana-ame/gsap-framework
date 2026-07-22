import { useEffect, useRef } from 'react';

const URL = 'https://p.sda1.dev/33/9946a5972dbcd00852a679fa0f159fe1/HD2-1.webp';

export function Img00NativeDisplay() {
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.style.cssText = 'position:fixed;inset:0;margin:auto;max-width:100vw;max-height:100vh;object-fit:contain;display:block;background:#0a0a14';
    img.alt = 'HD2-1';
    document.body.appendChild(img);
    imgRef.current = img;

    const onLoad = () => { img.style.display = 'block'; };
    const onErr = () => { img.style.display = 'none'; console.error('native img failed'); };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onErr);
    img.src = URL;

    const label = document.createElement('div');
    label.style.cssText = 'position:fixed;top:12px;left:12px;z-index:999;color:#ffcc44;font:bold 16px monospace;background:rgba(0,0,0,0.6);padding:4px 10px;border-radius:6px';
    label.textContent = 'Step 00: native <img> — no PIXI';
    document.body.appendChild(label);

    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onErr);
      img.remove();
      label.remove();
    };
  }, []);

  return null;
}

Img00NativeDisplay.head = {
  title: 'Img 00: Native <img>',
  description: '纯原生 HTML Image 元素 — 无 PIXI',
};
