import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', err, info);
  }

  reset = () => this.setState({ err: null });

  render() {
    if (!this.state.err) return this.props.children;
    const e = this.state.err;
    const body = `${e.name || 'Error'}: ${e.message || 'unknown'}\n\n${e.stack || ''}`;
    return (
      <div
        role="alert"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#1a0a14',
          color: '#ffd0d0',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          textAlign: 'left',
          overflow: 'auto',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <h1
          style={{
            fontSize: '1.1rem',
            margin: '0 0 8px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          App crashed
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            margin: '0 0 16px',
            opacity: 0.85,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Tap the message to copy · tap outside to retry
        </p>
        <pre
          role="button"
          tabIndex={0}
          onClick={() => navigator.clipboard?.writeText(body).catch(() => {})}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigator.clipboard?.writeText(body).catch(() => {});
            }
          }}
          style={{
            fontSize: '0.8rem',
            maxWidth: '90vw',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#0a0a14',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #4a1a1a',
            margin: 0,
          }}
        >
          {body}
        </pre>
        <button
          type="button"
          onClick={this.reset}
          style={{
            marginTop: 16,
            background: 'transparent',
            color: '#ffd0d0',
            border: '1px solid #ffd0d0',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }
}
