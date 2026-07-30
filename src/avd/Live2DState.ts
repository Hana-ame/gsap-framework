import { Live2DManager, type Live2DModelView } from './Live2DManager';

export class Live2DState {
  manager: Live2DManager | null = null;
  views: Map<string, Live2DModelView> = new Map();
}
