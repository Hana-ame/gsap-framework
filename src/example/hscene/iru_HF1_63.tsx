import { VnPlayer } from '../../vn';
import { iru_HF1_63 } from '../../vn/scenes/iru/iru_HF1_63';

export default function iru_HF1_63Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HF1_63} scriptKey="iru_HF1_63" />
    </div>
  );
}
