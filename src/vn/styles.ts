/**
 * VN 播放器运行时样式 — 一次性注入 fade / shake 等关键帧。
 */

let injected = false;

/** 注入全局关键帧样式（幂等）。 */
export function injectVnStyles(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.setAttribute('data-vn', 'runtime');
  style.textContent = `
@keyframes vn-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes vn-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes vn-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes vn-flash {
  0% { background: rgba(255,255,255,0.85); }
  100% { background: transparent; }
}
@keyframes vn-stand-slide-up {
  from { opacity: 0; transform: translateY(60px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes vn-stand-slide-down {
  from { opacity: 0; transform: translateY(-60px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes vn-stand-slide-left {
  from { opacity: 0; transform: translateX(-80px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes vn-stand-slide-right {
  from { opacity: 0; transform: translateX(80px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes vn-stand-zoom {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes vn-trans-wipe-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes vn-trans-wipe-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes vn-trans-wipe-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes vn-trans-wipe-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
@keyframes vn-trans-circle {
  from { clip-path: circle(0% at 50% 50%); }
  to { clip-path: circle(75% at 50% 50%); }
}
@keyframes vn-trans-slide-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes vn-trans-slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes vn-trans-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes vn-trans-slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
@keyframes vn-trans-zoom {
  from { transform: scale(0.2); }
  to { transform: scale(1); }
}
`;
  document.head.appendChild(style);
}
