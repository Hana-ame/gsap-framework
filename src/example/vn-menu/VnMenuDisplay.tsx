import { SCENE_GROUPS } from './scene-groups';
import { SCENE_COVERS } from './scene-covers';

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
        <div key={g.id} style={{ maxWidth: 960, margin: '0 auto 36px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {g.scenes.map((s) => {
              const meta = SCENE_COVERS[s];
              return (
                <a
                  key={s}
                  href={`#hscene-${s}`}
                  style={{
                    display: 'block',
                    background: 'rgba(26,26,58,0.9)',
                    border: '1px solid #2a2a4a',
                    borderRadius: 8,
                    color: '#fff',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '3 / 4', background: '#111', overflow: 'hidden' }}>
                    {meta && (
                      <img
                        src={meta.cover}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      padding: '8px 10px',
                      fontSize: 12,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {meta?.title ?? s}
                  </div>
                </a>
              );
            })}
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
