// Hook for reading and writing the current example ID from the URL hash
import { useEffect, useState, useCallback } from 'react';
import { isExample, DEFAULT_EXAMPLE, type Example } from './examples';

export function useHashExample(): Example {
  const compute = useCallback((): Example => {
    const h = window.location.hash.slice(1);
    // 无效/空 hash 一律回退到默认（新框架）
    return isExample(h) ? h : DEFAULT_EXAMPLE;
  }, []);

  const [example, setExample] = useState<Example>(compute);

  useEffect(() => {
    const onChange = () => setExample(compute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [compute]);

  return example;
}
