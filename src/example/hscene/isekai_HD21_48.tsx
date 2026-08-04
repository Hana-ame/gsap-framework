import { VnPlayer } from '../../vn';
import { isekai_HD21_48 } from '../../vn/scenes/isekai_HD21_48';

export default function isekai_HD21_48Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD21_48} scriptKey="isekai_HD21_48" />
    </div>
  );
}
