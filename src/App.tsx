// ============================================================
// 文件: src/App.tsx
// 用途: 主应用测试界面。展示画布、工具栏，并实时显示来自画布的事件日志。
//       新增 DVD 屏保反弹动画功能，通过插件实现。
// 上下文: React 根组件，用于演示 PixiCanvas 和 PixiController 的集成，
//        以及函数式插件的注册与使用。
//
// 版本: 2.2.0
//    - 新增 bouncePlugin，实现反弹图片动画。
//    - 在画布初始化后自动发送 startDVD 消息启动动画。
//    - 更新日志和按钮以支持新功能。
//
// Outline:
// 1. 导入依赖、组件、控制器和插件（包括新 bouncePlugin）
// 2. App 函数组件
//    a. 状态: 事件日志列表
//    b. 初始化控制器并注册所有插件
//    c. 处理来自控制器的消息，更新日志
//    d. 发送绘图指令的函数（使用 controller.sendToPixi）
//    e. 在 handleAppInit 中发送 startDVD 消息
//    f. 渲染 UI: 标题、按钮、画布、日志显示区
// 3. 辅助函数: 格式化时间戳
//
// 注意事项:
//   - 插件是直接导入的对象，无需实例化。
//   - 在 PixiCanvas 初始化后通过 onAppInit 回调设置 controller 的 app 实例，
//     并发送 startDVD 启动动画。
//   - 点击“清除”按钮会同时触发 clearPlugin 和 bouncePlugin 的清理逻辑，
//     但 bouncePlugin 会在收到 clear 消息后停止动画，然后 clearPlugin 清空舞台。
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { PixiCanvas } from "./components/PixiCanvas";
import { PixiController } from "./controllers/PixiController";
// 导入所有插件
import { circlePlugin } from "./plugins/circle.plugin";
import { rectanglePlugin } from "./plugins/rectangle.plugin";
import { clearPlugin } from "./plugins/clear.plugin";
import { bouncePlugin } from "./plugins/bounce.plugin"; // 新增
import "./App.css";

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

function App() {
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const appRef = useRef<PIXI.Application | null>(null);
  const controllerRef = useRef<PixiController | null>(null);

  // 初始化控制器并注册插件（只执行一次）
  if (!controllerRef.current) {
    const controller = new PixiController();

    // 注册所有插件
    controller.registerPlugin(circlePlugin);
    controller.registerPlugin(rectanglePlugin);
    controller.registerPlugin(clearPlugin);
    controller.registerPlugin(bouncePlugin); // 新增

    // 设置父组件消息处理器（接收画布事件）
    controller.onMessageFromParent((message) => {
      const timeStr = message.timestamp
        ? formatTimestamp(message.timestamp)
        : "未知时间";

      let logEntry = `[${timeStr}] 事件: ${message.type}`;
      if (message.x !== undefined && message.y !== undefined) {
        logEntry += ` 坐标: (${message.x.toFixed(2)}, ${message.y.toFixed(2)})`;
      }
      setEventLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
    });

    controllerRef.current = controller;
  }

  // 当 PixiCanvas 初始化完成时，将 app 实例设置到控制器，并启动 DVD 动画
  const handleAppInit = useCallback((app: PIXI.Application) => {
    appRef.current = app;
    controllerRef.current?.setApp(app);
    // 发送启动 DVD 反弹动画的消息
    controllerRef.current?.sendToPixi({ type: 'startDVD' });
    // 记录日志
    const timeStr = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    setEventLogs((prev) => [
      `[${timeStr}] 启动 DVD 反弹动画`,
      ...prev.slice(0, 49),
    ]);
  }, []);

  // 发送绘图指令
  const sendDrawCommand = (type: string) => {
    if (!controllerRef.current) return;

    const message = {
      type,
      timestamp: Date.now(),
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150,
      radius: 30,
      width: 60,
      height: 40,
      color: Math.random() * 0xffffff,
    };

    // 通过控制器发送，它会自动调用匹配的插件
    controllerRef.current.sendToPixi(message);

    // 记录指令日志
    const timeStr = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    setEventLogs((prev) => [
      `[${timeStr}] 发送绘图指令: ${type}`,
      ...prev.slice(0, 49),
    ]);
  };

  const clearLogs = () => setEventLogs([]);

  return (
    <div className="App">
      <h1>PixiJS v8 事件测试 (DVD 屏保动画)</h1>
      <div className="toolbar">
        <button onClick={() => sendDrawCommand("drawCircle")}>画圆</button>
        <button onClick={() => sendDrawCommand("drawRectangle")}>画矩形</button>
        <button onClick={() => sendDrawCommand("clear")}>清除</button>
        <button onClick={clearLogs}>清除日志</button>
      </div>
      <div className="canvas-container">
        <PixiCanvas
          controller={controllerRef.current}
          width={800}
          height={600}
          backgroundColor={0x1099bb}
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