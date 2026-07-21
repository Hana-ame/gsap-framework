/**
 * AVD DOM 模式示例
 *
 * 与 Pixi 版的 component-avd-choices 共享同一套章节数据（ch1.ts ~ ch3b.ts），
 * 但使用 DomLayer 渲染，所有 GSAP 动画行为一致。
 *
 * 关键差异：
 *   - 构造 AvdController 时传入 HTMLElement + 'dom' 模式
 *   - 背景 / 头像使用 Canvas2D 生成 DomTexture
 *   - 控制栏使用原生 HTML button
 */
import { useEffect, useRef, useState } from 'react';
import { AvdController, AudioManager, type AvdSettingsData, type TextEffect } from '../../components';
import { DomTexture } from '../../avd/dom/DomNode';
import { CH1 } from '../component-avd-choices/ch1';
import { CH2 } from '../component-avd-choices/ch2';
import { CH3A } from '../component-avd-choices/ch3a';
import { CH3B } from '../component-avd-choices/ch3b';

const CONTROL_H = 44;
const CHAPTER_LINES = [CH1.lines, CH2.lines, CH3A.lines, CH3B.lines].flat() as any[];

function createDomTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): DomTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const tex = new DomTexture('');
  const img = new Image();
  img.src = c.toDataURL();
  img.onload = () => { tex.img = img; tex.width = w; tex.height = h; tex.loaded = true; };
  return tex;
}

function buildDomAssets(W: number, H: number) {
  const bgCave = createDomTexture(W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0a1a'); g.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(136,170,170,0.15)';
    ctx.beginPath(); ctx.arc(80, H * 0.3, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(120, H * 0.25, 12, 0, Math.PI * 2); ctx.fill();
  });
  const bgRune = createDomTexture(W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0a2a'); g.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(68,136,255,0.5)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(100 + Math.random() * (W - 200), 80 + Math.random() * (H * 0.5), 4 + Math.random() * 8, 0, Math.PI * 2); ctx.fill();
    }
  });
  const bgTreasure = createDomTexture(W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a0a00'); g.addColorStop(1, '#3a2a0a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,204,102,0.5)';
    for (let i = 0; i < 12; i++) {
      const x = 60 + Math.random() * (W - 120);
      const y = 60 + Math.random() * (H * 0.6);
      ctx.beginPath(); ctx.arc(x, y, 6 + Math.random() * 8, 0, Math.PI * 2); ctx.fill();
    }
  });
  const bgGarden = createDomTexture(W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1a0a'); g.addColorStop(1, '#1a3a1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const colors = ['rgba(204,68,136,0.5)', 'rgba(68,204,136,0.5)', 'rgba(204,204,68,0.5)', 'rgba(204,136,68,0.5)'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = colors[i % 4];
      ctx.beginPath(); ctx.arc(80 + Math.random() * (W - 160), H * 0.3 + Math.random() * (H * 0.5), 12 + Math.random() * 20, 0, Math.PI * 2); ctx.fill();
    }
  });
  return { bgCave, bgRune, bgTreasure, bgGarden };
}

