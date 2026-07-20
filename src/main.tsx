// Application entry point
import { createRoot } from 'react-dom/client';
import { ExampleApp } from './example/ExampleApp';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ExampleApp />
  </ErrorBoundary>,
);
