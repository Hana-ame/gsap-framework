import { useEffect, useRef } from 'react';
import { IMAGE_MAP } from '../h-scenes/imageMapEx';
import { DomContainer, DomTexture } from '../../avd/dom/DomNode';
import { DomBackgroundLayer } from '../../avd/dom/DomBackgroundLayer';

const SCENES = {
  HD2: ['HD2-1', 'HD2-2', 'HD2-3', 'HD2-4', 'HD2-5', 'HD2-6', 'HD2-7'],
  HA1: ['HA1-1', 'HA1-2', 'HA1-3', 'HA1-3^', 'HA1-4', 'HA1-5'],
  HE1: ['HE1-1', 'HE1-2', 'HE1-3', 'HE1-4', 'HE1-5', 'HE1-5^', 'HE1-6', 'HE1-7', 'HE1-8', 'HE1-9', 'HE1-10', 'HE1-11', 'HE1-13', 'HE1-14'],
};

export function Cg05BgLayerMultiDisplay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<'HD2' | 'HA1' | 'HE1'>('HD2');
  const idxRef = useRef(0);

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

    const infoLabel = document.createElement('div');
    infoLabel.style.cssText =
      'position:fixed;top:38px;left:16px;color:#aaa;font-family:monospace;font-size:13px';
    root.appendChild(infoLabel);

    const allUrls = new Set(Object.values(SCENES).flat());
    const texMap = new Map<string, DomTexture>();
    for (const k of allUrls) texMap.set(k, new DomTexture(IMAGE_MAP[k]));

    function showNext() {
      const keys = SCENES[sceneRef.current];
      idxRef.current = (idxRef.current + 1) % keys.length;
      const key = keys[idxRef.current];
      const tex = texMap.get(key)!;
      bg.setBackground(tex);
      label.textContent = `${sceneRef.current} | ${key}`;
      infoLabel.textContent = 'click=next  [1=HD2 2=HA1 3=HE1]';
    }

    const checkLoaded = () => {
      if (Array.from(texMap.values()).every(t => t.loaded)) {
        showNext();
      } else {
        setTimeout(checkLoaded, 200);
      }
    };
    checkLoaded();

    root.style.cursor = 'pointer';
    root.addEventListener('click', showNext);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === '1') { sceneRef.current = 'HD2'; idxRef.current = 0; showNext(); }
      if (e.key === '2') { sceneRef.current = 'HA1'; idxRef.current = 0; showNext(); }
      if (e.key === '3') { sceneRef.current = 'HE1'; idxRef.current = 0; showNext(); }
    };
    window.addEventListener('keydown', keyHandler);

    return () => {
      bg.destroy();
      container.el.remove();
      label.remove();
      infoLabel.remove();
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#000' }} />;
}

Cg05BgLayerMultiDisplay.head = {
  title: 'CG 05: DomBgLayer Multi',
  description: 'DomBgLayer + 3 组场景切换 (1/2/3) + 点击切换',
};
