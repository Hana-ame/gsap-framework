import { AvdController } from './AvdController';
import { loadSettings, saveSettings } from './AvdSettings';
import type { AvdSettingsData } from './types';
import type { IRenderContainer, IRenderText } from './render/types';

export function buildAvdToolbar(avd: AvdController): void {
  const L = avd.layer;
  if (!L) return;

  const bar = L.createContainer();
  bar.eventMode = 'passive';

  const iconSize = 14;
  const gap = 4;
  const btnW = 52;
  const btnH = 26;
  const startX = avd['_opts']?.screenW ?? 800;
  const startY = 8;
  const fontFamily = avd['_opts']?.fontFamily ?? 'sans-serif';

  const buttons: Array<{ label: string; action: () => void }> = [
    { label: 'Auto', action: () => avd.setAutoMode(!avd.isAutoMode()) },
    { label: 'Skip', action: () => avd.setSkipMode(true) },
    { label: 'Hide', action: () => avd.toggleHideUi() },
    { label: 'Log', action: () => buildAvdBacklog(avd) },
    { label: 'Set', action: () => buildAvdSettings(avd) },
  ];

  buttons.forEach((def, i) => {
    const x = startX - (buttons.length - i) * (btnW + gap);
    const btn = L.createContainer();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = L.createGraphics();
    btn.addChild(bg);

    const label = L.createText({
      text: def.label,
      style: { fontSize: iconSize, fill: 0xffffff, fontFamily },
    });
    label.x = (btnW - (label as any).width) / 2;
    label.y = (btnH - iconSize - 2) / 2;
    btn.addChild(label);

    const render = (hover: boolean) => {
      bg.clear().roundRect(0, 0, btnW, btnH, 6)
        .fill({ color: hover ? 0x3a4a7a : 0x1a1a3a, alpha: 0.85 });
    };
    render(false);

    const el = (btn as any).el ?? btn;
    el.addEventListener?.('pointerdown', (e: any) => { e.stopPropagation(); def.action(); });
    el.addEventListener?.('pointerover', () => render(true));
    el.addEventListener?.('pointerout', () => render(false));
    (btn as any).on?.('pointerdown', (e: any) => { if (e.stopPropagation) e.stopPropagation(); def.action(); });

    btn.x = x;
    btn.y = startY;
    bar.addChild(btn);
  });

  avd.parent.addChild(bar);
}

let _backlogOverlay: IRenderContainer | null = null;
let _backlogTexts: IRenderText[] = [];

export function buildAvdBacklog(avd: AvdController): void {
  if (_backlogOverlay) {
    _backlogOverlay.visible = !_backlogOverlay.visible;
    return;
  }

  const L = avd.layer;
  if (!L) return;

  const overlay = L.createContainer();
  overlay.eventMode = 'static';
  overlay.cursor = 'pointer';
  _backlogOverlay = overlay;

  const bg = L.createGraphics();
  bg.rect(0, 0, avd['_opts']?.screenW ?? 800, avd['_opts']?.screenH ?? 600)
    .fill({ color: 0x000000, alpha: 0.85 });
  overlay.addChild(bg);

  const padding = 40;
  let y = padding + 20;
  const maxW = (avd['_opts']?.screenW ?? 800) - padding * 2;
  const textSize = avd['_opts']?.textSize ?? 24;
  const lineH = textSize + 8;
  const fontFamily = avd['_opts']?.fontFamily ?? 'sans-serif';

  const entries = avd.getBacklog();
  for (const entry of entries) {
    const speaker = entry.speaker ?? '';
    const prefix = speaker ? `${speaker}: ` : '';
    const text = L.createText({
      text: prefix + entry.text,
      style: {
        fontFamily, fontSize: Math.round(textSize * 0.8),
        fill: speaker ? 0x88ccff : 0xcccccc, wordWrap: true, wordWrapWidth: maxW,
      },
    });
    text.x = padding;
    text.y = y;
    overlay.addChild(text);
    _backlogTexts.push(text);
    y += lineH * 2;
  }

  const el = (overlay as any).el ?? overlay;
  el.addEventListener?.('pointerdown', () => { overlay.visible = false; });
  (overlay as any).on?.('pointerdown', () => { overlay.visible = false; });

  avd.parent.addChild(overlay);
}

export function hideAvdBacklog(): void {
  if (_backlogOverlay) {
    _backlogOverlay.visible = false;
  }
}

let _settingsOverlay: IRenderContainer | null = null;

