# WindowDisplay

两个可拖拽 GameWindow（Inventory + Chat）+ 模拟后端 + EventBus 跨窗口通信。

## 演示

- `createWindow` 创建 Inventory / Chat 窗口
- Chat 窗口含 timeline 列表和输入区域
- 模拟后端数据通过 `proxy.bus` 推送到窗口
- 展示 `SubCanvas.addChild` 安装 drag handle 的模式
