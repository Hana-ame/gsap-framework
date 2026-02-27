import * as PIXI from 'pixi.js';

export interface PixiPlugin {
  /** 此插件能够处理的消息类型列表 */
  messageTypes: string[];
  /** 执行绘图逻辑。若消息类型不匹配或参数错误，应抛出错误。 */
  execute(message: any, app: PIXI.Application): void;
}

// 同时，需要修改控制器中的 Plugin 类型，以支持新的接口。
// 控制器内部可以存储一个包装函数，该函数检查 message.type 并调用对应插件的 execute。
