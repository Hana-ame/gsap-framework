import { VnPlayer } from '../../vn';
import { iru_HC3_44 } from '../../vn/scenes/iru/iru_HC3_44';

export default function iru_HC3_44Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HC3_44} scriptKey="iru_HC3_44" />
    </div>
  );
}
