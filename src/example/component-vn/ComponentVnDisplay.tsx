import { useState } from 'react';
import { VnPlayer } from '../../vn';
import { demoScript } from './demo-script';

export function ComponentVnDisplay() {
  const [round, setRound] = useState(0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <VnPlayer
        key={round}
        script={demoScript}
        onEnd={() => {
          // 演示：结束后可点"重播"
        }}
      />
      {round > 0 && (
        <button
          onClick={() => setRound(0)}
          style={{
            position: 'fixed', zIndex: 50, top: 12, right: 12,
            padding: '8px 16px', background: '#1a1a3a', color: '#fff',
            border: '1px solid #3a4a7a', borderRadius: 6, cursor: 'pointer',
          }}
        >
          重播
        </button>
      )}
    </div>
  );
}

ComponentVnDisplay.head = {
  title: 'VN Player (重写)',
  description: '剧本驱动播放器 · preload(wait) + say + choice · ex.moonchan.xyz',
};