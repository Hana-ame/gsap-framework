import { VnPlayer } from '../../vn';
import { iru_HC3_48 } from '../../vn/scenes/iru_HC3_48';

export default function iru_HC3_48Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HC3_48} scriptKey="iru_HC3_48" />
    </div>
  );
}
