# start3DApp

three.js r184 全屏应用启动器，对称于 `startPixiApp`：建 renderer、scene、camera、OrbitControls，注册 resize，返回 destroy。**不要 PIXI**（纯 three.js；如需 PIXI overlay 见末尾"PIXI 混用"小节）。

---

## 调用栈

### 启动
```
start3DApp(onReady?)
  ├─ const renderer = new THREE.WebGLRenderer({ antialias: true })
  ├─ renderer.setSize(W, H) + setPixelRatio(devicePixelRatio)
  ├─ renderer.setClearColor(0x0a0a14)
  ├─ renderer.domElement 样式 = position:fixed; 100vw×100vh
  ├─ document.body.appendChild(canvas)
  ├─ scene = new Scene() + scene.fog = new Fog(0x0a0a14, 8, 40)
  ├─ camera = new PerspectiveCamera(60, W/H, 0.1, 100); position(6, 5, 8)
  ├─ controls = new OrbitControls(camera, domElement)
  │    ├─ enableDamping / dampingFactor / autoRotate / autoRotateSpeed
  │    ├─ target(0, 0.5, 0)
  │    └─ minDistance / maxDistance / maxPolarAngle（防穿透地面）
  ├─ raycaster = new Raycaster()
  ├─ window.addEventListener('resize', onResize)
  ├─ onReady?.(api)                                  ← 同步回调，用户 addChild 在这里
  └─ renderer.setAnimationLoop(() => {
       controls.update()
       renderer.render(scene, camera)
     })

  return destroy
```

### 销毁
```
destroy()
  ├─ renderer.setAnimationLoop(null)                ← 停 rAF
  ├─ window.removeEventListener('resize', onResize)
  ├─ controls.dispose()                              ← 拆 domElement 上的指针/滚轮监听
  ├─ scene.traverse(obj => obj.geometry?.dispose() + material.dispose())
  └─ renderer.dispose()                              ← 释放 WebGL 资源 + forceContextLoss
  └─ renderer.domElement.parentNode.removeChild(canvas)
```

---

## API

```ts
interface ThreeAppAPI {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  resize: (w: number, h: number) => void;     // 同 onResize，外部可手动触发
}

function start3DApp(onReady?: (api: ThreeAppAPI) => void): () => void
```

- `onReady` **同步**触发（不像 startPixiApp 是 async，因为 three.js 初始化都是同步的）
- `destroy` 调了就干净 — 不依赖外部再清东西

---

## 使用

### 最小
```ts
import { start3DApp } from '../three/start3DApp';

useEffect(() => {
  const destroy = start3DApp((api) => {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial(),
    );
    api.scene.add(cube);
  });
  return destroy;
}, []);
```

### 自定义动画
```ts
start3DApp((api) => {
  const mesh = new THREE.Mesh(geom, mat);
  api.scene.add(mesh);
  const base = api.controls.update.bind(api.controls);
  api.controls.update = (): boolean => {       // 必须保留返回 boolean
    const moved = base();
    mesh.rotation.y += 0.01;
    return moved;
  };
});
```

### 鼠标点击投射
```ts
const onClick = (e: PointerEvent) => {
  const rect = api.renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
  api.raycaster.setFromCamera(ndc, api.camera);
  const hits = api.raycaster.intersectObjects(api.scene.children, true);
  if (hits[0]) console.log('hit', hits[0].object);
};
api.renderer.domElement.addEventListener('click', onClick);
```

### 切走
```ts
return () => destroy();   // 停动画 + 拆监听 + dispose 几何/材质/renderer + 摘 canvas
```

---

## 巨坑（r184）

调研时查到的坑 / 用法变化：

1. **ESM only**（r150+） — `build/three.js` / `build/three.min.js` 删了；必须 `import * as THREE from 'three'`。我们已经用 Vite，没问题。
2. **WebGL 1 删了**（r163） — `WebGLRenderer` 只支持 WebGL 2；老设备 / iOS 14 以下会挂。当前 `devicePixelRatio` 用作 setPixelRatio，HDPI 屏 OK。
3. **`setAnimationLoop` 取代手写 rAF** — 官方推荐；XR 模式下自动换 `setXRAnimationLoop`，兼容 VR。
4. **`renderer.dispose()` 不等于 `forceContextLoss`** — `dispose()` 释放内部 state，但 WebGL context 还活着。资源要全清得 traverse 几何/材质 + `dispose()` + 拆 domElement。
5. **OrbitControls 在 `three/addons/controls/`**（不是 core） — 是官方 example/jsm，但不算"core 库"。`package.json` exports map 写了 `./addons/* → ./examples/jsm/*`，所以两种 import path 都行。
6. **OrbitControls.update 返回 boolean** — true = 相机动了；用于脏检查。替换 update 时**必须保留返回类型**。
7. **OrbitControls 自己监听 domElement 的 pointer 事件** — 自己再加 `click` / `pointerdown` 监听会共存，但要判断"是不是真的点击"（drag 后释放算拖动不算点击 — 看 `pointerdown` 到 `pointerup` 距离 < 5px 之类）。
8. **maxPolarAngle = π/2 - 0.05** — 防止相机绕到地下（看穿地面）。
9. **`renderer.setClearColor(0x0a0a14)`** — 不调默认是黑色，scene 没背景时会看到黑；调了 = 整个 renderer 清成这个色，scene fog / background 与之融合。
10. **`setPixelRatio(devicePixelRatio)`** — HDPI 屏必备；不调字 / 边会糊。

