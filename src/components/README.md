# components/ — PIXI 组件

在 SubCanvas 框架上构建的可复用 PIXI UI 组件。

## 组件列表

| 文件 | 导出 | 说明 |
|------|------|------|
| `PixiWindow.ts` | `createWindow` | 带标题栏/关闭按钮的拖拽窗口，`content` 子区域用于填充内容。dragMode: `'title'` `'anywhere'` `'none'`。 |
| `PixiConfirm.ts` | `createConfirm` | Modal 对话框。支持 message / image / 多按钮 / keepOpen。按钮可设 `primary` 高亮和 `keepOpen` 级别。 |
| `PixiImage.ts` | `createLoadingImage` | 异步图片加载。placeholder → loaded → error 三态。支持 token-cancel（重复调用 `setUrl` 取消旧加载）。 |
| `Loading.ts` | `showLoading` | 半透明覆盖层 + 旋转环。返回 hide 函数。支持自定义文字/颜色/隐藏 spinner。 |
| `Scrollable.ts` | `createScrollable` | 可滚内容区域。支持 wheel / drag / touch 滚动，可选 scrollbar，纵向/横向。 |
| `ClickableImage.ts` | `createClickableImage` | 可点击缩略图。点击阈值检测 → `'fullscreen:show'` bus 事件。配合 FullscreenManager 使用。 |
| `FullscreenManager.ts` | `createFullscreenManager` | Singleton 全屏看图管理器。zoom/drag/close overlay。 |
| `PixiVideoPlayer.ts` | `createVideoPlayer` | PIXI 内联视频播放器。controls bar / progress seek / cutscene 模式。PIXI Sprite + VideoSource。 |
| `VideoPlayer.tsx` | `VideoPlayer` | 纯 React DOM `<video>` 封装（forwardRef + useImperativeHandle）。不是 PIXI 组件但在同一 barrel 导出。 |
| `Avd.ts` | `Avd` | Adv 视觉小说对话引擎。typewriter / speaker / portrait / inline-layout / fade。 |
| `AvdDialogueBox.ts` | `DialogueBox` | AVD 对话框 UI（背景框、speaker 标签、文字区域）。 |
| `AvdPortraitLayer.ts` | `PortraitLayer` | AVD 立绘层（左右插槽、fade in/out、高亮）。 |
| `AvdInlineLayout.ts` | `buildInlineLayout` 等 | AVD 行内布局（图文混排、CJK 自动换行）。 |
| `AvdScript.ts` | `parseAvdScriptJSON` | AVD JSON 剧本解析（元信息、台本行、角色表）。 |
| `index.ts` | (全部公开导出) | 公开 API。**外部只 import 此文件**。 |
