import { VnPlayer } from '../../vn';
import { isekai_HB21_27 } from '../../vn/scenes/isekai/isekai_HB21_27';

export default function isekai_HB21_27Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HB21_27} scriptKey="isekai_HB21_27" />
    </div>
  );
}
