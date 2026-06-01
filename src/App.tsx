import { useHashRoute } from './router';
import { SingleDisplay } from './SingleDisplay';
import { MultipleDisplay } from './MultipleDisplay';

export default function App() {
  const route = useHashRoute();
  return route === 'single' ? <SingleDisplay /> : <MultipleDisplay />;
}
