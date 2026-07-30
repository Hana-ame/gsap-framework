import { useEffect, useRef, useState } from 'react';
import type { AvdLine } from '../../avd/types';
import { AvdController, parseScript } from '../../avd';
import { DomTexture } from '../../avd/dom/DomNode';
import { AVD_SCENE_REGISTRY } from './avdSceneRegistry';

/** Extract scene key from hash: #avd-scene-dom/ha1 → 'avd-scene-ha1' */
function getSceneKey(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  if (parts.length < 2) return null;
  return `avd-scene-${parts.slice(1).join('/')}`;
}

function SceneList({ onSelect }: { onSelect: (key: string) => void }) {
  const entries = Object.entries(AVD_SCENE_REGISTRY);
  return (
    <div style={{ padding: '20px', color: '#ccc', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#88ccff' }}>AVD Scenes</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {entries.map(([key, entry]) => (
          <button key={key} onClick={() => onSelect(key)}
            style={{ padding: '10px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, color: '#ccc', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#88ccff' }}>{entry.label}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{entry.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ComponentAvdSceneDomDisplay() {
  const elRef = useRef<HTMLDivElement>(null);
  const [sceneKey, setSceneKey] = useState<string | null>(() => getSceneKey());

  useEffect(() => {
    const el = elRef.current;
    if (!el || !sceneKey) return;

    const entry = AVD_SCENE_REGISTRY[sceneKey];
    if (!entry) {
      el.textContent = `Unknown scene: ${sceneKey}`;
      return;
    }

    let avd: AvdController | null = null;
    let destroyed = false;
    const W = window.innerWidth;
    const H = window.innerHeight;

    (async () => {
      const { lines, imageMap, getBgKeys } = entry;

      const bgKeys = getBgKeys();
      const uniqueKeys = [...new Set(bgKeys)];

      const textures: Record<string, DomTexture> = {};
      if (imageMap) {
        for (const k of uniqueKeys) {
          const url = imageMap[k];
          if (url) textures[k] = new DomTexture(url);
        }
        await Promise.allSettled(
          uniqueKeys.map(k => new Promise<void>(resolve => {
            const t = textures[k];
            if (!t || t.loaded) { resolve(); return; }
            const check = () => { if (t.loaded) resolve(); else requestAnimationFrame(check); };
            check();
          }))
        );
      }

      if (destroyed) return;

      const parsed = await parseScript({ lines, roster: {} }, {
        loadTexture: async () => undefined,
      } as any);

      if (destroyed) return;

      avd = new AvdController(el, null, {
        screenW: W, screenH: H,
        boxY: H - 200 - 40,
        portraitY: H - 560 - 20,
        boxBg: 0x0a0a14,
        boxBgAlpha: 0.5,
        boxRadius: 0,
        textColor: 0xffffff,
        nameColor: 0x88ccff,
        textSize: 20,
        nameSize: 16,
        fontFamily: '"Noto Serif SC", "STSong", serif',
        typewriterSpeed: 35,
      }, 'dom');

      if (imageMap) {
        avd.setBgTextureMap(textures);
        avd.setScript(parsed.lines as AvdLine[]);
      } else {
        avd.setBgLazyLoad(async (key) => {
          const url = `/game-cgs/${key}.png`;
          const tex = new DomTexture(url);
          if (!tex.loaded) {
            await new Promise<void>(resolve => {
              const check = () => { if (tex.loaded) resolve(); else requestAnimationFrame(check); };
              check();
            });
          }
          return tex;
        });
        avd.setBgTextureMap({});
        avd.setScript(parsed.lines as AvdLine[]);
      }
    })();

    return () => {
      destroyed = true;
      if (avd) avd.destroy();
    };
  }, [sceneKey]);

  if (!sceneKey) {
    return <SceneList onSelect={(key) => {
      window.location.hash = `avd-scene-dom/${key.replace('avd-scene-', '')}`;
      setSceneKey(key);
    }} />;
  }

  return (
    <div ref={elRef} style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }} />
  );
}
