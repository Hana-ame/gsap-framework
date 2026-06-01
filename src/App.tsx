import { useEffect } from 'react';
import { startPixiApp } from './PixiApp';

export default function App() {
  useEffect(() => {
    return startPixiApp();
  }, []);

  return null;
}