---

## PIXI 混用（未来）

如果想 3D 场景 + PIXI UI overlay，参考官方 mixing guide：

```ts
// 1. three 先建
const threeRenderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });   // ← stencil 必须 true
threeRenderer.setSize(W, H);
document.body.appendChild(threeRenderer.domElement);

// 2. PIXI 用 three 的 context
const pixiRenderer = new PIXI.WebGLRenderer();
await pixiRenderer.init({
  context: threeRenderer.getContext(),     // ← 关键：共享 context
  width: W, height: H,
  clearBeforeRender: false,                 // ← 不让 PIXI 清 three 的内容
});
const stage = new PIXI.Container();

// 3. render loop 交替 resetState
function loop() {
  threeRenderer.resetState();
  threeRenderer.render(scene, camera);
  pixiRenderer.resetState();
  pixiRenderer.render({ container: stage });
  requestAnimationFrame(loop);
}
loop();
```

**注意**：
- `stencil: true` 是 PIXI mask 兼容的需要
- 两 renderer 共享 context；resize 要 **同步**两边的尺寸
- PIXI 资源不与 three 互通（PIXI.Texture ≠ THREE.Texture）；要做 image → 各自 `URL.createObjectURL(blob)` 重新加载
- 用 `WebGLRenderer` 不用 `WebGPURenderer`（WebGPU 的 mixing 更复杂，r184 还在实验）

我们当前的 SubCanvas 系统是纯 PIXI 的；混用需要在 start3DApp 旁边再写一个 `start3DWithPixi` 之类。

---

## 应用范围

适合：
- **game UI 的 3D 部分**（角色模型、场景预览、装备 3D 展示）
- **数据可视化**（3D 柱图 / 散点 / 球面）
- **配置器**（3D 模型拖拽换色 / 旋转看细节）
- **元宇宙 / VR 场景**（用 WebXRRenderer）

不适合：
- **2D UI**（继续用 PIXI）
- **复杂着色器**（WebGPU 的 TSL 更适合；r184 还在实验）
- **极大量对象**（>10k）— InstancedMesh 或转 WebGPU
- **移动端**（WebGL 2 + 复杂 shader 在低端机会掉帧）

---

## 注意事项

1. **destroy 一定要调** — 漏了会：① rAF 一直跑（每帧渲染空场景到丢失的 context）；② 监听器挂在已摘的元素上但其他引用还在 → 内存泄露。
2. **不要在 destroy 之前 `new` 新对象加到 scene** — 销毁已开始 traverse，乱加会跳过 dispose。
3. **OrbitControls + 自己加 click 监听** — 两个都监听 domElement 的 pointer 事件，触发顺序按 addEventListener 顺序。OrbitControls 是 controls.dispose() 时自己拆的。
4. **canvas 在 body 末尾，z-index 0** — 自己加的 HUD div 要 `position:fixed; z-index:10; pointer-events:none`（pointer-events 避免吞掉 canvas 的点击）。
5. **devicePixelRatio 改了**（用户拖窗口到不同 DPI 屏）— 当前实现不监听 `matchMedia`；resize 时只重算 width/height。要 HDPI 切换就再补一个监听。
6. **没有 error boundary** — WebGL context lost（GPU reset / 切 tab）会静默失败；要做就监听 `webglcontextlost` / `webglcontextrestored`。
7. **场景对象 < 1000 时无脑 Mesh** — 多了换 InstancedMesh；粒子用 Points。
8. **OrbitControls 不会自动停止 autoRotate** — 用户拖一下也不会停；autoRotate 是持续状态。要"用户操作后停 autoRotate"就监听 controls.addEventListener('start', () => api.controls.autoRotate = false)。
9. **未来后台**：3D 场景的状态（相机位置、对象列表）可以走 `proxy.bus.emit('scene:snapshot', api.camera.position)`，存 localStorage 或远端；reload 时恢复。
