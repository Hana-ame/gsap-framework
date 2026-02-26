import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 在这里将错误发送到服务器或显示在页面上
    console.error('Caught error:', error, errorInfo);
    // 可选：将错误发送到后端 API
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({ error: error.toString(), stack: errorInfo.componentStack }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(e => console.warn('Failed to send error log', e));
  }

  render() {
    if (this.state.hasError) {
      // 可以显示错误信息，帮助调试
      return this.props.fallback || (
        <div style={{ padding: 20, background: '#fdd', color: '#a00' }}>
          <h2>应用发生错误</h2>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
