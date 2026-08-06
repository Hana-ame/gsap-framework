import { VnPlayer } from '../../vn';
import { iru_T21_39 } from '../../vn/scenes/iru/iru_T21_39';

export default function iru_T21_39Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_T21_39} scriptKey="iru_T21_39" />
    </div>
  );
}
