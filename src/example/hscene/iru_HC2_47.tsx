import { VnPlayer } from '../../vn';
import { iru_HC2_47 } from '../../vn/scenes/iru_HC2_47';

export default function iru_HC2_47Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HC2_47} />
    </div>
  );
}
