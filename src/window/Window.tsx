import { useEffect, useRef, useState, useId } from 'react';
import type {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

export const WINDOW_API_VERSION = '0.1.0';

export type WindowPosition = { x: number; y: number };

export type DragMode = 'title' | 'anywhere';

export type WindowProps = {
  id?: string;
  title?: ReactNode;
  initial?: WindowPosition;
  width: number | string;
  height: number | string;
  draggable?: boolean;
  dragMode?: DragMode;
  closable?: boolean;
  visible?: boolean;
  zIndex?: number;
  onFocus?: () => void;
  onClose?: () => void;
  onPositionChange?: (pos: WindowPosition) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

type DragState = { sx: number; sy: number; ox: number; oy: number };

export function Window({
  id,
  title,
  initial = { x: 40, y: 40 },
  width,
  height,
  draggable = true,
  dragMode = 'title',
  closable = false,
  visible = true,
  zIndex,
  onFocus,
  onClose,
  onPositionChange,
  className,
  style,
  children,
}: WindowProps) {
  const reactId = useId();
  const internalId = id ?? reactId;
  const [pos, setPos] = useState<WindowPosition>(initial);
  const [internalVisible, setInternalVisible] = useState(visible);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    setInternalVisible(visible);
  }, [visible]);

  const isInteractive = (el: EventTarget | null): boolean => {
    if (!(el instanceof HTMLElement)) return false;
    return !!el.closest('button, input, textarea, select, a, [role="button"], label');
  };

  const handleTitleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'title') return;
    if (!draggable) {
      onFocus?.();
      return;
    }
    onFocus?.();
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const handleTitleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'title') return;
    const d = dragRef.current;
    if (!d) return;
    const next = { x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) };
    setPos(next);
    onPositionChange?.(next);
  };
  const handleTitleUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'title') return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };
  const handleRootDownCapture = () => onFocus?.();
  const handleRootDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'anywhere' || !draggable) return;
    if (isInteractive(e.target)) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const handleRootMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'anywhere') return;
    const d = dragRef.current;
    if (!d) return;
    const next = { x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) };
    setPos(next);
    onPositionChange?.(next);
  };
  const handleRootUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragMode !== 'anywhere') return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };
  const handleClose = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  if (!internalVisible) return null;

  return (
    <div
      data-window-id={internalId}
      data-window-version={WINDOW_API_VERSION}
      data-window-drag-mode={dragMode}
      className={className}
      onPointerDownCapture={handleRootDownCapture}
      onPointerDown={handleRootDown}
      onPointerMove={handleRootMove}
      onPointerUp={handleRootUp}
      onPointerCancel={handleRootUp}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width,
        height,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d18',
        border: '1px solid #2a2a3a',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        minWidth: 0,
        minHeight: 0,
        cursor: dragMode === 'anywhere' && draggable ? 'grab' : 'default',
        touchAction: draggable ? 'none' : 'auto',
        ...style,
      }}
    >
      <div
        style={{
          padding: '6px 10px',
          background: '#1a1a2a',
          color: '#aaa',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          borderBottom: '1px solid #2a2a3a',
          userSelect: 'none',
          cursor: dragMode === 'title' && draggable ? 'grab' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
        }}
        onPointerDown={handleTitleDown}
        onPointerMove={handleTitleMove}
        onPointerUp={handleTitleUp}
        onPointerCancel={handleTitleUp}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {closable && (
          <button
            onClick={handleClose}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 0,
              width: 18,
              height: 18,
              lineHeight: '18px',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
            aria-label="close"
          >
            ×
          </button>
        )}
      </div>
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
