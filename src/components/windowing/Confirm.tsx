import { useState } from 'react';
import type { ReactNode, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Window } from './Window';
import type { WindowPosition } from './Window';

export type ConfirmProps = {
  open: boolean;
  title?: ReactNode;
  message: ReactNode;
  okText?: string;
  cancelText?: string;
  closable?: boolean;
  width?: number | string;
  height?: number | string;
  initial?: WindowPosition;
  onOk?: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export function Confirm({
  open,
  title = 'Confirm',
  message,
  okText = 'OK',
  cancelText = 'Cancel',
  closable = true,
  width = 320,
  height = 160,
  initial,
  onOk,
  onCancel,
  onOpenChange,
}: ConfirmProps) {
  const [pos, setPos] = useState<WindowPosition>(initial ?? { x: 0, y: 0 });

  if (!open) return null;

  const close = () => onOpenChange?.(false);

  const handleOk = (e: ReactPointerEvent<HTMLButtonElement> | ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    close();
    onOk?.();
  };
  const handleCancel = (e: ReactPointerEvent<HTMLButtonElement> | ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    close();
    onCancel?.();
  };
  const handleClose = () => {
    close();
    onCancel?.();
  };

  return (
    <Window
      title={title}
      width={width}
      height={height}
      initial={pos}
      draggable
      dragMode="anywhere"
      closable={closable}
      onClose={handleClose}
      onPositionChange={setPos}
    >
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          color: '#ddd',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <div style={{ flex: 1, overflow: 'auto', wordBreak: 'break-word' }}>{message}</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            onPointerDown={(e) => e.stopPropagation()}
            style={btnStyle('#2a2a3a', '#aaa')}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleOk}
            onPointerDown={(e) => e.stopPropagation()}
            style={btnStyle('#3a4a6a', '#fff')}
          >
            {okText}
          </button>
        </div>
      </div>
    </Window>
  );
}

function btnStyle(bg: string, fg: string) {
  return {
    background: bg,
    color: fg,
    border: '1px solid #444',
    borderRadius: 3,
    padding: '6px 14px',
    fontFamily: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    minWidth: 72,
  } as const;
}
