# MultipleDisplay

2×2 象限，每个象限一个 SubCanvas region。

## 演示

- `proxy.createRegion` 创建 4 个 quadrants
- 每个 region 独立 `mountDisplays` visualizer
- 窗口 resize 时 quadrant 尺寸等比重算
- 展示 SubCanvas 多区域共存、各自独立事件路由
