# ComponentVideoPlayerDisplay — 示例

`src/example/component-video-player/ComponentVideoPlayerDisplay.tsx` 的对应文档。

---

## 职责

演示 `createVideoPlayer` 在真实使用场景下的完整集成：
- 全屏 SubCanvas 装视频
- 右侧 HUD SubCanvas 装调试日志（`Scrollable` + `PIXI.Text`，每条 `onDebug` 入栈）
- 底部按钮 SubCanvas 装外部控制（Play/Pause 切换、Restart seek(0)）
- 销毁顺序：`player.destroy()` → `scrollable.destroy()` → 各 SubCanvas `.destroy()` → `destroyApp()`

URL 写死 `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4`（MDN 公共测试视频，CC0）。

---

## 状态图

### React 组件生命周期（React 19 + Strict Mode dev）

```mermaid
stateDiagram-v2
    [*] --> Mount_1: 首次访问<br/>useEffect

    Mount_1: Mount 1<br/>startPixiApp_1<br/>createVideoPlayer_1<br/>player_1.htmlVideo.src = URL<br/>player_1.htmlVideo.load()
    Mount_1 --> Cleanup_1: Strict Mode 合成清理<br/>(dev 模式, 同步)

    Cleanup_1: Cleanup 1 (synthetic)<br/>player_1.destroy()<br/>  ├─ 同步: pause / removeEventListener / scene 摘除<br/>  └─ setTimeout(0): cancelVideoFrameCallback / DOM 摘除 / revokeObjectURL / texture.destroy(false)<br/>destroyApp_1

    Cleanup_1 --> Mount_2: Strict Mode 合成重挂<br/>(同步, 同 task)

    Mount_2: Mount 2<br/>startPixiApp_2<br/>createVideoPlayer_2<br/>player_2.htmlVideo.src = URL<br/>player_2.htmlVideo.load()
    Mount_2 --> UserView: 用户看到 player_2 的视频

    UserView --> Cleanup_2: 用户导航离开<br/>(真实清理)

    Cleanup_2: Cleanup 2 (real)<br/>player_2.destroy() [同 Cleanup_1 流程]<br/>destroyApp_2

    Cleanup_2 --> [*]: 组件卸载

    [*] --> Mount_3: 再次访问 (navigate back)<br/>新组件实例, 新 useEffect

    Mount_3: Mount 3<br/>startPixiApp_3<br/>createVideoPlayer_3<br/>player_3.htmlVideo.src = URL<br/>player_3.htmlVideo.load()
    Mount_3 --> Cleanup_3: Strict Mode 合成清理

    Cleanup_3: Cleanup 3 (synthetic)<br/>player_3.destroy() [同 Cleanup_1]<br/>destroyApp_3
    Cleanup_3 --> Mount_4: Strict Mode 合成重挂

    Mount_4: Mount 4<br/>startPixiApp_4<br/>createVideoPlayer_4<br/>player_4.htmlVideo.src = URL<br/>player_4.htmlVideo.load()
    Mount_4 --> UserView2: 用户期望看到 player_4 的视频

    UserView2 --> Cleanup_4: 导航离开
    Cleanup_4 --> [*]
```

### OLD 异步清理的延迟触发（关键竞态）

```mermaid
stateDiagram-v2
    state "OLD player (player_2)" as OldP2 {
        [*] --> Aborted: 真实 Cleanup_2 触发<br/>setTimeout_2 入队
        Aborted: setTimeout_2 body<br/>cancelVideoFrameCallback(htmlVideo_2)<br/>parentNode.removeChild(htmlVideo_2)<br/>URL.revokeObjectURL(blob_2)<br/>oldTexture_2.destroy(false)
    }

    state "NEW player (player_4)" as NewP4 {
        [*] --> Loading: Mount_3 → Cleanup_3 → Mount_4<br/>player_4.htmlVideo.load()
        Loading --> CanPlay: 浏览器拉流完成
        CanPlay --> Ready: canplay 事件<br/>initVideoSource() 跑通
        Ready --> UserView: 纹理挂上, sprite 可见
    }

    Aborted --> UserView: setTimeout_2 在 Mount_4 期间/之后触发<br/>清理 OLD, 不影响 NEW

    note right of Aborted
        关键: setTimeout 异步清理**不阻塞** NEW 挂载
        - 同步部分: pause / removeEventListener / scene 摘除
        - 异步部分: cancel rVFC / DOM 摘 / blob revoke / texture.destroy(false)
        - 不调 source.destroy() (会触发 src=""; load() Abort → Cache Lock)
    end note

    note right of NewP4
        如果 setTimeout_2 的 Abort 在 Mount_4 的 load() 之前/同步触发,
        会让 htmlVideo_4 的同 URL 请求被 Chromium 媒体 Cache Lock 死锁
        → readyState=0, canplay 不触发, sprite 空
    end note
```

