// gsap-pixi — GSAP + PixiPlugin 一次性初始化。
// 作为一个独立模块，导入即完成注册（side-effect import），
// 后续只需 import { gsap } 即可使用 PixiPlugin 特化属性。

import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

export { gsap, PixiPlugin };
