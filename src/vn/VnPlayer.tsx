import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VnLine, VnScript, VnValue } from './types';
import { VnAssetLoader } from './loader';
import { evalCond } from './vars';
import { injectVnStyles } from './styles';

export interface VnPlayerProps {
  script: VnScript;
  onEnd?: () => void;
}

/** 播放器内部状态。 */
type VnPhase = 'loading' | 'typing' | 'idle' | 'choice' | 'done';

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
}

interface VnUiState {
  phase: VnPhase;
  lineIndex: number;
  speaker: string;
  text: string;
  /** 已显示的字符数（打字机）。 */
  shown: number;
  /** 本条台词的特效：flash 白屏闪、shake 抖动。 */
  effect?: 'shake' | 'flash';
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
}

const EMPTY_UI: VnUiState = {
  phase: 'loading',
  lineIndex: 0,
  speaker: '',
  text: '',
  shown: 0,
  effect: undefined,
  layers: [],
  stands: [],
  loadingProgress: { loaded: 0, total: 0 },
  choices: [],
};

export function VnPlayer({ script, onEnd }: VnPlayerProps) {
  const loaderRef = useRef<VnAssetLoader | null>(null);
  const [ui, setUi] = useState<VnUiState>(EMPTY_UI);
  const uiRef = useRef(ui);
  uiRef.current = ui;

  const [ended, setEnded] = useState(false);

  /** 剧本变量（choice.set 写入，showWhen / jump.if 读取）。ref 让 runLine 读到最新。 */
  const [vars, setVars] = useState<Record<string, VnValue>>({});
  const varsRef = useRef(vars);
  varsRef.current = vars;

  /** 立绘层是否隐藏（点击立绘切换）。 */
  const [standHidden, setStandHidden] = useState(false);

  /** 画面抖动（say.effect='shake' 时触发，450ms 后自动复位）。 */
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shaking) return;
    const t = setTimeout(() => setShaking(false), 450);
    return () => clearTimeout(t);
  }, [shaking]);

  // 注入运行时关键帧样式
  useEffect(() => {
    injectVnStyles();
  }, []);

  // 初始化 loader
  if (!loaderRef.current) {
    loaderRef.current = new VnAssetLoader();
  }
  const loader = loaderRef.current;

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
  const setStand = useCallback((pos: VnStand['pos'], key: string) => {
    setUi((prev) => {
      const rest = prev.stands.filter((s) => s.pos !== pos);
      rest.push({ key, pos });
      return { ...prev, stands: rest };
    });
    setStandHidden(false);
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

  /** 跳转目标处理：#hash → 改 hash 路由；http(s) → 打开网页；否则 → 场景名（自动加载）。 */
  const navigate = useCallback((target: string) => {
    if (target.startsWith('#')) {
      window.location.hash = target.slice(1);
      return;
    }
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener');
      return;
    }
    // 场景名：切到对应 hash（由 examples 注册的 hscene-<name>）
    const id = `hscene-${target}`;
    window.location.hash = id;
  }, []);

  /** 真正渲染一条行。 */
  const runLine = useCallback((idx: number) => {
      const line = script.lines[idx];
      if (!line) {
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
            // 等加载完再继续；期间订阅进度变化刷新 UI
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
            if (allDone) {
              loader.waitAll(keys).then(() => runLine(idx + 1));
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
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'idle' }));
          runLine(idx + 1);
          break;
        }

        case 'cg': {
          loader.load(line.key);
          setLayer('cg', line.key, line.index ?? 0, line.zIndex ?? 0, line.fadeMs ?? 0);
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'idle' }));
          runLine(idx + 1);
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
            effect: line.effect,
          }));
          if (line.effect === 'shake') setShaking(true);
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
          if (line.if && !evalCond(line.if, varsRef.current)) {
            // 条件不满足：跳过，继续下一行
            runLine(idx + 1);
            break;
          }
          const target = labelMap.get(line.to);
          if (target != null) {
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

        case 'end': {
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
    [loader, labelMap, script.lines, strictLoad, onEnd, navigate, setStand],
  );

  // 启动
  useEffect(() => {
    runLine(0);
    return () => {
      loader.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 打字机推进。 */
  useEffect(() => {
    if (ui.phase !== 'typing') return;
    const total = Array.from(ui.text).length;
    const typeSpeed = script.meta?.typeSpeed ?? 30;
    if (ui.shown >= total) {
      // 显示完整，等点击
      setUi((prev) => (prev.phase === 'typing' ? { ...prev, phase: 'idle' } : prev));
      return;
    }
    if (typeSpeed <= 0) {
      // 0 = 瞬间显示全文
      setUi((prev) => ({ ...prev, shown: total }));
      return;
    }
    const t = setTimeout(() => {
      setUi((prev) => ({ ...prev, shown: prev.shown + 1 }));
    }, typeSpeed);
    return () => clearTimeout(t);
  }, [ui.phase, ui.shown, ui.text, script.meta?.typeSpeed]);

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
      if (set) setVars((prev) => ({ ...prev, ...set }));
      const target = labelMap.get(to);
      if (target != null) {
        setUi((prev) => ({ ...prev, phase: 'idle' }));
        runLine(target);
      }
    },
    [labelMap, runLine],
  );

  // 键盘推进
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance]);

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
              key={s.pos}
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
                animation: 'vn-fade-in 300ms ease both',
                ...posStyle,
              }}
            />
          );
        })}

      {/* loading 遮罩：phase==='loading' 且资源未全就绪 */}
      {ui.phase === 'loading' && ui.loadingProgress.total > 0 && (
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
            .filter((c) => (c.showWhen ? evalCond(c.showWhen, vars) : true))
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
            background: dialog.bg ?? 'rgba(10,10,30,0.85)',
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

      {/* 台词特效：flash = 白屏闪一下（全屏覆盖，可穿透点击） */}
      {ui.effect === 'flash' && (
        <div
          key={`flash-${ui.lineIndex}`}
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
    </div>
  );
}
