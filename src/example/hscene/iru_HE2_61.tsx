import { VnPlayer } from '../../vn';
import { iru_HE2_61 } from '../../vn/scenes/iru/iru_HE2_61';

export default function iru_HE2_61Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HE2_61} scriptKey="iru_HE2_61" />
    </div>
  );
}
