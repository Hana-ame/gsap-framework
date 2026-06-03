import { useEffect, useRef, useState } from 'react';
import { startPixiApp } from '../../framework/PixiApp';
import { createVideoPlayer } from '../../components/PixiVideoPlayer';
import type { PixiVideoPlayerHandle } from '../../components/PixiVideoPlayer';
import type { SubCanvas } from '../../framework/SubCanvas';

// 稳定、支持跨域且允许 Range 请求的测试 MP4
const STABLE_MP4_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
// 备用极速测试 MP4 (Mozilla MDN)
// const STABLE_MP4_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4';

export function ComponentVideoPlayerDisplay() {
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);
  const playerRef = useRef<PixiVideoPlayerHandle | null>(null);

  const appendLog = (msg: string) => {
    const next = [`${new Date().toLocaleTimeString()} ${msg}`, ...logRef.current].slice(0, 10);
    logRef.current = next;
    setLog(next);
  };

  useEffect(() => {
    let root: SubCanvas | null = null;
    let offResize: (() => void) | null = null;

    const destroyApp = startPixiApp((proxy) => {
      root = proxy.createRegion({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

      const w = Math.min(window.innerWidth - 40, 640);
      const h = (w * 9) / 16;
      const x = (window.innerWidth - w) / 2;
      const y = (window.innerHeight - h) / 2 - 20;

      appendLog(`Mounting video player (${w}x${h})`);

      playerRef.current = createVideoPlayer(root, {
        url: STABLE_MP4_URL,
        x,
        y,
        width: w,
        height: h,
        autoplay: false,
        loop: true,
        muted: false, // 允许出声
        showControls: true,
        onLoad: () => appendLog('Video loaded successfully!'),
        onError: (e) => appendLog(`Error: ${e.message}`),
        onDebug: (msg) => {
          // 只打印部分关键信息，避免刷屏
          if (msg.includes('error') || msg.includes('fallback') || msg.includes('done')) {
            appendLog(`[DBG] ${msg}`);
          }
        }
      });

      offResize = proxy.onWindowResize(() => {
        if (!root) return;
        root.setBounds({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      });
    });

    return () => {
      offResize?.();
      playerRef.current?.destroy();
      destroyApp();
    };
  }, []);

  return (
    <>
      {/* HUD & Logs */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          right: 12,
          maxWidth: 240,
          background: 'rgba(13, 13, 24, 0.92)',
          border: '1px solid #2a2a3a',
          borderRadius: 4,
          padding: 8,
          color: '#ddd',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          lineHeight: 1.4,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <div style={{ color: '#88aaff', marginBottom: 4, fontWeight: 'bold' }}>PixiVideoPlayer Test</div>
        <div style={{ color: '#aaa', marginBottom: 8, fontSize: 9 }}>
          Source: Google Cloud Storage
        </div>
        {log.map((line, i) => (
          <div key={i} style={{ color: line.includes('Error') ? '#ff6666' : i === 0 ? '#fff' : '#777' }}>
            {line}
          </div>
        ))}
      </div>

      {/* External Controls (Optional) */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => playerRef.current?.toggle()}
          style={{
            background: '#1a1a2e',
            border: '1px solid #446',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Ext: Play/Pause
        </button>
        <button
          onClick={() => playerRef.current?.seek(0)}
          style={{
            background: '#1a1a2e',
            border: '1px solid #446',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Ext: Restart
        </button>
      </div>
    </>
  );
}

ComponentVideoPlayerDisplay.head = {
  title: 'Component: Video Player',
  description: 'Testing standard MP4 video playback in PixiJS v8 with custom UI.',
};
