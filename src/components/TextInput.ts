import * as PIXI from 'pixi.js';
import { gsap } from '../framework/gsap-pixi';
import { TXT } from '../framework/ui-helpers';

export interface TextInputOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  placeholder?: string;
  value?: string;
  fontSize?: number;
  color?: number;
  bgColor?: number;
  borderColor?: number;
  focusBorderColor?: number;
  fontFamily?: string;
  password?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export interface TextInputHandle {
  readonly stage: PIXI.Container;
  readonly inputEl: HTMLInputElement;
  focus(): void;
  blur(): void;
  getValue(): string;
  setValue(v: string): void;
  setEnabled(enabled: boolean): void;
  destroy(): void;
  readonly destroyed: boolean;
}

function toCssColor(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export function createTextInput(parent: PIXI.Container, opts: TextInputOptions): TextInputHandle {
  const {
    x, y, width, height,
    placeholder = '',
    value = '',
    fontSize = 14,
    color = 0xe6e6f0,
    bgColor = 0x14141f,
    borderColor = 0x2a2a3a,
    focusBorderColor = 0x4a6a9a,
    fontFamily = 'monospace',
    password = false,
    maxLength,
    onChange,
    onSubmit,
  } = opts;

  const cssColor = toCssColor(color);
  const cssBg = toCssColor(bgColor);
  const cssBorder = toCssColor(borderColor);
  const cssFocusBorder = toCssColor(focusBorderColor);

  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  container.eventMode = 'static';
  container.hitArea = new PIXI.Rectangle(0, 0, width, height);
  container.cursor = 'text';

  const bg = new PIXI.Graphics()
    .roundRect(0, 0, width, height, 6)
    .fill({ color: bgColor })
    .stroke({ width: 1.5, color: borderColor });
  container.addChild(bg);

  const label = new PIXI.Text({
    text: placeholder,
    style: { ...TXT.dim, fontSize, fontFamily, fill: 0x555566 },
  });
  label.x = 10;
  label.y = (height - label.height) / 2;
  label.eventMode = 'none';
  container.addChild(label);

  const text = new PIXI.Text({
    text: value || placeholder,
    style: { fontSize, fill: value ? color : 0x555566, fontFamily, lineHeight: fontSize + 4 },
  });
  text.x = 10;
  text.y = (height - text.height) / 2;
  text.eventMode = 'none';
  container.addChild(text);

  if (password && value) {
    text.text = '\u2022'.repeat(value.length);
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed',
    'z-index:10',
    'padding:0',
    'border-radius:6px',
    'box-sizing:border-box',
    'background:' + cssBg,
    'border:1.5px solid ' + cssBorder,
    'opacity:0',
    'pointer-events:auto',
    'display:flex',
    'align-items:center',
  ].join(';');
  document.body.appendChild(overlay);

  requestAnimationFrame(() => reposition());

  const input = document.createElement('input');
  input.type = password ? 'password' : 'text';
  input.value = value;
  if (maxLength) input.maxLength = maxLength;
  input.style.cssText = [
    'width:100%',
    'height:100%',
    'border:none',
    'outline:none',
    'background:transparent',
    'color:' + cssColor,
    'font-family:' + fontFamily,
    'font-size:' + fontSize + 'px',
    'padding:0 10px',
    'caret-color:' + cssFocusBorder,
    'box-sizing:border-box',
  ].join(';');
  overlay.appendChild(input);

  let focused = false;
  let destroyed = false;

  const reposition = () => {
    const bounds = container.getBounds();
    const canvas = document.querySelector('canvas[data-pixi-ready]');
    if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    overlay.style.left = (cr.left + bounds.x) + 'px';
    overlay.style.top = (cr.top + bounds.y) + 'px';
    overlay.style.width = bounds.width + 'px';
    overlay.style.height = bounds.height + 'px';
  };

  const syncLabel = () => {
    const v = input.value;
    if (password && v) {
      text.text = '\u2022'.repeat(v.length);
    } else {
      text.text = v || placeholder;
    }
    text.style.fill = v ? color : 0x555566;
    label.visible = !v;
  };

  let animTween: gsap.core.Timeline | null = null;

  const focus = () => {
    if (destroyed) return;
    focused = true;
    reposition();
    animTween?.kill();
    animTween = gsap.timeline()
      .to(overlay, { opacity: 1, duration: 0.15, ease: 'power2.out' })
      .to(overlay, { borderColor: cssFocusBorder, duration: 0.2, ease: 'power1.out' }, 0);
    bg.clear()
      .roundRect(0, 0, width, height, 6)
      .fill({ color: bgColor })
      .stroke({ width: 1.5, color: focusBorderColor });
    input.focus();
  };

  const blur = () => {
    if (!focused) return;
    focused = false;
    animTween?.kill();
    animTween = gsap.timeline()
      .to(overlay, { opacity: 0, duration: 0.12, ease: 'power2.in' })
      .to(overlay, { borderColor: cssBorder, duration: 0.15 }, 0);
    bg.clear()
      .roundRect(0, 0, width, height, 6)
      .fill({ color: bgColor })
      .stroke({ width: 1.5, color: borderColor });
    input.blur();
    syncLabel();
  };

  overlay.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (!focused) focus();
  });

  input.addEventListener('focus', () => {
    if (!focused) focus();
  });

  input.addEventListener('input', () => {
    syncLabel();
    onChange?.(input.value);
  });

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit?.(input.value);
      blur();
    }
    if (e.key === 'Escape') {
      blur();
    }
  });

  input.addEventListener('blur', () => {
    if (focused) blur();
  });

  const onResize = () => {
    if (focused) reposition();
  };
  window.addEventListener('resize', onResize);

  container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    focus();
  });

  return {
    stage: container,
    inputEl: input,
    focus,
    blur,
    getValue: () => input.value,
    setValue(v: string) {
      input.value = v;
      syncLabel();
    },
    setEnabled(enabled: boolean) {
      container.eventMode = enabled ? 'static' : 'none';
      container.alpha = enabled ? 1 : 0.5;
      overlay.style.pointerEvents = enabled ? 'auto' : 'none';
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      animTween?.kill();
      window.removeEventListener('resize', onResize);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (container.parent) container.parent.removeChild(container);
      container.destroy({ children: true });
    },
    get destroyed() { return destroyed; },
  };
}
