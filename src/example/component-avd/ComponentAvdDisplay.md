# ComponentAvdDisplay — Avd 演示

`src/example/component-avd/ComponentAvdDisplay.tsx` 的对应文档。

---

## 职责

演示 `Avd` 组件的所有功能：3 角色 roster / 主题切换 / 打字速度 / 重启 / 跳到末尾 / roster 模式切换。

---

## 区域布局

3 个 SubCanvas 区域（从顶到底）：

| 区域 | 高度 | 内容 |
|---|---|---|
| Control | 80px | 控件条（主题 / 速度 / 模式 / 重启 / 跳过） |
| Status | 28px | 状态栏（当前行 / state） |
| AVD | 剩余 | Avd 场景 |

窄屏（`screenW < 720`）时 Avd 内部自动调整 box/portrait/字号；本 demo 的控件条**不会**自动重排——控件只是 demo helper，**主交互是 click-to-advance**。

---

## 控件

### 主题（3 个按钮）

`dark` / `light` / `sepia`，点击切换。调 `avd.applyOptions(THEMES[t].options)` 实时换色（boxBg / boxBgAlpha / textColor / nameColor / arrowColor）。**按钮高亮**当前主题。

### Speed (cps) 步进器

`-` / 当前值 / `+`，1-100 chars/sec。调 `avd.setTypewriterSpeed(n)` 实时生效。**显示的数值会实时更新**（早期版本有 bug：closure 捕获了初始 30，按钮点 +/− 后显示数字不变，已在 `7f7347f` 修复）。

### Mode: solo / group（roster 模式）

切换 `avd.setRosterMode('speaker-only' | 'persistent')`：
- `solo`（默认）：当前说话者立绘淡入到 1.0，其他位置淡出到 0
- `group`：roster 内 3 个角色**同时可见**，当前说话者 1.0，非说话者 0.4（经典三人场景）

**按钮文字随模式变化**（"Mode: solo" / "Mode: group"），背景色也跟着变（深紫 / 亮蓝）。

### Restart

调 `setRestartKey(k => k + 1)`，触发 `[restartKey]` useEffect 重建 PIXI app。

### Skip to End

调 `avd.goTo(lineCount - 1)` 跳到最后一行。**注意**：`goTo` 不触发中间行的 `onLineEnter`——直接跳到目标行。

---

## 角色（Roster）

| 角色 | 默认位置 | 颜色（hair / shirt） |
|---|---|---|
| Alice | left | 棕发 + 蓝衬衫 |
| Bob | right | 黑发 + 卡其衬衫 |
| Carol | center | 红棕发 + 绿衬衫 |

**avatars 是程序生成的 PIXI.Graphics**（头 / 发 / 眼 / 嘴 / 身），无外部图片资源。`makeAvatar(name, skin, hair, shirt, size)` + `avatarToTexture(renderer, avatar)`。

**moon 图标**也是程序生成（圆 + 3 个陨石坑），用于 inline image 段。

---

## Script

10 行：

1. Narrator: 旁白
2. Alice: 终于编译通过了！
3. Alice: （inline moon 图）Alice 抬头，看见了 🌙 这轮明月。
4. Bob: 不对，那是平面几何。这里是相对论。
5. Bob: （长文本）文字支持自动排版……（自动换行）
6. Alice: 啊，对。我搞混了。
7. Carol: 我能加入吗？   ← Carol 第一次出现
8. Bob: 当然。
9. Alice: Carol！你也来了。
10. Narrator: 对话结束。点 Restart 重新开始。

**Roster 自动排位**：script 里**不写** `portraitPos`，由 `avd.setRoster({ Alice: 'left', Bob: 'right', Carol: 'center' })` 自动决定。**演示了 roster 是必需**——没有 roster 时，line 必须显式 `portraitPos`。

---

## 状态栏

显示 `Line N / Total · state: typing|between|done`。每次 `onStateChange` / `onLineEnter` 触发时更新。

---

## React 桥接 PIXI 模式

参考 [Avd.md - 单 useEffect 模式](../components/Avd.md#实现细节调用栈--内部流程)：

- 1 个 `useEffect([restartKey])` 创建 / 销毁 PIXI app
- `useState` 只用于"设置"（theme / speed / restartKey / rosterMode / lineIndex / avdState）
- `useRef` 持有 PIXI 引用（refs / avd）
- 多个 `useEffect([setting])` 同步 setting → PIXI

---

## 已知限制

- **控件在窄屏溢出**（< 480px）——主交互 click-to-advance 不受影响
- **avatars 280x280 渲染**：桌面 380 portrait 区域刚好放下；更小的 portrait 区域会顶到 box
- **no JSON loading**：本 demo 用硬编码 script + 资源。**真要用 JSON**，参考 [AvdScript.md](../components/AvdScript.md)
