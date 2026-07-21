/** pixi-mixins — 通过 PixiMixins 声明扩展 PIXI.Container 选项与属性。 */
import { Container } from 'pixi.js';
import { DRAG_HANDLE_LABEL } from './DragController';
import type { SubCanvasOptions } from './SubCanvasTypes';
import type { DragOptions } from './DragController';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- PixiJS 官方约定，用于扩展 ContainerOptions
  namespace PixiMixins {
    interface ContainerOptions {
      /** 标记容器为 SubCanvas 拖拽手柄 */
      isDragHandle?: boolean;
      /** 就地创建 SubCanvas 包裹此容器 */
      subCanvas?: Omit<SubCanvasOptions, 'rootApp'>;
      /** 将容器注册为命名层 */
      layer?: { manager: import('./Layer').LayerManager; name: string; zIndex: number };
      /** 附加拖拽控制器 */
      drag?: DragOptions & { ctx: import('./DragController').DragContext };
    }
    interface Container {
      /** 此容器是否为拖拽手柄（读写 label 的便捷属性） */
      isDragHandle: boolean;
    }
  }
}

Object.defineProperty(Container.prototype, 'isDragHandle', {
  get(this: Container) { return this.label === DRAG_HANDLE_LABEL; },
  set(this: Container, value: boolean) {
    if (value) {
      this.label = DRAG_HANDLE_LABEL;
    } else if (this.label === DRAG_HANDLE_LABEL) {
      this.label = '';
    }
  },
});
