import { useState } from 'react';
import { Confirm } from '../../components/windowing/Confirm';

export function ConfirmDisplay() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (s: string) => setLog((prev) => [`${new Date().toLocaleTimeString()}  ${s}`, ...prev].slice(0, 10));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#08080d',
        color: '#ddd',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Confirm</h1>
        <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>
          HTML dialog built on top of <code style={{ color: '#9ab' }}>{'<Window dragMode="anywhere" />'}</code>. Buttons stop pointer propagation so drag never fires.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setA(true)} style={triggerBtn}>
          Open simple Confirm
        </button>
        <button type="button" onClick={() => setB(true)} style={triggerBtn}>
          Open Confirm (custom)
        </button>
      </div>

      <div
        style={{
          marginTop: 8,
          padding: 10,
          background: '#0d0d18',
          border: '1px solid #2a2a3a',
          borderRadius: 4,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          minHeight: 60,
        }}
      >
        <div style={{ color: '#888', marginBottom: 4 }}>events</div>
        {log.length === 0 ? (
          <div style={{ color: '#555' }}>(none yet)</div>
        ) : (
          log.map((line, i) => (
            <div key={i} style={{ color: '#bbb' }}>
              {line}
            </div>
          ))
        )}
      </div>

      <Confirm
        open={a}
        onOpenChange={setA}
        title="Delete item?"
        message="This will permanently remove the item from your inventory. This action cannot be undone."
        onOk={() => append('A: OK clicked')}
        onCancel={() => append('A: Cancel clicked')}
      />

      <Confirm
        open={b}
        onOpenChange={setB}
        title="Save changes?"
        message={
          <div>
            Save <b>3 unsaved changes</b> to <code>scene.json</code>?
          </div>
        }
        okText="Save"
        cancelText="Discard"
        width={360}
        height={180}
        initial={{ x: 80, y: 80 }}
        onOk={() => append('B: Save clicked')}
        onCancel={() => append('B: Discard clicked')}
      />
    </div>
  );
}

const triggerBtn: React.CSSProperties = {
  background: '#1a1a2a',
  color: '#ddd',
  border: '1px solid #2a2a3a',
  borderRadius: 3,
  padding: '8px 14px',
  fontFamily: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
};

ConfirmDisplay.head = {
  title: 'HTML Confirm — sim',
  description: 'HTML dialog playground on top of Window dragMode=anywhere — buttons stopPropagation so drag never fires.',
  meta: [
    { name: 'theme-color', content: '#0a0a14' },
  ],
};
