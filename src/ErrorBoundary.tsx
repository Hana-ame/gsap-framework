import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
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
    if (this.state.err) {
      if (this.props.fallback) return this.props.fallback(this.state.err, this.reset);
      const w = window as unknown as { __paintError?: (t: string, b: string) => void };
      if (w.__paintError) {
        w.__paintError(
          'App crashed',
          (this.state.err.stack || this.state.err.message) + '\n\nTap anywhere to retry.',
        );
      }
      return (
        <div
          onClick={this.reset}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            zIndex: 2147483646,
          }}
        />
      );
    }
    return this.props.children;
  }
}
