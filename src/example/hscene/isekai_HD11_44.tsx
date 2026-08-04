import { VnPlayer } from '../../vn';
import { isekai_HD11_44 } from '../../vn/scenes/isekai_HD11_44';

export default function isekai_HD11_44Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD11_44} scriptKey="isekai_HD11_44" />
    </div>
  );
}