export function buildAvdSettings(avd: AvdController): void {
  if (_settingsOverlay) {
    _settingsOverlay.visible = !_settingsOverlay.visible;
    return;
  }

  const L = avd.layer;
  if (!L) return;

  const screenW = avd['_opts']?.screenW ?? 800;
  const screenH = avd['_opts']?.screenH ?? 600;
  const fontFamily = avd['_opts']?.fontFamily ?? 'sans-serif';
  const overlay = L.createContainer();
  overlay.eventMode = 'static';
  _settingsOverlay = overlay;

  const bg = L.createGraphics();
  bg.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.7 });
  overlay.addChild(bg);

  const panelW = 360;
  const panelH = 280;
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panel = L.createGraphics();
  panel.roundRect(0, 0, panelW, panelH, 12).fill({ color: 0x0a0a1e, alpha: 0.95 });
  panel.x = px;
  panel.y = py;
  overlay.addChild(panel);

  const settings = loadSettings();
  const rowH = 44;
  const startRowY = py + 50;

  const rows: Array<{ label: string; key: keyof AvdSettingsData; min: number; max: number; step: number }> = [
    { label: 'BGM Volume', key: 'bgmVolume', min: 0, max: 1, step: 0.1 },
    { label: 'SFX Volume', key: 'sfxVolume', min: 0, max: 1, step: 0.1 },
    { label: 'Text Speed', key: 'textSpeed', min: 5, max: 200, step: 5 },
    { label: 'Auto Delay', key: 'autoModeDelay', min: 500, max: 10000, step: 500 },
  ];

  const fmt = (key: string, v: number): string => {
    if (key === 'bgmVolume' || key === 'sfxVolume') return `${Math.round(v * 100)}%`;
    if (key === 'textSpeed') return `${v} cps`;
    if (key === 'autoModeDelay') return `${v}ms`;
    return String(v);
  };

  const applySetting = (key: string, value: number) => {
    const s = loadSettings();
    (s as any)[key] = value;
    saveSettings(s);
    avd.applySettings(s);
  };

  rows.forEach((row, i) => {
    const ry = startRowY + i * rowH;

    const lbl = L.createText({
      text: row.label,
      style: { fontSize: 15, fill: 0x88ccff, fontFamily },
    });
    lbl.x = px + 20;
    lbl.y = ry;
    overlay.addChild(lbl);

    const val = L.createText({
      text: fmt(row.key, settings[row.key]),
      style: { fontSize: 14, fill: 0xffffff, fontFamily },
    });
    val.x = px + panelW - 80;
    val.y = ry;
    overlay.addChild(val);

    const decBtn = makeMiniBtn(L, px + 20, ry + 22, '−', () => {
      const cur = settings[row.key];
      const nv = Math.max(row.min, +(cur - row.step).toFixed(2));
      (settings as any)[row.key] = nv;
      val.text = fmt(row.key, nv);
      applySetting(row.key, nv);
    });
    overlay.addChild(decBtn);

    const incBtn = makeMiniBtn(L, px + 50, ry + 22, '+', () => {
      const cur = settings[row.key];
      const nv = Math.min(row.max, +(cur + row.step).toFixed(2));
      (settings as any)[row.key] = nv;
      val.text = fmt(row.key, nv);
      applySetting(row.key, nv);
    });
    overlay.addChild(incBtn);
  });

  const title = L.createText({
    text: 'Settings',
    style: { fontSize: 20, fill: 0xffffff, fontFamily },
  });
  title.x = px + 20;
  title.y = py + 16;
  overlay.addChild(title);

  const closeBtn = makeMiniBtn(L, px + panelW - 36, py + 12, '✕', () => { overlay.visible = false; });
  overlay.addChild(closeBtn);

  const el = (overlay as any).el ?? overlay;
  el.addEventListener?.('pointerdown', (e: any) => {
    if (e.stopPropagation) e.stopPropagation();
  });

  avd.parent.addChild(overlay);
}

export function hideAvdSettings(): void {
  if (_settingsOverlay) _settingsOverlay.visible = false;
}

function makeMiniBtn(L: any, x: number, y: number, text: string, onClick: () => void): IRenderContainer {
  const sz = 22;
  const btn = L.createContainer();
  btn.eventMode = 'static';
  btn.cursor = 'pointer';

  const bg = L.createGraphics();
  bg.roundRect(0, 0, sz, sz, 4).fill({ color: 0x3a4a7a, alpha: 0.9 });
  btn.addChild(bg);

  const label = L.createText({
    text,
    style: { fontSize: 14, fill: 0xffffff },
  });
  label.x = (sz - (label as any).width) / 2;
  label.y = (sz - 14) / 2;
  btn.addChild(label);

  btn.x = x;
  btn.y = y;

  const el = (btn as any).el ?? btn;
  el.addEventListener?.('pointerdown', (e: any) => { e.stopPropagation(); onClick(); });
  (btn as any).on?.('pointerdown', (e: any) => { if (e.stopPropagation) e.stopPropagation(); onClick(); });
  return btn;
}
