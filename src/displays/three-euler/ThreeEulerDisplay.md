# ThreeEulerDisplay

`#three-euler` — 单个 three.js mesh，用 **YXZ 欧拉角** + **pitch clamp** 避免万向节锁。

## Call Stack

```
ThreeEulerDisplay  (useEffect mount)
 ├─ WebGLRenderer + Scene + PerspectiveCamera
 ├─ Lights: Ambient + main Directional + fill Directional
 ├─ GridHelper (ground)
 └─ ship (THREE.Group, 0.3m above ground)
     ├─ body (BoxGeometry 0.4×0.15×1, blue)
     ├─ nose (ConeGeometry, red, pointing +Z)
     ├─ wingL / wingR (BoxGeometry, light blue)
     └─ AxesHelper 0.7  (local axes — rotates with ship)
```

每帧：
```
euler.set(
  sin(t·0.3) · PITCH_MAX,   // pitch (X), clamped ±85°
  t · 0.5,                   // yaw (Y), continuous
  sin(t·0.7) · 0.5           // roll (Z), ±0.5 rad
);
ship.rotation.copy(euler);
```

`Euler.set(x, y, z, 'YXZ')` — order 是 yaw → pitch → roll。HUD 实时显示三个角 + lock 状态。

## Why YXZ + clamp avoids gimbal lock

| Euler order | Singularity | When |
|-------------|-------------|------|
| `XYZ`       | pitch = ±90° | 两轴对齐，roll 没意义 |
| `YXZ`       | pitch = ±90° | 同上，但 yaw 在外层更稳定 |
| `ZYX`       | pitch = ±90° | 同 |
| `Quat`      | none | 4D 表达，不锁 |

YXZ 在游戏 / 飞行里常用（FPS 相机、飞机姿态），因为：
- yaw 是「水平转」先做，不影响 pitch 的几何意义
- pitch 是「上下看」放中间
- roll 是「左右倾」放最后

**clamp pitch 到 ±85°** 是游戏 dev 标准做法 — 永远不到 ±90° 那个奇点。即使 order 写错，数值上也到不了 lock。

## API

无 props，无 ref。组件自管生命周期。

## Usage

```ts
import { ThreeEulerDisplay } from './displays/three-euler/ThreeEulerDisplay';
// 在 RouteSwitch
case 'three-euler': return <ThreeEulerDisplay />;
```

访问 `#three-euler` 看船姿态连续变化。OrbitControls 拖动相机（左键转，右键平移，滚轮 zoom）。HUD 左上角显示 pitch/yaw/roll + lock 警告。

## Scope

- ✅ 单 mesh（ship group），YXZ Euler 动画
- ✅ Pitch clamp 避免 lock
- ✅ HUD 显示 Euler 角 + 状态
- ✅ OrbitControls（相机不参与 Euler，避免混淆）
- ❌ 手动改 Euler（没 UI 控件；用 setRotation 可在代码里改）
- ❌ 演示「坏 order 怎么 lock」（没加对比；后续可加个 toggle 在 XYZ/YXZ 间切）

## Notes

### 为什么用 ship group 而不是单 mesh
- 三个零件（body + nose + wings）有局部关系
- group 的 rotation.copy(euler) 一次应用到所有子
- AxesHelper 跟着转，可视化局部坐标系 — 验证 Euler 是否符合预期

### 为什么 HUD 每帧更新
- 60Hz 文字更新没事
- 用 `textContent` 而不是 React state — 不触发 React 重渲染
- 用户感觉「数值跟着转」

### 为什么相机用 OrbitControls 不参与
- 相机姿态是 OrbitControls 管（target + spherical）
- 船姿态是 ship.rotation (Euler) 管
- 两者独立，避免「相机一动 lock 状态变」的歧义

### 已知 limitation
- `LOCK_THRESHOLD` 检查写死 89°，没考虑不同 order
- 没演示「lock 时实际行为」（XYZ order 配 ±90° pitch 会怎样）
- 飞行模拟缺 throttle / lift 模型 — 这是几何 demo，不是物理
