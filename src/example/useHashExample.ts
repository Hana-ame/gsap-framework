// Hook for reading and writing the current example ID from the URL hash
import { useEffect, useState, useCallback } from 'react';
import { isExample, type Example } from './examples';

export function useHashExample(): Example | null {
  const compute = useCallback((): Example | null => {
    const h = window.location.hash.slice(1);
    return isExample(h) ? h : null;
  }, []);

  const [example, setExample] = useState<Example | null>(compute);

  useEffect(() => {
    const onChange = () => setExample(compute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [compute]);

  return example;
}
