import { VnPlayer } from '../../vn';
import { iru_HE1_60 } from '../../vn/scenes/iru_HE1_60';

export default function iru_HE1_60Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={iru_HE1_60} />
    </div>
  );
}
