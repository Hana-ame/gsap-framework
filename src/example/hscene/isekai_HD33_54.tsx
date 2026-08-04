import { VnPlayer } from '../../vn';
import { isekai_HD33_54 } from '../../vn/scenes/isekai_HD33_54';

export default function isekai_HD33_54Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD33_54} scriptKey="isekai_HD33_54" />
    </div>
  );
}
