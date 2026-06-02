# ComponentConfirmDisplay

Showcase for `createConfirm()` from `components/PixiConfirm.ts`. Four variants demonstrating message text, image, multi-button, and `keepOpen`.

## Variants

1. **text** — message only, default OK / Cancel buttons.
2. **image** — image + message; image and message are mutually exclusive (image wins).
3. **3 buttons** — Save / Don't Save / Cancel.
4. **keepOpen** — `keepOpen: true`; the confirm does not auto-close on click. Demo: button stays open for 3 clicks then closes.

## API

```ts
createConfirm({
  parent: SubCanvas;
  title: string;
  message?: string;
  image?: string;
  imageMaxWidth?: number;
  imageMaxHeight?: number;
  width: number;
  height: number;
  x?: number;
  y?: number;
  draggable?: boolean;       // default true
  dragMode?: 'title' | 'anywhere' | 'none';
  closable?: boolean;        // default true
  okText?: string;
  cancelText?: string;
  buttons?: PixiConfirmButton[];
  onResult?: (result: PixiConfirmResult, confirm: PixiConfirm) => void;
  onClose?: () => void;
})
```

`result` is `'ok'` if the clicked button label matches `okText`, `'cancel'` if it matches `cancelText`, otherwise the raw label string.
