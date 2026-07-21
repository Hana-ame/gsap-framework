/**
 * AVD 分支选择示例
 *
 * 演示功能：
 *   1. 多章节剧本加载 — 从独立的 ch*.ts 文件静态导入
 *   2. 分支选项 — 引擎显示选项按钮，点击后跳转到对应 segment
 *   3. 多结局 — 三个不同结局，end:true 正确停止
 *   4. 运行时加载（备选） — 修改 SCRIPT_BASE + loadRemote() 即可从远程 JSON 加载
 *
 * 架构说明：
 *   - 剧本数据（ch1.ts / ch2.ts / ch3a.ts / ch3b.ts）是纯数据文件，
 *     不依赖框架类型，可托管在任何位置。
 *   - 引擎通过 segment 名导航，不依赖硬编码的行号。
 *     每个 segment 在整个剧本中唯一，由 buildSegmentMap() 自动索引。
 *   - parseScript() 将原始 JSON 解析为 AvdLine[]（含 PIXI.Texture），
 *     之后传给 AvdController.setScript()。
 *
 * 关键类型：
 *   AvdLine       — 一行对话：speaker / text / choices / segment / end
 *   AvdChoice     — 一个选项：text（显示文字）+ targetSegment（跳转段落名）
 *   AvdScriptJSON — 完整的剧本 JSON 格式，含 meta / roster / lines
 *   AvdAssetResolver — 纹理加载器，将 textureKey 映射为 PIXI.Texture
 *
 * 如需将剧本托管到远程服务器：
 *   1. 将 ch*.ts 导出为 JSON 或 JS 文件部署到 CDN
 *   2. 在 SCRIPT_BASE 填入远程 URL
 *   3. 调用 loadRemote() 代替静态导入
 */
import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { startPixiApp, type SubCanvasProxy } from '@framework';
import { makeInfoPanel } from '@components';
import { AvdController, AudioManager, parseScript, type AvdScriptJSON, type AvdAssetResolver, type AvdSettingsData, type ParticlePreset, type NotifType, type TextEffect, loadSettings, saveSettings } from '../../components';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3A } from './ch3a';
import { CH3B } from './ch3b';
import { AvdSettingsPanel } from './AvdSettingsPanel';

// ---------------------------------------------------------------- 配置
const CONTROL_H = 80;
const BTN_BG = 0x1a1a2e;
const AVATAR_SIZE = 280;

// ---------------------------------------------------------------- 剧本数据
// 静态导入：所有章节在构建时打包，运行时无网络请求。
// 替代方案：使用 loadRemote()，将 SCRIPT_BASE 改为远程地址，
// 例如 'https://cdn.example.com/scripts/avd-choices/'。
const CHAPTER_LINES: AvdScriptJSON['lines'][] = [
  [...CH1.lines] as AvdScriptJSON['lines'],
  [...CH2.lines] as AvdScriptJSON['lines'],
  [...CH3A.lines] as AvdScriptJSON['lines'],
  [...CH3B.lines] as AvdScriptJSON['lines'],
];

// ---------------------------------------------------------------- UI 辅助

function makeAvatar(name: string, skinColor: number, hairColor: number, shirtColor: number, size: number): PIXI.Container {
  const wrap = new PIXI.Container();
  wrap.label = `avatar:${name}`;

  // 头部
  const head = new PIXI.Graphics().circle(0, -size * 0.35, size * 0.18).fill({ color: skinColor });
  head.stroke({ width: 2, color: 0x0a0a14, alpha: 0.6 });
  wrap.addChild(head);

  // 头发（半圆）
  const hair = new PIXI.Graphics().arc(0, -size * 0.35, size * 0.18, Math.PI, 0).fill({ color: hairColor });
  hair.stroke({ width: 1, color: 0x0a0a14, alpha: 0.5 });
  wrap.addChild(hair);

  // 眼睛
  const eyeY = -size * 0.36;
  const eyeOffsetX = size * 0.06;
  wrap.addChild(
    new PIXI.Graphics().circle(-eyeOffsetX, eyeY, size * 0.012).fill({ color: 0x0a0a14 }),
    new PIXI.Graphics().circle(eyeOffsetX, eyeY, size * 0.012).fill({ color: 0x0a0a14 }),
  );

  // 嘴巴（弧线）
  const mouth = new PIXI.Graphics().arc(0, -size * 0.30, size * 0.04, 0, Math.PI).stroke({ color: 0x0a0a14, width: 1.5, alpha: 0.7 });
  wrap.addChild(mouth);

  // 身体
  const body = new PIXI.Graphics().roundRect(-size * 0.16, -size * 0.15, size * 0.32, size * 0.35, size * 0.04).fill({ color: shirtColor });
  body.stroke({ width: 2, color: 0x0a0a14, alpha: 0.6 });
  wrap.addChild(body);

  return wrap;
}

