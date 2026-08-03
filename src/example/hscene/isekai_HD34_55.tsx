import { VnPlayer } from '../../vn';
import { isekai_HD34_55 } from '../../vn/scenes/isekai_HD34_55';

export default function isekai_HD34_55Scene() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <VnPlayer script={isekai_HD34_55} />
    </div>
  );
}
