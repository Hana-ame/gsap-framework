import { VnPlayer } from '../../vn';
import { azusa_HD4_46 } from '../../vn/scenes/azusa/azusa_HD4_46';

export default function azusa_HD4_46Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={azusa_HD4_46} scriptKey="azusa_HD4_46" />
    </div>
  );
}
