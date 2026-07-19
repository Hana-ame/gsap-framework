// gsap-pixi — GSAP + PixiPlugin 一次性初始化。
// 只做 side-effect 注册，不 export 任何东西。
// 要用 gsap 的地方直接 import gsap from 'gsap'。

import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);
