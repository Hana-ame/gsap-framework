import { useEffect, useRef } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { DomContainer, DomTexture } from '../../avd/dom/DomNode';
import { DomBackgroundLayer } from '../../avd/dom/DomBackgroundLayer';

const KEYS = ['HD2-1', 'HD2-2', 'HD2-3', 'HD2-4', 'HD2-5'];

export function Cg04BgLayerDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const container = new DomContainer();
    root.appendChild(container.el);

    const bg = new DomBackgroundLayer(container, {
      screenW: window.innerWidth,
      screenH: window.innerHeight,
      bgColor: 0x000000,
    });

    const label = document.createElement('div');
    label.style.cssText =
      'position:fixed;top:16px;left:16px;color:#88ff88;font-family:monospace;font-size:15px';
    root.appendChild(label);

    let idx = 0;
    const textures = KEYS.map(k => new DomTexture(IMAGE_MAP[k]));

    function showNext() {
      idx = (idx + 1) % KEYS.length;
      bg.setBackground(textures[idx]);
      label.textContent = `DomBackgroundLayer | ${KEYS[idx]} | click to cycle`;
    }

    const checkLoaded = () => {
      if (textures.every(t => t.loaded)) {
        bg.setBackground(textures[0]);
        label.textContent = `DomBackgroundLayer | ${KEYS[0]} | click to cycle`;
      } else {
        setTimeout(checkLoaded, 200);
      }
    };
    checkLoaded();

    root.style.cursor = 'pointer';
    root.addEventListener('click', showNext);

    return () => {
      bg.destroy();
      container.el.remove();
      label.remove();
    };
  }, []);

  return <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#000' }} />;
}

Cg04BgLayerDisplay.head = {
  title: 'CG 04: DomBgLayer',
  description: 'DomBackgroundLayer + DomTexture + 双击切换 5 张 CG',
};
