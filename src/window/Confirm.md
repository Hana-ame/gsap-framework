# Confirm

High-level HTML dialog built on top of [`Window`](./Window.md) with `dragMode="anywhere"`.

## What it is

`Confirm` is a one-line dialog: a title, a message body, and `OK` / `Cancel` buttons. It composes a `Window` configured for full-surface dragging, and wires up the buttons so dragging never fires when the user clicks them.

## When to use it

- "Are you sure you want to X?" prompts
- Save / discard / overwrite choices
- Any one-shot decision that needs a clean visual interruption

For multi-field forms, custom layouts, or tabs, use [`Window`](./Window.md) directly.

## API

```ts
type ConfirmProps = {
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
```

| prop            | meaning                                                          |
| --------------- | ---------------------------------------------------------------- |
| `open`          | Controlled visibility. Mount with `false`, set `true` to show.   |
| `onOpenChange`  | Called with `false` when the dialog wants to close (X, OK, Cancel). Pass `setOpen` for default behavior. |
| `onOk`          | Called when OK button is pressed, after `onOpenChange(false)`.   |
| `onCancel`      | Called when Cancel button or X is pressed, after `onOpenChange(false)`. |
| `title`         | Title bar text. Default: `'Confirm'`.                            |
| `message`       | Body content. Can be string or any `ReactNode`.                  |
| `okText`        | OK button label. Default: `'OK'`.                                |
| `cancelText`    | Cancel button label. Default: `'Cancel'`.                        |
| `closable`      | Show the X button. Default: `true`. X behaves like Cancel.       |
| `width/height`  | Window size. Default: `320 × 160`.                               |
| `initial`       | Initial position `{x, y}`. Default: `{x: 0, y: 0}`.              |

## Usage

```tsx
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>Delete</button>

<Confirm
  open={open}
  onOpenChange={setOpen}
  title="Delete item?"
  message="This cannot be undone."
  onOk={() => doDelete()}
  onCancel={() => console.log('cancelled')}
/>
```

## Why `dragMode="anywhere"`?

A dialog usually has no other interactive area except its buttons. Forcing the user to drag from a thin title bar feels wrong. `dragMode="anywhere"` lets them grab the dialog from any non-button region.

## How button + drag coexist

The `Window` root catches `pointerdown` to start a drag in `anywhere` mode. To keep buttons clickable, every button handler does:

```ts
onPointerDown={(e) => e.stopPropagation()}
```

This stops the bubble phase, so the root drag handler never runs and `setPointerCapture` is never called. The button's normal `onClick` then fires on `pointerup`.

`onFocus` still works because it lives on `onPointerDownCapture`, which runs before bubble-phase `stopPropagation`.

## What it does NOT do

- No focus trap / focus restoration (use a real a11y library if you need it)
- No portal / overlay (it lives in the parent's stacking context)
- No animation in / out
- No keyboard ESC to close (X / Cancel button only)
- No theming (hard-coded dark style)

These are all trade-offs in favor of staying a thin wrapper. If you need any of them, copy this file and customize.
