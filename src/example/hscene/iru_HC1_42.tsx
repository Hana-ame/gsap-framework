import { VnPlayer } from '../../vn';
import { iru_HC1_42 } from '../../vn/scenes/iru/iru_HC1_42';

export default function iru_HC1_42Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HC1_42} scriptKey="iru_HC1_42" />
    </div>
  );
}