### 失败的 Abort 路径（已废弃，不要用）

```mermaid
stateDiagram-v2
    [*] --> SyncDestroy: destroy() 同步执行
    SyncDestroy: htmlVideo.removeAttribute('src')<br/>htmlVideo.load()<br/>videoTexture.destroy(true) [cascade]<br/>  → VideoSource.destroy()<br/>    → source.src = ""<br/>    → source.load()<br/>→ 同步 Abort 信号
    SyncDestroy --> CacheLock: Chromium 媒体 Cache Lock 死锁<br/>同 URL 新请求永远 Pending
    CacheLock --> NoVideo: canplay 不触发<br/>initVideoSource 不跑<br/>sprite 永久空

    note left of CacheLock
        症状: React Strict Mode dev 模式
        Mount → Cleanup → Mount 的 Cleanup 中
        同步 Abort 截断第一道流, 第二道流被锁
    end note
```

---

## 状态变量与不变量

**useEffect 闭包内 `let`：**
- `root: SubCanvas | null` — 全屏 SubCanvas
- `hudRegion: SubCanvas | null` — 右侧 HUD
- `btnRegion: SubCanvas | null` — 底部按钮
- `scrollableLog: Scrollable | null` — HUD 内日志滚动区
- `player: PixiVideoPlayerHandle | null` — 视频播放器句柄
- `logTexts: PIXI.Text[]` — 日志 Text 对象数组（限制 LOG_MAX=100 条）

**销毁顺序不变量**（cleanup 体内）：
1. `player?.destroy()` 必须**最先**（PIXI 视频有 setTimeout 异步清理，释放得越早 GC 压力越小）
2. `scrollableLog?.destroy()`
3. `btnRegion?.destroy()` / `hudRegion?.destroy()` / `root` 置 null（这三个 region 是 SubCanvas，会随 `destroyApp()` 一起被销毁，但显式置 null 让 GC 早一步回收）
4. `destroyApp()` 必须**最后**（销毁 PixiApplication 自身 + 全局 ticker 清理）

**Strict Mode 兼容性**：
- useEffect deps `[]` — 整个生命周期只跑一轮
- Strict Mode dev 会跑 `Mount → Cleanup → Mount` 合成循环一次
- 合成 Cleanup 调 `player.destroy()` 是无害的（destroyed 守卫 + setTimeout 异步）
- 合成 Cleanup 调 `destroyApp()` 是无害的（PixiApp.destroy 幂等）

---

## 调试方法

HUD 实时显示 `onDebug` 消息。关键观察点：
- `primed first frame` — 首帧 primer 成功，纹理应有内容
- `loadedmetadata duration=X` — 元数据加载完，`adjustSpriteScale` 跑过
- `autoplay blocked by browser policy; UI stays paused, await user click` — autoplay 被拒，正常
- `Native video error code: X` — 原生 error，进入 fallback 或最终失败
- `Attempting Blob fetch fallback...` — CORS / Range 失败，走 blob 兜底
- `Fallback failed: ...` — 兜底也失败，显示红色 "Load failed"

**如果 sprite 一直是空的**（HUD 没有任何新消息）：
1. 检查 `loadedmetadata` 有没有出现 → 没出现 = `canplay` 都没触发 = 网络层问题
2. 看浏览器 DevTools Network 标签：htmlVideo 请求是不是 Pending 状态 → 是 = Cache Lock（v3 修法应该解决）
3. 看 Console 有没有 `Cannot read properties of null` → texture/source lifecycle bug
