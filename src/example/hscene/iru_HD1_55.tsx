import { VnPlayer } from '../../vn';
import { iru_HD1_55 } from '../../vn/scenes/iru_HD1_55';

export default function iru_HD1_55Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HD1_55} scriptKey="iru_HD1_55" />
    </div>
  );
}
