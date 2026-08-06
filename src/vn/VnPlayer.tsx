import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { VnLine, VnScript, VnValue, VnHandle, VnButtons, VnButton } from './types';
import { VnAssetLoader } from './loader';
import { VnAudioEngine } from './audio';
import { evalCond } from './vars';
import { injectVnStyles } from './styles';
import { prefetchScene, clearWarmLayer } from './prefetch';
import { standKeyframe, transitionKeyframe } from './effects';
import { loadGame, saveGame } from './save';
import type { VnSaveData } from './save';
import { getSettings, updateSettings } from './settings';
import { getGlobalVars, setGlobalVars, subscribeGlobalVars, markSceneSeen } from './global-state';

export interface VnPlayerProps {
  script: VnScript;
  onEnd?: () => void;
  /** 本场景 key（存档记录 + 读档校验；跨场景读档由应用层据此导航）。 */
  scriptKey?: string;
  /** 菜单渲染插槽：非菜单指令场景（如对话框/选项）由应用层自行覆盖。 */
  renderMenu?: (items: Array<{ id: string; title: string; cover?: string; showWhen?: string }>) => React.ReactNode;
  /** 菜单条目点击跳转（缺省走 navigate）。 */
  onMenuPick?: (id: string) => void;
}

/** 回放（Backlog）一条记录。 */
export interface VnBacklogEntry {
  /** 行号（点击回溯跳回该行）。 */
  lineIndex: number;
  speaker: string;
  text: string;
}

/** 播放器内部状态。 */
type VnPhase = 'loading' | 'typing' | 'idle' | 'choice' | 'menu' | 'backlog' | 'done';

/** 一个显示图层。 */
interface VnLayer {
  key: string;
  kind: 'bg' | 'cg';
  index: number;
  zIndex: number;
  /** 换图淡入时长 ms（0=无动画）。 */
  fadeMs: number;
}

/** 一个立绘层。同位置互斥（后到覆盖）。 */
interface VnStand {
  key: string;
  pos: 'left' | 'center' | 'right';
  /** 进出场动画名（作用于该立绘 img）。 */
  anim: string;
  /** 动画时长 ms。 */
  fadeMs: number;
}

interface VnUiState {
  phase: VnPhase;
  lineIndex: number;
  speaker: string;
  text: string;
  /** 已显示的字符数（打字机）。 */
  shown: number;
  /** 显示图层（bg cover 占满，cg contain 看全；按 index/zIndex 排序，同 index cg 前 bg 后）。 */
  layers: VnLayer[];
  /** 立绘层（半身像，底部对齐，可点击隐藏）。 */
  stands: VnStand[];
  loadingProgress: { loaded: number; total: number };
  choices: Array<{
    text: string;
    to: string;
    /** 选中后写入 vars。 */
    set?: Record<string, VnValue>;
    /** 满足才显示。 */
    showWhen?: string;
  }>;
  /** 菜单指令数据（phase==='menu' 时渲染）。 */
  menu: { layout: 'list' | 'grid' | 'title'; items: Array<{ id: string; title: string; cover?: string; group?: string; showWhen?: string }> } | null;
  /** 自定义按钮层（buttons 指令，非阻塞覆盖层）。 */
  buttons: VnButtons | null;
  /** 回放（Backlog）已读台词。 */
  backlog: VnBacklogEntry[];
  /** 视频演出层（video 指令：全屏视频，停播时清空）。 */
  video: { key: string; url: string; loop: boolean; volume: number; fit: 'contain' | 'cover'; muted: boolean } | null;
}

const EMPTY_UI: VnUiState = {
  phase: 'loading',
  lineIndex: 0,
  speaker: '',
  text: '',
  shown: 0,
  layers: [],
  stands: [],
  loadingProgress: { loaded: 0, total: 0 },
  choices: [],
  menu: null,
  buttons: null,
  backlog: [],
  video: null,
};

