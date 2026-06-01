# ThreeDisplay

`#three` 路由对应的视图：three.js 全屏 3D 场景。8 圈立方体 + 中央二十面体 + 地面网格 + 三点光 + OrbitControls 拖动 + 点击地面生成方块。

**结构对称于 `SingleDisplay`**：useEffect 启动 → onReady 拿 api → 卸载 destroy。SingleDisplay 用 PIXI 画 2D，ThreeDisplay 用 three 画 3D。**SingleDisplay 不动**（用户要求"不能改在原地"）。

---

## 调用栈

### 启动
```
URL → #three
  └─ RouteSwitch → case 'three' → <ThreeDisplay />
       └─ useEffect(() => { ... }, [])
            ├─ hud = null
            ├─ downX = 0; downY = 0
            └─ destroy = start3DApp((api) => {
                 ├─ 3 灯：Ambient + 主 Directional + 补光 Directional
                 ├─ GridHelper(20, 20)
                 ├─ 中央 IcosahedronGeometry(0.9) + flatShading 橙色
                 ├─ 8 圈 BoxGeometry(0.9) 立方体（极坐标均分）
                 ├─ groundPlane = new Plane(y=1, w=0)
                 ├─ spawned[] 用于 click 生成的方块（>MAX_SPAWN 时 FIFO dispose）
                 ├─ 监听 pointerdown/up：
                 │    down 记起点
                 │    up 时如果移动 < 5px（click 不是 drag）→ 算 NDC → raycast
                 │    hit ground plane → spawn(hit.x, hit.z)
                 ├─ 包装 controls.update：原 update + 动画（中央旋转 / 环上下浮动 / spawn 旋转）
                 └─ hud = <div> 文案提示，appendChild body
              })
              return destroy
            └─ return cleanup:
                 destroy()          // start3DApp 的销毁
                 if (hud) remove    // 拆 HUD
```

### 拖动（OrbitControls）
```
用户在 canvas 上拖
  └─ renderer.domElement 'pointerdown' (OrbitControls 内部)
       └─ OrbitControls 记录起点，update 算相机位置
  renderer.setAnimationLoop
       └─ controls.update()       // 应用 damping + autoRotate
       └─ renderer.render(scene, camera)
       └─ 我们包装的 update 在 baseUpdate() 之后跑动画
```

### 点击生成方块
```
用户 click 地面（pointerdown 与 pointerup 距离 < 5px）
  └─ our pointerup handler
       ├─ 算 NDC（normal device coords: x∈[-1,1], y∈[-1,1]）
       ├─ raycaster.setFromCamera(ndc, camera)
       ├─ raycaster.ray.intersectPlane(groundPlane, hit)   // 算射线与 y=0 平面交点
       └─ if (hit):
            spawn(hit.x, hit.z)
              ├─ new Mesh(BoxGeometry(0.6), MeshStandardMaterial)
              ├─ position(hit.x, 0.3, hit.z)
              ├─ rotation 随机
              ├─ scene.add(mesh)
              ├─ spawned.push(mesh)
              └─ if (spawned.length > 60) → 摘最老的 + dispose
```

### 路由切走
```
URL 变 #single 等
  └─ React 卸载 <ThreeDisplay />
       └─ useEffect cleanup
            ├─ destroy()       // setAnimationLoop(null) + controls.dispose() + scene.traverse dispose + renderer.dispose() + 摘 canvas
            └─ removeChild(hud)
```

---

## API

```ts
export function ThreeDisplay(): null
```

- 无 props；无返回值（PIXI / canvas 都在 body）
- 副作用：1 个 canvas + 1 个 HUD div + 1 个 resize 监听 + 1 个 setAnimationLoop
- 场景：8 圈立方体 + 1 中央二十面体 + 1 GridHelper + 3 灯 + 点击生成

---

## 使用

### 访问 / 修改场景
当前没有暴露 — 想加按钮/输入就：
```tsx
// 改 onReady：
start3DApp((api) => {
  // ... 现有场景
  // 加自己的：
  api.scene.add(myCustomMesh);
});
```

### 拿 HUD 改文案
hud 是 `document.createElement('div')` 在 ThreeDisplay 内部；想外部控制就 hoist 出去。

### 加 / 删对象
```ts
const mesh = new THREE.Mesh(geom, mat);
api.scene.add(mesh);
// 删：
api.scene.remove(mesh);
mesh.geometry.dispose();
(mesh.material as THREE.Material).dispose();
```
**记得 dispose 几何 + 材质**，否则 WebGL 资源泄露。

### 改相机
```ts
api.camera.position.set(0, 10, 0);
api.camera.lookAt(0, 0, 0);
api.controls.target.set(0, 0, 0);
api.controls.update();
```

### 改 OrbitControls 行为
```ts
api.controls.autoRotate = false;
api.controls.enableDamping = false;
api.controls.minDistance = 1;
api.controls.maxDistance = 50;
```

### 关掉点击生成
删掉 `onDown` / `onUp` 那两段即可。

---

## 应用范围

适合：
- **demo / 学习**（3D 交互模板）
- **game UI 的 3D 部件**（角色预览、装备展示）
- **3D 数据可视化**（在 start3DApp onReady 里加 chart）

不适合：
- **生产 3D 游戏** — 没有 LOD、没有 frustum culling、没批渲染
- **复杂 shader**（r184 还在 WebGL 2 + TSL 实验）
- **多 canvas 3D**（每个 start3DApp 创建一个 WebGL context；多 context 共存有上限 — 多数浏览器 8-16）

---

## 注意事项

1. **renderer 是 three.js 单独的 WebGL context** — 与 PIXI 路由 (`#single` / `#multiple` / `#window`) 的 PIXI WebGL context **不共享**。路由切换时旧的 destroy 释放 context，新的创建另一个。
2. **canvas 在 body 末尾，HUD 在它之上** — HUD 的 `pointer-events: none` 让点击穿透到 canvas。
3. **OrbitControls + 自己 pointer 监听并存** — OrbitControls 监听 pointerdown/up/move/wheel；我们加 pointerdown/up 算 click。drag 后释放（> 5px 移动）算 OrbitControls 的拖动不算 click。
4. **click 生成依赖 raycaster** — `intersectPlane(groundPlane, hit)` 算射线与 y=0 平面交点；相机看向 (0, 0.5, 0) 时这个平面就在地面附近。
5. **spawn 上限 60** — 超了 FIFO 摘最老的 + dispose（geometry + material）。无上限会内存增长。
6. **`maxPolarAngle = π/2 - 0.05`** — OrbitControls 装在 start3DApp 里，防止相机绕到地下看穿地面。
7. **`autoRotate: true`** — 用户不动时场景自己转；用户拖动 OrbitControls 接管。autoRotate 不停 — 要"用户操作后停"就 `controls.addEventListener('start', () => controls.autoRotate = false)`。
8. **shadow 没开**（`renderer.shadowMap.enabled`）— 性能 vs 视觉权衡。demo 不需要；生产场景建议开。
9. **没监听 `webglcontextlost`** — GPU reset / 切 tab 后场景不再渲染；监听 `webglcontextrestored` 重建。
10. **performance.now() 做动画时钟** — 不用 `clock.getDelta()`，因为我们想每帧动画与相机 update 同步；`getDelta` 会有 frame skip 累积误差。
11. **没把场景状态存到 bus** — 当前场景是 ephemeral；要持久化（窗口大小 / 相机位置 / spawn 的方块）就走 `proxy.bus.emit('scene:snapshot', ...)`，reload 时 `bus.on('scene:restore', ...)` 重建。
