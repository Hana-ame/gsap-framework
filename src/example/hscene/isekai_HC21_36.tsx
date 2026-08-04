import { VnPlayer } from '../../vn';
import { isekai_HC21_36 } from '../../vn/scenes/isekai_HC21_36';

export default function isekai_HC21_36Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HC21_36} scriptKey="isekai_HC21_36" />
    </div>
  );
}
