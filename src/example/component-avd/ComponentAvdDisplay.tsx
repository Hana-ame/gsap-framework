// Example: AVD (Android Virtual Device) display emulator component
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvas } from '@framework';
import { makeInfoPanel } from '@components';
import { AvdController, type AvdLine, type AvdState, type AvdOptions, type AvdTextSegment } from '../../components';

const CONTROL_H = 80;
const STATUS_H = 28;
const BTN_BG = 0x1a1a2e;
const BTN_ACTIVE_BG = 0x4a6a9a;

type Theme = 'dark' | 'light' | 'sepia';

const THEMES: Record<Theme, { label: string; options: Partial<AvdOptions> }> = {
  dark: {
    label: 'Dark',
    options: {
      boxBg: 0x0a0a1e,
      boxBgAlpha: 0.92,
      textColor: 0xffffff,
      nameColor: 0x88ccff,
      arrowColor: 0x88ccff,
    },
  },
  light: {
    label: 'Light',
    options: {
      boxBg: 0xf4f4ee,
      boxBgAlpha: 0.94,
      textColor: 0x1a1a1a,
      nameColor: 0x3a5a8a,
      arrowColor: 0x3a5a8a,
    },
  },
  sepia: {
    label: 'Sepia',
    options: {
      boxBg: 0x3a2a1a,
      boxBgAlpha: 0.94,
      textColor: 0xf4e4c8,
      nameColor: 0xe8a868,
      arrowColor: 0xe8a868,
    },
  },
};

interface DemoRefs {
  avd: AvdController | null;
  controlRegion: SubCanvas | null;
  statusRegion: SubCanvas | null;
  avdRegion: SubCanvas | null;
  statusText: PIXI.Text | null;
  themeButtons: Map<Theme, PIXI.Container>;
  rosterModeButton: PIXI.Container | null;
  lineCount: number;
}

function makeAvatar(
  name: string,
  skinColor: number,
  hairColor: number,
  shirtColor: number,
  size: number,
): PIXI.Container {
  const wrap = new PIXI.Container();
  wrap.label = `avatar:${name}`;

  const head = new PIXI.Graphics().circle(0, -size * 0.35, size * 0.18).fill({ color: skinColor });
  head.stroke({ width: 2, color: 0x0a0a14, alpha: 0.6 });
  wrap.addChild(head);

  const hair = new PIXI.Graphics().arc(0, -size * 0.35, size * 0.18, Math.PI, 0).fill({ color: hairColor });
  hair.stroke({ width: 1, color: 0x0a0a14, alpha: 0.5 });
  wrap.addChild(hair);

  const eyeY = -size * 0.36;
  const eyeOffsetX = size * 0.06;
  const leftEye = new PIXI.Graphics().circle(-eyeOffsetX, eyeY, size * 0.012).fill({ color: 0x0a0a14 });
  const rightEye = new PIXI.Graphics().circle(eyeOffsetX, eyeY, size * 0.012).fill({ color: 0x0a0a14 });
  wrap.addChild(leftEye, rightEye);

  const mouth = new PIXI.Graphics().arc(0, -size * 0.30, size * 0.04, 0, Math.PI).stroke({
    color: 0x0a0a14,
    width: 1.5,
    alpha: 0.7,
  });
  wrap.addChild(mouth);

  const body = new PIXI.Graphics()
    .roundRect(-size * 0.16, -size * 0.15, size * 0.32, size * 0.35, size * 0.04)
    .fill({ color: shirtColor });
  body.stroke({ width: 2, color: 0x0a0a14, alpha: 0.6 });
  wrap.addChild(body);

  return wrap;
}

function avatarToTexture(renderer: PIXI.Renderer, avatar: PIXI.Container): PIXI.Texture {
  return renderer.generateTexture(avatar);
}

function makeMoonIcon(size: number, color: number = 0xe8d8a0): PIXI.Container {
  const wrap = new PIXI.Container();
  const moon = new PIXI.Graphics().circle(0, 0, size / 2).fill({ color });
  moon.stroke({ width: 1.5, color: 0x0a0a14, alpha: 0.5 });
  wrap.addChild(moon);
  const crater1 = new PIXI.Graphics().circle(-size * 0.15, -size * 0.1, size * 0.08).fill({ color: 0x0a0a14, alpha: 0.18 });
  const crater2 = new PIXI.Graphics().circle(size * 0.18, size * 0.05, size * 0.05).fill({ color: 0x0a0a14, alpha: 0.15 });
  const crater3 = new PIXI.Graphics().circle(-size * 0.05, size * 0.2, size * 0.04).fill({ color: 0x0a0a14, alpha: 0.12 });
  wrap.addChild(crater1, crater2, crater3);
  return wrap;
}

