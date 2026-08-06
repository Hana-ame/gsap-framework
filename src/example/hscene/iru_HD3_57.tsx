import { VnPlayer } from '../../vn';
import { iru_HD3_57 } from '../../vn/scenes/iru/iru_HD3_57';

export default function iru_HD3_57Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HD3_57} scriptKey="iru_HD3_57" />
    </div>
  );
}
