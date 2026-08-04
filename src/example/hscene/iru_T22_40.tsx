import { VnPlayer } from '../../vn';
import { iru_T22_40 } from '../../vn/scenes/iru_T22_40';

export default function iru_T22_40Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_T22_40} scriptKey="iru_T22_40" />
    </div>
  );
}
