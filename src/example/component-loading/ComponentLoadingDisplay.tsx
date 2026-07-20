// Example: Loading screen with progress indication
import { useEffect, useRef, useState } from 'react';
import { startPixiApp, type SubCanvas, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';
import { showLoading } from '../../components';

export function ComponentLoadingDisplay() {
  const readyRef = useRef(false);
  const hideRef = useRef<(() => void) | null>(null);
  const scRef = useRef<SubCanvas | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stop = startPixiApp((proxy: SubCanvasProxy) => {
      const sc = proxy.createRegion({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      scRef.current = sc;
      makeInfoPanel(sc, { title: '加载覆盖层', lines: ['用途：演示 showLoading() 和 createLoading() 的加载动画、自定义文本和覆盖层颜色。', '测试方法：点击按钮以不同选项显示加载覆盖层，数秒后自动消失。', '预期：加载覆盖层显示旋转动画和文本，超时后自动消失，自定义颜色和文本正常生效。'], x: window.innerWidth - 400, y: window.innerHeight - 150 });
      readyRef.current = true;
    });
    return () => {
      readyRef.current = false;
      hideRef.current?.();
      hideRef.current = null;
      stop();
    };
  }, []);

  const fire = (label: string, opts: Parameters<typeof showLoading>[1] = {}) => {
    if (!scRef.current) return;
    hideRef.current?.();
    hideRef.current = showLoading(scRef.current, opts);
    setBusy(true);
    setTimeout(() => {
      hideRef.current?.();
      hideRef.current = null;
      setBusy(false);
    }, 2500);
    console.log('[showcase] loading fired:', label);
  };

  return (
    <>
      <style>{css}</style>
      <div className="overlay">
        <div className="panel">
          <div className="panel-title">Loading.ts</div>
          <div className="panel-hint">
            showLoading(sc, opts?) &rarr; () =&gt; void
            <br />
            semi-transparent overlay + spinning ring. Returns a stop fn.
          </div>
          <div className="btn-row">
            <button
              className="btn"
              disabled={busy}
              onClick={() => fire('default', { text: 'Loading...' })}
            >
              default (text)
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => fire('spinner-cyan', { text: 'fetching...', spinnerColor: 0x00d4ff })}
            >
              custom spinner (cyan)
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => fire('text-only', { text: 'no spinner\ntext only', showSpinner: false })}
            >
              text only
            </button>
            <button
              className="btn"
              disabled={!busy}
              onClick={() => {
                hideRef.current?.();
                hideRef.current = null;
                setBusy(false);
              }}
            >
              stop
            </button>
          </div>
          <div className="panel-status">
            {busy ? 'loading active' : 'idle'}
          </div>
        </div>
      </div>
    </>
  );
}

ComponentLoadingDisplay.head = {
  title: 'subcanvas — Loading',
  description: 'Showcase: showLoading() overlay with spinner, text, custom color.',
  meta: [{ name: 'theme-color', content: '#0a0a14' }],
};

const css = `
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24px;
}
.panel {
  pointer-events: auto;
  background: rgba(10,10,20,0.88);
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  padding: 14px 18px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #e6e6f0;
  min-width: 380px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.panel-title {
  font-size: 0.85rem;
  color: #88aaff;
  margin-bottom: 4px;
}
.panel-hint {
  font-size: 0.72rem;
  opacity: 0.65;
  margin-bottom: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.btn {
  background: #14141f;
  border: 1px solid #2a2a3a;
  color: #e6e6f0;
  border-radius: 6px;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.btn:hover:not(:disabled) {
  border-color: #4a6a9a;
  background: #18182a;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.panel-status {
  font-size: 0.7rem;
  opacity: 0.6;
}
`;
