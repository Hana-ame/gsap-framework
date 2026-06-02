import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_EXAMPLE, isExample, type Example } from './examples';

export function useHashExample(): Example {
  const compute = useCallback((): Example => {
    const h = window.location.hash.slice(1);
    return isExample(h) ? h : DEFAULT_EXAMPLE;
  }, []);

  const [example, setExample] = useState<Example>(compute);

  useEffect(() => {
    if (!isExample(window.location.hash.slice(1))) {
      window.location.replace(`#${DEFAULT_EXAMPLE}`);
    }
    const onChange = () => setExample(compute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [compute]);

  return example;
}
