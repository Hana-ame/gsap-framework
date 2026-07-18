# utils/__tests__/

测试工具模块。所有测试是纯函数测试，无 PIXI / DOM / React 依赖。

## 运行

```bash
npm test          # 单次运行
npm run test:watch  # watch 模式
```

## 测试文件

| 文件 | 测试目标 | 用例数 |
|------|---------|--------|
| `math.test.ts` | `clamp` `lerp` `invLerp` `mapRange` `degToRad` `radToDeg` `distance` `distanceSq` `normalizeAngle` `snapToGrid` `randomInt` | 26 |
| `color.test.ts` | `hexToRgb` `rgbToHex` `rgbaToHex` `parseHexString` `formatHexString` `blendColors` `luminance` `isLight` `contrastTextColor` | 15 |
| `rect.test.ts` | `rectContains` `rectIntersects` `rectCenter` `rectExpand` `rectShrink` `rectFit` `rectClamp` `rectSnap` | 18 |

**总计: 59 个测试用例，305ms 运行。**

## 约定

- 纯函数，无副作用
- 每个 `describe` 对应一个导出函数
- 边界情况优先测试（edge values, zero inputs, negative values）
