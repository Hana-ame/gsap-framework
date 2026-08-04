import { VnPlayer } from '../../vn';
import { iru_T22_41 } from '../../vn/scenes/iru_T22_41';

export default function iru_T22_41Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_T22_41} scriptKey="iru_T22_41" />
    </div>
  );
}