function avatarToTexture(renderer: PIXI.Renderer, avatar: PIXI.Container): PIXI.Texture {
  return renderer.generateTexture(avatar);
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

function buildAssets(renderer: PIXI.Renderer) {
  // 程序化生成角色头像纹理（含多表情）
  const hero = makeAvatar('Hero', 0xf4c89a, 0x3a2a1a, 0x5a8acc, AVATAR_SIZE);
  const heroTex = avatarToTexture(renderer, hero);
  hero.destroy();

  const heroHappy = makeAvatar('Hero', 0xf4c89a, 0x3a2a1a, 0x5a8acc, AVATAR_SIZE);
  (heroHappy.children[3] as PIXI.Graphics).clear()
    .arc(0, -AVATAR_SIZE * 0.30, AVATAR_SIZE * 0.04, 0, Math.PI)
    .stroke({ color: 0x0a0a14, width: 1.5, alpha: 0.7 });
  const heroHappyTex = avatarToTexture(renderer, heroHappy);
  heroHappy.destroy();

  const heroSad = makeAvatar('Hero', 0xf4c89a, 0x3a2a1a, 0x5a8acc, AVATAR_SIZE);
  (heroSad.children[3] as PIXI.Graphics).clear()
    .arc(0, -AVATAR_SIZE * 0.28, AVATAR_SIZE * 0.045, Math.PI, Math.PI * 2)
    .stroke({ color: 0x0a0a14, width: 1.5, alpha: 0.7 });
  const heroSadTex = avatarToTexture(renderer, heroSad);
  heroSad.destroy();

  // 程序化生成场景背景纹理
  const W = window.innerWidth, H = window.innerHeight;
  const bgCave = makeBgTexture(renderer, W, H, 0x0a0a0a, 0x1a1a2e, 0x88aaaa, (g) => {
    g.circle(80, H * 0.3, 20).fill({ color: 0xaaaaaa, alpha: 0.3 });
    g.circle(120, H * 0.25, 12).fill({ color: 0xcccccc, alpha: 0.2 });
  });
  const bgTreasure = makeBgTexture(renderer, W, H, 0x1a0a00, 0x3a2a0a, 0xffcc66, (g) => {
    for (let i = 0; i < 12; i++) {
      const x = 60 + Math.random() * (W - 120);
      const y = 60 + Math.random() * (H * 0.6);
      g.poly(coinShape(x, y, 6 + Math.random() * 8)).fill({ color: 0xffdd44, alpha: 0.3 + Math.random() * 0.4 });
    }
  });
  const bgRune = makeBgTexture(renderer, W, H, 0x000a1a, 0x0a1a3a, 0x4488ff, (g) => {
    for (let i = 0; i < 6; i++) {
      const x = 100 + Math.random() * (W - 200);
      const y = 80 + Math.random() * (H * 0.5);
      g.circle(x, y, 4 + Math.random() * 8).fill({ color: 0x66aaff, alpha: 0.5 + Math.random() * 0.5 });
    }
  });
  const bgGarden = makeBgTexture(renderer, W, H, 0x0a1a0a, 0x1a3a1a, 0x66ff88, (g) => {
    for (let i = 0; i < 8; i++) {
      const x = 80 + Math.random() * (W - 160);
      const y = H * 0.3 + Math.random() * (H * 0.5);
      const r = 12 + Math.random() * 20;
      g.circle(x, y, r).fill({ color: [0xcc4488, 0x44cc88, 0xcccc44, 0xcc8844][i % 4], alpha: 0.4 + Math.random() * 0.3 });
    }
  });

  return { heroTex, heroHappyTex, heroSadTex, bgCave, bgTreasure, bgRune, bgGarden };
}

function makeBgTexture(
  renderer: PIXI.Renderer, w: number, h: number,
  color1: number, color2: number, accent: number,
  drawExtra: (g: PIXI.Graphics) => void,
): PIXI.Texture {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  // 垂直渐变背景
  const steps = 32;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = ((color1 >> 16) & 0xff) * (1 - t) + ((color2 >> 16) & 0xff) * t;
    const g_ = ((color1 >> 8) & 0xff) * (1 - t) + ((color2 >> 8) & 0xff) * t;
    const b = (color1 & 0xff) * (1 - t) + (color2 & 0xff) * t;
    g.rect(0, (h / steps) * i, w, Math.ceil(h / steps) + 1)
      .fill({ color: (Math.round(r) << 16) | (Math.round(g_) << 8) | Math.round(b) });
  }
  c.addChild(g);

  // 抽象装饰
  const decor = new PIXI.Graphics();
  decor.stroke({ color: accent, width: 1, alpha: 0.15 });
  decor.moveTo(0, h * 0.4).lineTo(w, h * 0.4);
  decor.moveTo(0, h * 0.7).lineTo(w, h * 0.7);
  c.addChild(decor);

  if (drawExtra) {
    const extra = new PIXI.Graphics();
    drawExtra(extra);
    c.addChild(extra);
  }

  const tex = renderer.generateTexture(c);
  c.destroy({ children: true });
  return tex;
}

