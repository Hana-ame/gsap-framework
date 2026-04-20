// ============================================================
// 文件: src/App.tsx
// 用途: 主应用测试界面。展示画布、工具栏，并实时显示来自画布的事件日志。
//       使用 GameController 封装所有业务逻辑，使组件保持简洁。
// 上下文: React 根组件，仅负责渲染和用户输入，所有逻辑委托给 GameController。
//
// 版本: 3.0.0
//    - 移除所有演示按钮（API演示、小球、烟花等），仅保留康威生命游戏控制按钮：
//      开始、暂停、步进、清除。
//    - 更新 GameController 实例化，添加生命游戏相关方法。
//
// Outline:
// 1. 导入依赖、组件、PixiController 和 GameController。
// 2. 初始化 PixiController 和 GameController（使用 useRef 确保只执行一次）。
// 3. 定义日志状态和更新函数，传递给 GameController 的 logCallback。
// 4. 定义 onAppInit 回调，调用 gameController.onAppInit。
// 5. 渲染 UI: 按钮点击调用 gameController 的对应方法。
// 6. 渲染日志列表。
//
// 注意事项:
//   - 所有业务逻辑和消息处理都在 GameController 中，App.tsx 不再处理事件转发。
//   - 插件列表已精简，仅注册 clear 和 gameOfLife 插件（见 plugins/index.ts）。
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { PixiCanvas } from "./components/PixiCanvas";
import { PixiController } from "./controllers/PixiController";
import { GameController } from "./controllers/GameController";
// 导入插件数组
import { plugins } from "./plugins";

import "./App.css";

function App() {
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const gameControllerRef = useRef<GameController | null>(null);
  const pixiControllerRef = useRef<PixiController | null>(null);

  // 初始化控制器（只执行一次）
  if (!pixiControllerRef.current) {
    const pixiController = new PixiController();

    // 批量注册所有插件（现在只包含 clear 和 gameOfLife）
    plugins.forEach((plugin) => pixiController.registerPlugin(plugin));

    pixiControllerRef.current = pixiController;
  }

  if (!gameControllerRef.current && pixiControllerRef.current) {
    // 创建 GameController，并传入日志回调
    const gameController = new GameController(pixiControllerRef.current, (logEntry) => {
      setEventLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
    });
    gameControllerRef.current = gameController;
  }

  // 当 PixiCanvas 初始化完成时，调用 GameController 的 onAppInit
  const handleAppInit = useCallback((app: PIXI.Application) => {
    gameControllerRef.current?.onAppInit(app);
  }, []);

  // 清除日志
  const clearLogs = () => setEventLogs([]);

  return (
    <div className="App">
      <h1>康威生命游戏 (PixiJS v8)</h1>
      <div className="toolbar">
        <button onClick={() => gameControllerRef.current?.startGameOfLife()}>开始</button>
        <button onClick={() => gameControllerRef.current?.pauseGameOfLife()}>暂停</button>
        <button onClick={() => gameControllerRef.current?.stepGameOfLife()}>步进</button>
        <button onClick={() => gameControllerRef.current?.clearCanvas()}>清除网格</button>
        <button onClick={clearLogs}>清除日志</button>
      </div>
      <div className="canvas-container">
        <PixiCanvas
          controller={pixiControllerRef.current!}
          width={800}
          height={600}
          backgroundColor={0x000000} // 黑色背景，与网格边框对比
          onAppInit={handleAppInit}
        />
      </div>
      <div className="event-log">
        <h3>事件日志 (带时间戳)</h3>
        <ul>
          {eventLogs.map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;