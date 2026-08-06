import { VnPlayer } from '../../vn';
import { iru_HC1_46 } from '../../vn/scenes/iru/iru_HC1_46';

export default function iru_HC1_46Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HC1_46} scriptKey="iru_HC1_46" />
    </div>
  );
}
