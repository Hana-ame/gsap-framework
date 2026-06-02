import { PwaGate } from './pwa';
import { RouteSwitch } from './router/RouteSwitch';

export default function App() {
  return (
    <PwaGate requireStandalone="mobile-only" bypassStorageKey="pwa-gate-bypass">
      <RouteSwitch />
    </PwaGate>
  );
}
