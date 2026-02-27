// src/App.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { PixiController } from "./controllers/PixiController";
import { PixiCanvas } from "./components/PixiCanvas";
import "./styles.css";

function App() {
  // 使用useRef保证控制器在整个生命周期内不变（除非手动替换）
  const controllerRef = useRef(new PixiController());
  const [messages, setMessages] = useState<string[]>([]);

  // 监听来自Pixi的消息
  useEffect(() => {
    const controller = controllerRef.current;

    const unsubscribe = controller.onMessageFromPixi((message) => {
      console.log("[Parent] 收到Pixi消息:", message);
      // 将消息显示在界面上
      setMessages((prev) => [
        `收到: ${JSON.stringify(message)}`,
        ...prev.slice(0, 9),
      ]);
    });

    return unsubscribe;
  }, []);
  
  // src/App.tsx (片段)
  useEffect(() => {
    const controller = controllerRef.current;
    const unsubscribe = controller.onMessageFromPixi((message) => {
      console.log("[Parent] 收到Pixi消息:", message);
      if (message.type === "pluginError") {
        setMessages((prev) => [
          `❌ 插件错误: ${message.error}`,
          ...prev.slice(0, 9),
        ]);
      } else {
        setMessages((prev) => [
          `收到: ${JSON.stringify(message)}`,
          ...prev.slice(0, 9),
        ]);
      }
    });
    return unsubscribe;
  }, []);

  // 向Pixi发送绘图指令
  const handleDrawCircle = useCallback(() => {
    const x = Math.random() * 700 + 50;
    const y = Math.random() * 500 + 50;
    const color = Math.floor(Math.random() * 0xffffff);
    controllerRef.current.sendToPixi({
      type: "drawCircle",
      x,
      y,
      radius: 30,
      color,
    });
  }, []);

  const handleDrawRectangle = useCallback(() => {
    const x = Math.random() * 700 + 50;
    const y = Math.random() * 500 + 50;
    const color = Math.floor(Math.random() * 0xffffff);
    controllerRef.current.sendToPixi({
      type: "drawRectangle",
      x,
      y,
      width: 50,
      height: 50,
      color,
    });
  }, []);

  const handleClear = useCallback(() => {
    controllerRef.current.sendToPixi({ type: "clear" });
  }, []);

  const handleSendTestData = useCallback(() => {
    // 模拟服务器推送的数据（未来可通过WebSocket接收）
    const testMessage = {
      type: "drawCircle",
      x: 400,
      y: 120,
      radius: 50,
      color: 0xffaa00,
    };
    controllerRef.current.sendToPixi(testMessage);
    setMessages((prev) => [
      `发送测试数据: ${JSON.stringify(testMessage)}`,
      ...prev.slice(0, 9),
    ]);
  }, []);

  return (
    <div className="app">
      <h1>Pixi.js + React 测试项目</h1>
      <div className="toolbar">
        <button onClick={handleDrawCircle}>画随机圆</button>
        <button onClick={handleDrawRectangle}>画随机矩形</button>
        <button onClick={handleClear}>清空画布</button>
        <button onClick={handleSendTestData}>模拟服务器数据</button>
      </div>
      <div className="canvas-container">
        <PixiCanvas
          controller={controllerRef.current}
          width={800}
          height={320}
        />
      </div>
      <div className="message-log">
        <h3>消息日志:</h3>
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
        <p className="hint">点击画布或在画布上按键盘，会发送消息到父组件</p>
      </div>
    </div>
  );
}

export default App;
