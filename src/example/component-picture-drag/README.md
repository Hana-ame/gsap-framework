# ComponentPictureDragDisplay

A minimal demo of a single draggable picture SubCanvas with click-position reporting.

Features:
- `SubCanvas` with `dragMode: 'anywhere'` — drag anywhere on the canvas to move it
- `dragBringToFront: true` — click/drag brings it to front
- Image loaded from URL (scaled to fit)
- Click detection: pointerdown + pointerup within 4px threshold (no drag in between)
- Click → red dot at local position + coordinate text via `EventBus`
- Coordinate display is fixed on screen (root stage); dot moves with the SubCanvas

## Click vs Drag

Click uses window-level `pointerdown`/`pointerup` listeners, independent from the PIXI drag system:

1. On `pointerdown`: if inside SubCanvas bounds, record start position
2. On `pointerup`: if pointer moved ≤ 4px from start, emit click (with position relative to SubCanvas at the time of press)
3. If pointer moved > 4px (drag occurred), the click is suppressed
4. `pointercancel` resets the state

This ensures a drag gesture never accidentally triggers a click report.

## 移动端

移动端未测试。理论上 window-level pointer events 应该 work，但不排除：
- 触摸滚动与 drag 的冲突
- 触摸延迟 / 手势识别干扰
- 多指触摸的处理

如需移动端支持，需额外测试并可能添加 `touch-action` 控制 / 手势冲突处理。

## Key integration

| Mechanism | Role |
|-----------|------|
| `window.addEventListener('pointerdown')` | Detects press inside SubCanvas bounds (independent of PIXI event system) |
| `window.addEventListener('pointerup')` | Detects release, checks movement threshold |
| `EventBus.emit('picture:click')` | Makes click data available for external hooks |
| `dragMode: 'anywhere'` | PIXI drag handle covers the entire SubCanvas |

No AABB routing or PIXI FederatedEvent handlers are used for click detection — keeps the gesture logic fully decoupled from the drag system.