export function VnPlayer({ script, onEnd, scriptKey, renderMenu, onMenuPick }: VnPlayerProps) {
  const loaderRef = useRef<VnAssetLoader | null>(null);
  const audioRef = useRef<VnAudioEngine | null>(null);
  const [ui, setUi] = useState<VnUiState>(EMPTY_UI);
  const uiRef = useRef(ui);
  uiRef.current = ui;

  /** 组件是否仍挂载（异步回调/定时器守卫，防卸载后 setState）。 */
  const mountedRef = useRef(true);
  /** 未清理的转场定时器（卸载时统一清）。 */
  const transitionTimersRef = useRef<number[]>([]);

  /** video 播完回调（wait=true 时 onEnded 触发推进；key 校验防串台）。 */
  const videoEndRef = useRef<{ key: string; done: () => void } | null>(null);

  /** 回放面板容器（打开时滚到底，最新在底部）。 */
  const backlogRef = useRef<HTMLDivElement | null>(null);

  const [ended, setEnded] = useState(false);

  /** 播放器设置（音量/打字机速度/自动/跳过），持久化到 localStorage。 */
  const [settings, setSettings] = useState(getSettings);

  /** 设置面板开关。 */
  const [showSettings, setShowSettings] = useState(false);

  /** 最新设置 ref：runLine/回调读到最新音量。 */
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /** 剧本变量（choice.set 写入，showWhen / jump.if 读取）。ref 让 runLine 读到最新。 */
  const [vars, setVars] = useState<Record<string, VnValue>>({});
  const varsRef = useRef(vars);
  varsRef.current = vars;

  /** 全局跨场景变量（localStorage 持久化，跨场景共享；本地 vars 覆盖同名字段）。 */
  const globalVars = useSyncExternalStore(subscribeGlobalVars, getGlobalVars);
  /** 条件求值用合并视图：{ ...全局, ...本地 }。 */
  const allVars = useMemo(() => ({ ...globalVars, ...vars }), [globalVars, vars]);
  const allVarsRef = useRef(allVars);
  allVarsRef.current = allVars;

  /** 立绘层是否隐藏（点击立绘切换）。 */
  const [standHidden, setStandHidden] = useState(false);

  /** 画面抖动（say.effect='shake' 时触发，450ms 后自动复位）。 */
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shaking) return;
    const t = setTimeout(() => setShaking(false), 450);
    return () => clearTimeout(t);
  }, [shaking]);

  /** 白屏闪（say.effect='flash' 时触发，keyed by 触发行号，260ms 动画结束后自动清除，避免残留重播）。 */
  const [flash, setFlash] = useState<number | null>(null);
  useEffect(() => {
    if (flash === null) return;
    const t = setTimeout(() => setFlash(null), 320);
    return () => clearTimeout(t);
  }, [flash]);

  /** 全屏转场（transition 指令：播动画 → 自动继续下一行）。 */
  const [transition, setTransition] = useState<{ key: string; effect: string; color: string; dur: number } | null>(null);

  // 注入运行时关键帧样式
  useEffect(() => {
    injectVnStyles();
  }, []);

  // 初始化 loader
  if (!loaderRef.current) {
    loaderRef.current = new VnAssetLoader();
  }
  const loader = loaderRef.current;

  // 初始化 audio engine
  if (!audioRef.current) {
    audioRef.current = new VnAudioEngine();
  }
  const audio = audioRef.current;

  /** VnHandle 引用：runLine 的 hook 分支读取最新句柄（保存跨渲染稳定）。 */
  const vnHandleRef = useRef<VnHandle | null>(null);

  const strictLoad = script.meta?.strictLoad ?? true;

  /** 设置/替换某层。同 kind 同 index 替换（key 变化即换图）。 */
  const setLayer = useCallback(
    (kind: 'bg' | 'cg', key: string, index = 0, zIndex = 0, fadeMs = 0) => {
      setUi((prev) => {
        const next = prev.layers.filter(
          (l) => !(l.kind === kind && l.index === index),
        );
        next.push({ key, kind, index, zIndex, fadeMs });
        return { ...prev, layers: next };
      });
    },
    [],
  );

  /** 设置/替换某位置的立绘。 */
  const setStand = useCallback(
    (pos: VnStand['pos'], key: string, effect?: string, fadeMs?: number) => {
      setUi((prev) => {
        const rest = prev.stands.filter((s) => s.pos !== pos);
        rest.push({ key, pos, anim: effect ?? 'vn-fade-in', fadeMs: fadeMs ?? 350 });
        return { ...prev, stands: rest };
      });
      setStandHidden(false);
    },
    [],
  );

  /** 隐藏某位置的立绘。 */
  const hideStand = useCallback((pos: VnStand['pos']) => {
    setUi((prev) => ({ ...prev, stands: prev.stands.filter((s) => s.pos !== pos) }));
  }, []);

  /** 解析 label → 行号。 */
  const labelMap = useMemo(() => {
    const m = new Map<string, number>();
    script.lines.forEach((l, i) => {
      if (l.type === 'label') m.set(l.name, i);
    });
    return m;
  }, [script.lines]);

  /** 启动时注册所有 preload 声明的 key→url。 */
  useEffect(() => {
    for (const l of script.lines) {
      if (l.type === 'preload') loader.registerAssets(l.assets);
    }
  }, [script.lines, loader]);

  /** 跳转目标处理：#hash → 改 hash 路由；http(s) → 打开网页；否则 → 场景名（预取后自动加载）。 */
  const navigate = useCallback((target: string) => {
    if (target.startsWith('#')) {
      window.location.hash = target.slice(1);
      return;
    }
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener');
      return;
    }
    // 场景名：先预取目标场景脚本 + 资源（对齐 WebGAL 一层子场景预加载），再切 hash
    const id = `hscene-${target}`;
    prefetchScene(target);
    window.location.hash = id;
  }, []);

    /** 写剧本变量：同步更新 ref（choice.set 后紧跟的 jump.if / showWhen 能立刻读到新值）。 */
  const writeVars = useCallback((patch: Record<string, VnValue>) => {
    setVars((prev) => ({ ...prev, ...patch }));
    varsRef.current = { ...varsRef.current, ...patch };
  }, []);

  /** 真正渲染一条行。 */
  const runLine = useCallback((idx: number) => {
      const line = script.lines[idx];
      if (!line) {
        if (scriptKey) markSceneSeen(scriptKey);
        setEnded(true);
        onEnd?.();
        return;
      }

      switch (line.type) {
        case 'preload': {
          const keys = line.assets.map((a) => a.key);
          for (const a of line.assets) loader.load(a.key);
          const progress = loader.progress(keys);
          const allDone = loader.allLoaded(keys);

          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'loading',
            loadingProgress: progress,
          }));

          if (line.wait || strictLoad) {
            // 等加载完再继续；尚未就绪才订阅（已就绪则无监听器可泄漏）
            if (allDone) {
              loader.waitAll(keys).then(() => runLine(idx + 1));
            } else {
              const unsub = loader.subscribe(() => {
                setUi((prev) =>
                  prev.phase === 'loading'
                    ? { ...prev, loadingProgress: loader.progress(keys) }
                    : prev,
                );
                if (loader.allLoaded(keys)) {
                  unsub();
                  loader.waitAll(keys).then(() => runLine(idx + 1));
                }
              });
            }
          } else {
            // 不等，立即继续
            runLine(idx + 1);
          }
          break;
        }

        case 'bg': {
          loader.load(line.key);
          setLayer('bg', line.key, line.index ?? 0, line.zIndex ?? 0, line.fadeMs ?? 0);
          // 切图等待：图未加载完就停在当前画面（loading 遮罩只在真实 preload 时显示），onload 后继续
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'loading' }));
          const bgEntry = loader.get(line.key);
          if (bgEntry && bgEntry.loaded) {
            runLine(idx + 1);
          } else {
            loader.waitFor(line.key).then(() => runLine(idx + 1));
          }
          break;
        }

        case 'cg': {
          loader.load(line.key);
          setLayer('cg', line.key, line.index ?? 0, line.zIndex ?? 0, line.fadeMs ?? 0);
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'loading' }));
          const cgEntry = loader.get(line.key);
          if (cgEntry && cgEntry.loaded) {
            runLine(idx + 1);
          } else {
            loader.waitFor(line.key).then(() => runLine(idx + 1));
          }
          break;
        }

        case 'wait': {
          // 显式挂起：停在当前画面，等点击（advance）才继续，不自动推进。
          // skip 模式直接跳过（不影响 choice/menu 这类交互点）。
          if (settingsRef.current.skip) {
            runLine(idx + 1);
            break;
          }
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'idle' }));
          if (line.effect === 'shake') setShaking(true);
          if (line.effect === 'flash') setFlash(idx);
          break;
        }

        case 'say': {
          if (line.bg) {
            loader.load(line.bg);
            setLayer('bg', line.bg, line.index ?? 0, line.zIndex ?? 0, line.fadeMs ?? 0);
          }
          if (line.cg) {
            loader.load(line.cg);
            setLayer('cg', line.cg, line.index ?? 0, line.zIndex ?? 0, line.fadeMs ?? 0);
          }
          if (line.stand) {
            loader.load(line.stand);
            setStand(line.standPos ?? 'left', line.stand);
          }
          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'typing',
            speaker: line.speaker ?? '',
            text: line.text,
            shown: 0,
            backlog: line.text
              ? [...prev.backlog, { lineIndex: idx, speaker: line.speaker ?? '', text: line.text }]
              : prev.backlog,
          }));
          if (line.effect === 'shake') setShaking(true);
          if (line.effect === 'flash') setFlash(idx);
          break;
        }

        case 'choice': {
          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'choice',
            choices: line.options.map((o) => ({
              text: o.text,
              to: o.to,
              set: o.set,
              showWhen: o.showWhen,
            })),
          }));
          break;
        }

        case 'jump': {
          if (line.if && !evalCond(line.if, allVarsRef.current)) {
            // 条件不满足：跳过，继续下一行
            runLine(idx + 1);
            break;
          }
          const target = labelMap.get(line.to);
          if (target != null) {
            setUi((prev) => ({ ...prev, phase: 'idle' }));
            runLine(target);
          } else {
            // 非 label：可能是 #hash / URL / 场景名
            navigate(line.to);
          }
          break;
        }

        case 'label': {
          runLine(idx + 1);
          break;
        }

        case 'audio': {
          const url = loader.get(line.key)?.url ?? line.key;
          if (line.action === 'stop') {
            if (!line.channel || line.channel === 'bgm') audioActiveRef.current.bgm = null;
            audio.stop(line.channel);
          } else {
            const channel = line.channel ?? (line.loop ? 'bgm' : 'sfx');
            if (channel === 'bgm') audioActiveRef.current.bgm = line.key;
            const base = line.volume ?? 1;
            const vol = base * (settingsRef.current.volume[channel] ?? 1);
            audio.play(line.key, url, {
              channel,
              loop: line.loop,
              volume: vol,
            });
          }
          runLine(idx + 1);
          break;
        }

        case 'hook': {
          // js/ts 场景：函数内嵌（一等公民）；json 场景：声明式 fetch。两者都支持 set 写回。
          const finish = () => {
            if (line.set) writeVars(line.set);
            runLine(idx + 1);
          };
          const fail = (err: unknown) => {
            console.error('[vn] hook failed:', line.key ?? '', err);
            finish();
          };
          const work = async () => {
            if (line.run) {
              await line.run(vnHandleRef.current);
            } else if (line.url) {
              await fetch(line.url, {
                method: line.method ?? 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: line.body ? JSON.stringify(line.body) : undefined,
              });
            }
          };
          if (line.wait) {
            work().then(finish, fail);
          } else {
            // fire-and-forget：不阻塞流程，失败静默
            work().then(() => undefined, () => undefined);
            runLine(idx + 1);
          }
          break;
        }

        case 'menu': {
          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'menu',
            menu: { layout: line.layout, items: line.items },
          }));
          break;
        }

        case 'buttons': {
          // 非阻塞覆盖层：显示后立即继续下一行；空数组 = 清除。
          setUi((prev) => ({ ...prev, lineIndex: idx, buttons: line.buttons.length ? line : null }));
          runLine(idx + 1);
          break;
        }

        case 'stand': {
          if (line.action === 'hide') {
            hideStand(line.pos ?? 'left');
            runLine(idx + 1);
            break;
          }
          if (line.key) {
            loader.load(line.key);
            const effect = line.effect ?? 'fade';
            const anim = standKeyframe(effect);
            setStand(line.pos ?? 'left', line.key, anim, line.fadeMs ?? 350);
          }
          runLine(idx + 1);
          break;
        }

        case 'transition': {
          const effect = line.effect ?? 'fade';
          const dur = line.fadeMs ?? 450;
          const key = `trans-${idx}`;
          setTransition({ key, effect, color: line.color ?? '#000', dur });
          const t = setTimeout(() => {
            if (!mountedRef.current) return;
            setTransition(null);
            runLine(idx + 1);
          }, dur + 30);
          transitionTimersRef.current.push(t);
          break;
        }

        case 'video': {
          if (line.action === 'stop') {
            setUi((prev) => ({ ...prev, video: null }));
            runLine(idx + 1);
            break;
          }
          const url = loader.get(line.key)?.url ?? line.key;
          const loop = line.loop ?? false;
          setUi((prev) => ({
            ...prev,
            video: {
              key: line.key,
              url,
              loop,
              volume: line.volume ?? 1,
              fit: line.fit ?? 'contain',
              muted: line.muted ?? false,
            },
          }));
          // wait=true（默认）：视频播完（onEnded）才继续；loop 或 wait=false 立即继续
          if (!loop && (line.wait ?? true)) {
            videoEndRef.current = { key: line.key, done: () => runLine(idx + 1) };
          } else {
            runLine(idx + 1);
          }
          break;
        }

        case 'end': {
          clearWarmLayer();
          if (scriptKey) markSceneSeen(scriptKey);
          setEnded(true);
          onEnd?.();
          if (line.goto) navigate(line.goto);
          break;
        }

        default: {
          runLine(idx + 1);
        }
      }
    },
    [loader, audio, labelMap, script.lines, strictLoad, onEnd, navigate, setLayer, setStand, hideStand, writeVars, scriptKey],
  );

  /** 跳转目标解析：#hash / URL 走 navigate；label 优先命中同场景行；其余按场景名导航。 */
  const resolveJump = useCallback(
    (target: string) => {
      const hit = labelMap.get(target);
      if (hit != null) {
        setUi((prev) => ({ ...prev, phase: 'idle' }));
        runLine(hit);
        return;
      }
      navigate(target);
    },
    [labelMap, navigate, runLine],
  );

  // 启动
  useEffect(() => {
    runLine(0);
    const timers = transitionTimersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
      loader.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 打字机推进。 */
  useEffect(() => {
    if (ui.phase !== 'typing') return;
    const total = Array.from(ui.text).length;
    const typeSpeed = script.meta?.typeSpeed ?? settings.typeSpeed;
    if (ui.shown >= total) {
      // 显示完整，等点击
      setUi((prev) => (prev.phase === 'typing' ? { ...prev, phase: 'idle' } : prev));
      return;
    }
    if (typeSpeed <= 0 || settings.skip) {
      // 0 = 瞬间显示全文；skip 模式直接跳过打字
      setUi((prev) => ({ ...prev, shown: total }));
      return;
    }
    const t = setTimeout(() => {
      setUi((prev) => ({ ...prev, shown: prev.shown + 1 }));
    }, typeSpeed);
    return () => clearTimeout(t);
  }, [ui.phase, ui.shown, ui.text, settings.typeSpeed, settings.skip, script.meta?.typeSpeed]);

  /** 自动播放：行完整显示后（idle）延迟 autoDelay 自动推进；skip 模式不等待。 */
  useEffect(() => {
    if (!settings.auto || ui.phase !== 'idle') return;
    const t = setTimeout(() => runLine(ui.lineIndex + 1), settings.autoDelay);
    return () => clearTimeout(t);
  }, [settings.auto, settings.autoDelay, ui.phase, ui.lineIndex, runLine]);

  const advance = useCallback(() => {
    if (ui.phase === 'typing') {
      // 点击：如果没打完，直接显示完整；否则 next
      const total = Array.from(ui.text).length;
      if (ui.shown < total) {
        setUi((prev) => ({ ...prev, shown: total }));
        return;
      }
      runLine(ui.lineIndex + 1);
    } else if (ui.phase === 'idle') {
      runLine(ui.lineIndex + 1);
    } else if (ui.phase === 'choice') {
      // 不处理（由选项按钮触发）
    }
  }, [ui, runLine]);

  const pickChoice = useCallback(
    (to: string, set?: Record<string, VnValue>) => {
      if (set) writeVars(set);
      // 与 jump 语义一致：label 优先，否则 #hash / URL / 场景名
      resolveJump(to);
    },
    [resolveJump, writeVars],
  );

  /** 正在播放的音频（存档记录 bgm）。 */
  const audioActiveRef = useRef<{ bgm: string | null }>({ bgm: null });

  /** 快存当前状态。 */
  const doSave = useCallback(
    async (slot: number) => {
      const u = uiRef.current;
      const data: VnSaveData = {
        slot,
        scriptKey: scriptKey ?? '',
        lineIndex: u.lineIndex,
        vars: { ...varsRef.current },
        layers: u.layers.map((l) => ({ ...l })),
        stands: u.stands.map((s) => ({ ...s })),
        speaker: u.speaker,
        text: u.text,
        shown: u.shown,
        phase: u.phase === 'typing' || u.phase === 'idle' || u.phase === 'choice' ? u.phase : 'idle',
        choices: u.choices.map((c) => ({ ...c })),
        audio: { bgm: audioActiveRef.current.bgm },
        video: u.video,
        savedAt: Date.now(),
      };
      await saveGame(data);
    },
    [scriptKey],
  );

  /** 读档恢复。跨场景时导航到对应场景（由应用层在新场景挂载后恢复）。 */
  const doLoad = useCallback(
    async (slot: number) => {
      const data = await loadGame(slot);
      if (!data) return;
      if (data.scriptKey && scriptKey && data.scriptKey !== scriptKey) {
        navigate(`hscene-${data.scriptKey}`);
        return;
      }
      setVars(data.vars);
      varsRef.current = data.vars;
      setUi((prev) => ({
        ...prev,
        lineIndex: data.lineIndex,
        phase: data.phase,
        speaker: data.speaker,
        text: data.text,
        shown: data.shown,
        layers: data.layers,
        stands: (data.stands ?? []).map((s) => ({
          key: s.key,
          pos: s.pos,
          anim: 'vn-fade-in',
          fadeMs: 300,
        })),
        choices: data.choices,
        menu: prev.menu,
        video: data.video ?? null,
      }));
      if (data.audio.bgm) {
        const url = loader.get(data.audio.bgm)?.url ?? data.audio.bgm;
        audioActiveRef.current.bgm = data.audio.bgm;
        audio.play(data.audio.bgm, url, { channel: 'bgm', loop: true });
      }
      runLine(data.lineIndex);
    },
    [scriptKey, loader, audio, navigate, runLine],
  );

  /** 构建 VnHandle：hook.run 收到它，可直接对 VN 对象操作。 */
  const vnHandle: VnHandle = useMemo(
    () => ({
      getVar: (name) => varsRef.current[name],
      setVar: (patch) => writeVars(patch),
      jump: (target) => resolveJump(target),
      playAudio: (key, opts) => {
        const url = loader.get(key)?.url ?? key;
        const channel = opts?.channel ?? (opts?.loop ? 'bgm' : 'sfx');
        if (channel === 'bgm') audioActiveRef.current.bgm = key;
        const base = opts?.volume ?? 1;
        const vol = base * (settingsRef.current.volume[channel] ?? 1);
        audio.play(key, url, { ...opts, volume: vol });
      },
      stopAudio: (channel) => {
        if (!channel || channel === 'bgm') audioActiveRef.current.bgm = null;
        audio.stop(channel);
      },
      flash: () => setFlash(Date.now()),
      shake: () => setShaking(true),
      save: (slot) => doSave(slot),
      load: (slot) => doLoad(slot),
      end: (goto) => {
        clearWarmLayer();
        if (scriptKey) markSceneSeen(scriptKey);
        setEnded(true);
        onEnd?.();
        if (goto) navigate(goto);
      },
      clearPrefetch: () => clearWarmLayer(),
      showBacklog: () => setUi((prev) => (prev.phase === 'backlog' ? prev : { ...prev, phase: 'backlog' })),
      closeBacklog: () =>
        setUi((prev) => (prev.phase === 'backlog' ? { ...prev, phase: 'idle' } : prev)),
      openSettings: () => setShowSettings(true),
      closeSettings: () => setShowSettings(false),
      toggleAuto: () => setSettings((s) => updateSettings({ auto: !s.auto })),
      toggleSkip: () => setSettings((s) => updateSettings({ skip: !s.skip })),
      setSetting: (patch) => setSettings(updateSettings(patch)),
      getGlobalVar: (name) => getGlobalVars()[name],
      setGlobalVar: (patch) => setGlobalVars(patch),
      markSeen: (sceneKey) => markSceneSeen(sceneKey),
    }),
    [loader, audio, resolveJump, navigate, writeVars, doSave, doLoad, onEnd, scriptKey],
  );
  vnHandleRef.current = vnHandle;

  // 键盘推进 / 回放 / 设置快捷键
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showSettings) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (ui.phase === 'backlog') {
          setUi((prev) => (prev.phase === 'backlog' ? { ...prev, phase: 'idle' } : prev));
        } else {
          advance();
        }
      } else if (e.key === 'Backspace' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (ui.phase === 'backlog') {
          setUi((prev) => (prev.phase === 'backlog' ? { ...prev, phase: 'idle' } : prev));
        } else if (ui.backlog.length > 0) {
          setUi((prev) => ({ ...prev, phase: 'backlog' }));
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance, ui.phase, ui.backlog.length, showSettings]);

  // 打开回放时滚动到底部（最新在底部）
  useEffect(() => {
    if (ui.phase === 'backlog' && backlogRef.current) {
      backlogRef.current.scrollTop = backlogRef.current.scrollHeight;
    }
  }, [ui.phase, ui.backlog.length]);

  if (ended) return null;

  const uiStyle = script.meta?.ui;
  const dialog = uiStyle?.dialog ?? {};
  const choice = uiStyle?.choice ?? {};
  const cgBox = uiStyle?.cgBox;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: script.meta?.fontFamily ?? '"Noto Serif SC", serif',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        animation: shaking ? 'vn-shake 450ms ease' : undefined,
      }}
      onClick={advance}
    >
      {/* 图层渲染：bg=cover 占满全屏，cg=contain 看全居中；按 index+zIndex 排序，同 index cg 前 bg 后
          cg 默认无包裹框（直接 contain 全屏，竖图立绘更大）；scenario 设了 meta.ui.cgBox 才套框 */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {ui.layers
          .slice()
          .sort((a, b) => {
            const aIdx = a.index + (a.kind === 'cg' ? 0.5 : 0);
            const bIdx = b.index + (b.kind === 'cg' ? 0.5 : 0);
            return aIdx - bIdx || a.zIndex - b.zIndex;
          })
          .map((layer) => {
            const url = loader.get(layer.key)?.url ?? layer.key;
            if (layer.kind === 'bg') {
              return (
                <img
                  key={`${layer.kind}-${layer.index}-${layer.key}`}
                  src={url}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    zIndex: layer.index,
                    animation:
                      layer.fadeMs > 0 ? `vn-fade-in ${layer.fadeMs}ms ease both` : undefined,
                  }}
                />
              );
            }
            return (
              <div
                key={`${layer.kind}-${layer.index}-${layer.key}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: layer.index + 1,
                }}
              >
                {cgBox ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: cgBox.maxWidth ?? 'calc(100vh * 16 / 9)',
                      aspectRatio: String(cgBox.aspect ?? 16 / 9),
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        animation:
                          layer.fadeMs > 0 ? `vn-fade-in ${layer.fadeMs}ms ease both` : undefined,
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      animation:
                        layer.fadeMs > 0 ? `vn-fade-in ${layer.fadeMs}ms ease both` : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}
      </div>

      {/* 视频演出层：全屏视频（video 指令）。wait=true 且非 loop 时播完自动推进下一行 */}
      {ui.video && (
        <video
          key={`video-${ui.video.key}`}
          src={ui.video.url}
          autoPlay
          loop={ui.video.loop}
          muted={ui.video.muted}
          ref={(el) => {
            if (el && !el.muted) el.volume = ui.video!.volume;
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: ui.video.fit,
            background: '#000',
            zIndex: 25,
          }}
          onEnded={() => {
            const w = videoEndRef.current;
            if (w && w.key === ui.video.key) {
              videoEndRef.current = null;
              w.done();
            }
          }}
        />
      )}

      {/* 立绘层：半身像底部对齐，点击整幅立绘切换显示/隐藏 */}
      {!standHidden &&
        ui.stands.length > 0 &&
        ui.stands.map((s) => {
          const url = loader.get(s.key)?.url ?? s.key;
          const posStyle =
            s.pos === 'center'
              ? { left: '50%', transform: 'translateX(-50%)' }
              : s.pos === 'right'
                ? { right: '2%' }
                : { left: '2%' };
          return (
            <img
              key={`${s.pos}-${s.key}`}
              src={url}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                setStandHidden((h) => !h);
              }}
              style={{
                position: 'absolute',
                bottom: '10%',
                height: '76%',
                maxWidth: '36%',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                cursor: 'pointer',
                zIndex: 24,
                animation: `${s.anim} ${s.fadeMs}ms ease both`,
                ...posStyle,
              }}
            />
          );
        })}

      {/* loading 遮罩：phase==='loading' 且资源未全就绪 */}
      {ui.phase === 'loading' &&
        ui.loadingProgress.total > 0 &&
        ui.loadingProgress.loaded < ui.loadingProgress.total && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>Loading… {ui.loadingProgress.loaded}/{ui.loadingProgress.total}</div>
          </div>
        </div>
      )}

      {/* 选项层 */}
      {ui.phase === 'choice' && (
        <div
          key={`choice-${ui.lineIndex}`}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: choice.align === 'left' ? 'flex-start' : choice.align === 'right' ? 'flex-end' : 'center',
            justifyContent: 'center',
            gap: choice.gap ?? 12,
            zIndex: 20,
            animation: choice.animate ? 'vn-fade-up 250ms ease both' : undefined,
          }}
        >
          {ui.choices
            .filter((c) => (c.showWhen ? evalCond(c.showWhen, allVars) : true))
            .map((c) => (
              <button
                key={c.to}
                onClick={(e) => {
                  e.stopPropagation();
                  pickChoice(c.to, c.set);
                }}
                style={{
                  padding: '12px 32px',
                  fontSize: choice.fontSize ?? 18,
                  background: choice.itemBg ?? 'rgba(20,20,40,0.9)',
                  color: choice.itemColor ?? '#fff',
                  border: '1px solid #3a4a7a',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {c.text}
              </button>
            ))}
        </div>
      )}

      {/* 自定义按钮层（buttons 指令）：非阻塞覆盖层。 */}
      {ui.buttons && (
        <div
          onClick={() => {
            if (ui.buttons?.dismissible) setUi((prev) => ({ ...prev, buttons: null }));
          }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: ui.buttons.dismissible ? 'auto' : 'none',
            zIndex: 40,
          }}
        >
          {(() => {
            const btns = ui.buttons;
            const posStyle: React.CSSProperties =
              btns.position === 'center' ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
              : btns.position === 'top' ? { left: '50%', top: 20, transform: 'translateX(-50%)' }
              : btns.position === 'left' ? { left: 20, top: '50%', transform: 'translateY(-50%)' }
              : btns.position === 'right' ? { right: 20, top: '50%', transform: 'translateY(-50%)' }
              : btns.position === 'top-left' ? { left: 20, top: 20 }
              : btns.position === 'top-right' ? { right: 20, top: 20 }
              : btns.position === 'bottom-left' ? { left: 20, bottom: 36 }
              : btns.position === 'bottom-right' ? { right: 20, bottom: 36 }
              : { left: '50%', bottom: 36, transform: 'translateX(-50%)' };
            const layoutStyle: React.CSSProperties =
              btns.layout === 'row' ? { flexDirection: 'row' }
              : btns.layout === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', maxWidth: 'min(520px, 88vw)' }
              : { flexDirection: 'column' };
            return (
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  gap: 10,
                  ...posStyle,
                  ...layoutStyle,
                  pointerEvents: 'auto',
                }}
              >
                {btns.buttons
                  .filter((b) => (b.showWhen ? evalCond(b.showWhen, allVars) : true))
                  .map((b, i) => (
                    <button
                      key={`${b.label}-${i}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = b.action;
                        if (a.type === 'jump') {
                          resolveJump(a.to);
                        } else if (a.type === 'set') {
                          writeVars(a.set);
                          setUi((prev) => ({ ...prev, buttons: null }));
                        } else if (a.type === 'href') {
                          window.open(a.url, '_blank', 'noopener');
                        }
                      }}
                      style={{
                        padding: '10px 22px',
                        fontSize: b.style?.fontSize ?? 16,
                        background: b.style?.bg ?? 'rgba(20,20,40,0.92)',
                        color: b.style?.color ?? '#fff',
                        border: '1px solid #3a4a7a',
                        borderRadius: 8,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 菜单层：数据驱动（标题 / 回想列表 / 场景网格）。条目即数据，点击走 navigate。 */}
      {ui.phase === 'menu' && ui.menu && (
        <div
          key={`menu-${ui.lineIndex}`}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 24px',
            background:
              ui.menu.layout === 'title' ? 'rgba(5,5,15,0.35)' : 'rgba(5,5,15,0.75)',
            color: '#fff',
            zIndex: 20,
          }}
        >
          <div
            style={{
              margin: 'auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
          {renderMenu
            ? renderMenu(
                ui.menu.items
                  .filter((m) => (m.showWhen ? evalCond(m.showWhen, allVars) : true))
                  .map((m) => ({
                    id: m.id,
                    title: m.title,
                    cover: m.cover,
                    showWhen: m.showWhen,
                  })),
              )
            : ui.menu.layout === 'grid'
              ? (() => {
                  const visible = ui.menu.items.filter((m) =>
                    m.showWhen ? evalCond(m.showWhen, allVars) : true,
                  );
                  const groups = new Map<string, typeof visible>();
                  for (const it of visible) {
                    const g = it.group ?? '';
                    if (!groups.has(g)) groups.set(g, []);
                    groups.get(g)!.push(it);
                  }
                  return [...groups.entries()].map(([g, its]) => (
                    <div key={g || '__ungrouped'} style={{ maxWidth: 960, width: '100%', margin: '0 auto 32px' }}>
                      {g && (
                        <div
                          style={{
                            fontSize: 20,
                            color: '#ffd78a',
                            borderBottom: '1px solid #3a4a7a',
                            paddingBottom: 8,
                            marginBottom: 16,
                          }}
                        >
                          {g}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                          gap: 12,
                        }}
                      >
                        {its.map((m) => (
                          <button
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onMenuPick) onMenuPick(m.id);
                              else resolveJump(m.id);
                            }}
                            style={{
                              padding: 0,
                              background: 'rgba(26,26,58,0.9)',
                              border: '1px solid #2a2a4a',
                              borderRadius: 8,
                              color: '#fff',
                              cursor: 'pointer',
                              overflow: 'hidden',
                            }}
                          >
                            {m.cover && (
                              <img
                                src={m.cover}
                                alt=""
                                loading="lazy"
                                style={{
                                  width: '100%',
                                  aspectRatio: '3 / 4',
                                  objectFit: 'cover',
                                  display: 'block',
                                  background: '#111',
                                }}
                              />
                            )}
                            <div
                              style={{
                                padding: '8px 10px',
                                fontSize: 12,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {m.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )                  );
                })()
              : ui.menu.layout === 'title'
                ? (() => {
                    const visible = ui.menu.items.filter((m) =>
                      m.showWhen ? evalCond(m.showWhen, allVars) : true,
                    );
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                        <div
                          style={{
                            fontSize: 44,
                            fontWeight: 'bold',
                            letterSpacing: 6,
                            color: '#fff',
                            textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                            marginBottom: 28,
                          }}
                        >
                          {script.meta?.ui?.title ?? script.meta?.title ?? 'Hana'}
                        </div>
                        {visible.map((m) => (
                          <button
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onMenuPick) onMenuPick(m.id);
                              else resolveJump(m.id);
                            }}
                            style={{
                              padding: '14px 44px',
                              fontSize: 18,
                              letterSpacing: 2,
                              background: 'rgba(20,20,40,0.75)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.35)',
                              borderRadius: 8,
                              cursor: 'pointer',
                              minWidth: 220,
                            }}
                          >
                            {m.title}
                          </button>
                        ))}
                      </div>
                    );
                  })()
              : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    width: 'min(420px, 90vw)',
                  }}
                >
                  {ui.menu.items
                    .filter((m) => (m.showWhen ? evalCond(m.showWhen, allVars) : true))
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMenuPick) onMenuPick(m.id);
                          else resolveJump(m.id);
                        }}
                        style={{
                          padding: '14px 28px',
                          fontSize: 18,
                          background: 'rgba(20,20,40,0.9)',
                          color: '#fff',
                          border: '1px solid #3a4a7a',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        {m.title}
                      </button>
                    ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* 对话框 */}
      {ui.phase === 'typing' || ui.phase === 'idle' ? (
        <div
          key={`dialog-${ui.lineIndex}`}
          style={{
            position: 'absolute',
            left: dialog.left ?? '4%',
            right: dialog.right ?? '4%',
            top: dialog.top,
            bottom: dialog.bottom ?? 24,
            padding: dialog.padding ?? '20px 28px',
            background: dialog.bgImg
              ? `url(${dialog.bgImg}) center / cover no-repeat, ${dialog.bg ?? 'rgba(10,10,30,0.85)'}`
              : (dialog.bg ?? 'rgba(10,10,30,0.85)'),
            borderRadius: dialog.radius ?? 12,
            border: '1px solid rgba(255,255,255,0.15)',
            minHeight: dialog.minHeight ?? 120,
            textAlign: dialog.align ?? 'left',
            zIndex: 30,
            animation: dialog.animate ? 'vn-fade-up 250ms ease both' : undefined,
          }}
        >
          {ui.speaker && (
            <div
              style={{
                position: 'absolute',
                top: -14,
                left: 20,
                padding: '4px 14px',
                background: '#0a0a1e',
                borderRadius: 6,
                color: '#88ccff',
                fontWeight: 'bold',
                border: '1px solid rgba(136,204,255,0.4)',
                fontSize: 16,
              }}
            >
              {ui.speaker}
            </div>
          )}
          <div
            style={{
              fontSize: dialog.textSize ?? script.meta?.textSize ?? 22,
              color: dialog.color ?? '#fff',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              minHeight: 60,
            }}
          >
            {Array.from(ui.text).slice(0, ui.shown).join('')}
            {ui.phase === 'idle' && <span style={{ opacity: 0.6 }}>▍</span>}
          </div>
        </div>
      ) : null}

      {/* 台词特效：flash = 白屏闪一下（keyed by 触发行号，动画结束自动清除，全屏覆盖可穿透点击） */}
      {flash !== null && (
        <div
          key={`flash-${flash}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'vn-flash 260ms ease-out both',
          }}
        />
      )}

      {/* 全屏转场（transition 指令）：盖住画面播过场动画，动画结束自动继续 */}
      {transition && (
        <div
          key={transition.key}
          style={{
            position: 'absolute',
            inset: 0,
            background: transition.color,
            zIndex: 95,
            pointerEvents: 'none',
            animation: `${transitionKeyframe(transition.effect)} ${transition.dur}ms ease-in-out both`,
          }}
        />
      )}

      {/* 顶栏控制：回放 / 自动 / 跳过 / 设置 */}
      {ui.phase === 'typing' || ui.phase === 'idle' ? (
        <div
          style={{
            position: 'absolute',
            top: dialog.top ?? 16,
            right: 24,
            display: 'flex',
            gap: 8,
            zIndex: 60,
          }}
        >
          {[
            { label: '回放', onClick: () => setUi((p) => (p.phase === 'backlog' ? p : { ...p, phase: 'backlog' })) },
            { label: settings.auto ? '自动●' : '自动○', onClick: () => setSettings((s) => updateSettings({ auto: !s.auto })) },
            { label: settings.skip ? '跳过●' : '跳过○', onClick: () => setSettings((s) => updateSettings({ skip: !s.skip })) },
            { label: '设置', onClick: () => setShowSettings(true) },
          ].map((b) => (
            <button
              key={b.label}
              onClick={(e) => {
                e.stopPropagation();
                b.onClick();
              }}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                background: 'rgba(10,10,30,0.7)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* 回放（Backlog）面板 */}
      {ui.phase === 'backlog' ? (
          <div
            ref={backlogRef}
            onClick={() => setUi((p) => ({ ...p, phase: 'idle' }))}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5,5,15,0.92)',
            zIndex: 80,
            overflowY: 'auto',
            padding: '24px 5%',
            cursor: 'pointer',
          }}
        >
          <div style={{ color: '#9ab8ff', fontSize: 13, marginBottom: 12 }}>历史 / 点击关闭 · 点击某条回溯</div>
          {ui.backlog.length === 0 ? (
            <div style={{ color: '#667', fontSize: 16, padding: 20 }}>暂无历史</div>
          ) : (
            ui.backlog.map((e, i) => (
              <div
                key={`${e.lineIndex}-${i}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setUi((p) => ({ ...p, phase: 'idle', lineIndex: e.lineIndex }));
                  runLine(e.lineIndex);
                }}
                style={{
                  padding: '10px 12px',
                  marginBottom: 8,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                }}
              >
                {e.speaker && <div style={{ color: '#88ccff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{e.speaker}</div>}
                <div style={{ color: '#ddd', fontSize: 16, lineHeight: 1.6 }}>{e.text}</div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* 设置面板 */}
      {showSettings ? (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5,5,15,0.92)',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(460px, 92vw)',
              background: '#13122a',
              border: '1px solid #3a4a7a',
              borderRadius: 14,
              padding: 24,
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 18 }}>设置</div>
            {(
              [
                { label: 'BGM 音量', ch: 'bgm' as const },
                { label: '音效音量', ch: 'sfx' as const },
                { label: '语音音量', ch: 'voice' as const },
              ] as const
            ).map((row) => (
              <div key={row.ch} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#9a9ac0', marginBottom: 6 }}>{row.label}</div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume[row.ch]}
                  onChange={(e) =>
                    setSettings((s) => updateSettings({ volume: { ...s.volume, [row.ch]: Number(e.target.value) } }))
                  }
                  style={{ width: '100%' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#9a9ac0', marginBottom: 6 }}>文字速度（{settings.typeSpeed}ms/字）</div>
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={settings.typeSpeed}
                onChange={(e) => setSettings((s) => updateSettings({ typeSpeed: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: '#9a9ac0', marginBottom: 6 }}>自动播放延迟（{settings.autoDelay}ms）</div>
              <input
                type="range"
                min={300}
                max={5000}
                step={100}
                value={settings.autoDelay}
                onChange={(e) => setSettings((s) => updateSettings({ autoDelay: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '8px 20px',
                  background: '#2a2a4a',
                  color: '#fff',
                  border: '1px solid #4a5a8a',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