function coinShape(cx: number, cy: number, r: number): number[] {
  const pts: number[] = [];
  for (let a = 0; a <= Math.PI * 2; a += Math.PI / 6) {
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6);
  }
  return pts;
}

// ---------------------------------------------------------------- React 组件

export function ComponentAvdChoicesDisplay() {
  const [restartKey, setRestartKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [backlogData, setBacklogData] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AvdSettingsData>(loadSettings);

  const avdRef = useRef<AvdController | null>(null);

  const append = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 12));

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const avdH = H - CONTROL_H;

    const destroyApp = startPixiApp((proxy: SubCanvasProxy) => {
      const root = proxy.createRegion({ x: 0, y: 0, width: W, height: H });

      // 右上角信息面板
      makeInfoPanel(root, {
        title: 'AVD 分支选择',
        lines: [
          '用途：演示分支对话系统——多个选择导致不同剧情走向。',
          '测试方法：点击推进对话，在分支处选择不同选项，观察剧情分歧。',
          '预期效果：选择后跳转到对应行，走向不同结局。',
        ],
        x: window.innerWidth - 400, y: window.innerHeight - 150,
      });

      // 顶部控制栏 + 主画面区域
      const controlRegion = proxy.createRegion({ x: 0, y: 0, width: W, height: CONTROL_H });
      const avdRegion = proxy.createRegion({ x: 0, y: CONTROL_H, width: W, height: avdH });

      const renderer = proxy.renderer;
      const assets = buildAssets(renderer);

      // 控制栏：Restart 按钮 + Auto/Skip/Backlog/Flag 控制
      {
        const stage = controlRegion.stage;
        const restartBtn = makeButton('Restart', 72, 26, () => {
          avdRef.current?.destroy();
          avdRef.current = null;
          setRestartKey((k) => k + 1);
          setLog([]);
          append('重新开始');
        }, 0x6a3a3a);
        restartBtn.x = 12;
        restartBtn.y = 20;
        stage.addChild(restartBtn);

        const autoBtn = makeButton('Auto', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          avd.setAutoMode(!avd.isAutoMode());
          append(avd.isAutoMode() ? '自动模式 ON' : '自动模式 OFF');
        }, 0x3a5a3a);
        autoBtn.x = 96;
        autoBtn.y = 20;
        stage.addChild(autoBtn);

        const skipBtn = makeButton('Skip', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          avd.setSkipMode(!avd.isSkipMode());
          append(avd.isSkipMode() ? '跳过模式 ON' : '跳过模式 OFF');
        }, 0x5a3a3a);
        skipBtn.x = 158;
        skipBtn.y = 20;
        stage.addChild(skipBtn);

        const backlogBtn = makeButton('记录', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          setBacklogData(avd.getBacklog().map((e) => `[${e.speaker ?? '--'}] ${e.text}`));
          setShowBacklog((v) => !v);
        }, 0x3a3a5a);
        backlogBtn.x = 220;
        backlogBtn.y = 20;
        stage.addChild(backlogBtn);

        const nbBtn = makeButton('笔记本', 72, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          const has = avd.hasFlag('has_notebook');
          if (has) avd.clearFlag('has_notebook'); else avd.setFlag('has_notebook');
          append(has ? '收起笔记本' : '拿出笔记本');
        }, 0x5a5a3a);
        nbBtn.x = 282;
        nbBtn.y = 20;
        stage.addChild(nbBtn);

        const speeds = [15, 35, 60, 120];
        let speedIdx = 1;
        const speedBtn = makeButton('速度: 35', 88, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          speedIdx = (speedIdx + 1) % speeds.length;
          const spd = speeds[speedIdx];
          avd.setTypewriterSpeed(spd);
          (speedBtn.children[1] as PIXI.Text).text = `速度: ${spd}`;
          append(`文字速度: ${spd} 字符/秒`);
        }, 0x3a3a5a);
        speedBtn.x = 360;
        speedBtn.y = 20;
        stage.addChild(speedBtn);

        const saveBtn = makeButton('保存', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          const data = avd.save();
          localStorage.setItem('avd_save', JSON.stringify(data));
          append('存档已保存');
        }, 0x3a5a5a);
        saveBtn.x = 454;
        saveBtn.y = 20;
        stage.addChild(saveBtn);

        const loadBtn = makeButton('读档', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          const raw = localStorage.getItem('avd_save');
          if (!raw) { append('无存档'); return; }
          avd.load(JSON.parse(raw));
          append('存档已读取');
        }, 0x5a5a5a);
        loadBtn.x = 516;
        loadBtn.y = 20;
        stage.addChild(loadBtn);

        const exprs = ['normal', 'happy', 'sad'];
        let exprIdx = 0;
        const exprBtn = makeButton('表情: normal', 98, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          exprIdx = (exprIdx + 1) % exprs.length;
          const ex = exprs[exprIdx];
          avd.setLineExpression(ex);
          (exprBtn.children[1] as PIXI.Text).text = `表情: ${ex}`;
          append(`表情切换: ${ex}`);
        }, 0x5a3a5a);
        exprBtn.x = 578;
        exprBtn.y = 20;
        stage.addChild(exprBtn);

        const fadeBtn = makeButton('淡入/淡出', 86, 26, async () => {
          const avd = avdRef.current;
          if (!avd) return;
          append('淡出…');
          await avd.fadeOut(500);
          await avd.fadeIn(500);
          append('淡入完成');
        }, 0x3a3a3a);
        fadeBtn.x = 682;
        fadeBtn.y = 20;
        stage.addChild(fadeBtn);

        const setBtn = makeButton('设置', 56, 26, () => {
          setShowSettings((v) => !v);
        }, 0x4a4a4a);
        setBtn.x = 774;
        setBtn.y = 20;
        stage.addChild(setBtn);

        const presets: ParticlePreset[] = ['snow', 'sparkle', 'dust', 'cherry', 'magic', 'rain', 'embers'];
        let particleIdx = -1;
        let activeEmitter: ReturnType<AvdController['particleSystem']['createEmitter']> | null = null;
        const particleBtn = makeButton('粒子', 64, 26, () => {
          const avd = avdRef.current;
          if (!avd || !avdRegion) return;

          // Toggle off
          if (activeEmitter) {
            activeEmitter.stop();
            activeEmitter.destroy();
            activeEmitter = null;
            particleIdx = -1;
            (particleBtn.children[1] as PIXI.Text).text = '粒子';
            append('粒子效果: off');
            return;
          }

          // Toggle on — cycle preset each time
          particleIdx = (particleIdx + 1) % presets.length;
          const p = presets[particleIdx];
          activeEmitter = avd.particleSystem.createEmitter(
            avdRegion.stage, p,
            { x: 0, y: 0, width: W, height: avdH },
          );
          activeEmitter.play();
          (particleBtn.children[1] as PIXI.Text).text = `粒子:${p}`;
          append(`粒子效果: ${p}`);
        }, 0x4a5a4a);
        particleBtn.x = 836;
        particleBtn.y = 20;
        stage.addChild(particleBtn);

        const notifBtn = makeButton('通知', 56, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          const types: Array<{ type: NotifType; msg: string }> = [
            { type: 'info', msg: '获得道具：古老的钥匙' },
            { type: 'success', msg: '存档已保存' },
            { type: 'warn', msg: '体力不足，无法继续探索' },
            { type: 'error', msg: '物品栏已满' },
          ];
          const pick = types[Math.floor(Math.random() * types.length)];
          avd.notify({ text: pick.msg, type: pick.type });
          append(`通知: [${pick.type}] ${pick.msg}`);
        }, 0x4a4a5a);
        notifBtn.x = 906;
        notifBtn.y = 20;
        stage.addChild(notifBtn);

        const effects: TextEffect[] = ['none', 'wave', 'shake', 'rainbow'];
        let effectIdx = 0;
        const effectBtn = makeButton('特效: off', 86, 26, () => {
          const avd = avdRef.current;
          if (!avd) return;
          effectIdx = (effectIdx + 1) % effects.length;
          const ef = effects[effectIdx];
          avd.setTextEffect(ef);
          (effectBtn.children[1] as PIXI.Text).text = `特效: ${ef === 'none' ? 'off' : ef}`;
          append(`文字特效: ${ef}`);
        }, 0x5a4a3a);
        effectBtn.x = 968;
        effectBtn.y = 20;
        stage.addChild(effectBtn);

        const hint = new PIXI.Text({
          text: '保存/读档/表情/淡入淡出',
          style: { fontSize: 11, fill: 0x88aa88, fontFamily: 'monospace' },
        });
        hint.x = 780;
        hint.y = 26;
        stage.addChild(hint);
      }

      if (avdRegion) {
        // ---- 初始化 AVD 引擎 ----

        // 将各章节的 lines 合并为一个数组。
        // segment 名在整本剧本中唯一，引擎会自动索引。
        const allLines: AvdScriptJSON['lines'] = CHAPTER_LINES.flat();

        // 角色纹理解析器：parseScript 遇到 textureKey 时回调此函数。
        const bgMap: Record<string, PIXI.Texture> = {
          bg_cave: assets.bgCave,
          bg_treasure: assets.bgTreasure,
          bg_rune: assets.bgRune,
          bg_garden: assets.bgGarden,
        };
        const resolver: AvdAssetResolver = {
          loadTexture: async (key) => {
            if (bgMap[key]) return bgMap[key];
            if (key === 'hero') return assets.heroTex;
            if (key === 'hero_happy') return assets.heroHappyTex;
            if (key === 'hero_sad') return assets.heroSadTex;
            return PIXI.Texture.EMPTY;
          },
        };

        // parseScript 解析 AvdScriptJSON → AvdParsedScript（含 AvdLine[] + AvdRoster）
        // 它会自动加载所有纹理、解析 choices 中的 targetSegment 等。
        parseScript(
          {
            lines: allLines,
            roster: {
              Hero: {
                pos: 'left', textureKey: 'hero',
                expressions: { happy: 'hero_happy', sad: 'hero_sad' },
              },
            },
          },
          resolver,
        ).then((parsed) => {
          // 生成程序化音频（无外部文件依赖）
          const audioGen = new AudioManager();
          const audioMap: Record<string, AudioBuffer> = {
            bgm_cave: audioGen.generateChord(60, 4),
            bgm_treasure: audioGen.generateChord(80, 4),
            bgm_rune: audioGen.generateChord(100, 4),
            bgm_garden: audioGen.generateChord(120, 4),
            sfx_drip: audioGen.generateNoise(0.15),
            sfx_door: audioGen.generateNoise(0.3),
            voice_hello: audioGen.generateTone(400, 0.5, 'sine'),
            voice_wonder: audioGen.generateTone(350, 0.8, 'triangle'),
            voice_cheer: audioGen.generateTone(600, 0.4, 'sawtooth'),
          };
          audioGen.destroy();

          // AvdController 是视觉小说引擎的核心类。
          // 职责：管理打字机效果、对话推进、角色头像、选项渲染。
          const avd = new AvdController(avdRegion.stage, avdRegion.ticker, {
            screenW: W,
            screenH: avdH,
            typewriterSpeed: 35,           // 打字机速度（字符/秒）
            boxY: avdH - 200 - 40,         // 对话框底部位置
            portraitY: avdH - 560 - 20,    // 头像底部位置

            // ---- 生命周期回调 ----

            // 当选项出现时触发（choices 数组可用）
            onChoiceEnter: (choices) => {
              append(`出现了 ${choices.length} 个选项`);
            },

            // 当玩家选择一个选项后触发
            onChoiceSelect: (choice, idx) => {
              const target = choice.targetSegment ?? `#${(choice.targetLine ?? 0) + 1}`;
              append(`选择了 #${idx + 1}: 「${choice.text}」→ ${target}`);
            },

            // 剧本结束时触发（所有 end:true 行执行完毕）
            onComplete: () => {
              append('剧情结束');
            },

            onStateChange: () => {},
          });

          // 应用解析后的角色表和剧本
          // parsed.roster 包含 { Hero: { pos: 'left', texture: PIXI.Texture } }
          // parsed.lines 包含完整的 AvdLine[]（含 PIXI.Texture 引用）
          avd.setRoster(parsed.roster);
          avd.setScript(parsed.lines);
          avd.setAudioMap(audioMap);
          avd.setBgTextureMap(bgMap);
          avd.applySettings(settings);
          avdRef.current = avd;
        });
      }
    });

    return () => {
      avdRef.current?.destroy();
      avdRef.current = null;
      destroyApp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartKey]);

  // 底部日志面板 — 显示用户操作记录
  return (
    <>
      <style>{css}</style>
      {showSettings && (
        <AvdSettingsPanel
          settings={settings}
          onChange={(s) => {
            setSettings(s);
            saveSettings(s);
            avdRef.current?.applySettings(s);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      <div className="avdc-bottom-panel">
        <div className="avdc-log">
          {log.length === 0 ? (
            <div className="avdc-log-empty">点击推进对话 · 分支处选择选项</div>
          ) : (
            log.map((l, i) => <div key={i} className="avdc-log-line">{l}</div>)
          )}
        </div>
      </div>
      {showBacklog && (
        <div className="avdc-backlog-overlay" onClick={() => setShowBacklog(false)}>
          <div className="avdc-backlog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="avdc-backlog-title">对话记录</div>
            <div className="avdc-backlog-list">
              {backlogData.length === 0 ? (
                <div className="avdc-backlog-empty">暂无记录</div>
              ) : (
                backlogData.map((l, i) => <div key={i} className="avdc-backlog-item">{l}</div>)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ComponentAvdChoicesDisplay.head = {
  title: 'AVD 分支选择',
  description: 'AVD 视觉小说分支选择示例：多个选项 → 不同剧情走向 → 三个不同结局。纯 PIXI.js UI。',
  meta: [{ name: 'theme-color', content: '#0a1a0a' }],
};

const css = `
.avdc-bottom-panel { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; display: flex; justify-content: center; padding: 0 12px 12px; pointer-events: none; }
.avdc-log {
  pointer-events: auto;
  background: rgba(10,20,10,0.88);
  border: 1px solid #2a4a2a;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #c8e8c8;
  font-size: 0.72rem;
  min-width: 400px;
  max-height: 100px;
  overflow-y: auto;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.avdc-log-empty { opacity: 0.4; }
.avdc-log-line { padding: 1px 0; }
.avdc-backlog-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.avdc-backlog-panel {
  background: rgba(10,20,10,0.95);
  border: 1px solid #2a4a2a;
  border-radius: 12px;
  padding: 16px;
  width: 80%; max-width: 600px; max-height: 80vh;
  display: flex; flex-direction: column;
  color: #c8e8c8;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.avdc-backlog-title {
  font-size: 1rem; font-weight: bold;
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px solid #2a4a2a;
}
.avdc-backlog-list {
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px;
}
.avdc-backlog-empty { opacity: 0.4; }
.avdc-backlog-item {
  font-size: 0.8rem;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.03);
}
`;
