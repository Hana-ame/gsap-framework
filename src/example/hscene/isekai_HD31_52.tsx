import { VnPlayer } from '../../vn';
import { isekai_HD31_52 } from '../../vn/scenes/isekai_HD31_52';

export default function isekai_HD31_52Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD31_52} />
    </div>
  );
}
