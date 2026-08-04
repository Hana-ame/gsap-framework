import { VnPlayer } from '../../vn';
import { iru_T3_54 } from '../../vn/scenes/iru_T3_54';

export default function iru_T3_54Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_T3_54} scriptKey="iru_T3_54" />
    </div>
  );
}