function makeIconTexture(renderer: PIXI.Renderer, icon: PIXI.Container): PIXI.Texture {
  return renderer.generateTexture(icon);
}

function makeButton(label: string, w: number, h: number, onClick: () => void, bg: number = BTN_BG): PIXI.Container {
  const btn = new PIXI.Container();
  const g = new PIXI.Graphics().roundRect(0, 0, w, h, 6).fill({ color: bg, alpha: 0.92 });
  g.stroke({ width: 1.5, color: 0x446 });
  btn.addChild(g);
  const t = new PIXI.Text({
    text: label,
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  t.anchor.set(0.5);
  t.x = w / 2;
  t.y = h / 2;
  btn.addChild(t);
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
  btn.on('pointerdown', onClick);
  return btn;
}

function makeStepper(
  label: string,
  value: number,
  onChange: (v: number) => void,
  min: number,
  max: number,
  btnBg: number = BTN_BG,
): PIXI.Container {
  const wrap = new PIXI.Container();
  const lbl = new PIXI.Text({
    text: label,
    style: { fontSize: 10, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  lbl.x = 0;
  lbl.y = 2;
  wrap.addChild(lbl);

  const btnW = 32;
  const btnH = 28;
  const valW = 36;

  let current = value;
  const valText = new PIXI.Text({
    text: String(current),
    style: { fontSize: 12, fill: 0xffffff, fontFamily: 'monospace' },
  });
  valText.anchor.set(0.5);
  valText.x = btnW + valW / 2;
  valText.y = 18 + btnH / 2;
  wrap.addChild(valText);

  const minus = makeButton('-', btnW, btnH, () => {
    if (current > min) {
      current -= 1;
      valText.text = String(current);
      onChange(current);
    }
  }, btnBg);
  minus.x = 0;
  minus.y = 18;
  wrap.addChild(minus);

  const plus = makeButton('+', btnW, btnH, () => {
    if (current < max) {
      current += 1;
      valText.text = String(current);
      onChange(current);
    }
  }, btnBg);
  plus.x = btnW + valW;
  plus.y = 18;
  wrap.addChild(plus);

  return wrap;
}

const AVATAR_SIZE = 280;

interface BuiltAssets {
  alicePortrait: PIXI.Texture;
  bobPortrait: PIXI.Texture;
  carolPortrait: PIXI.Texture;
  moonIcon: PIXI.Texture;
  script: AvdLine[];
}

function buildAssets(renderer: PIXI.Renderer): BuiltAssets {
  const aliceAvatar = makeAvatar('Alice', 0xf4c89a, 0x4a2a1a, 0x5a8acc, AVATAR_SIZE);
  const bobAvatar = makeAvatar('Bob', 0xe8b888, 0x1a1a1a, 0x6a5a3a, AVATAR_SIZE);
  const carolAvatar = makeAvatar('Carol', 0xd8a888, 0x8a4a2a, 0x4a8a5a, AVATAR_SIZE);
  const aliceTex = avatarToTexture(renderer, aliceAvatar);
  const bobTex = avatarToTexture(renderer, bobAvatar);
  const carolTex = avatarToTexture(renderer, carolAvatar);
  aliceAvatar.destroy();
  bobAvatar.destroy();
  carolAvatar.destroy();

  const moon = makeMoonIcon(64);
  const moonTex = makeIconTexture(renderer, moon);
  moon.destroy();

  const inlineWithMoon: AvdTextSegment[] = [
    { kind: 'text', text: 'Alice 抬头，看见了 ' },
    { kind: 'image', texture: moonTex, width: 32, height: 32 },
    { kind: 'text', text: ' 这轮明月。' },
  ];

  const longText: AvdTextSegment[] = [
    { kind: 'text', text: '文字支持自动排版。如果一行放不下，' },
    { kind: 'text', text: 'Avd 会自动换行。每个字符、每张图片都会算进自动排版的逻辑里。' },
  ];

  const script: AvdLine[] = [
    { speaker: 'Narrator', text: '深夜的实验室里，只有服务器的嗡嗡声。' },
    { speaker: 'Alice', text: '终于编译通过了！' },
    { speaker: 'Alice', text: inlineWithMoon },
    { speaker: 'Bob', text: '不对，那是平面几何。这里是相对论。' },
    { speaker: 'Bob', text: longText },
    { speaker: 'Alice', text: '啊，对。我搞混了。' },
    { speaker: 'Carol', text: '我能加入吗？' },
    { speaker: 'Bob', text: '当然。' },
    { speaker: 'Alice', text: 'Carol！你也来了。' },
    { speaker: 'Narrator', text: '对话结束。点 Restart 重新开始。' },
  ];

  return { alicePortrait: aliceTex, bobPortrait: bobTex, carolPortrait: carolTex, moonIcon: moonTex, script };
}

function buildControlPanel(
  refs: DemoRefs,
  setTheme: (t: Theme) => void,
  setSpeed: (n: number) => void,
  setRestartKey: Dispatch<SetStateAction<number>>,
  setRosterMode: (m: 'speaker-only' | 'persistent') => void,
): void {
  if (!refs.controlRegion) return;
  const stage = refs.controlRegion.stage;
  stage.removeChildren();
  refs.themeButtons.clear();

  let x = 12;
  const y0 = 8;

  const themes: Theme[] = ['dark', 'light', 'sepia'];
  for (const t of themes) {
    const btn = makeButton(THEMES[t].label, 56, 26, () => setTheme(t), BTN_BG);
    btn.x = x;
    btn.y = y0;
    stage.addChild(btn);
    refs.themeButtons.set(t, btn);
    x += 64;
  }
  x += 16;

  const speedStepper = makeStepper('Speed (cps)', 30, setSpeed, 1, 100);
  speedStepper.x = x;
  speedStepper.y = y0;
  stage.addChild(speedStepper);
  x += 80;

  const rosterModeBtn = makeButton('Mode: solo', 86, 26, () => {
    if (refs.avd) {
      const next = refs.avd.getRosterMode() === 'speaker-only' ? 'persistent' : 'speaker-only';
      setRosterMode(next);
    }
  }, 0x4a3a6a);
  rosterModeBtn.x = x;
  rosterModeBtn.y = y0;
  stage.addChild(rosterModeBtn);
  refs.rosterModeButton = rosterModeBtn;
  x += 94;

  const restartBtn = makeButton('Restart', 64, 26, () => setRestartKey((k) => k + 1), 0x6a3a3a);
  restartBtn.x = x;
  restartBtn.y = y0;
  stage.addChild(restartBtn);
  x += 72;

  const skipBtn = makeButton('Skip to End', 80, 26, () => {
    if (refs.avd) refs.avd.goTo(refs.lineCount - 1);
  }, 0x3a4a6a);
  skipBtn.x = x;
  skipBtn.y = y0;
  stage.addChild(skipBtn);
}

function updateThemeButtonVisuals(refs: DemoRefs, theme: Theme): void {
  for (const [t, btn] of refs.themeButtons.entries()) {
    const g = btn.children[0] as PIXI.Graphics;
    if (!g) continue;
    g.clear();
    g.roundRect(0, 0, 56, 26, 6).fill({ color: t === theme ? BTN_ACTIVE_BG : BTN_BG, alpha: 0.92 });
    g.stroke({ width: 1.5, color: t === theme ? 0x88ccff : 0x446 });
  }
}

function buildStatusBar(refs: DemoRefs): void {
  if (!refs.statusRegion) return;
  const stage = refs.statusRegion.stage;
  stage.removeChildren();
  const W = refs.statusRegion.bounds.width;

  const bg = new PIXI.Graphics().rect(0, 0, W, STATUS_H).fill({ color: 0x14141f, alpha: 0.6 });
  bg.eventMode = 'none';
  stage.addChild(bg);

  const statusText = new PIXI.Text({
    text: '',
    style: { fontSize: 12, fill: 0xaaaacc, fontFamily: 'monospace' },
  });
  statusText.x = 12;
  statusText.y = 8;
  stage.addChild(statusText);
  refs.statusText = statusText;

  const hintText = new PIXI.Text({
    text: 'Click anywhere to advance \u00b7 Speed live \u00b7 Theme live',
    style: { fontSize: 10, fill: 0x666688, fontFamily: 'monospace' },
  });
  hintText.anchor.set(1, 0);
  hintText.x = W - 12;
  hintText.y = 10;
  stage.addChild(hintText);
}

function updateStatusText(refs: DemoRefs, state: AvdState, lineIndex: number): void {
  if (!refs.statusText) return;
  refs.statusText.text = `Line ${lineIndex + 1} / ${refs.lineCount}   \u00b7   state: ${state}`;
}

export function ComponentAvdDisplay() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [speed, setSpeed] = useState(30);
  const [restartKey, setRestartKey] = useState(0);
  const [rosterMode, setRosterModeState] = useState<'speaker-only' | 'persistent'>('speaker-only');
  const [lineIndex, setLineIndex] = useState(0);
  const [avdState, setAvdState] = useState<AvdState>('typing');

  const refsRef = useRef<DemoRefs | null>(null);
  const avdRef = useRef<AvdController | null>(null);
  const themeRef = useRef(theme);
  const speedRef = useRef(speed);
  const rosterModeRef = useRef(rosterMode);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    rosterModeRef.current = rosterMode;
    avdRef.current?.setRosterMode(rosterMode);
    if (refsRef.current?.rosterModeButton) {
      const g = refsRef.current.rosterModeButton.children[0] as PIXI.Graphics;
      const t = refsRef.current.rosterModeButton.children[1] as PIXI.Text;
      if (g) {
        g.clear();
        g.roundRect(0, 0, 86, 26, 6).fill({ color: rosterMode === 'persistent' ? BTN_ACTIVE_BG : 0x4a3a6a, alpha: 0.92 });
        g.stroke({ width: 1.5, color: rosterMode === 'persistent' ? 0x88ccff : 0x446 });
      }
      if (t) t.text = `Mode: ${rosterMode === 'persistent' ? 'group' : 'solo'}`;
    }
  }, [rosterMode]);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const avdH = H - CONTROL_H - STATUS_H;

    const refs: DemoRefs = {
      avd: null,
      controlRegion: null,
      statusRegion: null,
      avdRegion: null,
      statusText: null,
      themeButtons: new Map(),
      rosterModeButton: null,
      lineCount: 0,
    };
    refsRef.current = refs;

    const destroyApp = startPixiApp((proxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });
      makeInfoPanel(root, {
        title: 'AVD 视觉小说',
        lines: [
          '用途：视觉小说对话系统，支持打字机效果、角色头像和内联图片。',
          '测试方法：点击推进对话，使用控件调整速度、跳转至指定行。',
          '预期效果：文字逐字打出，头像淡入淡出，推进触达下一行，内联图片正确显示。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      refs.controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      refs.statusRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: STATUS_H });
      refs.avdRegion = proxy.createRegion({ x: 0, y: CONTROL_H + STATUS_H, width: W, height: avdH });

      const renderer = proxy.renderer;
      const assets = buildAssets(renderer);
      refs.lineCount = assets.script.length;

      if (refs.controlRegion) buildControlPanel(refs, setTheme, setSpeed, setRestartKey, (m) => setRosterModeState(m));
      if (refs.statusRegion) buildStatusBar(refs);
      updateStatusText(refs, 'typing', 0);
      updateThemeButtonVisuals(refs, themeRef.current);

      if (refs.avdRegion) {
        refs.avd = new AvdController(refs.avdRegion.stage, refs.avdRegion.ticker, {
          screenW: W,
          screenH: avdH,
          ...THEMES[themeRef.current].options,
          typewriterSpeed: speedRef.current,
          boxY: avdH - 200 - 40,
          portraitY: avdH - 560 - 20,
          onStateChange: (s) => setAvdState(s),
          onLineEnter: (_line, idx) => setLineIndex(idx),
        });
        refs.avd.setRoster({
          Alice: { pos: 'left', texture: assets.alicePortrait },
          Bob: { pos: 'right', texture: assets.bobPortrait },
          Carol: { pos: 'center', texture: assets.carolPortrait },
        });
        refs.avd.setRosterMode(rosterModeRef.current);
        refs.avd.setScript(assets.script);
        avdRef.current = refs.avd;
      }
    });

    return () => {
      if (refs.avd) refs.avd.destroy();
      avdRef.current = null;
      refsRef.current = null;
      destroyApp();
    };
  }, [restartKey]);

  useEffect(() => {
    avdRef.current?.applyOptions(THEMES[theme].options);
    if (refsRef.current) updateThemeButtonVisuals(refsRef.current, theme);
  }, [theme]);

  useEffect(() => {
    avdRef.current?.setTypewriterSpeed(speed);
  }, [speed]);

  useEffect(() => {
    if (refsRef.current) updateStatusText(refsRef.current, avdState, lineIndex);
  }, [avdState, lineIndex]);

  return <></>;
}

ComponentAvdDisplay.head = {
  title: 'Component: AVD',
  description:
    'Visual novel dialogue component: textbox + portraits + typewriter text + fade in/out + speed control + CJK/English + Unicode math. Pure PIXI.js UI, no DOM overlay.',
};
