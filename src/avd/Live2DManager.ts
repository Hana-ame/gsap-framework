/**
 * Live2D 集成管理
 *
 * 基于 Cubism 5 Web SDK 渲染 Live2D 模型到离屏 canvas，
 * 再同步为 PIXI.Texture 供 PixiJS v8 使用。
 *
 * 使用前提：
 *   1. 从 Live2D 官网下载 Cubism 5 Web SDK
 *   2. 将 live2dcubismcore.min.js 和 Framework 编译产物放入项目
 *   3. 在 HTML 中引用，或通过动态 import 加载
 *
 * 如果 Cubism SDK 未加载，所有方法静默降级（返回 null / noop）。
 */
import * as PIXI from 'pixi.js';

// ---- 类型声明（Cubism 5 Web SDK）----
declare global {
  interface Window {
    CubismFramework?: {
      startUp: (config: unknown) => void;
      initialize: () => void;
      dispose: () => void;
      isStarted: () => boolean;
    };
  }
}

export interface Live2DModelOptions {
  modelDir: string;
  modelJson: string;          // model3.json 路径
  width?: number;
  height?: number;
}

export class Live2DManager {
  private _initialized = false;
  private _models = new Map<string, Live2DModelView>();
  private _glCanvas: HTMLCanvasElement | null = null;
  private _gl: WebGL2RenderingContext | null = null;

  /** Cubism SDK 是否可用 */
  get isAvailable(): boolean {
    return typeof window !== 'undefined' &&
      !!(window.CubismFramework || (window as any).Live2DCubismFramework);
  }

  /** 初始化 Cubism 运行时 */
  init(glCanvas?: HTMLCanvasElement): boolean {
    if (this._initialized) return true;
    if (!this.isAvailable) return false;

    this._glCanvas = glCanvas ?? document.createElement('canvas');
    this._gl = this._glCanvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!this._gl) return false;

    const Cubism = this._getCubism();
    if (!Cubism) return false;

    const { CubismFramework, CubismConfig } = Cubism as any;
    const config = new CubismConfig();
    config.setLoggingLevel(0); // 0=Off
    CubismFramework.startUp(config);
    CubismFramework.initialize();
    this._initialized = true;
    return true;
  }

  /** 加载模型并返回 Live2DModelView */
  async loadModel(key: string, opts: Live2DModelOptions): Promise<Live2DModelView | null> {
    if (!this._initialized && !this.init()) return null;

    const Cubism = this._getCubism();
    if (!Cubism) return null;

    const view = new Live2DModelView(this._gl!, opts);
    await view.load();
    this._models.set(key, view);
    return view;
  }

  getModel(key: string): Live2DModelView | undefined {
    return this._models.get(key);
  }

  /** 每帧调用，同步所有模型的渲染到 PIXI 纹理 */
  updateAll(deltaMS: number): void {
    for (const model of this._models.values()) {
      model.update(deltaMS);
    }
  }

  destroy(): void {
    for (const model of this._models.values()) model.destroy();
    this._models.clear();
    if (this._initialized) {
      const Cubism = this._getCubism();
      if (Cubism) Cubism.CubismFramework.dispose();
      this._initialized = false;
    }
  }

  private _getCubism(): any {
    return (window as any).Live2DCubismFramework || (window as any).CubismFramework;
  }
}

// ---- Live2DModelView ----

export class Live2DModelView {
  readonly container: PIXI.Container;
  readonly displayWidth: number;
  readonly displayHeight: number;
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _gl: WebGL2RenderingContext;
  private _opts: Live2DModelOptions;
  private _model: any = null;   // CubismModel
  private _motion: any = null;  // 当前运动
  private _modelH: number;

  constructor(gl: WebGL2RenderingContext, opts: Live2DModelOptions) {
    this._gl = gl;
    this._opts = opts;
    this._modelH = opts.height ?? 512;

    this._canvas = gl.canvas as HTMLCanvasElement;
    this._canvas.width = opts.width ?? 256;
    this._canvas.height = this._modelH;
    this.displayWidth = this._canvas.width;
    this.displayHeight = this._canvas.height;

    this.container = new PIXI.Container();
    this._sprite = new PIXI.Sprite(PIXI.Texture.from(this._canvas));
    this._sprite.anchor.set(0.5, 1);
    this.container.addChild(this._sprite);
  }

  async load(): Promise<void> {
    const Cubism = this._getCubism();
    if (!Cubism) return;

    const { CubismModelSetting, CubismModel } = Cubism;

    // 加载 model3.json
    const resp = await fetch(this._opts.modelJson);
    const json = await resp.json();
    const setting = new CubismModelSetting(json, this._opts.modelDir);
    this._model = CubismModel.createFromSetting(setting);

    // 加载纹理
    // Cubism SDK 通过 setting 自动加载贴图
    await this._model.loadTextures();

    // 自动播放 idle 动画
    this._model.startMotion('Idle', 0, 3); // 3=Force
  }

  /** 播放运动 */
  startMotion(group: string, no: number, priority: number = 3): void {
    if (this._model) this._model.startMotion(group, no, priority);
  }

  /** 设置表情 */
  setExpression(name: string): void {
    if (this._model) this._model.setExpression(name);
  }

  /** 设置参数（如 PARAM_EYE_L_OPEN = 1 睁眼） */
  setParameter(id: string, value: number): void {
    if (this._model) this._model.setParameter(id, value, 0.5);
  }

  /** 每帧更新：动画推进 → WebGL 渲染 → PIXI 纹理同步 */
  update(deltaMS: number): void {
    if (!this._model) return;

    this._model.update(deltaMS);
    this._model.draw(this._gl);

    const source = this._sprite.texture.source as any;
    if (source?.update) source.update();
  }

  destroy(): void {
    if (this._model) this._model.release();
    this._model = null;
    this.container.destroy({ children: true });
  }

  private _getCubism(): any {
    return (window as any).Live2DCubismFramework || (window as any).CubismFramework;
  }
}
