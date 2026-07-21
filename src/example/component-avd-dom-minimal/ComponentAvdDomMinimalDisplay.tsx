/**
 * AVD DOM 模式最小示例
 *
 * 演示功能：
 *   1. DOM 模式 AvdController — 无 PIXI canvas，纯 DOM 渲染
 *   2. 打字机效果（组件的 DomTypingEngine）
 *   3. 分支选项（多结局，内嵌 20+ 行剧本数据）
 *   4. GSAP 动画（淡入淡出、对话框入场）
 *
 * 与 Pixi 版的 API 完全一致，仅构造时传 'dom' 模式：
 *   new AvdController(containerEl, null, options, 'dom')
 */
import { useEffect, useRef, useState } from 'react';
import { AvdController } from '../../components';
import type { AvdLine } from '../../avd/types';

// ── 内嵌剧本 ──

const SCRIPT: AvdLine[] = [
  { speaker: 'Narrator', text: '夜色笼罩着古老的小镇。你站在岔路口前。' },
  { speaker: 'Narrator', text: '左边是灯火通明的酒馆，传来欢笑声。', },
  { speaker: 'Narrator', text: '右边是一条幽暗的小巷，通向未知的深处。' },
  {
    speaker: '???', text: '年轻人，你要走哪条路？',
    choices: [
      { text: '去酒馆', targetSegment: 'tavern' },
      { text: '走小巷', targetSegment: 'alley' },
    ],
  },

  // ── 分支 A：酒馆 ──
  { segment: 'tavern', speaker: 'Narrator', text: '你推开了酒馆的木门。温暖的火光和麦酒香气扑面而来。' },
  { speaker: '酒保', text: '哈哈，新面孔！来，喝一杯暖暖身子。', },
  {
    speaker: '酒保', text: '你是想听故事，还是想接活儿？',
    choices: [
      { text: '听故事', targetSegment: 'story' },
      { text: '接活儿', targetSegment: 'job' },
    ],
  },
  { segment: 'story', speaker: '酒保', text: '传说古墓里有一件神器，能让人看到未来……', },
  {
    speaker: '酒保', text: '不过那地方闹鬼，没人敢去。你有兴趣？',
    choices: [
      { text: '去古墓', targetSegment: 'tomb' },
      { text: '还是算了', targetSegment: 'stay' },
    ],
  },
  { segment: 'job', speaker: '酒保', text: '村外最近有狼群出没，猎户需要帮手。' },
  { speaker: '酒保', text: '报酬不错，就是有点危险。', },
  {
    speaker: '酒保', text: '怎么样？',
    choices: [
      { text: '接受委托', targetSegment: 'hunt' },
      { text: '不感兴趣', targetSegment: 'stay' },
    ],
  },

  // ── 结局 ──
  { segment: 'tomb', speaker: 'Narrator', text: '你来到了古墓深处……', end: false },
  { speaker: 'Narrator', text: '找到了那件神器！但洞顶开始崩塌——', end: false },
  { speaker: 'Narrator', text: '你带着神器逃了出来。从此成为传奇。', end: true },

  { segment: 'hunt', speaker: 'Narrator', text: '你在森林里追踪狼群……', end: false },
  { speaker: 'Narrator', text: '经过一番激战，你成功击退了狼群。', end: false },
  { speaker: 'Narrator', text: '村民为你欢呼，你成了村里的英雄。', end: true },

  { segment: 'stay', speaker: 'Narrator', text: '你选择留在原地，什么都没做。', end: false },
  { speaker: 'Narrator', text: '日子一天天过去，你偶尔会想起那个夜晚的岔路。', end: false },
  { speaker: 'Narrator', text: '也许有一天，你会做出不同的选择。', end: true },

  // ── 分支 B：小巷 ──
  { segment: 'alley', speaker: 'Narrator', text: '小巷里漆黑一片，只有远处的一盏灯在风中摇曳。' },
  { speaker: 'Narrator', text: '你听到身后的脚步声，回头一看——' },
  { speaker: '???', text: '别出声。跟我来。', end: false },
  { speaker: 'Narrator', text: '神秘人带你穿过密道，来到一个地下集市……', end: true },
];

// ── 组件 ──

export function ComponentAvdDomMinimalDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avdRef = useRef<AvdController | null>(null);
  const [status, setStatus] = useState('点击箭头推进');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const controlH = 48;

    const avd = new AvdController(el, null, {
      screenW: W, screenH: H - controlH,
      typewriterSpeed: 40,
      fontFamily: '"Noto Serif SC", "STSong", serif',
      textSize: 18,
      nameSize: 15,
      boxY: (H - controlH) - 200,
      boxHeight: 200,
      boxPadding: 20,
      boxBg: 0x0a0a14,
      boxBgAlpha: 0.88,
      boxRadius: 10,
      boxEnterOffsetY: 80,
      textColor: 0xd8d8e8,
      nameColor: 0x88aaff,
      onComplete: () => setStatus('── 故事结束 ──'),
      onStateChange: (s) => {
        if (s === 'typing') setStatus('打字中…');
        else if (s === 'between') setStatus('›');
        else if (s === 'choice') setStatus('请选择');
        else if (s === 'done') setStatus('── 终 ──');
      },
    }, 'dom');

    avd.setScript(SCRIPT);
    avdRef.current = avd;

    return () => {
      avd.destroy();
      avdRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: 'calc(100vh - 48px)',
          overflow: 'hidden', background: '#0a0a14',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 48,
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
          background: '#0f0f1e', borderTop: '1px solid #2a2a4a', zIndex: 200,
          fontFamily: 'monospace', fontSize: 12,
        }}
      >
        <span style={{ flex: 1, color: '#88aa88', opacity: 0.9 }}>{status}</span>

        <button
          onClick={() => {
            const a = avdRef.current;
            if (!a) return;
            a.setAutoMode(!a.isAutoMode());
            setStatus(a.isAutoMode() ? '自动 ON' : '手动');
          }}
          style={{ background: '#2a3a2a', border: '1px solid #4a6a4a', color: '#c8e8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}
        >
          Auto
        </button>

        <button
          onClick={async () => {
            const a = avdRef.current;
            if (!a) return;
            await a.fadeOut(400);
            setStatus('淡出');
            await a.fadeIn(400);
            setStatus('淡入完成');
          }}
          style={{ background: '#2a2a3a', border: '1px solid #4a4a6a', color: '#c8c8e8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}
        >
          Fade
        </button>

        <button
          onClick={() => {
            avdRef.current?.destroy();
            avdRef.current = null;
            window.location.reload();
          }}
          style={{ background: '#3a2a2a', border: '1px solid #6a4a4a', color: '#e8c8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}
        >
          Restart
        </button>
      </div>
    </>
  );
}

ComponentAvdDomMinimalDisplay.head = {
  title: 'AVD DOM 最小示例',
  description: '纯 DOM 渲染的视觉小说对话引擎。无 PIXI canvas，GSAP 动画、打字机效果、分支选项全部通过 HTML/CSS/JS 实现。',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
