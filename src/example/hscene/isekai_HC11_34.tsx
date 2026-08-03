import { VnPlayer } from '../../vn';
import { isekai_HC11_34 } from '../../vn/scenes/isekai_HC11_34';

export default function isekai_HC11_34Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC11_34} />
    </div>
  );
}
