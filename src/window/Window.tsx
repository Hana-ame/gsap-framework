import { useEffect, useRef, useState, useId } from 'react';
import type {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

export const WINDOW_API_VERSION = '0.1.0';

export type WindowPosition = { x: number; y: number };

export type WindowProps = {
  id?: string;
  title?: ReactNode;
  initial?: WindowPosition;
  width: number | string;
  height: number | string;
  draggable?: boolean;
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

  const handleTitleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    const d = dragRef.current;
    if (!d) return;
    const next = { x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) };
    setPos(next);
    onPositionChange?.(next);
  };
  const handleTitleUp = (e: ReactPointerEvent<HTMLDivElement>) => {
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
  const handleRootDown = () => onFocus?.();

  if (!internalVisible) return null;

  return (
    <div
      data-window-id={internalId}
      data-window-version={WINDOW_API_VERSION}
      className={className}
      onPointerDown={handleRootDown}
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
          cursor: draggable ? 'grab' : 'default',
          touchAction: draggable ? 'none' : 'auto',
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
