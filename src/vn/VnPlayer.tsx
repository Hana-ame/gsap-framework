import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VnLine, VnScript } from './types';
import { VnAssetLoader } from './loader';

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
  loadingProgress: { loaded: number; total: number };
  choices: Array<{ text: string; to: string }>;
}

const EMPTY_UI: VnUiState = {
  phase: 'loading',
  lineIndex: 0,
  speaker: '',
  text: '',
  shown: 0,
  layers: [],
  loadingProgress: { loaded: 0, total: 0 },
  choices: [],
};

export function VnPlayer({ script, onEnd }: VnPlayerProps) {
  const loaderRef = useRef<VnAssetLoader | null>(null);
  const [ui, setUi] = useState<VnUiState>(EMPTY_UI);
  const uiRef = useRef(ui);
  uiRef.current = ui;

  const [ended, setEnded] = useState(false);

  // 初始化 loader
  if (!loaderRef.current) {
    loaderRef.current = new VnAssetLoader();
  }
  const loader = loaderRef.current;

  const strictLoad = script.meta?.strictLoad ?? true;

  /** 设置/替换某层。同 kind 同 index 替换（key 变化即换图）。 */
  const setLayer = useCallback(
    (kind: 'bg' | 'cg', key: string, index = 0, zIndex = 0) => {
      setUi((prev) => {
        const next = prev.layers.filter(
          (l) => !(l.kind === kind && l.index === index),
        );
        next.push({ key, kind, index, zIndex });
        return { ...prev, layers: next };
      });
    },
    [],
  );

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
          setLayer('bg', line.key, line.index ?? 0, line.zIndex ?? 0);
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'idle' }));
          runLine(idx + 1);
          break;
        }

        case 'cg': {
          loader.load(line.key);
          setLayer('cg', line.key, line.index ?? 0, line.zIndex ?? 0);
          setUi((prev) => ({ ...prev, lineIndex: idx, phase: 'idle' }));
          runLine(idx + 1);
          break;
        }

        case 'say': {
          if (line.bg) {
            loader.load(line.bg);
            setLayer('bg', line.bg, line.index ?? 0, line.zIndex ?? 0);
          }
          if (line.cg) {
            loader.load(line.cg);
            setLayer('cg', line.cg, line.index ?? 0, line.zIndex ?? 0);
          }
          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'typing',
            speaker: line.speaker ?? '',
            text: line.text,
            shown: 0,
          }));
          break;
        }

        case 'choice': {
          setUi((prev) => ({
            ...prev,
            lineIndex: idx,
            phase: 'choice',
            choices: line.options.map((o) => ({ text: o.text, to: o.to })),
          }));
          break;
        }

        case 'jump': {
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
    [loader, labelMap, script.lines, strictLoad, onEnd, navigate],
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
    if (ui.shown >= total) {
      // 显示完整，等点击
      setUi((prev) => (prev.phase === 'typing' ? { ...prev, phase: 'idle' } : prev));
      return;
    }
    const t = setTimeout(() => {
      setUi((prev) => ({ ...prev, shown: prev.shown + 1 }));
    }, 30);
    return () => clearTimeout(t);
  }, [ui.phase, ui.shown, ui.text]);

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
    (to: string) => {
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
  const cgBox = uiStyle?.cgBox ?? {};
  const cgAspect = cgBox.aspect ?? 16 / 9;
  const cgMaxW = cgBox.maxWidth ?? 'calc(100vh * 16 / 9)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: script.meta?.fontFamily ?? '"Noto Serif SC", serif',
      }}
      onClick={advance}
    >
      {/* 图层渲染：bg=cover 占满全屏，cg=contain 看全居中；按 index+zIndex 排序，同 index cg 前 bg 后 */}
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
                <div style={{ position: 'relative', width: '100%', maxWidth: cgMaxW, aspectRatio: `${cgAspect}` }}>
                  <img
                    src={url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>
            );
          })}
      </div>

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
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: choice.align === 'left' ? 'flex-start' : choice.align === 'right' ? 'flex-end' : 'center',
            justifyContent: 'center',
            gap: choice.gap ?? 12,
            zIndex: 20,
          }}
        >
          {ui.choices.map((c) => (
            <button
              key={c.to}
              onClick={(e) => {
                e.stopPropagation();
                pickChoice(c.to);
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
    </div>
  );
}
