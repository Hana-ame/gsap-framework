// Root example app component that renders the selected example
import { useHashExample } from './useHashExample';
import { exampleMap } from './examples';

export function ExampleApp() {
  const example = useHashExample();
  const C = exampleMap[example];
  return <C />;
}