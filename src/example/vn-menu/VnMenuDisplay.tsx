import { SCENE_GROUPS } from './scene-groups';

export function VnMenuDisplay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a14',
        overflow: 'auto',
        color: '#fff',
        fontFamily: '"Noto Serif SC", "STSong", serif',
        padding: '40px 24px',
      }}
    >
      <h1 style={{ textAlign: 'center', fontSize: 28, color: '#88ccff', marginBottom: 32 }}>
        H-Scene 回想
      </h1>
      {SCENE_GROUPS.map((g) => (
        <div key={g.id} style={{ maxWidth: 900, margin: '0 auto 36px' }}>
          <h2
            style={{
              fontSize: 20,
              color: '#ffd78a',
              borderBottom: '1px solid #3a4a7a',
              paddingBottom: 8,
              marginBottom: 16,
            }}
          >
            {g.title}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {g.scenes.map((s) => (
              <a
                key={s}
                href={`#hscene-${s}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: 'rgba(26,26,58,0.9)',
                  border: '1px solid #2a2a4a',
                  borderRadius: 8,
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

VnMenuDisplay.head = {
  title: 'H-Scene 回想',
  description: '三游戏 77 场景 · ex.moonchan.xyz',
};