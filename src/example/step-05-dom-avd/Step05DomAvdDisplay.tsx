import { useEffect, useRef, useState } from 'react';
import { AvdController } from '../../avd/AvdController';

export function Step05DomAvdDisplay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('initial');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const avd = new AvdController(el, null, {
      screenW: 900,
      screenH: 500,
      boxWidth: 820,
      boxHeight: 180,
      boxX: 40,
      boxY: 300,
      boxPadding: 20,
      boxBg: 0x0a0a14,
      boxBgAlpha: 0.88,
      boxRadius: 10,
      textSize: 18,
      fontFamily: 'serif',
      typewriterSpeed: 40,
      onStateChange: (s) => setStatus(s),
    }, 'dom');

    avd.setScript([
      { speaker: 'Narrator', text: '夜色笼罩着古老的小镇。你站在岔路口前。' },
      { speaker: 'Narrator', text: '左边是灯火通明的酒馆，传来欢笑声。' },
    ]);

    avdRef.current = avd;
    return () => { avd.destroy(); avdRef.current = null; };
  }, []);

  const avdRef = useRef<AvdController | null>(null);

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#111122' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 40,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        background: '#0f0f1e', borderTop: '1px solid #2a2a4a', zIndex: 200,
        fontFamily: 'monospace', fontSize: 12, color: '#88aa88',
      }}>
        <span style={{ flex: 1 }}>{status}</span>
        <button onClick={() => avdRef.current?.next()}
          style={{ background: '#2a3a2a', border: '1px solid #4a6a4a', color: '#c8e8c8', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
          Next
        </button>
      </div>
    </>
  );
}

Step05DomAvdDisplay.head = {
  title: 'Step 05: AvdController DOM',
  description: 'AvdController 完整 DOM 模式 — 打字机 + 状态推进',
};
