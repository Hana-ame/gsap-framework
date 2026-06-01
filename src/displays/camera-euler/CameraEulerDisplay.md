# CameraEulerDisplay

`#camera-euler` — Three.js **camera** 用 YXZ 欧拉角 + pitch clamp 避免万向节锁，跟 `#three-euler`（mesh 用欧拉角）配对。

## Call Stack

```
CameraEulerDisplay  (useEffect mount)
 ├─ WebGLRenderer + Scene + PerspectiveCamera (rotation.order = 'YXZ')
 ├─ Lights: Ambient + main Directional + fill Directional
 ├─ World axes (AxesHelper 2)
 ├─ Grid (GridHelper 20x20)
 ├─ Central target (red BoxGeometry)
 ├─ 8 reference pillars (BoxGeometry, HSL color cycle)
 └─ Back wall (PlaneGeometry)
```

Camera 位置固定 `(0, 1.2, 5)`，**不**用 OrbitControls（避免和 Euler 输入混淆）。每帧：
```
camera.rotation.set(
  sin(t * 0.3) * PITCH_MAX,   // pitch (X), clamped +/-80 deg
  t * 0.4,                      // yaw (Y), continuous
  sin(t * 0.7) * 20deg,         // roll (Z), +/-20 deg
  'YXZ'                         // order: yaw -> pitch -> roll
);
```

`camera.rotation` 自动更新 `camera.quaternion`（内部走 Euler → Quaternion 转换，避免 lock 后再让 Quaternion 还原 lock 状态）。

## Why YXZ + clamp avoids gimbal lock

| Euler order | Singularity | When |
|-------------|-------------|------|
| `XYZ`       | pitch = +/-90 deg | 两轴对齐，roll 没意义 |
| `YXZ`       | pitch = +/-90 deg | 同上，但 yaw 在外层更稳定 |
| `ZYX`       | pitch = +/-90 deg | 同 |
| `Quat`      | none | 4D 表达，不锁 |

YXZ 是 FPS / 飞行类应用标准：
- yaw 在外层（先转）—— 水平看，pitch 才有意义
- pitch 中间 —— 上下看
- roll 最里 —— 左右倾

**Clamp pitch 到 +/-80 deg** 永远到不了 +/-90 deg 那个奇点。即使 order 写错，数值上也安全。

## API

无 props，无 ref。组件自管生命周期。

## Usage

```ts
import { CameraEulerDisplay } from './displays/camera-euler/CameraEulerDisplay';
// RouteSwitch
case 'camera-euler': return <CameraEulerDisplay />;
```

访问 `#camera-euler` 看 camera 在场景里摇头看上下看。HUD 左上角显示 pitch / yaw / roll + lock 状态 + 当前位置。

## Scope

- ✅ Single camera，YXZ Euler 动画
- ✅ Pitch clamp (+/-80 deg) 避免 lock
- ✅ HUD 显示 Euler 角 + 状态 + position
- ❌ OrbitControls（不参与；外部控制会冲掉 Euler）
- ❌ 手动输入（没有 UI 控件；用 code 改 `camera.rotation` 即可）
- ❌ 演示「坏 order 怎么 lock」（没加对比）

## Notes

### 为什么跟 `#three-euler` 分开
- `#three-euler`：object (ship) 用 Euler —— 物体姿态
- `#camera-euler`：camera 用 Euler —— 视点姿态
- 两者 Euler 的语义不同（一个 transform object，一个 transform view），分开讲清楚
- 同一个 route 里塞两个 demo 会让 HUD 混乱

### 为什么 camera 位置固定
- OrbitControls 会写 `camera.position` 和 `camera.quaternion`
- 我们的 Euler 动画也写 `camera.rotation`（自动同步 quaternion）
- 两者冲突 —— 拖一下 OrbitControls 就把动画覆盖了
- 固定位置 + 纯 Euler 旋转，语义清晰：「Euler 就是相机的姿态输入」

### 已知 limitation
- HUD 的 `pos` 永远是 `(0, 1.2, 5)`（camera 没动），看起来 redundant —— 是给未来扩展（orbit + Euler 复合）留的字段
- pitch clamp 写死 +/-80 deg，没考虑不同 order 的 lock 阈值
- 没演示「lock 时实际行为」（XYZ order 配 +/-90 deg pitch 会怎样）
- `camera.rotation` 在某些 r 版本有 .onChange callback，未启用

## 相关
- `#three-euler` (ThreeEulerDisplay) —— 配对 demo
- `src/window/NOTES.md` —— window 化层 polish 记录
