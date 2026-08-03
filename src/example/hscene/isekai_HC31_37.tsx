import { VnPlayer } from '../../vn';
import { isekai_HC31_37 } from '../../vn/scenes/isekai_HC31_37';

export default function isekai_HC31_37Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC31_37} />
    </div>
  );
}
