import { Nav } from './Nav';
import { useHashRoute } from './router';
import { SingleDisplay } from './SingleDisplay';
import { MultipleDisplay } from './MultipleDisplay';

export default function App() {
  const route = useHashRoute();
  return (
    <>
      <Nav route={route} />
      {route === 'single' ? <SingleDisplay /> : <MultipleDisplay />}
    </>
  );
}
