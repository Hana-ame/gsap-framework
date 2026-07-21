/**
 * VN 中间格式 + InputRemapper 示例
 *
 * 演示完整管线：
 *   1. KAG 脚本 → kagToVnScript() → VnScriptJSON（中间 JSON）
 *   2. VnScriptPlayer 执行中间 JSON
 *   3. InputRemapper 键盘重映射
 *
 * 只需替换 kagToVnScript → renpyToVnScript / onsToVnScript / rmmzToVnScript
 * 即可切换剧本源格式，中间流程不变。
 */
import { useEffect, useRef, useState } from 'react';
import { AvdController, InputRemapper, VnScriptPlayer, kagToVnScript } from '../../components';
import type { VnPlayerHost } from '../../components';

// ── KAG 剧本（直接内嵌，也可以是 .ks 文件内容） ──
const KAG_SOURCE = `
*start
[bg storage="bg_night" time=500]
[p]
夜色笼罩着古老的小镇。你站在岔路口前。
左边是灯火通明的酒馆。
右边是一条幽暗的小巷。
[p]
[bg storage="bg_tavern"]
[se storage="sfx_door"]
[wait time=300]
"???：年轻人，你要走哪条路？"
[p]
[button text="去酒馆" target="tavern"]
[button text="走小巷" target="alley"]

*tavern
[bg storage="bg_tavern"]
[bgm storage="bgm_tavern"]
[p]
你推开了酒馆的木门。
温暖的火光和麦酒香气扑面而来。
[p]
[se storage="sfx_door"]
"酒保：哈哈，新面孔！来，喝一杯。"
[p]
[jump target="ending"]

*alley
[bg storage="bg_night"]
[p]
小巷里漆黑一片。
你听到身后的脚步声……
[p]
"神秘人：别出声。跟我来。"
[p]
[jump target="ending"]

*ending
[p]
[wait time=500]
你的故事开始了……
[end]
`;

export function ComponentAvdVnDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VnScriptPlayer | null>(null);
  const avdRef = useRef<AvdController | null>(null);
  const inputRef = useRef<InputRemapper | null>(null);
  const [status, setStatus] = useState('点击 / Enter 推进');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const controlH = 48;

    // 1) 构造 AvdController（DOM 模式）
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
      onComplete: () => setStatus('── 终 ──'),
      onStateChange: (s) => {
        if (s === 'typing') setStatus('打字中…');
        else if (s === 'between') setStatus('› 点击/Enter');
        else if (s === 'choice') setStatus('请选择');
        else if (s === 'done') setStatus('── 终 ──');
      },
    }, 'dom');
    avdRef.current = avd;

    // 2) VnScriptPlayer 作为 host 桥接 AvdController
    const host: VnPlayerHost = {
      setScript: (lines) => avd.setScript(lines),
      next: () => avd.next(),
      getState: () => avd.getState(),
      getLineIndex: () => avd.getLineIndex(),
      getLineCount: () => avd.getLineCount(),
      goTo: (i) => avd.goTo(i),
      fadeOut: (d, cb) => avd.fadeOut(d, cb),
      fadeIn: (d, cb) => avd.fadeIn(d, cb),
      setFlag: (n) => avd.setFlag(n),
      clearFlag: (n) => avd.clearFlag(n),
      hasFlag: (n) => avd.hasFlag(n),
    };

    // 3) KAG → 中间 JSON → Player
    const script = kagToVnScript(KAG_SOURCE);
    console.log('VnScriptJSON:', JSON.stringify(script, null, 2));

    const layer = avd['_layer']!;

    const player = new VnScriptPlayer(host, layer, layer.root);
    player.load(script);
    playerRef.current = player;

    // 4) InputRemapper
    const input = new InputRemapper();
    input.on('advance', () => avd.next());
    input.on('auto', () => { avd.setAutoMode(!avd.isAutoMode()); setStatus(avd.isAutoMode() ? '自动 ON' : '手动'); });
    input.on('quickSave', () => { avd.quickSave(); setStatus('存档'); });
    input.on('quickLoad', () => { avd.quickLoad(); setStatus('读档'); });
    input.on('menu', () => setStatus('菜单 (Escape)'));
    inputRef.current = input;

    return () => {
      input.destroy();
      player.destroy();
      avd.destroy();
      playerRef.current = null;
      avdRef.current = null;
      inputRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%',
          height: 'calc(100vh - 48px)', overflow: 'hidden', background: '#0a0a14',
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

        <span style={{ color: '#4a6a6a', fontSize: 10 }}>
          Enter/Space↵
        </span>
        <button onClick={() => {
          const a = avdRef.current;
          if (!a) return;
          a.setAutoMode(!a.isAutoMode());
          setStatus(a.isAutoMode() ? '自动 ON' : '手动');
        }} style={{ background: '#2a3a2a', border: '1px solid #4a6a4a', color: '#c8e8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Auto</button>

        <button onClick={async () => {
          const a = avdRef.current;
          if (!a) return;
          await a.fadeOut(400);
          setStatus('淡出');
          await a.fadeIn(400);
          setStatus('淡入完成');
        }} style={{ background: '#2a2a3a', border: '1px solid #4a4a6a', color: '#c8e8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Fade</button>

        <button onClick={() => {
          avdRef.current?.destroy();
          avdRef.current = null;
          window.location.reload();
        }} style={{ background: '#3a2a2a', border: '1px solid #6a4a4a', color: '#e8c8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Restart</button>
      </div>
    </>
  );
}

ComponentAvdVnDisplay.head = {
  title: 'VN 中间格式 + InputRemapper',
  description: 'KAG 脚本 → VnScriptJSON → VnScriptPlayer + InputRemapper 键盘重映射。完整演示中间格式管线。',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};
