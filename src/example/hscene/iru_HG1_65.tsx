import { VnPlayer } from '../../vn';
import { iru_HG1_65 } from '../../vn/scenes/iru/iru_HG1_65';

export default function iru_HG1_65Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HG1_65} scriptKey="iru_HG1_65" />
    </div>
  );
}
