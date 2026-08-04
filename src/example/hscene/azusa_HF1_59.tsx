import { VnPlayer } from '../../vn';
import { azusa_HF1_59 } from '../../vn/scenes/azusa_HF1_59';

export default function azusa_HF1_59Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HF1_59} scriptKey="azusa_HF1_59" />
    </div>
  );
}
