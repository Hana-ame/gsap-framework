# EventBus

极简 pub-sub（~30 行）。`SubCanvasProxy.bus` 实例是 **共享** 的 — 跨 SubCanvas 通信 + 后台事件入口（WebSocket 消息直接 `proxy.bus.emit('event', data)`，UI 订阅）。

---

## 调用栈

### 谁用它
```
SubCanvasProxy.constructor()
  └─ this._bus = new EventBus()

proxy.bus  ← 暴露给外部
  ├─ 用户代码：proxy.bus.on('event', fn)
  ├─ UI 组件：proxy.bus.on('backend:item-update', refreshInventory)
  └─ 未来 WebSocket：ws.onmessage = (e) => proxy.bus.emit('backend:item-update', JSON.parse(e.data))
```

### on / off
```
bus.on('chat', handler)
  ├─ listeners.get('chat') 不存在？ → new Set()，存
  ├─ listeners.get('chat').add(handler)
  └─ return () => bus.off('chat', handler)   // 自动 cleanup
```
`bus.on()` 返回的函数就是 cleanup — 直接在 useEffect 末尾 return 即可。

### emit
```
bus.emit('chat', payload)
  ├─ listeners.get('chat') 拿不到？ → return
  └─ 拷贝 set 后遍历（中途 unsubscribe 安全）:
       for fn of [...set]:
         try fn(payload)
         catch err → console.error（一个 handler 抛了不影响其他）
```

### clear
```
proxy.destroyAll()
  └─ this._bus.clear()   // proxy 销毁时清空所有监听
```

---

## API

```ts
class EventBus {
  on<T>(event: string, fn: (payload: T) => void): () => void    // 返回 cleanup
  off(event: string, fn: (payload: unknown) => void): void
  emit<T>(event: string, payload?: T): void
  clear(): void
  listenerCount(event: string): number
}
```

- **同步派发**：`emit` 立刻调所有 listener；不会等下一帧
- **失败隔离**：一个 handler 抛错不会影响其他
- **拷贝遍历**：`emit` 时拷贝 listener set 再遍历 — 遍历中 `off` 安全
- **没有 once / 优先级 / 异步**：保持极简，需要再加

---

## 使用

### 跨 SubCanvas 通信
```ts
// Window A
proxy.bus.emit('inventory:item-picked', { id: 42, name: 'sword' });

// Window B
const off = proxy.bus.on<{ id: number; name: string }>('inventory:item-picked', (item) => {
  console.log('got item', item);
  refreshUI(item);
});
// ...
off();   // 取消订阅
```

### React useEffect 内
```ts
useEffect(() => {
  const off = proxy.bus.on('backend:user-update', (user) => setUser(user));
  return off;   // 卸载时自动取消订阅
}, []);
```

### 模拟后台（用于 demo / 测试）
```ts
showLoading(root, 'loading inventory...');
setTimeout(() => {
  proxy.bus.emit('inventory:loaded', { items: [...] });
  hideLoading();
}, 1500);
```

### 未来接 WebSocket
```ts
// 后台集成时（src/api/websocket.ts）
const ws = new WebSocket('wss://api.example.com/ws');
ws.onmessage = (e) => {
  const { event, data } = JSON.parse(e.data);
  proxy.bus.emit(event, data);   // UI 不用改
};
// UI 继续 proxy.bus.on(event, handler) 即可
```

---

## 应用范围（游戏 UI 场景）

适合：
- **跨窗口状态同步**（背包 → 角色面板 → 任务栏）
- **后台事件入口**（WebSocket / SSE / polling → UI）
- **解耦 UI 组件**（HUD 不直接调 Inventory，emit 一个事件让 Inventory 自己听）
- **全局事件总线**（esc 关闭所有浮窗、theme 切换、热重载）

不适合：
- **高频流式数据**（60fps 角色位置）— 派发开销太大；用 PIXI.Ticker 直接更新
- **需要回放**（undo / redo）— EventBus 是 fire-and-forget；用 state store
- **需要类型安全**（`bus.emit('typo', ...)` 编译不报错）— 现在是字符串 key；要严格就用 typed emitter（成本是 boilerplate）

---

## 注意事项

1. **payload 用 unknown / any** — handler 自己 narrow；bus 不验证类型。
2. **handler 抛错被 console.error 但 emit 继续** — 一个挂了不影响其他，但也不会重试。
3. **`on` 返回的 cleanup 一定要调** — 否则路由切换后旧 listener 还在（闭包持有旧 proxy → 旧 PIXI 资源泄露）。React 里 `return off` 是最稳的写法。
4. **event 名用 namespace**（`inventory:loaded` / `chat:msg`）— 避免和第三方事件撞名；可考虑加 `appname:` 前缀。
5. **不要在 handler 里 emit 同一个 event** — 同步派发会导致递归，调到 stack overflow。需要在 handler 里 emit 别的 event 或者用 queueMicrotask 包一层。
6. **`bus.clear()` 只在 `destroyAll` 里调** — 不要在普通业务里调，会清掉所有订阅。
7. **没有"只 emit 给某订阅者"** — 全部 broadcast。要定向就用 SubCanvas 实例方法（`win1.sendTo(win2, msg)`）— 那种 API 还没做。
