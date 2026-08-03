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
`;
  document.head.appendChild(style);
}