export function ComponentAvdDomDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [backlogData, setBacklogData] = useState<string[]>([]);
  const avdRef = useRef<AvdController | null>(null);

  const append = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 12));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const avdH = H - CONTROL_H;

    const assets = buildDomAssets(W, avdH);
    const bgMap: Record<string, DomTexture> = {
      bg_cave: assets.bgCave, bg_treasure: assets.bgTreasure,
      bg_rune: assets.bgRune, bg_garden: assets.bgGarden,
    };

    const audioGen = new AudioManager();
    const audioMap: Record<string, AudioBuffer> = {
      bgm_cave: audioGen.generateChord(60, 4),
      bgm_treasure: audioGen.generateChord(80, 4),
      bgm_rune: audioGen.generateChord(100, 4),
      bgm_garden: audioGen.generateChord(120, 4),
      sfx_drip: audioGen.generateNoise(0.15),
      sfx_door: audioGen.generateNoise(0.3),
      voice_hello: audioGen.generateTone(400, 0.5, 'sine'),
      voice_wonder: audioGen.generateTone(350, 0.8, 'triangle'),
      voice_cheer: audioGen.generateTone(600, 0.4, 'sawtooth'),
    };
    audioGen.destroy();

    const avd = new AvdController(el, null, {
      screenW: W, screenH: avdH,
      typewriterSpeed: 35,
      boxY: avdH - 200 - 40,
      portraitY: avdH - 560 - 20,
      onChoiceEnter: (choices) => append(`出现了 ${choices.length} 个选项`),
      onChoiceSelect: (choice, idx) => {
        const target = choice.targetSegment ?? `#${(choice.targetLine ?? 0) + 1}`;
        append(`选择了 #${idx + 1}: 「${choice.text}」→ ${target}`);
      },
      onComplete: () => append('剧情结束'),
    }, 'dom');

    avd.setScript(CHAPTER_LINES);
    avd.setAudioMap(audioMap);
    avdRef.current = avd;

    return () => {
      avd.destroy();
      avdRef.current = null;
    };
  }, []);

  return (
    <>
      <div id="avd-dom-container" ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: `calc(100vh - ${CONTROL_H}px)`, overflow: 'hidden', background: '#0a0a14' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: CONTROL_H, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', background: '#0f0f1e', borderTop: '1px solid #2a2a4a', zIndex: 200, fontFamily: 'monospace', fontSize: 12 }}>
        <button onClick={() => { avdRef.current?.destroy(); avdRef.current = null; setLog([]); append('重新开始'); window.location.reload(); }} style={{ background: '#6a3a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Restart</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; a.setAutoMode(!a.isAutoMode()); append(a.isAutoMode() ? '自动 ON' : '自动 OFF'); }} style={{ background: '#3a5a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Auto</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; a.setSkipMode(!a.isSkipMode()); append(a.isSkipMode() ? '跳过 ON' : '跳过 OFF'); }} style={{ background: '#5a3a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Skip</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; setBacklogData(a.getBacklog().map((e) => `[${e.speaker ?? '--'}] ${e.text}`)); setShowBacklog((v) => !v); }} style={{ background: '#3a3a5a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>记录</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; const has = a.hasFlag('has_notebook'); if (has) a.clearFlag('has_notebook'); else a.setFlag('has_notebook'); append(has ? '收起笔记本' : '拿出笔记本'); }} style={{ background: '#5a5a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>笔记本</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; const data = a.save(); localStorage.setItem('avd_save', JSON.stringify(data)); append('存档已保存'); }} style={{ background: '#3a5a5a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>保存</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; const raw = localStorage.getItem('avd_save'); if (!raw) { append('无存档'); return; } a.load(JSON.parse(raw)); append('存档已读取'); }} style={{ background: '#5a5a5a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>读档</button>
        <button onClick={() => { const a = avdRef.current; if (!a) return; const ef: TextEffect[] = ['none', 'wave', 'shake', 'rainbow']; const cur = ef.indexOf(a['_typing'].effect as TextEffect); const next = ef[(cur + 1) % ef.length]; a.setTextEffect(next); append(`特效: ${next}`); }} style={{ background: '#5a4a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>特效</button>
        <button onClick={async () => { const a = avdRef.current; if (!a) return; append('淡出…'); await a.fadeOut(500); await a.fadeIn(500); append('淡入完成'); }} style={{ background: '#3a3a3a', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>淡入/淡出</button>
      </div>
      <div style={{ position: 'fixed', bottom: CONTROL_H + 8, left: 12, zIndex: 200, fontFamily: 'monospace', fontSize: 11, color: '#88aa88', background: 'rgba(10,20,10,0.8)', padding: '4px 10px', borderRadius: 6, maxHeight: 80, overflowY: 'auto', pointerEvents: 'none' }}>
        {log.length === 0 ? <span style={{ opacity: 0.4 }}>点击推进对话 · 分支处选择选项</span> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {showBacklog && (
        <div onClick={() => setShowBacklog(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(10,20,10,0.95)', border: '1px solid #2a4a2a', borderRadius: 12, padding: 16, width: '80%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', color: '#c8e8c8', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #2a4a2a' }}>对话记录</div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {backlogData.length === 0 ? <span style={{ opacity: 0.4 }}>暂无记录</span> : backlogData.map((l, i) => <div key={i} style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }}>{l}</div>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ComponentAvdDomDisplay.head = {
  title: 'AVD DOM 模式',
  description: 'AVD 视觉小说 DOM 模式示例。使用 DomLayer 渲染，GSAP 动画行为与 Pixi 版一致。',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
